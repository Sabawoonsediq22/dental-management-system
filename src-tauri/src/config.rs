use std::env;
use std::path::PathBuf;

const ENV_GOOGLE_CLIENT_ID: &str = "GOOGLE_OAUTH_CLIENT_ID";
const DOT_ENV_FILENAME: &str = "src-tauri/.env";

#[derive(Debug, Clone)]
pub struct AppConfig {
    pub google_oauth_client_id: String,
}

impl AppConfig {
    pub fn load() -> Result<Self, String> {
        // Priority 1: Direct environment variable
        if let Ok(val) = env::var(ENV_GOOGLE_CLIENT_ID) {
            let trimmed = val.trim().to_string();
            if !trimmed.is_empty() {
                return Ok(AppConfig { google_oauth_client_id: trimmed });
            }
        }

        // Priority 2: .env file located next to Cargo.toml (src-tauri/.env)
        let dot_env_path = {
            let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
            manifest_dir.join(".env")
        };

        if dot_env_path.exists() {
            dotenvy::from_path(&dot_env_path).ok();

            if let Ok(val) = env::var(ENV_GOOGLE_CLIENT_ID) {
                let trimmed = val.trim().to_string();
                if !trimmed.is_empty() {
                    return Ok(AppConfig { google_oauth_client_id: trimmed });
                }
            }
        }

        // Priority 3: Error with clear instructions
        Err(format!(
            "Missing required configuration: GOOGLE_OAUTH_CLIENT_ID\n\n\
             Set it via one of these methods:\n\n\
             1. Environment variable:\n\
                $env:GOOGLE_OAUTH_CLIENT_ID = \"your-client-id.apps.googleusercontent.com\"\n\n\
             2. Create {} with:\n\
                GOOGLE_OAUTH_CLIENT_ID=\"your-client-id.apps.googleusercontent.com\"\n\n\
             Get a Client ID at: https://console.cloud.google.com/apis/credentials",
            DOT_ENV_FILENAME
        ))
    }
}
