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

    #[allow(dead_code)]
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

        let number_of_procedures = input.number_of_procedures.max(1);

        let treatment_record = sqlx::query_as::<_, TreatmentRecord>(
            "INSERT INTO treatment_records (id, visit_id, procedure_id, number_of_procedures, performed_at)
             VALUES (?, ?, ?, ?, ?)
             RETURNING id, visit_id, procedure_id, number_of_procedures, performed_at",
        )
        .bind(&id)
        .bind(&input.visit_id)
        .bind(&input.procedure_id)
        .bind(number_of_procedures)
        .bind(&now)
        .fetch_one(&mut **tx)
        .await?;

        for tooth in input.treatment_teeth.iter().filter(|tooth| tooth.tooth_number > 0) {
            sqlx::query(
                "INSERT INTO treatment_tooth (id, treatment_record_id, tooth_number, tooth_quadrant) VALUES (NULL, ?, ?, ?)",
            )
            .bind(&id)
            .bind(tooth.tooth_number)
            .bind(tooth.tooth_quadrant.trim())
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
            "SELECT id, visit_id, procedure_id, number_of_procedures, performed_at FROM treatment_records WHERE visit_id = ? ORDER BY performed_at DESC",
        )
        .bind(visit_id)
        .fetch_all(pool)
        .await?;

        Ok(records)
    }
}
