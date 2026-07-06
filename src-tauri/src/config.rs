use std::env;
use std::path::PathBuf;

const ENV_GOOGLE_CLIENT_ID: &str = "GOOGLE_OAUTH_CLIENT_ID";
const ENV_GOOGLE_CLIENT_SECRET: &str = "GOOGLE_OAUTH_CLIENT_SECRET";

include!(concat!(env!("OUT_DIR"), "/env_config.rs"));

#[derive(Debug, Clone)]
pub struct AppConfig {
    pub google_oauth_client_id: String,
    pub google_oauth_client_secret: String,
}

impl AppConfig {
    pub fn load() -> Result<Self, String> {
        let client_id = Self::resolve_config(ENV_GOOGLE_CLIENT_ID, EMBEDDED_GOOGLE_CLIENT_ID);
        let client_secret = Self::resolve_config(ENV_GOOGLE_CLIENT_SECRET, EMBEDDED_GOOGLE_CLIENT_SECRET);

        if client_id.is_empty() {
            eprintln!("[WARN] GOOGLE_OAUTH_CLIENT_ID not configured. Google Drive features will be unavailable.");
        }
        if client_secret.is_empty() {
            eprintln!("[WARN] GOOGLE_OAUTH_CLIENT_SECRET not configured. Google Drive features will be unavailable.");
        }

        Ok(AppConfig {
            google_oauth_client_id: client_id,
            google_oauth_client_secret: client_secret,
        })
    }

    fn resolve_config(env_key: &str, embedded: &str) -> String {
        if let Ok(val) = env::var(env_key) {
            let trimmed = val.trim().to_string();
            if !trimmed.is_empty() {
                return trimmed;
            }
        }

        if !embedded.is_empty() {
            return embedded.to_string();
        }

        let dot_env_path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join(".env");
        if dot_env_path.exists() {
            dotenvy::from_path(&dot_env_path).ok();
            if let Ok(val) = env::var(env_key) {
                let trimmed = val.trim().to_string();
                if !trimmed.is_empty() {
                    return trimmed;
                }
            }
        }

        String::new()
    }
}
