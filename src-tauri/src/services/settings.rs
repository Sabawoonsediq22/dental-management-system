use sqlx::SqlitePool;
use crate::models::*;
use crate::services::errors::AppResult;
use chrono::Utc;
use serde::{Deserialize, Serialize};

pub struct SettingsService;

impl SettingsService {
    pub async fn get(pool: &SqlitePool) -> AppResult<AppSettings> {
        let settings = sqlx::query_as::<_, AppSettings>(
            "SELECT id, clinic_name, clinic_phone, clinic_address, support_email, clinic_logo, language, auto_backup_enabled, auto_backup_frequency, auto_backup_target, last_backup_at, gdrive_client_id, gdrive_connected, gdrive_folder_id, local_backup_enabled, local_backup_frequency, local_last_backup_at, local_next_scheduled_backup, gdrive_backup_enabled, gdrive_backup_frequency, gdrive_connected_email, gdrive_last_backup_at, gdrive_next_scheduled_backup, gdrive_last_sync_at, created_at, updated_at FROM app_settings LIMIT 1"
        )
        .fetch_optional(pool)
        .await?;

        match settings {
            Some(s) => Ok(s),
            None => {
                let now = Utc::now().to_rfc3339();
                let s = AppSettings {
                    id: 1,
                    clinic_name: None,
                    clinic_phone: None,
                    clinic_address: None,
                    support_email: None,
                    clinic_logo: None,
                    language: Some("en".to_string()),
                    auto_backup_enabled: false,
                    auto_backup_frequency: "daily".to_string(),
                    auto_backup_target: "local".to_string(),
                    last_backup_at: None,
                    gdrive_client_id: None,
                    gdrive_connected: false,
                    gdrive_folder_id: None,
                    local_backup_enabled: false,
                    local_backup_frequency: "daily".to_string(),
                    local_last_backup_at: None,
                    local_next_scheduled_backup: None,
                    gdrive_backup_enabled: false,
                    gdrive_backup_frequency: "daily".to_string(),
                    gdrive_connected_email: None,
                    gdrive_last_backup_at: None,
                    gdrive_next_scheduled_backup: None,
                    gdrive_last_sync_at: None,
                    created_at: now.clone(),
                    updated_at: now.clone(),
                };
                sqlx::query(
                    "INSERT INTO app_settings (id, clinic_name, clinic_phone, clinic_address, support_email, clinic_logo, language, auto_backup_enabled, auto_backup_frequency, auto_backup_target, gdrive_connected, gdrive_folder_id, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
                )
                .bind(1)
                .bind::<Option<String>>(None)
                .bind::<Option<String>>(None)
                .bind::<Option<String>>(None)
                .bind::<Option<String>>(None)
                .bind::<Option<String>>(None)
                .bind("en")
                .bind(false)
                .bind("daily")
                .bind("local")
                .bind(false)
                .bind::<Option<String>>(None)
                .bind(&now)
                .bind(&now)
                .execute(pool)
                .await?;
                Ok(s)
            }
        }
    }

    pub async fn update(pool: &SqlitePool, input: UpdateSettingsInput) -> AppResult<AppSettings> {
        let now = Utc::now().to_rfc3339();

        sqlx::query(
            "UPDATE app_settings SET clinic_name=?, clinic_phone=?, clinic_address=?, support_email=?, clinic_logo=?, language=?, updated_at=? WHERE id=1"
        )
        .bind(&input.clinic_name)
        .bind(&input.clinic_phone)
        .bind(&input.clinic_address)
        .bind(&input.support_email)
        .bind(&input.clinic_logo)
        .bind(&input.language)
        .bind(&now)
        .execute(pool)
        .await?;

        Self::get(pool).await
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateSettingsInput {
    pub clinic_name: Option<String>,
    pub clinic_phone: Option<String>,
    pub clinic_address: Option<String>,
    pub support_email: Option<String>,
    pub clinic_logo: Option<String>,
    pub language: Option<String>,
}
