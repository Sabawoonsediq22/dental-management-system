use crate::models::*;
use crate::services::errors::AppResult;
use crate::services::treatment::TreatmentRecordService;
use chrono::Utc;
use sqlx::{SqlitePool, Transaction};
use uuid::Uuid;

pub struct PatientService;

impl PatientService {
    pub async fn list(
        pool: &SqlitePool,
        query: Option<&str>,
        gender: Option<&str>,
        page: u32,
        per_page: u32,
    ) -> AppResult<PatientPageResult> {
        let offset = ((page.max(1) - 1) * per_page) as i64;
        let per_page_i64 = per_page as i64;

        let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM patients")
            .fetch_one(pool)
            .await?;

        let items: Vec<Patient> = if let Some(q_str) = query {
            if !q_str.trim().is_empty() {
                let like = format!("%{}%", q_str.trim());
                sqlx::query_as(
                    "SELECT id, full_name, phone, age, gender, address, created_at, updated_at FROM patients WHERE full_name LIKE ? OR phone LIKE ? OR id LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
                )
                .bind(&like)
                .bind(&like)
                .bind(&like)
                .bind(per_page_i64)
                .bind(offset)
                .fetch_all(pool)
                .await?
            } else if let Some(g) = gender {
                if g != "All" {
                    sqlx::query_as(
                        "SELECT id, full_name, phone, age, gender, address, created_at, updated_at FROM patients WHERE gender = ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
                    )
                    .bind(g)
                    .bind(per_page_i64)
                    .bind(offset)
                    .fetch_all(pool)
                    .await?
                } else {
                    sqlx::query_as(
                        "SELECT id, full_name, phone, age, gender, address, created_at, updated_at FROM patients ORDER BY created_at DESC LIMIT ? OFFSET ?"
                    )
                    .bind(per_page_i64)
                    .bind(offset)
                    .fetch_all(pool)
                    .await?
                }
            } else {
                sqlx::query_as(
                    "SELECT id, full_name, phone, age, gender, address, created_at, updated_at FROM patients ORDER BY created_at DESC LIMIT ? OFFSET ?"
                )
                .bind(per_page_i64)
                .bind(offset)
                .fetch_all(pool)
                .await?
            }
        } else if let Some(g) = gender {
            if g != "All" {
                sqlx::query_as(
                    "SELECT id, full_name, phone, age, gender, address, created_at, updated_at FROM patients WHERE gender = ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
                )
                .bind(g)
                .bind(per_page_i64)
                .bind(offset)
                .fetch_all(pool)
                .await?
            } else {
                sqlx::query_as(
                    "SELECT id, full_name, phone, age, gender, address, created_at, updated_at FROM patients ORDER BY created_at DESC LIMIT ? OFFSET ?"
                )
                .bind(per_page_i64)
                .bind(offset)
                .fetch_all(pool)
                .await?
            }
        } else {
            sqlx::query_as(
                "SELECT id, full_name, phone, age, gender, address, created_at, updated_at FROM patients ORDER BY created_at DESC LIMIT ? OFFSET ?"
            )
            .bind(per_page_i64)
            .bind(offset)
            .fetch_all(pool)
            .await?
        };

        let total_pages = ((total + per_page_i64 - 1) / per_page_i64).max(1);

        Ok(PatientPageResult {
            items,
            total,
            page,
            per_page,
            total_pages,
        })
    }

