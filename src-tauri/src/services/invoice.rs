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
    pub async fn list(pool: &SqlitePool, params: crate::models::InvoiceListParams) -> AppResult<InvoicePageResult> {
        let page = params.page.unwrap_or(1).max(1);
        let per_page = params.per_page.unwrap_or(10).max(1);
        let offset = ((page - 1) * per_page) as i64;
        let per_page_i64 = per_page as i64;

        let mut conditions: Vec<String> = Vec::new();
        let mut bind_values: Vec<String> = Vec::new();

        if let Some(ref q) = params.query {
            if !q.trim().is_empty() {
                conditions.push("(i.invoice_number LIKE ? OR p.full_name LIKE ? OR p.phone LIKE ? OR i.id = ?)".to_string());
                let like = format!("%{}%", q.trim());
                bind_values.push(like.clone());
                bind_values.push(like.clone());
                bind_values.push(like.clone());
                bind_values.push(q.trim().to_string());
            }
        }

        if let Some(ref s) = params.status {
            if s != "All" {
                conditions.push("i.status = ?".to_string());
                bind_values.push(s.clone());
            }
        }

        let where_clause = if conditions.is_empty() {
            String::new()
        } else {
            format!(" WHERE {}", conditions.join(" AND "))
        };

        // Build total query
        let total_query_str = if bind_values.is_empty() {
            "SELECT COUNT(*) FROM invoices i".to_string()
        } else {
            format!("SELECT COUNT(*) FROM invoices i JOIN visits v ON v.id = i.visit_id JOIN patients p ON p.id = v.patient_id {}", where_clause)
        };
        
        let mut total_query = sqlx::query_scalar(&total_query_str);
        for val in &bind_values {
            total_query = total_query.bind(val);
        }
        let total = total_query.fetch_one(pool).await?;

        // Prepare status count query values (respecting query filter but ignoring status filter)
        let mut status_bind_values: Vec<String> = Vec::new();
        if let Some(ref q) = params.query {
            if !q.trim().is_empty() {
                let like = format!("%{}%", q.trim());
                status_bind_values.push(like.clone());
                status_bind_values.push(like.clone());
                status_bind_values.push(like.clone());
                status_bind_values.push(q.trim().to_string());
            }
        }

        // Query status counts
        let unpaid_count_sql = if status_bind_values.is_empty() {
            "SELECT COUNT(*) FROM invoices WHERE status = 'Unpaid'"
        } else {
            "SELECT COUNT(*) FROM invoices i JOIN visits v ON v.id = i.visit_id JOIN patients p ON p.id = v.patient_id WHERE (i.invoice_number LIKE ? OR p.full_name LIKE ? OR p.phone LIKE ? OR i.id = ?) AND i.status = 'Unpaid'"
        };
        
        let unpaid_count: i64 = if status_bind_values.is_empty() {
            sqlx::query_scalar(unpaid_count_sql).fetch_one(pool).await?
        } else {
            let mut q = sqlx::query_scalar(unpaid_count_sql);
            for val in &status_bind_values {
                q = q.bind(val);
            }
            q.fetch_one(pool).await?
        };

        let partial_count_sql = if status_bind_values.is_empty() {
            "SELECT COUNT(*) FROM invoices WHERE status = 'Partial'"
        } else {
            "SELECT COUNT(*) FROM invoices i JOIN visits v ON v.id = i.visit_id JOIN patients p ON p.id = v.patient_id WHERE (i.invoice_number LIKE ? OR p.full_name LIKE ? OR p.phone LIKE ? OR i.id = ?) AND i.status = 'Partial'"
        };
        
        let partial_count: i64 = if status_bind_values.is_empty() {
            sqlx::query_scalar(partial_count_sql).fetch_one(pool).await?
        } else {
            let mut q = sqlx::query_scalar(partial_count_sql);
            for val in &status_bind_values {
                q = q.bind(val);
            }
            q.fetch_one(pool).await?
        };

        let paid_count_sql = if status_bind_values.is_empty() {
            "SELECT COUNT(*) FROM invoices WHERE status = 'Paid'"
        } else {
            "SELECT COUNT(*) FROM invoices i JOIN visits v ON v.id = i.visit_id JOIN patients p ON p.id = v.patient_id WHERE (i.invoice_number LIKE ? OR p.full_name LIKE ? OR p.phone LIKE ? OR i.id = ?) AND i.status = 'Paid'"
        };
        
        let paid_count: i64 = if status_bind_values.is_empty() {
            sqlx::query_scalar(paid_count_sql).fetch_one(pool).await?
        } else {
            let mut q = sqlx::query_scalar(paid_count_sql);
            for val in &status_bind_values {
                q = q.bind(val);
            }
            q.fetch_one(pool).await?
        };

        let total_outstanding_sql = if status_bind_values.is_empty() {
            "SELECT COALESCE(SUM(outstanding_amount), 0.0) FROM invoices WHERE status IN ('Unpaid', 'Partial')"
        } else {
            "SELECT COALESCE(SUM(i.outstanding_amount), 0.0) FROM invoices i JOIN visits v ON v.id = i.visit_id JOIN patients p ON p.id = v.patient_id WHERE (i.invoice_number LIKE ? OR p.full_name LIKE ? OR p.phone LIKE ? OR i.id = ?) AND i.status IN ('Unpaid', 'Partial')"
        };
        
        let total_outstanding: f64 = if status_bind_values.is_empty() {
            sqlx::query_scalar(total_outstanding_sql).fetch_one(pool).await?
        } else {
            let mut q = sqlx::query_scalar(total_outstanding_sql);
            for val in &status_bind_values {
                q = q.bind(val);
            }
            q.fetch_one(pool).await?
        };

        // Build main query
        let query_str = format!(
            "SELECT i.id, i.invoice_number, i.subtotal, i.discount, i.total_amount, i.paid_amount, i.outstanding_amount, i.status, i.issued_at, v.patient_id, p.full_name, p.phone, v.visit_date FROM invoices i JOIN visits v ON v.id = i.visit_id JOIN patients p ON p.id = v.patient_id {} ORDER BY i.issued_at DESC LIMIT ? OFFSET ?",
            where_clause
        );

        // FIXED: Build query with all 13 columns
        let mut query = sqlx::query_as::<_, (String, String, f64, f64, f64, f64, f64, String, String, String, String, Option<String>, String)>(&query_str);
        
        // FIXED: Bind values using a different approach
        for val in bind_values {
            query = query.bind(val);
        }
        query = query.bind(per_page_i64).bind(offset);

        let rows = query.fetch_all(pool).await?;

        let items: Vec<InvoiceListItem> = rows
            .into_iter()
            .map(|(id, invoice_number, subtotal, discount, total_amount, paid_amount, outstanding_amount, status, issued_at, patient_id, patient_name, patient_phone, visit_date)| {
                InvoiceListItem {
                    id: id.clone(),
                    invoice_number,
                    patient_id,
                    patient_name,
                    patient_phone,
                    visit_id: id,
                    visit_date,
                    subtotal,
                    discount,
                    total_amount,
                    paid_amount,
                    outstanding_amount,
                    status,
                    issued_at,
                }
            })
            .collect();

        Ok(InvoicePageResult {
            items,
            total,
            page,
            per_page,
            total_pages: ((total + per_page_i64 - 1) / per_page_i64).max(1),
            unpaid_count,
            partial_count,
            paid_count,
            total_outstanding,
        })
    }

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
            "SELECT id, invoice_id, amount, method, notes, received_at FROM payments
             WHERE invoice_id = ?
             ORDER BY received_at ASC",
        )
        .bind(&invoice.id)
        .fetch_all(pool)
        .await?;

        let procedure_rows = sqlx::query_as::<_, ReceiptProcedure>(
            "SELECT tr.id as treatment_record_id,
                    p.name as procedure_name,
                    p.additional_note,
                    tr.number_of_procedures as quantity,
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

        let clinic_settings = sqlx::query_as::<_, (Option<String>, Option<String>, Option<String>, Option<String>)>(
            "SELECT clinic_name, clinic_address, clinic_phone, clinic_logo FROM app_settings WHERE id = 1"
        )
        .fetch_optional(pool)
        .await?;

        let (clinic_name, clinic_address, clinic_phone, clinic_logo) = clinic_settings.unwrap_or_default();

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
                name: clinic_name.unwrap_or_else(|| "Dental Clinic".to_string()),
                address: clinic_address.unwrap_or_default(),
                phone: clinic_phone.unwrap_or_default(),
                logo_url: clinic_logo,
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