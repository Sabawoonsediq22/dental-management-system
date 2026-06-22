use sqlx::SqlitePool;
use crate::models::*;
use crate::services::errors::AppResult;
use chrono::{Utc, Duration};

pub struct DashboardService;

impl DashboardService {
    pub async fn stats(pool: &SqlitePool) -> AppResult<DashboardStats> {
        let today = Utc::now().format("%Y-%m-%d").to_string();

        let daily_revenue: Option<f64> = sqlx::query_scalar(
            "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE date(received_at) = ?"
        )
        .bind(&today)
        .fetch_one(pool)
        .await?;

        let patients_today: i64 = sqlx::query_scalar(
            "SELECT COUNT(DISTINCT patient_id) FROM visits WHERE date(visit_date) = ?"
        )
        .bind(&today)
        .fetch_one(pool)
        .await?;

        let outstanding_balance: Option<f64> = sqlx::query_scalar(
            "SELECT COALESCE(SUM(outstanding_amount), 0) FROM invoices WHERE status IN ('Unpaid', 'Partial')"
        )
        .fetch_one(pool)
        .await?;

        let procedures_performed: i64 = sqlx::query_scalar(
            "SELECT COALESCE(SUM(number_of_procedures), 0) FROM treatment_records WHERE date(performed_at) = ?"
        )
        .bind(&today)
        .fetch_one(pool)
        .await?;

        Ok(DashboardStats {
            daily_revenue: daily_revenue.unwrap_or(0.0),
            patients_today,
            outstanding_balance: outstanding_balance.unwrap_or(0.0),
            procedures_performed,
        })
    }

    pub async fn patients_flow(pool: &SqlitePool, mode: &str) -> AppResult<Vec<PatientsFlowPoint>> {
        if mode == "weekly" {
            let mut result = Vec::new();
            for i in (0..7).rev() {
                let day = Utc::now() - Duration::days(i);
                let date_str = day.format("%Y-%m-%d").to_string();
                let label = day.format("%a").to_string();

                let check_ins: i64 = sqlx::query_scalar(
                    "SELECT COUNT(*) FROM visits WHERE date(visit_date) = ?"
                )
                .bind(&date_str)
                .fetch_one(pool)
                .await?;

                let completed: i64 = sqlx::query_scalar(
                    "SELECT COUNT(*) FROM visits WHERE date(visit_date) = ? AND status = 'Completed'"
                )
                .bind(&date_str)
                .fetch_one(pool)
                .await?;

                result.push(PatientsFlowPoint {
                    label,
                    check_ins,
                    visits: check_ins,
                    completed,
                });
            }
            return Ok(result);
        }

        let mut result = Vec::new();
        for hour in [8u32, 10, 12, 14, 16, 18] {
            let hour_str = format!("{:02}:00", hour);
            let next_hour = format!("{:02}:59", hour);

            let check_ins: i64 = sqlx::query_scalar(
                "SELECT COUNT(*) FROM visits WHERE visit_date >= time(?) AND visit_date < time(?)"
            )
            .bind(&hour_str)
            .bind(&next_hour)
            .fetch_one(pool)
            .await?;

            let completed: i64 = sqlx::query_scalar(
                "SELECT COUNT(*) FROM visits WHERE visit_date >= time(?) AND visit_date < time(?) AND status = 'Completed'"
            )
            .bind(&hour_str)
            .bind(&next_hour)
            .fetch_one(pool)
            .await?;

            result.push(PatientsFlowPoint {
                label: hour_str,
                check_ins,
                visits: check_ins,
                completed,
            });
        }
        Ok(result)
    }

    pub async fn procedure_distribution(pool: &SqlitePool) -> AppResult<Vec<ProcedureDistribution>> {
        let rows: Vec<(String, i64)> = sqlx::query_as(
            "SELECT p.name, COUNT(*) as count FROM treatment_records tr
             JOIN procedures p ON tr.procedure_id = p.id
             WHERE date(tr.performed_at) = date('now')
             GROUP BY p.name
             ORDER BY count DESC"
        )
        .fetch_all(pool)
        .await?;

        Ok(rows.into_iter().map(|(name, count)| ProcedureDistribution { name, count }).collect())
    }

    pub async fn recent_patients(pool: &SqlitePool) -> AppResult<Vec<RecentPatient>> {
        let rows: Vec<(String, String, String, i32, String, String, String, String)> = sqlx::query_as(
            "SELECT p.id, p.full_name, p.phone, p.age, p.gender, p.address, v.visit_date, v.status
             FROM patients p
             JOIN visits v ON p.id = v.patient_id
             ORDER BY v.visit_date DESC
             LIMIT 10"
        )
        .fetch_all(pool)
        .await?;

        Ok(rows.into_iter().map(|(id, full_name, phone, age, gender, address, visit_date, status)| {
            RecentPatient {
                id,
                full_name,
                phone,
                age,
                gender,
                address,
                visit_date,
                status,
            }
        }).collect())
    }
}
