use crate::models::*;
use crate::services::errors::{AppError, AppResult};
use chrono::{Local, Utc};
use sqlx::{SqlitePool, Transaction};
use std::io;
use tauri::Manager;
use uuid::Uuid;

pub struct NewPatientIntakeService;

impl NewPatientIntakeService {
    pub async fn create(
        pool: &SqlitePool,
        app_handle: &tauri::AppHandle,
        input: CreatePatientIntakeInput,
    ) -> AppResult<PatientIntakeResult> {
        Self::validate_input(&input)?;

        let now = Utc::now().to_rfc3339();
        let patient_id = Self::next_patient_id(pool).await?;
        let xray_file_path = Self::prepare_xray_file(
            app_handle,
            &patient_id,
            input.xray_filename.as_deref(),
            input.xray_bytes.as_deref(),
            &now,
        )?;

        let result =
            Self::create_in_transaction(pool, input, patient_id, now, xray_file_path.clone()).await;

        if result.is_err() {
            if let Some(path) = xray_file_path {
                let _ = std::fs::remove_file(path);
            }
        }

        result
    }

    async fn create_in_transaction(
        pool: &SqlitePool,
        input: CreatePatientIntakeInput,
        patient_id: String,
        now: String,
        xray_file_path: Option<String>,
    ) -> AppResult<PatientIntakeResult> {
        let mut tx = pool.begin().await?;

        let gender_str = match input.gender {
            Gender::Male => "Male",
            Gender::Female => "Female",
            Gender::Other => "Other",
        };

        let patient = sqlx::query_as::<_, Patient>(
            "INSERT INTO patients (id, full_name, phone, age, gender, address, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             RETURNING id, full_name, phone, age, gender, address, created_at, updated_at",
        )
        .bind(&patient_id)
        .bind(&input.full_name)
        .bind(&input.phone)
        .bind(input.age)
        .bind(gender_str)
        .bind(&input.address)
        .bind(&now)
        .bind(&now)
        .fetch_one(&mut *tx)
        .await?;

        for allergy in Self::split_csv(input.allergies.as_deref()) {
            sqlx::query(
                "INSERT OR IGNORE INTO patient_allergies (patient_id, allergy_name) VALUES (?, ?)",
            )
            .bind(&patient.id)
            .bind(allergy)
            .execute(&mut *tx)
            .await?;
        }

        for medication in Self::split_csv(input.medications.as_deref()) {
            sqlx::query(
                "INSERT OR IGNORE INTO patient_medications (patient_id, medication_name) VALUES (?, ?)",
            )
            .bind(&patient.id)
            .bind(medication)
            .execute(&mut *tx)
            .await?;
        }

        for condition in Self::dedupe_strings(&input.medical_conditions) {
            sqlx::query(
                "INSERT OR IGNORE INTO medical_conditions (patient_id, condition_name, is_active) VALUES (?, ?, TRUE)",
            )
            .bind(&patient.id)
            .bind(condition)
            .execute(&mut *tx)
            .await?;
        }

        let visit_id = Self::next_visit_id(&mut tx).await?;
        let visit_date = now.clone();

        let visit = sqlx::query_as::<_, Visit>(
            "INSERT INTO visits (id, patient_id, visit_date, chief_complaint, clinical_notes, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             RETURNING id, patient_id, visit_date, chief_complaint, clinical_notes, status, created_at, updated_at",
        )
        .bind(&visit_id)
        .bind(&patient.id)
        .bind(&visit_date)
        .bind(&input.chief_complaint)
        .bind(&input.clinical_notes)
        .bind("Open")
        .bind(&now)
        .bind(&now)
        .fetch_one(&mut *tx)
        .await?;

        let procedure = match input.procedure_name.as_deref() {
            Some(name) if !name.trim().is_empty() => {
                let procedure_name = name.trim();
                let procedure = sqlx::query_as::<_, Procedure>(
                    "SELECT id, name, additional_note, price, created_at, updated_at FROM procedures WHERE name = ?",
                )
                .bind(procedure_name)
                .fetch_optional(&mut *tx)
                .await?
                .ok_or_else(|| AppError::InvalidInput(format!("Procedure '{}' not found", procedure_name)))?;

                Some(procedure)
            }
            _ => None,
        };

        let procedure_price = input
            .procedure_price_override
            .unwrap_or_else(|| procedure.as_ref().map(|p| p.price).unwrap_or(0.0));
        let subtotal = procedure_price * input.quantity as f64;

        if input.discount > subtotal {
            return Err(AppError::InvalidInput(
                "Discount cannot exceed treatment subtotal".to_string(),
            ));
        }

        let treatment_record = if let Some(procedure) = procedure {
            let treatment_id = format!("TR-{}", Uuid::new_v4().simple());
            let treatment_record = sqlx::query_as::<_, TreatmentRecord>(
                "INSERT INTO treatment_records (id, visit_id, procedure_id, tooth_quadrant, quantity, procedure_price, performed_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)
                 RETURNING id, visit_id, procedure_id, tooth_quadrant, quantity, procedure_price, performed_at",
            )
            .bind(&treatment_id)
            .bind(&visit.id)
            .bind(&procedure.id)
            .bind(&Option::<String>::None)
            .bind(input.quantity)
            .bind(procedure_price)
            .bind(&now)
            .fetch_one(&mut *tx)
            .await?;

            for tooth_number in &input.tooth_numbers {
                sqlx::query(
                    "INSERT INTO treatment_teeth (treatment_record_id, tooth_number) VALUES (?, ?)",
                )
                .bind(&treatment_id)
                .bind(tooth_number)
                .execute(&mut *tx)
                .await?;
            }

            Some(treatment_record)
        } else {
            None
        };

        let invoice_id = format!("INV-{}", Uuid::new_v4().simple());
        let invoice_number = format!(
            "INV-{}-{}",
            Utc::now().timestamp_millis(),
            Uuid::new_v4().simple()
        );
        let total_amount = subtotal - input.discount;

        let invoice = sqlx::query_as::<_, Invoice>(
            "INSERT INTO invoices (id, visit_id, invoice_number, subtotal, discount, total_amount, paid_amount, outstanding_amount, status, issued_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             RETURNING id, visit_id, invoice_number, subtotal, discount, total_amount, paid_amount, outstanding_amount, status, issued_at",
        )
        .bind(&invoice_id)
        .bind(&visit.id)
        .bind(invoice_number)
        .bind(subtotal)
        .bind(input.discount)
        .bind(total_amount)
        .bind(0.0)
        .bind(total_amount)
        .bind("Unpaid")
        .bind(&now)
        .fetch_one(&mut *tx)
        .await?;

        let xray = if let Some(file_path) = xray_file_path {
            let xray_id = format!("XRAY-{}", Uuid::new_v4().simple());
            let xray = sqlx::query_as::<_, Xray>(
                "INSERT INTO xrays (id, patient_id, file_path, is_primary, uploaded_at)
                 VALUES (?, ?, ?, ?, ?)
                 RETURNING id, patient_id, file_path, is_primary, uploaded_at",
            )
            .bind(xray_id)
            .bind(&patient.id)
            .bind(file_path)
            .bind(false)
            .bind(&now)
            .fetch_one(&mut *tx)
            .await?;

            Some(xray)
        } else {
            None
        };

        tx.commit().await?;

        Ok(PatientIntakeResult {
            patient,
            visit,
            treatment_record,
            invoice,
            xray,
        })
    }

