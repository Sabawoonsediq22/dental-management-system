use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::SqlitePool;
use std::str::FromStr;

pub async fn init_pool(db_path: &str) -> Result<SqlitePool, sqlx::Error> {
    if let Some(parent) = std::path::Path::new(db_path).parent() {
        if let Err(e) = std::fs::create_dir_all(parent) {
            return Err(sqlx::Error::Io(e));
        }
    }
    let opts = SqliteConnectOptions::from_str(db_path)?
        .create_if_missing(true);
    SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(opts)
        .await
}

pub async fn run_migrations(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    let migrations_path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("migrations");
    
    let mut files: Vec<_> = std::fs::read_dir(&migrations_path)?
        .filter_map(|entry| entry.ok())
        .filter_map(|entry| {
            let path = entry.path();
            if path.extension().map(|ext| ext == "sql").unwrap_or(false) {
                Some(path)
            } else {
                None
            }
        })
        .collect();
    
    files.sort_by(|a, b| a.file_name().cmp(&b.file_name()));
    
    for file in files {
        let sql = std::fs::read_to_string(&file)?;
        for stmt in sql.split(';') {
            let stmt = stmt.trim();
            if !stmt.is_empty() {
                sqlx::query(stmt).execute(pool).await?;
            }
        }
    }
    Ok(())
}