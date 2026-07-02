use std::env;
use std::path::PathBuf;

const ENV_GOOGLE_CLIENT_ID: &str = "GOOGLE_OAUTH_CLIENT_ID";
const ENV_GOOGLE_CLIENT_SECRET: &str = "GOOGLE_OAUTH_CLIENT_SECRET";
const DOT_ENV_FILENAME: &str = "src-tauri/.env";

#[derive(Debug, Clone)]
pub struct AppConfig {
    pub google_oauth_client_id: String,
    pub google_oauth_client_secret: String,
}

impl AppConfig {
    pub fn load() -> Result<Self, String> {
        let mut client_id = None;
        let mut client_secret = None;

        if let Ok(val) = env::var(ENV_GOOGLE_CLIENT_ID) {
            let trimmed = val.trim().to_string();
            if !trimmed.is_empty() {
                client_id = Some(trimmed);
            }
        }

        if let Ok(val) = env::var(ENV_GOOGLE_CLIENT_SECRET) {
            let trimmed = val.trim().to_string();
            if !trimmed.is_empty() {
                client_secret = Some(trimmed);
            }
        }

        let dot_env_path = {
            let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
            manifest_dir.join(".env")
        };

        if dot_env_path.exists() {
            dotenvy::from_path(&dot_env_path).ok();

            if client_id.is_none() {
                if let Ok(val) = env::var(ENV_GOOGLE_CLIENT_ID) {
                    let trimmed = val.trim().to_string();
                    if !trimmed.is_empty() {
                        client_id = Some(trimmed);
                    }
                }
            }

            if client_secret.is_none() {
                if let Ok(val) = env::var(ENV_GOOGLE_CLIENT_SECRET) {
                    let trimmed = val.trim().to_string();
                    if !trimmed.is_empty() {
                        client_secret = Some(trimmed);
                    }
                }
            }
        }

        let google_oauth_client_id = client_id.ok_or_else(|| {
            format!(
                "Missing required configuration: GOOGLE_OAUTH_CLIENT_ID\n\n\
                 Set it via one of these methods:\n\n\
                 1. Environment variable:\n\
                    $env:GOOGLE_OAUTH_CLIENT_ID = \"your-client-id.apps.googleusercontent.com\"\n\
                    $env:GOOGLE_OAUTH_CLIENT_SECRET = \"your-client-secret\"\n\n\
                 2. Create {} with:\n\
                    GOOGLE_OAUTH_CLIENT_ID=\"your-client-id.apps.googleusercontent.com\"\n\
                    GOOGLE_OAUTH_CLIENT_SECRET=\"your-client-secret\"\n\n\
                 Get a Client ID at: https://console.cloud.google.com/apis/credentials",
                DOT_ENV_FILENAME
            )
        })?;

        Ok(AppConfig {
            google_oauth_client_id,
            google_oauth_client_secret: client_secret.unwrap_or_default(),
        })
    }
}
