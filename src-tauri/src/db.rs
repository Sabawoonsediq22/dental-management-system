use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::SqlitePool;
use std::str::FromStr;

pub async fn init_pool(db_path: &str) -> Result<SqlitePool, sqlx::Error> {
    if let Some(parent) = std::path::Path::new(db_path).parent() {
        if let Err(e) = std::fs::create_dir_all(parent) {
            return Err(sqlx::Error::Io(e));
        }
    }

    if let Ok(pool) = try_connect(db_path).await {
        checkpoint_wal(&pool).await;
        return Ok(pool);
    }

    cleanup_stale_wal_files(db_path);

    let pool = try_connect(db_path).await?;
    checkpoint_wal(&pool).await;
    Ok(pool)
}

async fn try_connect(db_path: &str) -> Result<SqlitePool, sqlx::Error> {
    let opts = SqliteConnectOptions::from_str(db_path)?
        .create_if_missing(true)
        .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)
        .synchronous(sqlx::sqlite::SqliteSynchronous::Normal)
        .busy_timeout(std::time::Duration::from_secs(10))
        .foreign_keys(true);
    SqlitePoolOptions::new()
        .max_connections(5)
        .min_connections(1)
        .acquire_timeout(std::time::Duration::from_secs(30))
        .connect_with(opts)
        .await
}

async fn checkpoint_wal(pool: &SqlitePool) {
    if let Err(e) = sqlx::query("PRAGMA wal_checkpoint(TRUNCATE)")
        .execute(pool)
        .await
    {
        eprintln!("[WARN] Failed to checkpoint WAL: {}", e);
    }
}

fn cleanup_stale_wal_files(db_path: &str) {
    for suffix in &["-wal", "-shm"] {
        let stale_path = format!("{}{}", db_path, suffix);
        let path = std::path::Path::new(&stale_path);
        if path.exists() {
            if let Err(e) = std::fs::remove_file(path) {
                eprintln!("[WARN] Failed to remove stale file {}: {}", stale_path, e);
            } else {
                println!("[INFO] Cleaned up stale WAL file: {}", stale_path);
            }
        }
    }
}

pub async fn run_migrations(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS _sqlx_migrations (
            id INTEGER PRIMARY KEY,
            version TEXT NOT NULL UNIQUE,
            applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        )",
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
                let version = path
                    .file_stem()
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

    for (version, file) in &files {
        let exists: bool = sqlx::query_scalar(
            "SELECT EXISTS(SELECT 1 FROM _sqlx_migrations WHERE version = ?)",
        )
        .bind(version)
        .fetch_one(pool)
        .await?;

        if exists {
            continue;
        }

        let sql = std::fs::read_to_string(file)?;

        let mut tx = pool.begin().await?;

        for stmt in sql.split(';') {
            let stmt = stmt.trim();
            if !stmt.is_empty() {
                sqlx::query(stmt).execute(&mut *tx).await?;
            }
        }

        sqlx::query("INSERT INTO _sqlx_migrations (version) VALUES (?)")
            .bind(version)
            .execute(&mut *tx)
            .await?;

        tx.commit().await?;
    }
    Ok(())
}

#[allow(dead_code)]
pub async fn check_database_integrity(pool: &SqlitePool) -> Result<Vec<String>, sqlx::Error> {
    let result: String = sqlx::query_scalar("PRAGMA integrity_check")
        .fetch_one(pool)
        .await?;

    Ok(result.split('\n').map(|s| s.to_string()).collect())
}

#[allow(dead_code)]
pub async fn vacuum_database(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query("VACUUM").execute(pool).await?;
    Ok(())
}

#[allow(dead_code)]
pub async fn get_database_stats(pool: &SqlitePool) -> Result<DatabaseStats, sqlx::Error> {
    let page_count: i64 = sqlx::query_scalar("PRAGMA page_count")
        .fetch_one(pool)
        .await?;
    let page_size: i64 = sqlx::query_scalar("PRAGMA page_size")
        .fetch_one(pool)
        .await?;
    let freelist_count: i64 = sqlx::query_scalar("PRAGMA freelist_count")
        .fetch_one(pool)
        .await?;

    Ok(DatabaseStats {
        page_count,
        page_size,
        freelist_count,
        total_size_bytes: page_count * page_size,
        wal_mode: true,
    })
}

#[allow(dead_code)]
#[derive(Debug, serde::Serialize)]
pub struct DatabaseStats {
    pub page_count: i64,
    pub page_size: i64,
    pub freelist_count: i64,
    pub total_size_bytes: i64,
    pub wal_mode: bool,
}
