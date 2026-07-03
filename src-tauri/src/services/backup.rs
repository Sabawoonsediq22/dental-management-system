use sqlx::SqlitePool;
use crate::models::*;
use crate::services::errors::{AppError, AppResult};
use chrono::Utc;
use std::path::PathBuf;

pub struct BackupService;

#[allow(dead_code)]
impl BackupService {
    pub async fn create_local_backup(
        pool: &SqlitePool,
        backup_dir: &PathBuf,
        backup_type: &str,
        custom_path: Option<&str>,
    ) -> AppResult<BackupRecord> {
        let dest = if let Some(path) = custom_path {
            let p = std::path::PathBuf::from(path);
            let dest = if p.is_dir() {
                std::fs::create_dir_all(&p)?;
                let now = Utc::now();
                let filename = format!("dental_clinic_{}.db", now.format("%Y%m%d_%H%M%S"));
                p.join(filename)
            } else {
                if let Some(parent) = p.parent() {
                    std::fs::create_dir_all(parent)?;
                }
                p
            };
            dest
        } else {
            std::fs::create_dir_all(backup_dir)?;
            let now = Utc::now();
            let filename = format!("dental_clinic_{}.db", now.format("%Y%m%d_%H%M%S"));
            backup_dir.join(&filename)
        };
        let dest_str = dest.to_string_lossy().replace('\\', "/");
        let escaped = dest_str.replace('\'', "''");

        let sql = format!("VACUUM INTO '{}'", escaped);
        sqlx::query(&sql).execute(pool).await.map_err(|e| {
            AppError::Backup(format!("VACUUM INTO failed: {}", e))
        })?;

        let file_size = std::fs::metadata(&dest)
            .map(|m| m.len() as i64)
            .unwrap_or(0);

        let finished = Utc::now().to_rfc3339();
        let record = sqlx::query_as::<_, BackupRecord>(
            "INSERT INTO backups (backup_type, backup_path, cloud_provider, status, file_size, created_at, completed_at)
             VALUES (?, ?, 'local', 'success', ?, datetime('now'), ?)
             RETURNING id, backup_type, backup_path, cloud_provider, status, file_size, error_message, created_at, completed_at"
        )
        .bind(backup_type)
        .bind(&dest_str)
        .bind(file_size)
        .bind(&finished)
        .fetch_one(pool)
        .await?;

        Ok(record)
    }

    pub async fn list_backups(pool: &SqlitePool) -> AppResult<Vec<BackupRecord>> {
        let records = sqlx::query_as::<_, BackupRecord>(
            "SELECT id, backup_type, backup_path, cloud_provider, status, file_size, error_message, created_at, completed_at
             FROM backups ORDER BY created_at DESC LIMIT 50"
        )
        .fetch_all(pool)
        .await?;
        Ok(records)
    }

