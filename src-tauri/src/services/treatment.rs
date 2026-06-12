use crate::models::*;
use crate::services::errors::AppResult;
use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

pub struct TreatmentRecordService;

impl TreatmentRecordService {
    pub async fn create(
        pool: &SqlitePool,
        input: CreateTreatmentRecordInput,
    ) -> AppResult<TreatmentRecord> {
        let id = format!("TR-{}", Uuid::new_v4().simple());
        let now = Utc::now().to_rfc3339();

        let treatment_record = sqlx::query_as::<_, TreatmentRecord>(
            "INSERT INTO treatment_records (id, visit_id, procedure_id, tooth_quadrant, quantity, procedure_price, performed_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             RETURNING id, visit_id, procedure_id, tooth_quadrant, quantity, procedure_price, performed_at"
        )
        .bind(&id)
        .bind(&input.visit_id)
        .bind(&input.procedure_id)
        .bind(&input.tooth_quadrant)
        .bind(input.quantity)
        .bind(input.procedure_price)
        .bind(&now)
        .fetch_one(pool)
        .await?;

        // Insert tooth numbers
        for tooth_number in &input.tooth_numbers {
            sqlx::query(
                "INSERT INTO treatment_teeth (treatment_record_id, tooth_number) VALUES (?, ?)",
            )
            .bind(&id)
            .bind(tooth_number)
            .execute(pool)
            .await?;
        }

        Ok(treatment_record)
    }

    #[allow(dead_code)]
    pub async fn list_for_visit(
        pool: &SqlitePool,
        visit_id: &str,
    ) -> AppResult<Vec<TreatmentRecord>> {
        let records = sqlx::query_as(
            "SELECT id, visit_id, procedure_id, tooth_quadrant, quantity, procedure_price, performed_at FROM treatment_records WHERE visit_id = ? ORDER BY performed_at DESC"
        )
        .bind(visit_id)
        .fetch_all(pool)
        .await?;

        Ok(records)
    }
}
