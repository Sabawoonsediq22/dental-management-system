use sqlx::SqlitePool;
use crate::models::*;
use crate::services::errors::AppResult;
use chrono::Utc;

fn compute_initials(full_name: &str) -> String {
    let parts: Vec<&str> = full_name.trim().split_whitespace().collect();
    if parts.len() >= 2 {
        let first = parts[0].chars().next().unwrap_or(' ').to_uppercase().to_string();
        let last = parts.last().unwrap().chars().next().unwrap_or(' ').to_uppercase().to_string();
        first + &last
    } else {
        full_name.chars().take(2).collect::<String>().to_uppercase()
    }
}

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

        // Get total count
        let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM patients")
            .fetch_one(pool)
            .await?;

        // Build query with optional filtering
        let items: Vec<Patient> = if let Some(q_str) = query {
            if !q_str.trim().is_empty() {
                let like = format!("%{}%", q_str.trim());
                sqlx::query_as(
                    "SELECT id, full_name, phone, age, gender, address, is_complete_profile, created_at, updated_at, COALESCE(initials, '') as initials FROM patients WHERE full_name LIKE ? OR phone LIKE ? OR id LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
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
                        "SELECT id, full_name, phone, age, gender, address, is_complete_profile, created_at, updated_at, COALESCE(initials, '') as initials FROM patients WHERE gender = ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
                    )
                    .bind(g)
                    .bind(per_page_i64)
                    .bind(offset)
                    .fetch_all(pool)
                    .await?
                } else {
                    sqlx::query_as(
                        "SELECT id, full_name, phone, age, gender, address, is_complete_profile, created_at, updated_at, COALESCE(initials, '') as initials FROM patients ORDER BY created_at DESC LIMIT ? OFFSET ?"
                    )
                    .bind(per_page_i64)
                    .bind(offset)
                    .fetch_all(pool)
                    .await?
                }
            } else {
                sqlx::query_as(
                    "SELECT id, full_name, phone, age, gender, address, is_complete_profile, created_at, updated_at, COALESCE(initials, '') as initials FROM patients ORDER BY created_at DESC LIMIT ? OFFSET ?"
                )
                .bind(per_page_i64)
                .bind(offset)
                .fetch_all(pool)
                .await?
            }
        } else if let Some(g) = gender {
            if g != "All" {
                sqlx::query_as(
                    "SELECT id, full_name, phone, age, gender, address, is_complete_profile, created_at, updated_at, COALESCE(initials, '') as initials FROM patients WHERE gender = ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
                )
                .bind(g)
                .bind(per_page_i64)
                .bind(offset)
                .fetch_all(pool)
                .await?
            } else {
                sqlx::query_as(
                    "SELECT id, full_name, phone, age, gender, address, is_complete_profile, created_at, updated_at, COALESCE(initials, '') as initials FROM patients ORDER BY created_at DESC LIMIT ? OFFSET ?"
                )
                .bind(per_page_i64)
                .bind(offset)
                .fetch_all(pool)
                .await?
            }
        } else {
            sqlx::query_as(
                "SELECT id, full_name, phone, age, gender, address, is_complete_profile, created_at, updated_at, COALESCE(initials, '') as initials FROM patients ORDER BY created_at DESC LIMIT ? OFFSET ?"
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
            "SELECT id, full_name, phone, age, gender, address, is_complete_profile, created_at, updated_at, COALESCE(initials, '') as initials FROM patients WHERE id = ?"
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        patient.ok_or_else(|| crate::services::errors::AppError::NotFound(format!("Patient {} not found", id)))
    }

    pub async fn create(pool: &SqlitePool, input: CreatePatientInput) -> AppResult<Patient> {
        let id = format!("KD-{}-{:03}", chrono::Local::now().format("%Y"), {
            let count = sqlx::query_scalar::<_, i32>("SELECT COUNT(*) FROM patients").fetch_one(pool).await.unwrap_or(0);
            count + 1
        });

        let gender_str = match input.gender {
            Gender::Male => "Male",
            Gender::Female => "Female",
            Gender::Other => "Other",
        };

        let initials = compute_initials(&input.full_name);
        let now = Utc::now().to_rfc3339();

        sqlx::query(
            "INSERT INTO patients (id, full_name, phone, age, gender, address, is_complete_profile, created_at, updated_at, initials)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(&input.full_name)
        .bind(&input.phone)
        .bind(input.age)
        .bind(gender_str)
        .bind(&input.address)
        .bind(input.is_complete_profile.unwrap_or(false))
        .bind(&now)
        .bind(&now)
        .bind(&initials)
        .execute(pool)
        .await?;

        // Insert medical info
        sqlx::query(
            "INSERT INTO patient_medical_info (patient_id, allergies, medications, clinical_notes, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(&input.allergies)
        .bind(&input.medications)
        .bind(&input.clinical_notes)
        .bind(&now)
        .bind(&now)
        .execute(pool)
        .await?;

        Ok(Patient {
            id,
            full_name: input.full_name,
            phone: input.phone,
            age: input.age,
            gender: input.gender,
            address: input.address,
            is_complete_profile: input.is_complete_profile.unwrap_or(false),
            created_at: now.clone(),
            updated_at: now,
            initials,
        })
    }

    pub async fn update(pool: &SqlitePool, id: &str, input: UpdatePatientInput) -> AppResult<Patient> {
        let existing = Self::find(pool, id).await?;

        let full_name = input.full_name.unwrap_or_else(|| existing.full_name.clone());
        let phone = input.phone.unwrap_or_else(|| existing.phone.clone());
        let age = input.age.unwrap_or(existing.age);
        let gender = input.gender.unwrap_or(existing.gender);
        let address = input.address;
        let is_complete_profile = input.is_complete_profile.unwrap_or(existing.is_complete_profile);
        let initials = compute_initials(&full_name);

        let gender_str = match gender {
            Gender::Male => "Male",
            Gender::Female => "Female",
            Gender::Other => "Other",
        };

        let now = Utc::now().to_rfc3339();

        sqlx::query(
            "UPDATE patients SET full_name=?, phone=?, age=?, gender=?, address=?, is_complete_profile=?, updated_at=?, initials=?
             WHERE id=?"
        )
        .bind(&full_name)
        .bind(&phone)
        .bind(age)
        .bind(gender_str)
        .bind(&address)
        .bind(is_complete_profile)
        .bind(&now)
        .bind(&initials)
        .bind(id)
        .execute(pool)
        .await?;

        if input.allergies.is_some() || input.medications.is_some() || input.clinical_notes.is_some() {
            sqlx::query(
                "UPDATE patient_medical_info SET allergies=?, medications=?, clinical_notes=?, updated_at=?
                 WHERE patient_id=?"
            )
            .bind(&input.allergies)
            .bind(&input.medications)
            .bind(&input.clinical_notes)
            .bind(&now)
            .bind(id)
            .execute(pool)
            .await?;
        }

        Ok(Patient {
            id: existing.id,
            full_name,
            phone,
            age,
            gender,
            address,
            is_complete_profile,
            created_at: existing.created_at,
            updated_at: now,
            initials,
        })
    }

    pub async fn delete(pool: &SqlitePool, id: &str) -> AppResult<()> {
        let result = sqlx::query("DELETE FROM patients WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await?;
        if result.rows_affected() == 0 {
            return Err(crate::services::errors::AppError::NotFound(format!("Patient {} not found", id)));
        }
        Ok(())
    }

    pub async fn add_medical_condition(pool: &SqlitePool, patient_id: &str, condition_name: &str) -> AppResult<()> {
        let now = Utc::now().to_rfc3339();
        sqlx::query("INSERT INTO medical_conditions (patient_id, condition_name, is_active, created_at) VALUES (?, ?, TRUE, ?)")
            .bind(patient_id)
            .bind(condition_name)
            .bind(&now)
            .execute(pool)
            .await?;
        Ok(())
    }
}