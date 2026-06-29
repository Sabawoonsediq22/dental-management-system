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
}
