use sqlx::SqlitePool;
use crate::models::*;
use crate::services::errors::AppResult;
use chrono::Utc;
use uuid::Uuid;

pub struct ProcedureService;

impl ProcedureService {
    pub async fn list(pool: &SqlitePool) -> AppResult<Vec<Procedure>> {
        let procedures = sqlx::query_as(
            "SELECT id, name, additional_note, price, created_at, updated_at FROM procedures ORDER BY name"
        )
        .fetch_all(pool)
        .await?;

        Ok(procedures)
    }

    pub async fn find_by_name(pool: &SqlitePool, name: &str) -> AppResult<Option<Procedure>> {
        let procedure = sqlx::query_as(
            "SELECT id, name, additional_note, price, created_at, updated_at FROM procedures WHERE name = ?"
        )
        .bind(name)
        .fetch_optional(pool)
        .await?;

        Ok(procedure)
    }

    #[allow(dead_code)]
    pub async fn seed_defaults(pool: &SqlitePool) -> AppResult<()> {
        let defaults: Vec<(&str, &str, f64)> = vec![
            ("Examination", "Initial examination", 200.0),
            ("Simple Filling", "Basic dental filling", 1500.0),
            ("RCT", "Root canal treatment", 2000.0),
            ("Zirconium Crown", "Zirconium dental crown", 100.0),
            ("PMF Crown", "Porcelain fused metal crown", 2000.0),
            ("Metal Crown", "Full metal crown", 1500.0),
            ("Veneer Direct", "Direct veneer placement", 2000.0),
            ("Extraction (Simple)", "Simple tooth extraction", 500.0),
            ("Extraction (Complex)", "Complex tooth extraction", 1500.0),
            ("Extraction (Surgical)", "Surgical extraction", 3000.0),
            ("Mucocele Removing", "Mucocele removal procedure", 5000.0),
            ("Crown Lengthening", "Crown lengthening surgery", 1500.0),
            ("RCT + Post Corel + Crown", "Complete root canal with post and crown", 5000.0),
            ("Dentures Upper Lower", "Full denture set", 30000.0),
            ("Orthodontics (Basic)", "Basic orthodontic treatment", 300.0),
            ("Orthodontics (Standard)", "Standard orthodontic treatment", 400.0),
            ("Orthodontics Visit", "Orthodontic follow-up", 1500.0),
            ("Implant Surgery Only (Standard)", "Standard implant surgery", 400.0),
            ("Implant Surgery Only (Premium)", "Premium implant surgery", 500.0),
            ("Scaling & Polishing", "Cleaning and polishing", 1500.0),
            ("Bleaching", "Teeth whitening", 100.0),
            ("Old Crown Cementation Fee", "Cementation fee", 150.0),
        ];

        let now = Utc::now().to_rfc3339();
        for (name, note, price) in defaults {
            let id = format!("PROC-{}", Uuid::new_v4().simple());
            sqlx::query(
                "INSERT OR IGNORE INTO procedures (id, name, additional_note, price, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?)"
            )
            .bind(&id)
            .bind(name)
            .bind(note)
            .bind(price)
            .bind(&now)
            .bind(&now)
            .execute(pool)
            .await?;
        }

        Ok(())
    }
}