    pub async fn delete_backup(pool: &SqlitePool, id: i64) -> AppResult<()> {
        let record = sqlx::query_as::<_, BackupRecord>(
            "SELECT id, backup_type, backup_path, cloud_provider, status, file_size, error_message, created_at, completed_at
             FROM backups WHERE id = ?"
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        match record {
            Some(r) => {
                if r.cloud_provider == "local" || r.cloud_provider == "both" {
                    let path = std::path::Path::new(&r.backup_path);
                    if path.exists() {
                        std::fs::remove_file(path).ok();
                    }
                }
                sqlx::query("DELETE FROM backups WHERE id = ?")
                    .bind(id)
                    .execute(pool)
                    .await?;
                Ok(())
            }
            None => Err(AppError::NotFound("Backup not found".into())),
        }
    }

    pub async fn record_failed_backup(
        pool: &SqlitePool,
        backup_type: &str,
        cloud_provider: &str,
        error_msg: &str,
    ) -> AppResult<BackupRecord> {
        let record = sqlx::query_as::<_, BackupRecord>(
            "INSERT INTO backups (backup_type, backup_path, cloud_provider, status, file_size, error_message, created_at, completed_at)
             VALUES (?, ?, ?, 'failed', 0, ?, datetime('now'), datetime('now'))
             RETURNING id, backup_type, backup_path, cloud_provider, status, file_size, error_message, created_at, completed_at"
        )
        .bind(backup_type)
        .bind("")
        .bind(cloud_provider)
        .bind(error_msg)
        .fetch_one(pool)
        .await?;
        Ok(record)
    }

    pub fn is_backup_due(last_backup_at: &Option<String>, frequency: &str) -> bool {
        let last = match last_backup_at {
            Some(s) => chrono::DateTime::parse_from_rfc3339(s),
            None => return true,
        };
        let last = match last {
            Ok(dt) => dt.with_timezone(&Utc),
            Err(_) => return true,
        };
        let now = Utc::now();
        let dur = now - last;
        match frequency {
            "daily" => dur.num_hours() >= 24,
            "weekly" => dur.num_days() >= 7,
            "monthly" => dur.num_days() >= 30,
            _ => true,
        }
    }

    pub async fn get_backup_settings(pool: &SqlitePool) -> AppResult<BackupSettings> {
        let row = sqlx::query(
            "SELECT auto_backup_enabled, auto_backup_frequency, auto_backup_target, last_backup_at,
                    gdrive_client_id, gdrive_connected, gdrive_folder_id,
                    local_backup_enabled, local_backup_frequency, local_last_backup_at, local_next_scheduled_backup,
                    gdrive_backup_enabled, gdrive_backup_frequency, gdrive_connected_email,
                    gdrive_last_backup_at, gdrive_next_scheduled_backup, gdrive_last_sync_at
             FROM app_settings WHERE id = 1"
        )
        .fetch_optional(pool)
        .await
        .map_err(AppError::Database)?;

        match row {
            Some(r) => {
                use sqlx::Row;
                Ok(BackupSettings {
                    auto_backup_enabled: r.try_get(0).unwrap_or(false),
                    auto_backup_frequency: r.try_get(1).unwrap_or_else(|_| "daily".into()),
                    auto_backup_target: r.try_get(2).unwrap_or_else(|_| "local".into()),
                    last_backup_at: r.try_get(3).ok(),
                    gdrive_client_id: r.try_get(4).ok(),
                    gdrive_connected: r.try_get(5).unwrap_or(false),
                    gdrive_folder_id: r.try_get(6).ok(),
                    local_backup_enabled: r.try_get(7).unwrap_or(false),
                    local_backup_frequency: r.try_get(8).unwrap_or_else(|_| "daily".into()),
                    local_last_backup_at: r.try_get(9).ok(),
                    local_next_scheduled_backup: r.try_get(10).ok(),
                    gdrive_backup_enabled: r.try_get(11).unwrap_or(false),
                    gdrive_backup_frequency: r.try_get(12).unwrap_or_else(|_| "daily".into()),
                    gdrive_connected_email: r.try_get(13).ok(),
                    gdrive_last_backup_at: r.try_get(14).ok(),
                    gdrive_next_scheduled_backup: r.try_get(15).ok(),
                    gdrive_last_sync_at: r.try_get(16).ok(),
                })
            }
            None => Ok(BackupSettings {
                auto_backup_enabled: false,
                auto_backup_frequency: "daily".into(),
                auto_backup_target: "local".into(),
                last_backup_at: None,
                gdrive_client_id: None,
                gdrive_connected: false,
                gdrive_folder_id: None,
                local_backup_enabled: false,
                local_backup_frequency: "daily".into(),
                local_last_backup_at: None,
                local_next_scheduled_backup: None,
                gdrive_backup_enabled: false,
                gdrive_backup_frequency: "daily".into(),
                gdrive_connected_email: None,
                gdrive_last_backup_at: None,
                gdrive_next_scheduled_backup: None,
                gdrive_last_sync_at: None,
            }),
        }
    }

    pub async fn set_local_backup_now(pool: &SqlitePool) -> AppResult<()> {
        let now = Utc::now().to_rfc3339();
        sqlx::query("UPDATE app_settings SET local_last_backup_at = ? WHERE id = 1")
            .bind(&now)
            .execute(pool)
            .await?;
        Ok(())
    }

    pub async fn set_gdrive_backup_now(pool: &SqlitePool) -> AppResult<()> {
        let now = Utc::now().to_rfc3339();
        sqlx::query("UPDATE app_settings SET gdrive_last_backup_at = ?, gdrive_last_sync_at = ? WHERE id = 1")
            .bind(&now)
            .bind(&now)
            .execute(pool)
            .await?;
        Ok(())
    }

    pub async fn update_backup_settings(
        pool: &SqlitePool,
        input: &UpdateBackupSettingsInput,
    ) -> AppResult<BackupSettings> {
        if let Some(v) = &input.auto_backup_enabled {
            sqlx::query("UPDATE app_settings SET auto_backup_enabled = ? WHERE id = 1")
                .bind(v)
                .execute(pool)
                .await?;
        }
        if let Some(v) = &input.auto_backup_frequency {
            sqlx::query("UPDATE app_settings SET auto_backup_frequency = ? WHERE id = 1")
                .bind(v)
                .execute(pool)
                .await?;
        }
        if let Some(v) = &input.auto_backup_target {
            sqlx::query("UPDATE app_settings SET auto_backup_target = ? WHERE id = 1")
                .bind(v)
                .execute(pool)
                .await?;
        }
        if let Some(v) = &input.gdrive_client_id {
            sqlx::query("UPDATE app_settings SET gdrive_client_id = ?, gdrive_connected = 0 WHERE id = 1")
                .bind(v)
                .execute(pool)
                .await?;
        }
        if let Some(v) = &input.local_backup_enabled {
            sqlx::query("UPDATE app_settings SET local_backup_enabled = ? WHERE id = 1")
                .bind(v)
                .execute(pool)
                .await?;
        }
        if let Some(v) = &input.local_backup_frequency {
            sqlx::query("UPDATE app_settings SET local_backup_frequency = ? WHERE id = 1")
                .bind(v)
                .execute(pool)
                .await?;
        }
        if let Some(v) = &input.gdrive_backup_enabled {
            sqlx::query("UPDATE app_settings SET gdrive_backup_enabled = ? WHERE id = 1")
                .bind(v)
                .execute(pool)
                .await?;
        }
        if let Some(v) = &input.gdrive_backup_frequency {
            sqlx::query("UPDATE app_settings SET gdrive_backup_frequency = ? WHERE id = 1")
                .bind(v)
                .execute(pool)
                .await?;
        }
        Self::get_backup_settings(pool).await
    }

    pub fn is_backup_due_for(last_backup_at: &Option<String>, frequency: &str) -> bool {
        let last = match last_backup_at {
            Some(s) => chrono::DateTime::parse_from_rfc3339(s),
            None => return true,
        };
        let last = match last {
            Ok(dt) => dt.with_timezone(&Utc),
            Err(_) => return true,
        };
        let now = Utc::now();
        let dur = now - last;
        match frequency {
            "daily" => dur.num_hours() >= 24,
            "weekly" => dur.num_days() >= 7,
            "monthly" => dur.num_days() >= 30,
            _ => true,
        }
    }

    pub async fn set_last_backup_now(pool: &SqlitePool) -> AppResult<()> {
        let now = Utc::now().to_rfc3339();
        sqlx::query("UPDATE app_settings SET last_backup_at = ? WHERE id = 1")
            .bind(&now)
            .execute(pool)
            .await?;
        Ok(())
    }

    pub async fn restore_from_backup(
        pool: &SqlitePool,
        db_path: &str,
        backup_path: &str,
    ) -> AppResult<RestoreBackupResult> {
        let backup_file = std::path::Path::new(backup_path);
        let db_file = std::path::Path::new(db_path);
        let db_dir = db_file.parent().unwrap_or(std::path::Path::new("."));

        // Step 1: Validate backup file exists and is a valid SQLite database
        if !backup_file.exists() {
            return Err(AppError::Restore(format!(
                "Backup file not found: {}",
                backup_path
            )));
        }

        let file_size = std::fs::metadata(backup_file)
            .map(|m| m.len())
            .map_err(|e| AppError::Restore(format!("Cannot read backup file: {}", e)))?;
        if file_size == 0 {
            return Err(AppError::Restore("Backup file is empty".into()));
        }

        // Check SQLite header magic bytes
        let header = std::fs::read(backup_file)
            .map_err(|e| AppError::Restore(format!("Failed to read backup file: {}", e)))?;
        if header.len() < 16 || &header[..16] != b"SQLite format 3\0" {
            return Err(AppError::Restore("Invalid SQLite database file (missing SQLite header)".into()));
        }

        // Full integrity check on the backup file
        let opts = sqlx::sqlite::SqliteConnectOptions::new()
            .filename(backup_path)
            .read_only(true);
        let test_pool = SqlitePool::connect_with(opts)
            .await
            .map_err(|e| AppError::Restore(format!("Failed to open backup for validation: {}", e)))?;

        let integrity: String = sqlx::query_scalar("PRAGMA integrity_check")
            .fetch_one(&test_pool)
            .await
            .unwrap_or_else(|_| "error".to_string());

        let table_count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table'",
        )
        .fetch_one(&test_pool)
        .await
        .unwrap_or(0);

        test_pool.close().await;

        if integrity.trim() != "ok" {
            return Err(AppError::Restore(format!(
                "Backup file integrity check failed: {}",
                integrity
            )));
        }
        if table_count == 0 {
            return Err(AppError::Restore(
                "Backup file contains no database tables".into(),
            ));
        }

        // Safety backup path in the same directory as the database
        let safety_path = db_dir.join("database_before_restore.db");

        // Temp file for atomic replacement (same filesystem as db)
        let temp_path = db_dir.join("dental_clinic_restore_temp.db");

        // Clean up any stale temp file from a previous failed restore
        if temp_path.exists() {
            std::fs::remove_file(&temp_path).ok();
        }

        // Step 3: Create safety backup of the current database
        let safety_created = if db_file.exists() {
            match std::fs::copy(db_file, &safety_path) {
                Ok(_) => {
                    println!(
                        "Safety backup created at: {}",
                        safety_path.display()
                    );
                    true
                }
                Err(e) => {
                    return Err(AppError::Restore(format!(
                        "Failed to create safety backup: {}",
                        e
                    )));
                }
            }
        } else {
            false
        };

        // Step 4: WAL checkpoint to flush all pending writes to the main DB file
        let _ = sqlx::query("PRAGMA wal_checkpoint(TRUNCATE)")
            .execute(pool)
            .await;

        // Step 5: Close all database connections
        pool.close().await;

        // Step 6: Atomically replace the database file
        // First copy backup to a temp file in the same directory (ensuring we can rename atomically)
        if let Err(e) = std::fs::copy(backup_file, &temp_path) {
            // Attempt rollback: restore safety backup back to original location
            Self::rollback_restore(&safety_path, db_file, &temp_path, safety_created);
            return Err(AppError::Restore(format!(
                "Failed to copy backup to database location: {}",
                e
            )));
        }

        // Rename temp file to the actual database path (atomic on same filesystem)
        if let Err(e) = std::fs::rename(&temp_path, db_file) {
            // Clean up temp file first
            std::fs::remove_file(&temp_path).ok();
            // Attempt rollback
            Self::rollback_restore(&safety_path, db_file, &temp_path, safety_created);
            return Err(AppError::Restore(format!(
                "Failed to replace database file: {}",
                e
            )));
        }

        // Clean up WAL and SHM files from the old database to prevent conflicts
        let wal_path = db_dir.join("dental_clinic.db-wal");
        if wal_path.exists() {
            std::fs::remove_file(&wal_path).ok();
        }
        let shm_path = db_dir.join("dental_clinic.db-shm");
        if shm_path.exists() {
            std::fs::remove_file(&shm_path).ok();
        }

        println!(
            "Database restored successfully from: {} (size: {} bytes)",
            backup_path, file_size
        );

        Ok(RestoreBackupResult {
            success: true,
            safety_backup_path: Some(safety_path.to_string_lossy().to_string()),
            restored_file: db_path.to_string(),
            file_size: file_size as i64,
            restored_at: Utc::now().to_rfc3339(),
        })
    }

