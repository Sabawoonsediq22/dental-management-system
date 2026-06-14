use crate::models::*;
use crate::services::errors::AppResult;
use sqlx::SqlitePool;

pub struct ProcedureService;

impl ProcedureService {
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
    pub async fn seed_defaults(_pool: &SqlitePool) -> AppResult<()> {
        Ok(())
    }
}
