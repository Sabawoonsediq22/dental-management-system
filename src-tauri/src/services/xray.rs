use tauri::Manager;
use sqlx::SqlitePool;
use crate::models::*;
use crate::services::errors::AppResult;
use chrono::Utc;
use uuid::Uuid;

#[allow(dead_code)]
pub struct XrayService;

#[allow(dead_code)]
impl XrayService {
    pub async fn upload(
        pool: &SqlitePool,
        app_handle: &tauri::AppHandle,
        patient_id: &str,
        treatment_record_id: Option<&str>,
        filename: &str,
        bytes: &[u8],
    ) -> AppResult<Xray> {
        let id = format!("XRAY-{}", Uuid::new_v4().simple());
        let now = Utc::now().to_rfc3339();

        let base_path = app_handle
            .path()
            .app_data_dir()
            .unwrap()
            .join("xrays")
            .join(patient_id);
        
        std::fs::create_dir_all(&base_path)?;
        
        let safe_filename: String = filename.chars().filter(|c| c.is_alphanumeric() || *c == '.' || *c == '-' || *c == '_').collect();
        let file_path = base_path.join(&format!("{}-{}", now.replace(':', "-"), safe_filename)).to_string_lossy().to_string();
        std::fs::write(&file_path, bytes)?;

        let xray = sqlx::query_as::<_, Xray>(
            "INSERT INTO xrays (id, patient_id, treatment_record_id, file_path, is_primary, uploaded_at)
             VALUES (?, ?, ?, ?, ?, ?)
             RETURNING id, patient_id, treatment_record_id, file_path, is_primary, uploaded_at"
        )
        .bind(&id)
        .bind(patient_id)
        .bind(treatment_record_id)
        .bind(&file_path)
        .bind(false)
        .bind(&now)
        .fetch_one(pool)
        .await?;

        Ok(xray)
    }

    pub async fn list_for_patient(pool: &SqlitePool, patient_id: &str) -> AppResult<Vec<Xray>> {
        let xrays = sqlx::query_as(
            "SELECT id, patient_id, treatment_record_id, file_path, is_primary, uploaded_at FROM xrays WHERE patient_id = ? ORDER BY uploaded_at DESC"
        )
        .bind(patient_id)
        .fetch_all(pool)
        .await?;

        Ok(xrays)
    }

    pub async fn list_for_treatment_record(pool: &SqlitePool, treatment_record_id: &str) -> AppResult<Vec<Xray>> {
        let xrays = sqlx::query_as(
            "SELECT id, patient_id, treatment_record_id, file_path, is_primary, uploaded_at FROM xrays WHERE treatment_record_id = ? ORDER BY uploaded_at DESC"
        )
        .bind(treatment_record_id)
        .fetch_all(pool)
        .await?;

        Ok(xrays)
    }
}