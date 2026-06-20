use crate::models::*;
use crate::services::errors::{AppError, AppResult};
use chrono::Utc;
use sqlx::SqlitePool;

pub struct InvoiceService;

fn calculate_invoice_status(outstanding_amount: f64, paid_amount: f64) -> InvoiceStatus {
    if outstanding_amount == 0.0 {
        InvoiceStatus::Paid
    } else if paid_amount > 0.0 {
        InvoiceStatus::Partial
    } else {
        InvoiceStatus::Unpaid
    }
}

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
        let outstanding_amount = total_amount - input.paid_amount;
        let status = calculate_invoice_status(outstanding_amount, input.paid_amount);

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
        .bind(input.paid_amount)
        .bind(outstanding_amount)
        .bind(match status {
            InvoiceStatus::Unpaid => "Unpaid",
            InvoiceStatus::Partial => "Partial",
            InvoiceStatus::Paid => "Paid",
        })
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

    pub async fn get_receipt_details(
        pool: &SqlitePool,
        invoice_id: &str,
    ) -> AppResult<ReceiptData> {
        let invoice = sqlx::query_as::<_, Invoice>(
            "SELECT id, visit_id, invoice_number, subtotal, discount, total_amount, paid_amount, outstanding_amount, status, issued_at FROM invoices WHERE id = ?"
        )
        .bind(invoice_id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Invoice {} not found", invoice_id)))?;

        let patient = sqlx::query_as::<_, ReceiptPatient>(
            "SELECT p.id, p.full_name, p.phone FROM patients p
             INNER JOIN visits v ON v.patient_id = p.id
             WHERE v.id = ?",
        )
        .bind(&invoice.visit_id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| {
            AppError::NotFound(format!("Patient for visit {} not found", invoice.visit_id))
        })?;

        let payments = sqlx::query_as::<_, ReceiptPayment>(
            "SELECT id, invoice_id, amount, 'Cash' as method, notes, received_at FROM payments
             WHERE invoice_id = ?
             ORDER BY received_at ASC",
        )
        .bind(&invoice.id)
        .fetch_all(pool)
        .await?;

        let procedure_rows = sqlx::query_as::<_, ReceiptProcedure>(
            "SELECT tr.id as treatment_record_id,
                    p.name as procedure_name,
                    p.additional_note as procedure_additional_note,
                    tr.number_of_procedures,
                    p.procedure_price as unit_price,
                    (p.procedure_price * tr.number_of_procedures) as total_price,
                    tr.performed_at,
                    (SELECT GROUP_CONCAT(tt.tooth_number, ', ') FROM treatment_tooth tt WHERE tt.treatment_record_id = tr.id) as tooth_numbers
             FROM treatment_records tr
             INNER JOIN procedures p ON p.id = tr.procedure_id
             WHERE tr.visit_id = ?
             ORDER BY tr.performed_at DESC"
        )
        .bind(&invoice.visit_id)
        .fetch_all(pool)
        .await?;

        Ok(ReceiptData {
            id: invoice.id,
            invoice_number: invoice.invoice_number,
            patient_id: patient.id,
            patient_name: patient.full_name,
            patient_phone: patient.phone,
            visit_id: invoice.visit_id,
            issue_date: invoice.issued_at,
            currency: "AFN".to_string(),
            subtotal: invoice.subtotal,
            discount: invoice.discount,
            total_amount: invoice.total_amount,
            paid_amount: invoice.paid_amount,
            outstanding_amount: invoice.outstanding_amount,
            status: invoice.status,
            procedures: procedure_rows,
            payments,
            clinic: ReceiptClinic {
                name: "KHWAJA DENTAL & IMPLANT SERVICE".to_string(),
                address: "House 42, Road 7, Sector 3, Uttara, Dhaka".to_string(),
                phone: "Phone: +880 1711-223344".to_string(),
            },
        })
    }

    pub async fn get_receipt_details_by_visit(
        pool: &SqlitePool,
        visit_id: &str,
    ) -> AppResult<ReceiptData> {
        let invoice = sqlx::query_as::<_, Invoice>(
            "SELECT id, visit_id, invoice_number, subtotal, discount, total_amount, paid_amount, outstanding_amount, status, issued_at FROM invoices WHERE visit_id = ?"
        )
        .bind(visit_id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Invoice for visit {} not found", visit_id)))?;

        Self::get_receipt_details(pool, &invoice.id).await
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
