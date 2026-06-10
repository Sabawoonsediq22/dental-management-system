use sqlx::SqlitePool;
use crate::models::*;
use crate::services::errors::{AppError, AppResult};
use chrono::Utc;

pub struct InvoiceService;

impl InvoiceService {
    pub async fn create(pool: &SqlitePool, input: CreateInvoiceInput) -> AppResult<Invoice> {
        let id = format!("INV-{}", uuid::Uuid::new_v4().simple());
        let invoice_number = format!("INV-{}", Utc::now().timestamp_millis());

        let now = Utc::now().to_rfc3339();

        // Calculate subtotal from treatment records for this visit
        let treatment_records: Vec<TreatmentRecord> = sqlx::query_as(
            "SELECT id, visit_id, procedure_id, tooth_quadrant, quantity, procedure_price, performed_at FROM treatment_records WHERE visit_id = ?"
        )
        .bind(&input.visit_id)
        .fetch_all(pool)
        .await?;

        let subtotal: f64 = treatment_records.iter().map(|t| t.procedure_price * t.quantity as f64).sum();
        let total_amount = subtotal - input.discount;

        let invoice = sqlx::query_as::<_, Invoice>(
            "INSERT INTO invoices (id, visit_id, invoice_number, subtotal, discount, total_amount, paid_amount, outstanding_amount, status, issued_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             RETURNING id, visit_id, invoice_number, subtotal, discount, total_amount, paid_amount, outstanding_amount, status, issued_at"
        )
        .bind(&id)
        .bind(&input.visit_id)
        .bind(&invoice_number)
        .bind(subtotal)
        .bind(input.discount)
        .bind(total_amount)
        .bind(0.0)
        .bind(total_amount)
        .bind("Unpaid")
        .bind(&now)
        .fetch_one(pool)
        .await?;

        Ok(invoice)
    }

    pub async fn get_for_visit(pool: &SqlitePool, visit_id: &str) -> AppResult<Option<Invoice>> {
        let invoice = sqlx::query_as(
            "SELECT id, visit_id, invoice_number, subtotal, discount, total_amount, paid_amount, outstanding_amount, status, issued_at FROM invoices WHERE visit_id = ?"
        )
        .bind(visit_id)
        .fetch_optional(pool)
        .await?;

        Ok(invoice)
    }

    #[allow(dead_code)]
    pub async fn find(pool: &SqlitePool, id: &str) -> AppResult<Invoice> {
        let invoice = sqlx::query_as(
            "SELECT id, visit_id, invoice_number, subtotal, discount, total_amount, paid_amount, outstanding_amount, status, issued_at FROM invoices WHERE id = ?"
        )
        .bind(id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Invoice {} not found", id)))?;

        Ok(invoice)
    }
}