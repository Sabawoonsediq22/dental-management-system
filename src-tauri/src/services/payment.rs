use sqlx::SqlitePool;
use crate::models::*;
use crate::services::errors::AppResult;
use chrono::Utc;

pub struct PaymentService;

impl PaymentService {
    pub async fn add(pool: &SqlitePool, input: AddPaymentInput) -> AppResult<Payment> {
        let id = format!("PAY-{}", uuid::Uuid::new_v4().simple());
        let now = Utc::now().to_rfc3339();
        let method_str = match input.method {
            PaymentMethod::Cash => "Cash",
            PaymentMethod::Card => "Card",
            PaymentMethod::Mobile => "Mobile",
            PaymentMethod::Insurance => "Insurance",
        };

        let mut tx = pool.begin().await?;

        let payment = sqlx::query_as::<_, Payment>(
            "INSERT INTO payments (id, invoice_id, amount, method, notes, received_at)
             VALUES (?, ?, ?, ?, ?, ?)
             RETURNING id, invoice_id, amount, method, notes, received_at"
        )
        .bind(&id)
        .bind(&input.invoice_id)
        .bind(input.amount)
        .bind(method_str)
        .bind(&input.notes)
        .bind(&now)
        .fetch_one(&mut *tx)
        .await?;

        // Update invoice paid amount and status
        sqlx::query(
            "UPDATE invoices SET 
             paid_amount = paid_amount + ?,
             outstanding_amount = outstanding_amount - ?,
             status = CASE 
                 WHEN outstanding_amount - ? <= 0 THEN 'Paid'
                 WHEN outstanding_amount - ? > 0 AND outstanding_amount - ? < total_amount THEN 'Partial'
                 ELSE status
             END
             WHERE id = ?"
        )
        .bind(input.amount)
        .bind(input.amount)
        .bind(input.amount)
        .bind(input.amount)
        .bind(input.amount)
        .bind(&input.invoice_id)
        .execute(&mut *tx)
        .await?;

        tx.commit().await?;

        Ok(payment)
    }

    pub async fn list_for_invoice(pool: &SqlitePool, invoice_id: &str) -> AppResult<Vec<Payment>> {
        let payments = sqlx::query_as(
            "SELECT id, invoice_id, amount, method, notes, received_at FROM payments WHERE invoice_id = ?"
        )
        .bind(invoice_id)
        .fetch_all(pool)
        .await?;

        Ok(payments)
    }
}