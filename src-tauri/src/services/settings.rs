use sqlx::SqlitePool;
use crate::models::*;
use crate::services::errors::AppResult;
use chrono::Utc;
use serde::{Deserialize, Serialize};

pub struct SettingsService;

impl SettingsService {
    pub async fn get(pool: &SqlitePool) -> AppResult<AppSettings> {
        let settings = sqlx::query_as(
            "SELECT id, clinic_name, clinic_phone, clinic_address, language, created_at, updated_at FROM app_settings LIMIT 1"
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
                    language: Some("en".to_string()),
                    created_at: now.clone(),
                    updated_at: now.clone(),
                };
                sqlx::query(
                    "INSERT INTO app_settings (id, clinic_name, clinic_phone, clinic_address, language, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?)"
                )
                .bind(1)
                .bind::<Option<String>>(None)
                .bind::<Option<String>>(None)
                .bind::<Option<String>>(None)
                .bind("en")
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
            "UPDATE app_settings SET clinic_name=?, clinic_phone=?, clinic_address=?, language=?, updated_at=? WHERE id=1"
        )
        .bind(&input.clinic_name)
        .bind(&input.clinic_phone)
        .bind(&input.clinic_address)
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
    pub language: Option<String>,
}