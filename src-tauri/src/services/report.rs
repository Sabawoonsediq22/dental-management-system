use sqlx::SqlitePool;
use crate::models::*;
use crate::services::errors::AppResult;
use chrono::{Utc, Datelike, NaiveDate};

fn days_in_month(year: i32, month: u32) -> i64 {
    let (y, m) = if month == 12 { (year + 1, 1) } else { (year, month + 1) };
    NaiveDate::from_ymd_opt(y, m, 1)
        .unwrap()
        .pred_opt()
        .unwrap()
        .day() as i64
}

fn fill_daily_trends(
    year: i32,
    month: u32,
    rows: Vec<(i64, f64)>,
) -> Vec<DailyTrendPoint> {
    let total = days_in_month(year, month);
    let mut map = std::collections::HashMap::<i64, f64>::new();
    for (day, val) in rows {
        map.insert(day, val);
    }
    let mut result = Vec::with_capacity(total as usize);
    for d in 1..=total {
        let day_str = format!("{:02}", d);
        let value = map.get(&d).copied().unwrap_or(0.0);
        result.push(DailyTrendPoint { day: day_str, value });
    }
    result
}

pub struct ReportService;

impl ReportService {
    pub async fn summary(pool: &SqlitePool) -> AppResult<ReportSummary> {
        let now = Utc::now();
        let year = now.year();
        let month = now.month();
        let year_str = now.format("%Y").to_string();
        let month_str = now.format("%Y-%m").to_string();

        let total_patients: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM patients")
            .fetch_one(pool)
            .await?;

        let total_visits_this_month: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM visits WHERE strftime('%Y', visit_date) = ?"
        )
        .bind(&year_str)
        .fetch_one(pool)
        .await?;

        let completed_visits_this_month: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM visits WHERE status = 'Completed' AND strftime('%Y', visit_date) = ?"
        )
        .bind(&year_str)
        .fetch_one(pool)
        .await?;

        let cancelled_visits_this_month: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM visits WHERE status = 'Cancelled' AND strftime('%Y', visit_date) = ?"
        )
        .bind(&year_str)
        .fetch_one(pool)
        .await?;

        let revenue_this_month: Option<f64> = sqlx::query_scalar(
            "SELECT COALESCE(SUM(paid_amount), 0.0) FROM invoices WHERE strftime('%Y', issued_at) = ?"
        )
        .bind(&year_str)
        .fetch_one(pool)
        .await?;

        let outstanding_balance: Option<f64> = sqlx::query_scalar(
            "SELECT COALESCE(SUM(outstanding_amount), 0.0) FROM invoices WHERE status IN ('Unpaid', 'Partial')"
        )
        .fetch_one(pool)
        .await?;

        // Daily active patients trend (current month)
        let active_patients_rows: Vec<(i64, f64)> = sqlx::query_as(
            "SELECT CAST(strftime('%d', visit_date) AS INTEGER) as day_num, CAST(COUNT(DISTINCT patient_id) AS REAL) as val
             FROM visits
             WHERE strftime('%Y-%m', visit_date) = ?
             GROUP BY strftime('%d', visit_date)
             ORDER BY day_num"
        )
        .bind(&month_str)
        .fetch_all(pool)
        .await?;
        let active_patients_trend = fill_daily_trends(year, month, active_patients_rows);

        // Daily visits trend (current month)
        let visits_rows: Vec<(i64, f64)> = sqlx::query_as(
            "SELECT CAST(strftime('%d', visit_date) AS INTEGER) as day_num, CAST(COUNT(*) AS REAL) as val
             FROM visits
             WHERE strftime('%Y-%m', visit_date) = ?
             GROUP BY strftime('%d', visit_date)
             ORDER BY day_num"
        )
        .bind(&month_str)
        .fetch_all(pool)
        .await?;
        let visits_trend = fill_daily_trends(year, month, visits_rows);

        // Daily revenue trend (current month)
        let revenue_rows: Vec<(i64, f64)> = sqlx::query_as(
            "SELECT CAST(strftime('%d', received_at) AS INTEGER) as day_num, COALESCE(SUM(amount), 0.0) as val
             FROM payments
             WHERE strftime('%Y-%m', received_at) = ?
             GROUP BY strftime('%d', received_at)
             ORDER BY day_num"
        )
        .bind(&month_str)
        .fetch_all(pool)
        .await?;
        let revenue_trend = fill_daily_trends(year, month, revenue_rows);

        // Daily outstanding trend (current month)
        let outstanding_rows: Vec<(i64, f64)> = sqlx::query_as(
            "SELECT CAST(strftime('%d', issued_at) AS INTEGER) as day_num, COALESCE(SUM(outstanding_amount), 0.0) as val
             FROM invoices
             WHERE strftime('%Y-%m', issued_at) = ?
             GROUP BY strftime('%d', issued_at)
             ORDER BY day_num"
        )
        .bind(&month_str)
        .fetch_all(pool)
        .await?;
        let outstanding_trend = fill_daily_trends(year, month, outstanding_rows);

        // Previous month comparisons
        let prev_start = format!("{}-{:02}-01", year, month);
        let (prev_year, prev_month) = if month == 1 { (year - 1, 12u32) } else { (year, month - 1) };
        let prev_start_str = format!("{}-{:02}-01", prev_year, prev_month);

        let prev_active_patients: i64 = sqlx::query_scalar(
            "SELECT COUNT(DISTINCT patient_id) FROM visits
             WHERE visit_date >= ? AND visit_date < ?"
        )
        .bind(&prev_start_str)
        .bind(&prev_start)
        .fetch_one(pool)
        .await?;

        let prev_total_visits: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM visits
             WHERE visit_date >= ? AND visit_date < ?"
        )
        .bind(&prev_start_str)
        .bind(&prev_start)
        .fetch_one(pool)
        .await?;

        let prev_revenue: f64 = sqlx::query_scalar(
            "SELECT COALESCE(SUM(amount), 0.0) FROM payments
             WHERE received_at >= ? AND received_at < ?"
        )
        .bind(&prev_start_str)
        .bind(&prev_start)
        .fetch_one(pool)
        .await?;

        let prev_outstanding: f64 = sqlx::query_scalar(
            "SELECT COALESCE(SUM(outstanding_amount), 0.0) FROM invoices
             WHERE issued_at >= ? AND issued_at < ?"
        )
        .bind(&prev_start_str)
        .bind(&prev_start)
        .fetch_one(pool)
        .await?;

        Ok(ReportSummary {
            active_patients: total_patients,
            total_visits_this_month,
            revenue_this_month: revenue_this_month.unwrap_or(0.0),
            outstanding_balance: outstanding_balance.unwrap_or(0.0),
            completed_visits_this_month,
            cancelled_visits_this_month,
            active_patients_trend,
            visits_trend,
            revenue_trend,
            outstanding_trend,
            prev_active_patients,
            prev_total_visits,
            prev_revenue,
            prev_outstanding,
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
