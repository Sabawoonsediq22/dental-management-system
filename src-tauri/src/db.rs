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
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS _sqlx_migrations (
            id INTEGER PRIMARY KEY,
            version TEXT NOT NULL UNIQUE,
            applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        )"
    )
    .execute(pool)
    .await?;

    let migrations_path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("migrations");

    let mut files: Vec<_> = std::fs::read_dir(&migrations_path)?
        .into_iter()
        .filter_map(|entry| entry.ok())
        .filter_map(|entry| {
            let path = entry.path();
            if path.extension().map(|ext| ext == "sql").unwrap_or(false) {
                let version = path.file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or("")
                    .split('_')
                    .next()
                    .unwrap_or("")
                    .to_string();
                Some((version, path))
            } else {
                None
            }
        })
        .collect();

    files.sort_by(|a, b| a.0.cmp(&b.0));

    for (version, file) in files {
        let exists: bool = sqlx::query_scalar(
            "SELECT EXISTS(SELECT 1 FROM _sqlx_migrations WHERE version = ?)"
        )
        .bind(&version)
        .fetch_one(pool)
        .await?;

        if exists {
            continue;
        }

        let sql = std::fs::read_to_string(&file)?;

        for stmt in sql.split(';') {
            let stmt = stmt.trim();
            if !stmt.is_empty() && !stmt.starts_with("--") {
                sqlx::query(stmt).execute(pool).await.unwrap_or_default();
            }
        }

        sqlx::query("INSERT INTO _sqlx_migrations (version) VALUES (?)")
            .bind(&version)
            .execute(pool)
            .await?;
    }
    Ok(())
}