    pub async fn find(pool: &SqlitePool, id: &str) -> AppResult<Patient> {
        let patient = sqlx::query_as(
            "SELECT id, full_name, phone, age, gender, address, created_at, updated_at FROM patients WHERE id = ?"
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        patient.ok_or_else(|| {
            crate::services::errors::AppError::NotFound(format!("Patient {} not found", id))
        })
    }

    pub async fn create(pool: &SqlitePool, input: CreatePatientInput) -> AppResult<Patient> {
        let mut tx = pool.begin().await?;
        let patient_count: i32 = sqlx::query_scalar("SELECT COUNT(*) FROM patients")
            .fetch_one(&mut *tx)
            .await?;
        let id = format!(
            "KD-{}-{:03}",
            chrono::Local::now().format("%Y"),
            patient_count + 1
        );

        let gender_str = match input.gender {
            Gender::Male => "Male",
            Gender::Female => "Female",
            Gender::Other => "Other",
        };

        let now = Utc::now().to_rfc3339();

        sqlx::query(
            "INSERT INTO patients (id, full_name, phone, age, gender, address, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(&input.full_name)
        .bind(&input.phone)
        .bind(input.age)
        .bind(gender_str)
        .bind(&input.address)
        .bind(&now)
        .bind(&now)
        .execute(&mut *tx)
        .await?;

        Self::insert_allergies(&mut tx, &id, input.allergies.as_deref()).await?;
        Self::insert_medications(&mut tx, &id, input.medications.as_deref()).await?;
        Self::insert_medical_conditions(&mut tx, &id, input.medical_conditions.as_deref()).await?;
        let visit_id = Self::insert_visit(
            &mut tx,
            &id,
            input.visit_date.as_deref(),
            input.chief_complaint.as_deref(),
            input.clinical_notes.as_deref(),
            &now,
        )
        .await?;

        if let Some(procedure_id) = Self::insert_procedure(
            &mut tx,
            &visit_id,
            input.procedure_name.as_deref(),
            input.procedure_additional_note.as_deref(),
            input.procedure_price,
            &now,
        )
        .await?
        {
            Self::insert_treatment_record(
                &mut tx,
                &visit_id,
                &procedure_id,
                input.number_of_procedures,
                input.treatment_teeth.as_deref(),
            )
            .await?;
        }

        Self::insert_invoice(
            &mut tx,
            &visit_id,
            input.discount.unwrap_or(0.0),
            input.paid_amount.unwrap_or(0.0),
        )
        .await?;

        tx.commit().await?;

        Ok(Patient {
            id,
            full_name: input.full_name,
            phone: input.phone,
            age: input.age,
            gender: input.gender,
            address: input.address,
            created_at: now.clone(),
            updated_at: now,
        })
    }

    async fn insert_allergies(
        tx: &mut Transaction<'_, sqlx::Sqlite>,
        patient_id: &str,
        allergies: Option<&str>,
    ) -> AppResult<()> {
        for allergy in Self::split_csv(allergies) {
            sqlx::query(
                "INSERT OR IGNORE INTO patient_allergies (patient_id, allergy_name) VALUES (?, ?)",
            )
            .bind(patient_id)
            .bind(allergy)
            .execute(&mut **tx)
            .await?;
        }

        Ok(())
    }

    async fn insert_medications(
        tx: &mut Transaction<'_, sqlx::Sqlite>,
        patient_id: &str,
        medications: Option<&str>,
    ) -> AppResult<()> {
        for medication in Self::split_csv(medications) {
            sqlx::query(
                "INSERT OR IGNORE INTO patient_medications (patient_id, medication_name) VALUES (?, ?)"
            )
            .bind(patient_id)
            .bind(medication)
            .execute(&mut **tx)
            .await?;
        }

        Ok(())
    }

    async fn insert_medical_conditions(
        tx: &mut Transaction<'_, sqlx::Sqlite>,
        patient_id: &str,
        medical_conditions: Option<&[String]>,
    ) -> AppResult<()> {
        for condition in Self::dedupe_strings(medical_conditions.unwrap_or(&[])) {
            sqlx::query(
                "INSERT OR IGNORE INTO medical_conditions (patient_id, condition_name, is_active) VALUES (?, ?, TRUE)"
            )
            .bind(patient_id)
            .bind(condition)
            .execute(&mut **tx)
            .await?;
        }

        Ok(())
    }

    async fn insert_visit(
        tx: &mut Transaction<'_, sqlx::Sqlite>,
        patient_id: &str,
        visit_date: Option<&str>,
        chief_complaint: Option<&str>,
        clinical_notes: Option<&str>,
        now: &str,
    ) -> AppResult<String> {
        let visit_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM visits")
            .fetch_one(&mut **tx)
            .await?;
        let visit_id = format!("V-{}-{:06}", Utc::now().format("%Y%m%d"), visit_count + 1);
        let visit_date = Self::trimmed_optional(visit_date).unwrap_or_else(|| now.to_string());
        let chief_complaint = Self::trimmed_optional(chief_complaint);
        let clinical_notes = Self::trimmed_optional(clinical_notes);

        sqlx::query(
            "INSERT INTO visits (id, patient_id, visit_date, chief_complaint, clinical_notes, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&visit_id)
        .bind(patient_id)
        .bind(visit_date)
        .bind(chief_complaint)
        .bind(clinical_notes)
        .bind("Open")
        .bind(now)
        .bind(now)
        .execute(&mut **tx)
        .await?;

        Ok(visit_id)
    }

    async fn insert_procedure(
        tx: &mut Transaction<'_, sqlx::Sqlite>,
        visit_id: &str,
        name: Option<&str>,
        additional_note: Option<&str>,
        price: Option<f64>,
        now: &str,
    ) -> AppResult<Option<String>> {
        let Some(name) = Self::trimmed_optional(name) else {
            return Ok(None);
        };
        let price = price.filter(|price| *price >= 0.0).unwrap_or(0.0);
        let additional_note = Self::trimmed_optional(additional_note);
        let id = format!("PROC-{}", Uuid::new_v4().simple());

        sqlx::query(
            "INSERT INTO procedures (id, visit_id, name, additional_note, procedure_price, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(&id)
        .bind(visit_id)
        .bind(&name)
        .bind(additional_note)
        .bind(price)
        .bind(now)
        .bind(now)
        .execute(&mut **tx)
        .await?;

        Ok(Some(id))
    }

    async fn insert_treatment_record(
        tx: &mut Transaction<'_, sqlx::Sqlite>,
        visit_id: &str,
        procedure_id: &str,
        number_of_procedures: Option<i32>,
        treatment_teeth: Option<&[TreatmentToothInput]>,
    ) -> AppResult<()> {
        let number_of_procedures = number_of_procedures.unwrap_or(1).max(1);
        let treatment_teeth = treatment_teeth
            .unwrap_or(&[])
            .iter()
            .map(|tooth| TreatmentToothInput {
                tooth_number: tooth.tooth_number,
                tooth_quadrant: tooth.tooth_quadrant.trim().to_string(),
            })
            .filter(|tooth| tooth.tooth_number > 0 && !tooth.tooth_quadrant.is_empty())
            .collect::<Vec<_>>();

        TreatmentRecordService::insert_in_transaction(
            tx,
            CreateTreatmentRecordInput {
                visit_id: visit_id.to_string(),
                procedure_id: procedure_id.to_string(),
                treatment_teeth,
                number_of_procedures,
            },
        )
        .await?;

        Ok(())
    }

    async fn insert_invoice(
        tx: &mut Transaction<'_, sqlx::Sqlite>,
        visit_id: &str,
        discount: f64,
        paid_amount: f64,
    ) -> AppResult<()> {
        let subtotal: f64 = sqlx::query_scalar(
            "SELECT COALESCE(SUM(p.procedure_price * tr.number_of_procedures), 0)
             FROM treatment_records tr
             JOIN procedures p ON p.id = tr.procedure_id
             WHERE tr.visit_id = ?",
        )
        .bind(visit_id)
        .fetch_one(&mut **tx)
        .await?;

        let total_amount = subtotal - discount;
        let outstanding_amount = total_amount - paid_amount;
        let status = if outstanding_amount == 0.0 {
            InvoiceStatus::Paid
        } else if paid_amount > 0.0 {
            InvoiceStatus::Partial
        } else {
            InvoiceStatus::Unpaid
        };

        let invoice_id = format!("INV-{}", uuid::Uuid::new_v4().simple());
        let invoice_number = format!("INV-{}", Utc::now().timestamp_millis());
        let now = Utc::now().to_rfc3339();

        sqlx::query(
            "INSERT INTO invoices (id, visit_id, invoice_number, subtotal, discount, total_amount, paid_amount, outstanding_amount, status, issued_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(&invoice_id)
        .bind(visit_id)
        .bind(&invoice_number)
        .bind(subtotal)
        .bind(discount)
        .bind(total_amount)
        .bind(paid_amount)
        .bind(outstanding_amount)
        .bind(match status {
            InvoiceStatus::Unpaid => "Unpaid",
            InvoiceStatus::Partial => "Partial",
            InvoiceStatus::Paid => "Paid",
        })
        .bind(&now)
        .execute(&mut **tx)
        .await?;

        Ok(())
    }

    fn split_csv(value: Option<&str>) -> Vec<String> {
        let mut result = Vec::new();

        for item in value
            .unwrap_or("")
            .split(',')
            .map(|item| item.trim().to_string())
            .filter(|item| !item.is_empty())
        {
            if !result
                .iter()
                .any(|existing: &String| existing.eq_ignore_ascii_case(&item))
            {
                result.push(item);
            }
        }

        result
    }

    fn dedupe_strings(values: &[String]) -> Vec<String> {
        let mut result = Vec::new();

        for value in values
            .iter()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty())
        {
            if !result
                .iter()
                .any(|existing: &String| existing.eq_ignore_ascii_case(&value))
            {
                result.push(value);
            }
        }

        result
    }

    fn trimmed_optional(value: Option<&str>) -> Option<String> {
        value
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty())
    }

    pub async fn update(
        pool: &SqlitePool,
        id: &str,
        input: UpdatePatientInput,
    ) -> AppResult<Patient> {
        let existing = Self::find(pool, id).await?;

        let full_name = input
            .full_name
            .unwrap_or_else(|| existing.full_name.clone());
        let phone = input.phone.unwrap_or_else(|| existing.phone.clone());
        let age = input.age.unwrap_or(existing.age);
        let gender = input.gender.unwrap_or(existing.gender);
        let address = input.address;

        let gender_str = match gender {
            Gender::Male => "Male",
            Gender::Female => "Female",
            Gender::Other => "Other",
        };

        let now = Utc::now().to_rfc3339();

        sqlx::query(
            "UPDATE patients SET full_name=?, phone=?, age=?, gender=?, address=?, updated_at=? WHERE id=?"
        )
        .bind(&full_name)
        .bind(&phone)
        .bind(age)
        .bind(gender_str)
        .bind(&address)
        .bind(&now)
        .bind(id)
        .execute(pool)
        .await?;

        Ok(Patient {
            id: existing.id,
            full_name,
            phone,
            age,
            gender,
            address,
            created_at: existing.created_at,
            updated_at: now,
        })
    }

    pub async fn delete(pool: &SqlitePool, id: &str) -> AppResult<()> {
        let result = sqlx::query("DELETE FROM patients WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await?;
        if result.rows_affected() == 0 {
            return Err(crate::services::errors::AppError::NotFound(format!(
                "Patient {} not found",
                id
            )));
        }
        Ok(())
    }

    pub async fn add_medical_condition(
        pool: &SqlitePool,
        patient_id: &str,
        condition_name: &str,
    ) -> AppResult<()> {
        sqlx::query("INSERT INTO medical_conditions (patient_id, condition_name, is_active) VALUES (?, ?, TRUE)")
            .bind(patient_id)
            .bind(condition_name)
            .execute(pool)
            .await?;
        Ok(())
    }
}
