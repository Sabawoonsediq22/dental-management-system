use crate::models::*;
use crate::services::errors::AppResult;
use sqlx::SqlitePool;

pub struct SearchService;

impl SearchService {
    pub async fn global_search(
        pool: &SqlitePool,
        query: &str,
    ) -> AppResult<Vec<SearchResult>> {
        let trimmed = query.trim();
        if trimmed.is_empty() {
            return Ok(Vec::new());
        }

        let like = format!("%{}%", trimmed);

        let mut results = Vec::new();

        // Patients
        let patients: Vec<GlobalSearchPatient> = sqlx::query_as(
            "SELECT id, full_name, phone FROM patients
             WHERE full_name LIKE ? OR phone LIKE ? OR id LIKE ?
             ORDER BY created_at DESC LIMIT 10"
        )
        .bind(&like)
        .bind(&like)
        .bind(&like)
        .fetch_all(pool)
        .await?;

        for p in patients {
            results.push(SearchResult {
                id: p.id.clone(),
                result_type: "patient".to_string(),
                title: p.full_name,
                subtitle: format!("Patient ID: {}", p.id),
                route: Some(format!("/patients/{}", p.id)),
            });
        }

        // Invoices (with patient name via visits)
        let invoices: Vec<GlobalSearchInvoice> = sqlx::query_as(
            "SELECT i.id, i.invoice_number, i.status, i.outstanding_amount, p.full_name as patient_name
             FROM invoices i
             JOIN visits v ON v.id = i.visit_id
             JOIN patients p ON p.id = v.patient_id
             WHERE i.invoice_number LIKE ? OR p.full_name LIKE ?
             ORDER BY i.issued_at DESC LIMIT 10"
        )
        .bind(&like)
        .bind(&like)
        .fetch_all(pool)
        .await?;

        for inv in invoices {
            let status_label = match inv.status.as_str() {
                "Paid" => "Paid in Full",
                "Partial" => "Partial Payment",
                "Unpaid" => "Outstanding Balance",
                _ => inv.status.as_str(),
            };
            results.push(SearchResult {
                id: inv.id.clone(),
                result_type: "invoice".to_string(),
                title: format!("{} - {}", inv.invoice_number, inv.patient_name),
                subtitle: status_label.to_string(),
                route: Some(format!("/billing/invoices/{}", inv.id)),
            });
        }

        // Receipts (derived from invoices that have payments)
        let receipts: Vec<GlobalSearchReceipt> = sqlx::query_as(
            "SELECT i.id, i.invoice_number, i.status, p.full_name as patient_name
             FROM invoices i
             JOIN visits v ON v.id = i.visit_id
             JOIN patients p ON p.id = v.patient_id
             JOIN payments pay ON pay.invoice_id = i.id
             WHERE i.invoice_number LIKE ? OR p.full_name LIKE ?
             GROUP BY i.id
             ORDER BY i.issued_at DESC LIMIT 10"
        )
        .bind(&like)
        .bind(&like)
        .fetch_all(pool)
        .await?;

        for r in receipts {
            let status_label = match r.status.as_str() {
                "Paid" => "Paid in Full",
                "Partial" => "Partial Payment",
                "Unpaid" => "Outstanding Balance",
                _ => r.status.as_str(),
            };
            results.push(SearchResult {
                id: r.id.clone(),
                result_type: "receipt".to_string(),
                title: r.invoice_number.clone(),
                subtitle: status_label.to_string(),
                route: Some(format!("/billing/receipts/{}", r.id)),
            });
        }

        // Visits
        let visits: Vec<GlobalSearchVisit> = sqlx::query_as(
            "SELECT v.id, v.visit_date, v.chief_complaint, p.full_name as patient_name
             FROM visits v
             JOIN patients p ON p.id = v.patient_id
             WHERE v.id LIKE ? OR p.full_name LIKE ?
             ORDER BY v.created_at DESC LIMIT 10"
        )
        .bind(&like)
        .bind(&like)
        .fetch_all(pool)
        .await?;

        for v in visits {
            results.push(SearchResult {
                id: v.id.clone(),
                result_type: "visit".to_string(),
                title: format!("Visit {}", v.id),
                subtitle: v.patient_name,
                route: Some(format!("/visits/{}", v.id)),
            });
        }

        // Treatments (via procedures joined to visits)
        let treatments: Vec<GlobalSearchTreatment> = sqlx::query_as(
            "SELECT DISTINCT p.id, p.name, p.additional_note, p.procedure_price, p.visit_id,
                    pat.full_name as practitioner_name
             FROM procedures p
             JOIN visits v ON v.id = p.visit_id
             JOIN patients pat ON pat.id = v.patient_id
             WHERE p.name LIKE ? OR p.additional_note LIKE ?
             ORDER BY p.created_at DESC LIMIT 10"
        )
        .bind(&like)
        .bind(&like)
        .fetch_all(pool)
        .await?;

        for t in treatments {
            results.push(SearchResult {
                id: t.id.clone(),
                result_type: "treatment".to_string(),
                title: t.name,
                subtitle: if let Some(practitioner) = t.practitioner_name {
                    format!("Practitioner: {}", practitioner)
                } else {
                    format!("Price: {}", t.procedure_price)
                },
                route: Some(format!("/treatments/{}", t.id)),
            });
        }

        // Payments
        let payments: Vec<GlobalSearchPayment> = sqlx::query_as(
            "SELECT pay.id, pay.amount, pay.received_at, p.full_name as patient_name
             FROM payments pay
             JOIN invoices i ON i.id = pay.invoice_id
             JOIN visits v ON v.id = i.visit_id
             JOIN patients p ON p.id = v.patient_id
             WHERE pay.id LIKE ? OR p.full_name LIKE ?
             ORDER BY pay.received_at DESC LIMIT 10"
        )
        .bind(&like)
        .bind(&like)
        .fetch_all(pool)
        .await?;

        for pay in payments {
            results.push(SearchResult {
                id: pay.id.clone(),
                result_type: "payment".to_string(),
                title: format!("Payment - {}", pay.patient_name),
                subtitle: format!("{:.2}", pay.amount),
                route: Some(format!("/billing/payments/{}", pay.id)),
            });
        }

        Ok(results)
    }
}
