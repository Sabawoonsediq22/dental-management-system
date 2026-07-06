fn main() {
    tauri_build::build();

    let out_dir = std::path::PathBuf::from(std::env::var("OUT_DIR").unwrap());
    let dest_path = out_dir.join("env_config.rs");

    let dotenv_path = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join(".env");

    let mut client_id = String::new();
    let mut client_secret = String::new();

    if dotenv_path.exists() {
        if let Ok(content) = std::fs::read_to_string(&dotenv_path) {
            for line in content.lines() {
                if let Some((key, value)) = line.split_once('=') {
                    match key.trim() {
                        "GOOGLE_OAUTH_CLIENT_ID" => {
                            client_id = value.trim().to_string();
                        }
                        "GOOGLE_OAUTH_CLIENT_SECRET" => {
                            client_secret = value.trim().to_string();
                        }
                        _ => {}
                    }
                }
            }
        }
    }

    let content = format!(
        "pub const EMBEDDED_GOOGLE_CLIENT_ID: &str = \"{}\";\n\
         pub const EMBEDDED_GOOGLE_CLIENT_SECRET: &str = \"{}\";\n",
        client_id, client_secret
    );

    std::fs::write(&dest_path, content).unwrap();
}
