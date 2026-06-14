use crate::models::*;
use crate::services::errors::AppResult;
use chrono::Utc;
use sqlx::{SqlitePool, Transaction};
use uuid::Uuid;

pub struct TreatmentRecordService;

impl TreatmentRecordService {
    pub async fn create(
        pool: &SqlitePool,
        input: CreateTreatmentRecordInput,
    ) -> AppResult<TreatmentRecord> {
        let mut tx = pool.begin().await?;
        let record = Self::insert(&mut tx, input).await?;
        tx.commit().await?;
        Ok(record)
    }

    pub async fn insert_in_transaction(
        tx: &mut Transaction<'_, sqlx::Sqlite>,
        input: CreateTreatmentRecordInput,
    ) -> AppResult<TreatmentRecord> {
        Self::insert(tx, input).await
    }

    async fn insert(
        tx: &mut Transaction<'_, sqlx::Sqlite>,
        input: CreateTreatmentRecordInput,
    ) -> AppResult<TreatmentRecord> {
        let id = format!("TR-{}", Uuid::new_v4().simple());
        let now = Utc::now().to_rfc3339();

        let treatment_record = sqlx::query_as::<_, TreatmentRecord>(
            "INSERT INTO treatment_records (id, visit_id, procedure_id, quantity, procedure_price, performed_at)
             VALUES (?, ?, ?, ?, ?, ?)
             RETURNING id, visit_id, procedure_id, quantity, procedure_price, performed_at",
        )
        .bind(&id)
        .bind(&input.visit_id)
        .bind(&input.procedure_id)
        .bind(input.number_of_procedures)
        .bind(input.procedure_price)
        .bind(&now)
        .fetch_one(&mut **tx)
        .await?;

        for tooth_number in &input.tooth_numbers {
            sqlx::query(
                "INSERT INTO treatment_teeth (treatment_record_id, tooth_number, tooth_quadrant) VALUES (?, ?, ?)",
            )
            .bind(&id)
            .bind(tooth_number)
            .bind(&input.tooth_quadrant)
            .execute(&mut **tx)
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
            "SELECT id, visit_id, procedure_id, quantity, procedure_price, performed_at FROM treatment_records WHERE visit_id = ? ORDER BY performed_at DESC",
        )
        .bind(visit_id)
        .fetch_all(pool)
        .await?;

        Ok(records)
    }
}
