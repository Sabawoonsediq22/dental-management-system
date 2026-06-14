use crate::models::*;
use crate::services::errors::{AppError, AppResult};
use chrono::Utc;
use sqlx::SqlitePool;

pub struct InvoiceService;

impl InvoiceService {
    pub async fn create(pool: &SqlitePool, input: CreateInvoiceInput) -> AppResult<Invoice> {
        let id = format!("INV-{}", uuid::Uuid::new_v4().simple());
        let invoice_number = format!("INV-{}", Utc::now().timestamp_millis());

        let now = Utc::now().to_rfc3339();

        let subtotal: f64 = sqlx::query_scalar(
            "SELECT COALESCE(SUM(p.procedure_price * tr.number_of_procedures), 0)
             FROM treatment_records tr
             JOIN procedures p ON p.id = tr.procedure_id
             WHERE tr.visit_id = ?",
        )
        .bind(&input.visit_id)
        .fetch_one(pool)
        .await?;
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
