use base64::Engine;
use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use sha2::{Digest, Sha256};
use serde::{Deserialize, Serialize};
use tauri::Emitter;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;
use tokio::time::Duration;
use uuid::Uuid;
use std::path::PathBuf;
use crate::services::errors::{AppError, AppResult};

const DRIVE_SCOPE: &str = "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email";
const AUTH_ENDPOINT: &str = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT: &str = "https://oauth2.googleapis.com/token";
const USERINFO_ENDPOINT: &str = "https://www.googleapis.com/oauth2/v2/userinfo";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GDriveToken {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_at: String,
    pub scope: Option<String>,
}

pub struct GDriveClient;

#[allow(dead_code)]
impl GDriveClient {
    fn random_verifier() -> String {
        let mut out = [0u8; 64];
        for i in 0..4 {
            let u = Uuid::new_v4();
            out[i*16..(i+1)*16].copy_from_slice(u.as_bytes());
        }
        URL_SAFE_NO_PAD.encode(out)
    }

    fn code_challenge(verifier: &str) -> String {
        let mut hasher = Sha256::default();
        hasher.update(verifier.as_bytes());
        URL_SAFE_NO_PAD.encode(hasher.finalize())
    }

    pub fn token_path(app_data: &PathBuf) -> PathBuf {
        app_data.join("gdrive_token.json")
    }

    pub fn load_token(app_data: &PathBuf) -> Option<GDriveToken> {
        let path = Self::token_path(app_data);
        if !path.exists() {
            return None;
        }
        // Try plaintext first (legacy), then encrypted
        if let Ok(s) = std::fs::read_to_string(&path) {
            if let Ok(token) = serde_json::from_str::<GDriveToken>(&s) {
                return Some(token);
            }
            // Try decryption if plaintext failed
            if let Ok(decrypted) = crate::crypto::Crypto::decrypt(app_data, &s.trim()) {
                if let Ok(token) = serde_json::from_slice::<GDriveToken>(&decrypted) {
                    return Some(token);
                }
            }
        }
        None
    }

    fn save_token(token: &GDriveToken, app_data: &PathBuf) -> AppResult<()> {
        let path = Self::token_path(app_data);
        let json = serde_json::to_vec(token)?;
        let encrypted = crate::crypto::Crypto::encrypt(app_data, &json)?;
        std::fs::write(&path, encrypted)?;
        Ok(())
    }

    pub fn delete_token(app_data: &PathBuf) {
        let path = Self::token_path(app_data);
        if path.exists() {
            std::fs::remove_file(path).ok();
        }
    }

