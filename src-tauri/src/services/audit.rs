use sqlx::SqlitePool;
use crate::services::errors::{AppError, AppResult};
use chrono::Utc;

pub struct AuditService;

impl AuditService {
    pub async fn log(
        pool: &SqlitePool,
        action: &str,
        entity_type: &str,
        entity_id: Option<&str>,
        details: Option<&str>,
        performed_by: Option<&str>,
    ) -> AppResult<()> {
        sqlx::query(
            "INSERT INTO audit_log (action, entity_type, entity_id, details, performed_by, created_at)
             VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(action)
        .bind(entity_type)
        .bind(entity_id)
        .bind(details)
        .bind(performed_by)
        .bind(Utc::now().to_rfc3339())
        .execute(pool)
        .await
        .map_err(AppError::Database)?;
        Ok(())
    }

    pub async fn query(
        pool: &SqlitePool,
        limit: i64,
        offset: i64,
        entity_type: Option<&str>,
        action: Option<&str>,
    ) -> AppResult<Vec<AuditLogEntry>> {
        let mut sql = String::from(
            "SELECT id, action, entity_type, entity_id, details, performed_by, created_at FROM audit_log WHERE 1=1"
        );
        let mut bind_values: Vec<String> = Vec::new();

        if let Some(et) = entity_type {
            sql.push_str(" AND entity_type = ?");
            bind_values.push(et.to_string());
        }
        if let Some(a) = action {
            sql.push_str(" AND action = ?");
            bind_values.push(a.to_string());
        }

        sql.push_str(" ORDER BY created_at DESC LIMIT ? OFFSET ?");

        let mut query = sqlx::query_as::<_, AuditLogEntry>(&sql);
        for val in &bind_values {
            query = query.bind(val);
        }
        query = query.bind(limit).bind(offset);

        let entries = query.fetch_all(pool).await.map_err(AppError::Database)?;
        Ok(entries)
    }

    pub async fn count(
        pool: &SqlitePool,
        entity_type: Option<&str>,
        action: Option<&str>,
    ) -> AppResult<i64> {
        let mut sql = String::from("SELECT COUNT(*) FROM audit_log WHERE 1=1");
        let mut bind_values: Vec<String> = Vec::new();

        if let Some(et) = entity_type {
            sql.push_str(" AND entity_type = ?");
            bind_values.push(et.to_string());
        }
        if let Some(a) = action {
            sql.push_str(" AND action = ?");
            bind_values.push(a.to_string());
        }

        let mut query = sqlx::query_scalar(&sql);
        for val in &bind_values {
            query = query.bind(val);
        }

        let count: i64 = query.fetch_one(pool).await.map_err(AppError::Database)?;
        Ok(count)
    }
}

#[derive(Debug, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct AuditLogEntry {
    pub id: i64,
    pub action: String,
    pub entity_type: String,
    pub entity_id: Option<String>,
    pub details: Option<String>,
    pub performed_by: Option<String>,
    pub created_at: String,
}
