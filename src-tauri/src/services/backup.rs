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
    ) -> AppResult<BackupRecord> {
        std::fs::create_dir_all(backup_dir)?;

        let now = Utc::now();
        let filename = format!("dental_clinic_{}.db", now.format("%Y%m%d_%H%M%S"));
        let dest = backup_dir.join(&filename);
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
        let row = sqlx::query_as::<_, (bool, String, String, Option<String>, Option<String>, bool, Option<String>)>(
            "SELECT auto_backup_enabled, auto_backup_frequency, auto_backup_target, last_backup_at, gdrive_client_id, gdrive_connected, gdrive_folder_id
             FROM app_settings WHERE id = 1"
        )
        .fetch_optional(pool)
        .await?;

        match row {
            Some(r) => Ok(BackupSettings {
                auto_backup_enabled: r.0,
                auto_backup_frequency: r.1,
                auto_backup_target: r.2,
                last_backup_at: r.3,
                gdrive_client_id: r.4,
                gdrive_connected: r.5,
                gdrive_folder_id: r.6,
            }),
            None => Ok(BackupSettings {
                auto_backup_enabled: false,
                auto_backup_frequency: "daily".into(),
                auto_backup_target: "local".into(),
                last_backup_at: None,
                gdrive_client_id: None,
                gdrive_connected: false,
                gdrive_folder_id: None,
            }),
        }
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
        Self::get_backup_settings(pool).await
    }

    pub async fn set_last_backup_now(pool: &SqlitePool) -> AppResult<()> {
        let now = Utc::now().to_rfc3339();
        sqlx::query("UPDATE app_settings SET last_backup_at = ? WHERE id = 1")
            .bind(&now)
            .execute(pool)
            .await?;
        Ok(())
    }
}