    pub fn is_token_expired(token: &GDriveToken) -> bool {
        let now = Utc::now();
        match chrono::DateTime::parse_from_rfc3339(&token.expires_at) {
            Ok(exp) => now + chrono::Duration::seconds(60) >= exp.with_timezone(&Utc),
            Err(_) => true,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GDriveUserInfo {
    pub email: String,
    pub name: Option<String>,
    pub picture: Option<String>,
}

use chrono::Utc;

impl GDriveClient {
    pub async fn get_user_info(access_token: &str) -> AppResult<GDriveUserInfo> {
        let client = reqwest::Client::builder()
            .build()
            .map_err(|e| AppError::Http(e.to_string()))?;

        let resp = client.get(USERINFO_ENDPOINT)
            .bearer_auth(access_token)
            .send()
            .await
            .map_err(|e| AppError::Http(e.to_string()))?;

        let status = resp.status();
        let text = resp.text().await
            .map_err(|e| AppError::Http(e.to_string()))?;

        if !status.is_success() {
            return Err(AppError::OAuth(format!("userinfo failed ({}): {}", status, text)));
        }

        let v: serde_json::Value = serde_json::from_str(&text)
            .map_err(|e| AppError::Serde(e))?;

        let email = v["email"].as_str()
            .ok_or_else(|| AppError::OAuth("missing email in userinfo".into()))?
            .to_string();

        let name = v["name"].as_str().map(|s| s.to_string());
        let picture = v["picture"].as_str().map(|s| s.to_string());

        Ok(GDriveUserInfo { email, name, picture })
    }

    pub async fn start_auth_flow(
        client_id: &str,
        client_secret: Option<&str>,
        app_data: PathBuf,
        app_handle: tauri::AppHandle,
    ) -> AppResult<String> {
        let verifier = Self::random_verifier();
        let challenge = Self::code_challenge(&verifier);

        let (listener, redirect_port) = Self::bind_available_port(43210u16, 43210u16, 43310u16).await?;
        let redirect_uri = format!("http://127.0.0.1:{}", redirect_port);

        let auth_url = format!(
            "{}?client_id={}&redirect_uri={}&response_type=code&scope={}&access_type=offline&prompt=consent&code_challenge_method=S256&code_challenge={}",
            AUTH_ENDPOINT,
            urlencoding::encode(client_id),
            urlencoding::encode(&redirect_uri),
            urlencoding::encode(DRIVE_SCOPE),
            challenge
        );

        let client_id_owned = client_id.to_owned();
        let app_data_clone = app_data.clone();
        let redirect_uri_clone = redirect_uri.clone();
        let app_handle_clone = app_handle.clone();
        let client_secret_owned = client_secret.map(str::to_owned);

        tokio::spawn(async move {
            let result = Self::handle_redirect(
                &listener,
                &client_id_owned,
                &redirect_uri_clone,
                &verifier,
                client_secret_owned.as_deref(),
                &app_data_clone,
            ).await;

            match result {
                Ok(()) => {
                    if let Some(token) = Self::load_token(&app_data_clone) {
                        if let Ok(info) = Self::get_user_info(&token.access_token).await {
                            let info_json = serde_json::json!({
                                "email": info.email,
                                "name": info.name,
                                "picture": info.picture,
                            });
                            app_handle_clone.emit("gdrive-auth-success", info_json).ok();
                        } else {
                            app_handle_clone.emit("gdrive-auth-success", ()).ok();
                        }
                    } else {
                        app_handle_clone.emit("gdrive-auth-success", ()).ok();
                    }
                }
                Err(e) => {
                    eprintln!("GDrive auth error: {}", e);
                    app_handle_clone.emit("gdrive-auth-error", e.to_string()).ok();
                }
            }
        });

        Ok(auth_url)
    }

    async fn bind_available_port(start: u16, min: u16, max: u16) -> AppResult<(TcpListener, u16)> {
        for port in start..=max {
            match TcpListener::bind(format!("127.0.0.1:{}", port)).await {
                Ok(listener) => return Ok((listener, port)),
                Err(_) if port < max => continue,
                Err(e) => {
                    return Err(AppError::OAuth(format!(
                        "could not bind any port in range {}-{}: {}",
                        min, max, e
                    )));
                }
            }
        }
        Err(AppError::OAuth(format!(
            "no available port in range {}-{}",
            min, max
        )))
    }

    async fn handle_redirect(
        listener: &TcpListener,
        client_id: &str,
        redirect_uri: &str,
        verifier: &str,
        client_secret: Option<&str>,
        app_data: &PathBuf,
    ) -> AppResult<()> {
        let timeout_dur = Duration::from_secs(300);
        let deadline = tokio::time::Instant::now() + timeout_dur;

        loop {
            let remaining = deadline.saturating_duration_since(tokio::time::Instant::now());
            if remaining.is_zero() {
                return Err(AppError::OAuth("auth timeout".into()));
            }

            let accept_future = listener.accept();
            let (mut stream, peer_addr) = match tokio::time::timeout(remaining, accept_future).await {
                Ok(Ok(pair)) => pair,
                Ok(Err(e)) => return Err(AppError::OAuth(format!("accept error: {}", e))),
                Err(_) => return Err(AppError::OAuth("auth timeout".into())),
            };

            let mut buf = [0u8; 4096];
            let n = match tokio::time::timeout(Duration::from_secs(10), stream.read(&mut buf)).await {
                Ok(Ok(n)) => n,
                Ok(Err(e)) => {
                    eprintln!("GDrive auth: read error from {}: {}", peer_addr, e);
                    continue;
                }
                Err(_) => {
                    eprintln!("GDrive auth: read timeout from {}", peer_addr);
                    continue;
                }
            };

            let req = String::from_utf8_lossy(&buf[..n]);

            let request_line = req.lines().next().unwrap_or("");

            let code = request_line
                .split_whitespace()
                .nth(1)
                .and_then(|path| {
                    let query = path.split('?').nth(1)?;
                    for pair in query.split('&') {
                        let mut kv = pair.splitn(2, '=');
                        if kv.next()? == "code" {
                            return kv.next();
                        }
                    }
                    None
                });

            match code {
                Some(code_str) => {
                    let code_decoded = urlencoding::decode(code_str)
                        .map_err(|e| AppError::OAuth(format!("decode error: {}", e)))?;

                    let token = Self::exchange_code(client_id, &code_decoded, verifier, redirect_uri, client_secret).await?;
                    Self::save_token(&token, app_data)?;

                    let html = "<html><body><h2>Authorization successful</h2><p>You can close this tab and return to the app.</p></body></html>";
                    let resp = format!(
                        "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                        html.len(),
                        html
                    );
                    stream.write_all(resp.as_bytes()).await.ok();
                    return Ok(());
                }
                None => {
                    let error_msg = request_line
                        .split_whitespace()
                        .nth(1)
                        .and_then(|path| {
                            let query = path.split('?').nth(1)?;
                            for pair in query.split('&') {
                                let mut kv = pair.splitn(2, '=');
                                if kv.next()? == "error" {
                                    return kv.next();
                                }
                            }
                            None
                        });

                    match error_msg {
                        Some(msg) => {
                            let error_msg_owned = msg.to_string();
                            let html = format!("<html><body><h2>Authorization failed</h2><p>Error: {}</p></body></html>", error_msg_owned);
                            let resp = format!(
                                "HTTP/1.1 400 Bad Request\r\nContent-Type: text/html\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                                html.len(),
                                html
                            );
                            stream.write_all(resp.as_bytes()).await.ok();
                            return Err(AppError::OAuth(format!("auth error: {}", error_msg_owned)));
                        }
                        None => {
                            eprintln!(
                                "GDrive auth: ignoring non-OAuth request from {}: {}",
                                peer_addr,
                                request_line
                            );
                            let resp = "HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";
                            stream.write_all(resp.as_bytes()).await.ok();
                            continue;
                        }
                    }
                }
            }
        }
    }

    async fn exchange_code(
        client_id: &str,
        code: &str,
        code_verifier: &str,
        redirect_uri: &str,
        client_secret: Option<&str>,
    ) -> AppResult<GDriveToken> {
        let client = reqwest::Client::builder()
            .build()
            .map_err(|e| AppError::Http(e.to_string()))?;

        let mut params = vec![
            ("code", code),
            ("client_id", client_id),
            ("code_verifier", code_verifier),
            ("redirect_uri", redirect_uri),
            ("grant_type", "authorization_code"),
        ];
        if let Some(secret) = client_secret.filter(|s| !s.is_empty()) {
            params.push(("client_secret", secret));
        }

        let resp = client.post(TOKEN_ENDPOINT)
            .form(&params)
            .send()
            .await
            .map_err(|e| AppError::Http(e.to_string()))?;

        let status = resp.status();
        let text = resp.text().await
            .map_err(|e| AppError::Http(e.to_string()))?;

        if !status.is_success() {
            return Err(AppError::OAuth(format!("token exchange failed ({}): {}", status, text)));
        }

        let v: serde_json::Value = serde_json::from_str(&text)
            .map_err(|e| AppError::Serde(e))?;

        let access_token = v["access_token"].as_str()
            .ok_or_else(|| AppError::OAuth("missing access_token".into()))?
            .to_string();
        let refresh_token = v["refresh_token"].as_str().map(|s| s.to_string());
        let expires_in = v["expires_in"].as_i64().unwrap_or(3600);
        let scope = v["scope"].as_str().map(|s| s.to_string());

        let expires_at = (Utc::now() + chrono::Duration::seconds(expires_in)).to_rfc3339();

        Ok(GDriveToken {
            access_token,
            refresh_token,
            expires_at,
            scope,
        })
    }

    pub async fn refresh_token(client_id: &str, client_secret: Option<&str>, token: &GDriveToken, app_data: &PathBuf) -> AppResult<GDriveToken> {
        let refresh_token = token.refresh_token.as_deref()
            .ok_or_else(|| AppError::OAuth("no refresh token".into()))?;

        let client = reqwest::Client::builder()
            .build()
            .map_err(|e| AppError::Http(e.to_string()))?;

        let mut params = vec![
            ("refresh_token", refresh_token),
            ("client_id", client_id),
            ("grant_type", "refresh_token"),
        ];
        if let Some(secret) = client_secret.filter(|s| !s.is_empty()) {
            params.push(("client_secret", secret));
        }

        let resp = client.post(TOKEN_ENDPOINT)
            .form(&params)
            .send()
            .await
            .map_err(|e| AppError::Http(e.to_string()))?;

        let status = resp.status();
        let text = resp.text().await
            .map_err(|e| AppError::Http(e.to_string()))?;

        if !status.is_success() {
            return Err(AppError::OAuth(format!("token refresh failed ({}): {}", status, text)));
        }

        let v: serde_json::Value = serde_json::from_str(&text)
            .map_err(|e| AppError::Serde(e))?;

        let access_token = v["access_token"].as_str()
            .ok_or_else(|| AppError::OAuth("missing access_token".into()))?
            .to_string();
        let expires_in = v["expires_in"].as_i64().unwrap_or(3600);
        let new_refresh_token = v["refresh_token"].as_str().map(|s| s.to_string())
            .or_else(|| token.refresh_token.clone());

        let expires_at = (Utc::now() + chrono::Duration::seconds(expires_in)).to_rfc3339();

        let new_token = GDriveToken {
            access_token,
            refresh_token: new_refresh_token,
            expires_at,
            scope: token.scope.clone(),
        };

        Self::save_token(&new_token, app_data)?;
        Ok(new_token)
    }

    pub async fn ensure_valid_token(client_id: &str, client_secret: Option<&str>, app_data: &PathBuf) -> AppResult<String> {
        let token = Self::load_token(app_data)
            .ok_or_else(|| AppError::OAuth("no token available".into()))?;

        if Self::is_token_expired(&token) {
            let refreshed = Self::refresh_token(client_id, client_secret, &token, app_data).await?;
            Ok(refreshed.access_token)
        } else {
            Ok(token.access_token)
        }
    }

    pub async fn ensure_folder(access_token: &str, folder_name: &str) -> AppResult<String> {
        let client = reqwest::Client::builder()
            .build()
            .map_err(|e| AppError::Http(e.to_string()))?;

        let query = format!(
            "mimeType='application/vnd.google-apps.folder' and name='{}' and trashed=false",
            folder_name.replace('\'', "\\'")
        );

        let fields = "files(id,name)".to_string();
        let resp = client.get("https://www.googleapis.com/drive/v3/files")
            .query(&[("q", &query), ("fields", &fields)])
            .bearer_auth(access_token)
            .send()
            .await
            .map_err(|e| AppError::Http(e.to_string()))?;

        if !resp.status().is_success() {
            return Err(AppError::OAuth(format!("query folder failed: {}", resp.text().await.unwrap_or_default())));
        }

        let text = resp.text().await
            .map_err(|e| AppError::Http(e.to_string()))?;
        let v: serde_json::Value = serde_json::from_str(&text)
            .map_err(|e| AppError::Serde(e))?;

        if let Some(files) = v["files"].as_array() {
            if let Some(file) = files.first() {
                if let Some(id) = file["id"].as_str() {
                    return Ok(id.to_string());
                }
            }
        }

        let metadata = serde_json::json!({
            "name": folder_name,
            "mimeType": "application/vnd.google-apps.folder"
        });

        let create_resp = client.post("https://www.googleapis.com/drive/v3/files")
            .bearer_auth(access_token)
            .json(&metadata)
            .send()
            .await
            .map_err(|e| AppError::Http(e.to_string()))?;

        if !create_resp.status().is_success() {
            return Err(AppError::OAuth(format!("create folder failed: {}", create_resp.text().await.unwrap_or_default())));
        }

        let text = create_resp.text().await
            .map_err(|e| AppError::Http(e.to_string()))?;
        let v: serde_json::Value = serde_json::from_str(&text)
            .map_err(|e| AppError::Serde(e))?;

        v["id"].as_str().map(|s| s.to_string())
            .ok_or_else(|| AppError::OAuth("missing folder id".into()))
    }

    pub async fn upload_file(
        access_token: &str,
        folder_id: &str,
        name: &str,
        bytes: &[u8],
    ) -> AppResult<String> {
        let client = reqwest::Client::builder()
            .build()
            .map_err(|e| AppError::Http(e.to_string()))?;

        let boundary = "dental_backup_boundary_001";
        let metadata = serde_json::json!({
            "name": name,
            "parents": [folder_id]
        }).to_string();

        let mut body: Vec<u8> = Vec::new();
        body.extend_from_slice(
            format!("--{}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n", boundary).as_bytes()
        );
        body.extend_from_slice(metadata.as_bytes());
        body.extend_from_slice(
            format!("\r\n--{}\r\nContent-Type: application/octet-stream\r\n\r\n", boundary).as_bytes()
        );
        body.extend_from_slice(bytes);
        body.extend_from_slice(
            format!("\r\n--{}--\r\n", boundary).as_bytes()
        );

        let resp = client.post("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart")
            .bearer_auth(access_token)
            .header("Content-Type", format!("multipart/related; boundary={}", boundary))
            .body(body)
            .send()
            .await
            .map_err(|e| AppError::Http(e.to_string()))?;

        let status = resp.status();
        let text = resp.text().await
            .map_err(|e| AppError::Http(e.to_string()))?;

        if !status.is_success() {
            return Err(AppError::Http(format!("upload failed ({}): {}", status, text)));
        }

        let v: serde_json::Value = serde_json::from_str(&text)
            .map_err(|e| AppError::Serde(e))?;

        v["id"].as_str().map(|s| s.to_string())
            .ok_or_else(|| AppError::OAuth("missing file id".into()))
    }

    pub async fn delete_file(access_token: &str, file_id: &str) -> AppResult<()> {
        let client = reqwest::Client::builder()
            .build()
            .map_err(|e| AppError::Http(e.to_string()))?;

        let url = format!("https://www.googleapis.com/drive/v3/files/{}", file_id);
        let resp = client.delete(&url)
            .bearer_auth(access_token)
            .send()
            .await
            .map_err(|e| AppError::Http(e.to_string()))?;

        let status = resp.status();
        if status.is_success() || status.as_u16() == 404 {
            return Ok(());
        }

        let text = resp.text().await.unwrap_or_default();
        Err(AppError::Http(format!("delete failed ({}): {}", status, text)))
    }
}
