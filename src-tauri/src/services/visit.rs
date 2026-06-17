use sqlx::SqlitePool;
use crate::models::*;
use crate::services::errors::{AppError, AppResult};
use chrono::Utc;
// use uuid::Uuid;

#[derive(Debug, sqlx::FromRow)]
struct ProcedureRow {
    treatment_record_id: String,
    procedure_name: String,
    procedure_additional_note: Option<String>,
    number_of_procedures: i32,
    unit_price: f64,
    total_price: f64,
    performed_at: String,
}

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

    pub async fn get_with_treatments(pool: &SqlitePool, patient_id: &str) -> AppResult<Vec<PatientVisitWithTreatments>> {
        let visits = sqlx::query_as::<_, Visit>(
            "SELECT id, patient_id, visit_date, chief_complaint, clinical_notes, status, created_at, updated_at FROM visits WHERE patient_id = ? ORDER BY visit_date DESC"
        )
        .bind(patient_id)
        .fetch_all(pool)
        .await?;

        let mut result = Vec::new();

        for visit in visits {
            let rows: Vec<ProcedureRow> = sqlx::query_as(
                "SELECT tr.id as treatment_record_id,
                        p.name as procedure_name,
                        p.additional_note as procedure_additional_note,
                        tr.number_of_procedures,
                        p.procedure_price as unit_price,
                        (p.procedure_price * tr.number_of_procedures) as total_price,
                        tr.performed_at
                 FROM treatment_records tr
                 JOIN procedures p ON p.id = tr.procedure_id
                 WHERE tr.visit_id = ?
                 ORDER BY tr.performed_at DESC"
            )
            .bind(&visit.id)
            .fetch_all(pool)
            .await?;

            let mut treatment_procedures: Vec<TreatmentProcedure> = Vec::new();
            for row in rows {
                let treatment_record_id = row.treatment_record_id.clone();
                let teeth = sqlx::query_as::<_, TreatmentTooth>(
                    "SELECT id, treatment_record_id, tooth_number, tooth_quadrant FROM treatment_tooth WHERE treatment_record_id = ?"
                )
                .bind(&treatment_record_id)
                .fetch_all(pool)
                .await?.into_iter().collect();

                let procedure_name = match row.procedure_additional_note.as_deref().map(str::trim).filter(|note| !note.is_empty()) {
                    Some(note) => format!("{} - {}", row.procedure_name, note),
                    None => row.procedure_name,
                };

                treatment_procedures.push(TreatmentProcedure {
                    treatment_record_id,
                    procedure_name,
                    procedure_additional_note: None,
                    number_of_procedures: row.number_of_procedures,
                    unit_price: row.unit_price,
                    total_price: row.total_price,
                    performed_at: row.performed_at,
                    teeth,
                });
            }

            result.push(PatientVisitWithTreatments {
                visit_id: visit.id,
                visit_date: visit.visit_date,
                chief_complaint: visit.chief_complaint,
                clinical_notes: visit.clinical_notes,
                status: visit.status,
                procedures: treatment_procedures,
            });
        }

        Ok(result)
    }
}
