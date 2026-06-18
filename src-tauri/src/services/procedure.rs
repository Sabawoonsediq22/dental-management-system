use crate::models::*;
use crate::services::errors::AppResult;
use sqlx::SqlitePool;

pub struct ProcedureService;

impl ProcedureService {
    pub async fn create(pool: &SqlitePool, input: CreateProcedureInput) -> AppResult<Procedure> {
        let id = format!("PROC-{}", uuid::Uuid::new_v4().simple());
        let now = chrono::Utc::now().to_rfc3339();
        let name = input.name.trim().to_string();
        let additional_note = input
            .additional_note
            .as_deref()
            .map(str::trim)
            .filter(|note| !note.is_empty());

        let procedure = sqlx::query_as::<_, Procedure>(
            "INSERT INTO procedures (id, visit_id, name, additional_note, procedure_price, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             RETURNING id, name, additional_note, procedure_price, created_at, updated_at"
        )
        .bind(&id)
        .bind(&input.visit_id)
        .bind(&name)
        .bind(additional_note)
        .bind(input.procedure_price)
        .bind(&now)
        .bind(&now)
        .fetch_one(pool)
        .await?;

        Ok(procedure)
    }

    pub async fn list(pool: &SqlitePool) -> AppResult<Vec<Procedure>> {
        let procedures = sqlx::query_as(
            "SELECT id, name, additional_note, procedure_price, created_at, updated_at FROM procedures ORDER BY name"
        )
        .fetch_all(pool)
        .await?;

        Ok(procedures)
    }

    pub async fn find_by_name(pool: &SqlitePool, name: &str) -> AppResult<Option<Procedure>> {
        let procedure = sqlx::query_as(
            "SELECT id, name, additional_note, procedure_price, created_at, updated_at FROM procedures WHERE name = ?"
        )
        .bind(name)
        .fetch_optional(pool)
        .await?;

        Ok(procedure)
    }

    #[allow(dead_code)]
    pub async fn update_additional_note(
        pool: &SqlitePool,
        id: &str,
        additional_note: Option<&str>,
    ) -> AppResult<()> {
        sqlx::query("UPDATE procedures SET additional_note = ?, updated_at = ? WHERE id = ?")
            .bind(additional_note)
            .bind(chrono::Utc::now().to_rfc3339())
            .bind(id)
            .execute(pool)
            .await?;

        Ok(())
    }

    #[allow(dead_code)]
    pub async fn seed_defaults(_pool: &SqlitePool) -> AppResult<()> {
        Ok(())
    }
}
