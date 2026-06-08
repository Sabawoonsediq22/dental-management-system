use sqlx::SqlitePool;
use crate::models::*;
use crate::services::errors::AppResult;
use chrono::Utc;
use uuid::Uuid;

pub struct ProcedureService;

impl ProcedureService {
    pub async fn list(pool: &SqlitePool) -> AppResult<Vec<Procedure>> {
        let procedures = sqlx::query_as(
            "SELECT id, name, description, default_price, category, is_active, created_at, updated_at FROM procedures ORDER BY name"
        )
        .fetch_all(pool)
        .await?;

        Ok(procedures)
    }

    #[allow(dead_code)]
    pub async fn seed_defaults(pool: &SqlitePool) -> AppResult<()> {
        let defaults: Vec<(&str, &str, f64, &str)> = vec![
            ("Examination", "Initial examination", 200.0, "General"),
            ("Simple Filling", "Basic dental filling", 1500.0, "Restorative"),
            ("RCT", "Root canal treatment", 2000.0, "Endodontic"),
            ("Zirconium Crown", "Zirconium dental crown", 100.0, "Prosthetic"),
            ("PMF Crown", "Porcelain fused metal crown", 2000.0, "Prosthetic"),
            ("Metal Crown", "Full metal crown", 1500.0, "Prosthetic"),
            ("Veneer Direct", "Direct veneer placement", 2000.0, "Cosmetic"),
            ("Extraction (Simple)", "Simple tooth extraction", 500.0, "Surgical"),
            ("Extraction (Complex)", "Complex tooth extraction", 1500.0, "Surgical"),
            ("Extraction (Surgical)", "Surgical extraction", 3000.0, "Surgical"),
            ("Mucocele Removing", "Mucocele removal procedure", 5000.0, "Surgical"),
            ("Crown Lengthening", "Crown lengthening surgery", 1500.0, "Surgical"),
            ("RCT + Post Corel + Crown", "Complete root canal with post and crown", 5000.0, "Restorative"),
            ("Dentures Upper Lower", "Full denture set", 30000.0, "Prosthetic"),
            ("Orthodontics (Basic)", "Basic orthodontic treatment", 300.0, "Orthodontic"),
            ("Orthodontics (Standard)", "Standard orthodontic treatment", 400.0, "Orthodontic"),
            ("Orthodontics Visit", "Orthodontic follow-up", 1500.0, "Orthodontic"),
            ("Implant Surgery Only (Standard)", "Standard implant surgery", 400.0, "Implant"),
            ("Implant Surgery Only (Premium)", "Premium implant surgery", 500.0, "Implant"),
            ("Scaling & Polishing", "Cleaning and polishing", 1500.0, "Preventive"),
            ("Bleaching", "Teeth whitening", 100.0, "Cosmetic"),
            ("Old Crown Cementation Fee", "Cementation fee", 150.0, "Prosthetic"),
        ];

        let now = Utc::now().to_rfc3339();
        for (name, desc, price, category) in defaults {
            let id = format!("PROC-{}", Uuid::new_v4().simple());
            sqlx::query(
                "INSERT OR IGNORE INTO procedures (id, name, description, default_price, category, is_active, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            )
            .bind(&id)
            .bind(name)
            .bind(desc)
            .bind(price)
            .bind(category)
            .bind(true)
            .bind(&now)
            .bind(&now)
            .execute(pool)
            .await?;
        }

        Ok(())
    }
}