    async fn next_patient_id(pool: &SqlitePool) -> AppResult<String> {
        let count = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM patients")
            .fetch_one(pool)
            .await?;

        Ok(format!("KD-{}-{:03}", Local::now().format("%Y"), count + 1))
    }

    async fn next_visit_id(tx: &mut Transaction<'_, sqlx::Sqlite>) -> AppResult<String> {
        let count = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM visits")
            .fetch_one(&mut **tx)
            .await?;

        Ok(format!(
            "V-{}-{:06}",
            Utc::now().format("%Y%m%d"),
            count + 1
        ))
    }

    fn prepare_xray_file(
        app_handle: &tauri::AppHandle,
        patient_id: &str,
        filename: Option<&str>,
        bytes: Option<&[u8]>,
        now: &str,
    ) -> AppResult<Option<String>> {
        match (filename, bytes) {
            (Some(filename), Some(bytes)) => {
                let app_data_dir = app_handle
                    .path()
                    .app_data_dir()
                    .map_err(|e| io::Error::new(io::ErrorKind::Other, e.to_string()))?;
                let base_path = app_data_dir.join("xrays").join(patient_id);
                std::fs::create_dir_all(&base_path)?;

                let safe_filename = Self::sanitize_xray_filename(filename);
                let file_path =
                    base_path.join(format!("{}-{}", now.replace(':', "-"), safe_filename));
                std::fs::write(&file_path, bytes)?;

                Ok(Some(file_path.to_string_lossy().to_string()))
            }
            (Some(_), None) | (None, Some(_)) => Err(AppError::InvalidInput(
                "X-ray filename and file bytes must be provided together".to_string(),
            )),
            (None, None) => Ok(None),
        }
    }

    fn sanitize_xray_filename(filename: &str) -> String {
        let sanitized: String = filename
            .chars()
            .filter(|c| c.is_alphanumeric() || *c == '.' || *c == '-' || *c == '_')
            .collect();

        if sanitized.is_empty() {
            "xray.bin".to_string()
        } else {
            sanitized
        }
    }

    fn split_csv(value: Option<&str>) -> Vec<String> {
        value
            .unwrap_or("")
            .split(',')
            .map(|item| item.trim().to_string())
            .filter(|item| !item.is_empty())
            .collect()
    }

    fn dedupe_strings(values: &[String]) -> Vec<String> {
        let mut result: Vec<String> = values
            .iter()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty())
            .collect();

        result.sort_by(|a, b| a.to_lowercase().cmp(&b.to_lowercase()));
        result.dedup_by(|a, b| a.eq_ignore_ascii_case(b));
        result
    }

    fn validate_input(input: &CreatePatientIntakeInput) -> AppResult<()> {
        if input.full_name.trim().is_empty() {
            return Err(AppError::InvalidInput("Full name is required".to_string()));
        }

        if input.phone.trim().is_empty() {
            return Err(AppError::InvalidInput(
                "Phone number is required".to_string(),
            ));
        }

        if input.age <= 0 || input.age > 150 {
            return Err(AppError::InvalidInput(
                "Age must be between 1 and 150".to_string(),
            ));
        }

        if input.discount < 0.0 {
            return Err(AppError::InvalidInput(
                "Discount cannot be negative".to_string(),
            ));
        }

        if input.quantity <= 0 {
            return Err(AppError::InvalidInput(
                "Procedure quantity must be greater than zero".to_string(),
            ));
        }

        if input
            .procedure_price_override
            .is_some_and(|price| price < 0.0)
        {
            return Err(AppError::InvalidInput(
                "Procedure price cannot be negative".to_string(),
            ));
        }

        match (input.xray_filename.as_deref(), input.xray_bytes.as_ref()) {
            (Some(filename), Some(_)) if filename.trim().is_empty() => Err(AppError::InvalidInput(
                "X-ray filename cannot be empty".to_string(),
            )),
            (Some(_), None) | (None, Some(_)) => Err(AppError::InvalidInput(
                "X-ray filename and file bytes must be provided together".to_string(),
            )),
            _ => Ok(()),
        }
    }
}
