use sqlx::SqlitePool;
use crate::models::*;
use crate::services::errors::AppResult;
use chrono::Utc;

pub struct ReportService;

impl ReportService {
    pub async fn summary(pool: &SqlitePool) -> AppResult<ReportSummary> {
        let now = Utc::now();
        let year = now.format("%Y").to_string();

        let total_patients: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM patients")
            .fetch_one(pool)
            .await?;

        let total_visits_this_month: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM visits WHERE strftime('%Y', visit_date) = ?"
        )
        .bind(&year)
        .fetch_one(pool)
        .await?;

        let completed_visits_this_month: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM visits WHERE status = 'Completed' AND strftime('%Y', visit_date) = ?"
        )
        .bind(&year)
        .fetch_one(pool)
        .await?;

        let cancelled_visits_this_month: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM visits WHERE status = 'Cancelled' AND strftime('%Y', visit_date) = ?"
        )
        .bind(&year)
        .fetch_one(pool)
        .await?;

        let revenue_this_month: Option<f64> = sqlx::query_scalar(
            "SELECT COALESCE(SUM(paid_amount), 0.0) FROM invoices WHERE strftime('%Y', issued_at) = ?"
        )
        .bind(&year)
        .fetch_one(pool)
        .await?;

        let outstanding_balance: Option<f64> = sqlx::query_scalar(
            "SELECT COALESCE(SUM(outstanding_amount), 0.0) FROM invoices WHERE status IN ('Unpaid', 'Partial')"
        )
        .fetch_one(pool)
        .await?;

        Ok(ReportSummary {
            active_patients: total_patients,
            total_visits_this_month,
            revenue_this_month: revenue_this_month.unwrap_or(0.0),
            outstanding_balance: outstanding_balance.unwrap_or(0.0),
            completed_visits_this_month,
            cancelled_visits_this_month,
        })
    }

    pub async fn monthly_revenue(pool: &SqlitePool) -> AppResult<Vec<MonthlyRevenuePoint>> {
        let rows: Vec<(String, f64)> = sqlx::query_as(
            "SELECT strftime('%Y-%m', issued_at) as month, COALESCE(SUM(paid_amount), 0.0) as revenue
             FROM invoices
             WHERE issued_at >= date('now', '-12 months')
             GROUP BY strftime('%Y-%m', issued_at)
             ORDER BY month ASC"
        )
        .fetch_all(pool)
        .await?;
        Ok(rows.into_iter().map(|(month, revenue)| MonthlyRevenuePoint { month, revenue }).collect())
    }
}