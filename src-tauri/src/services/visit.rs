use sqlx::SqlitePool;
use crate::models::*;
use crate::services::errors::{AppError, AppResult};
use chrono::Utc;
// use uuid::Uuid;

pub struct VisitService;

impl VisitService {
    pub async fn create(pool: &SqlitePool, input: CreateVisitInput) -> AppResult<Visit> {
        let id = format!("V-{}-{:06}", Utc::now().format("%Y%m%d"), {
            let count = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM visits").fetch_one(pool).await.unwrap_or(0);
            count + 1
        });

        let now = Utc::now().to_rfc3339();
        let visit_date = input.visit_date.clone().unwrap_or_else(|| now.clone());

        let visit = sqlx::query_as::<_, Visit>(
            "INSERT INTO visits (id, patient_id, visit_date, chief_complaint, clinical_notes, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             RETURNING id, patient_id, visit_date, chief_complaint, clinical_notes, status, created_at, updated_at"
        )
        .bind(&id)
        .bind(&input.patient_id)
        .bind(&visit_date)
        .bind(&input.chief_complaint)
        .bind(&input.clinical_notes)
        .bind("Open")
        .bind(&now)
        .bind(&now)
        .fetch_one(pool)
        .await?;

        Ok(visit)
    }

    pub async fn update_status(pool: &SqlitePool, id: &str, status: VisitStatus) -> AppResult<Visit> {
        let now = Utc::now().to_rfc3339();
        let status_str = match status {
            VisitStatus::Open => "Open",
            VisitStatus::Completed => "Completed",
            VisitStatus::Cancelled => "Cancelled",
        };

        let visit = sqlx::query_as::<_, Visit>(
            "UPDATE visits SET status=?, updated_at=? WHERE id=?
             RETURNING id, patient_id, visit_date, chief_complaint, clinical_notes, status, created_at, updated_at"
        )
        .bind(status_str)
        .bind(&now)
        .bind(id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Visit {} not found", id)))?;

        Ok(visit)
    }

    pub async fn get_by_patient(pool: &SqlitePool, patient_id: &str) -> AppResult<Vec<Visit>> {
        let visits = sqlx::query_as(
            "SELECT id, patient_id, visit_date, chief_complaint, clinical_notes, status, created_at, updated_at FROM visits WHERE patient_id = ? ORDER BY visit_date DESC"
        )
        .bind(patient_id)
        .fetch_all(pool)
        .await?;

        Ok(visits)
    }

    #[allow(dead_code)]
    pub async fn find(pool: &SqlitePool, id: &str) -> AppResult<Visit> {
        let visit = sqlx::query_as(
            "SELECT id, patient_id, visit_date, chief_complaint, clinical_notes, status, created_at, updated_at FROM visits WHERE id = ?"
        )
        .bind(id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Visit {} not found", id)))?;

        Ok(visit)
    }
}