    /// Attempts to roll back a failed restore by replacing the current database
    /// with the safety backup. Safe to call even if partial state exists.
    fn rollback_restore(
        safety_path: &std::path::Path,
        db_file: &std::path::Path,
        temp_path: &std::path::Path,
        safety_created: bool,
    ) {
        if !safety_created {
            return;
        }
        // Remove the failed restored file if it exists
        if db_file.exists() {
            std::fs::remove_file(db_file).ok();
        }
        // Rename safety backup back to original database path
        if safety_path.exists() {
            if let Err(e) = std::fs::rename(safety_path, db_file) {
                eprintln!(
                    "CRITICAL: Failed to restore safety backup. Manual intervention required: {}",
                    e
                );
            } else {
                println!("Rollback successful: original database restored from safety backup");
            }
        }
        // Clean up any temp file
        if temp_path.exists() {
            std::fs::remove_file(temp_path).ok();
        }
    }

    pub async fn validate_backup_file(backup_path: &str) -> AppResult<BackupValidation> {
        let path = std::path::Path::new(backup_path);
        if !path.exists() {
            return Ok(BackupValidation {
                valid: false,
                file_size: 0,
                table_count: 0,
                error: Some("File not found".to_string()),
            });
        }

        let file_size = std::fs::metadata(path)
            .map(|m| m.len() as i64)
            .unwrap_or(0);
        if file_size == 0 {
            return Ok(BackupValidation {
                valid: false,
                file_size: 0,
                table_count: 0,
                error: Some("File is empty".to_string()),
            });
        }

        // Check SQLite header
        let header = std::fs::read(path)
            .map_err(|e| AppError::Restore(format!("Failed to read file: {}", e)))?;
        if header.len() < 16 || &header[..16] != b"SQLite format 3\0" {
            return Ok(BackupValidation {
                valid: false,
                file_size,
                table_count: 0,
                error: Some("Not a valid SQLite database file".to_string()),
            });
        }

        // Open the backup file and check integrity
        let opts = sqlx::sqlite::SqliteConnectOptions::new()
            .filename(backup_path)
            .read_only(true);
        let test_pool = match SqlitePool::connect_with(opts).await {
            Ok(p) => p,
            Err(e) => {
                return Ok(BackupValidation {
                    valid: false,
                    file_size,
                    table_count: 0,
                    error: Some(format!("Failed to open database: {}", e)),
                });
            }
        };

        let integrity: String = sqlx::query_scalar("PRAGMA integrity_check")
            .fetch_one(&test_pool)
            .await
            .unwrap_or_else(|_| "error".to_string());
        let table_count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table'",
        )
        .fetch_one(&test_pool)
        .await
        .unwrap_or(0);

        test_pool.close().await;

        let ok = integrity.trim() == "ok";
        Ok(BackupValidation {
            valid: ok,
            file_size,
            table_count,
            error: if ok { None } else { Some(integrity) },
        })
    }

    pub async fn list_available_backups(pool: &SqlitePool) -> AppResult<Vec<BackupRecord>> {
        let records = sqlx::query_as::<_, BackupRecord>(
            "SELECT id, backup_type, backup_path, cloud_provider, status, file_size, error_message, created_at, completed_at
             FROM backups WHERE status = 'success' ORDER BY created_at DESC LIMIT 50"
        )
        .fetch_all(pool)
        .await?;
        Ok(records)
    }

    pub async fn get_backup_file_path(
        pool: &SqlitePool,
        backup_id: i64,
    ) -> AppResult<String> {
        let path: Option<String> = sqlx::query_scalar(
            "SELECT backup_path FROM backups WHERE id = ? AND cloud_provider = 'local' AND status = 'success'"
        )
        .bind(backup_id)
        .fetch_optional(pool)
        .await?;

        path.ok_or_else(|| AppError::NotFound(format!("Backup {} not found or not a local backup", backup_id)))
    }
}
