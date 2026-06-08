use serde::{Deserialize, Serialize};
use sqlx::FromRow;

// Patient
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Patient {
    pub id: String,
    pub full_name: String,
    pub phone: String,
    pub age: i32,
    pub gender: Gender,
    pub address: Option<String>,
    pub is_complete_profile: bool,
    pub created_at: String,
    pub updated_at: String,
    pub initials: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, Copy, PartialEq, Eq)]
#[sqlx(rename_all = "lowercase")]
pub enum Gender {
    Male,
    Female,
    Other,
}

// Patient medical info
#[derive(Debug, Serialize, Deserialize, FromRow)]
#[allow(dead_code)]
pub struct PatientMedicalInfo {
    pub patient_id: String,
    pub allergies: Option<String>,
    pub medications: Option<String>,
    pub clinical_notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[allow(dead_code)]
pub struct MedicalCondition {
    pub id: i64,
    pub patient_id: String,
    pub condition_name: String,
    pub is_active: bool,
}

// Visit
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Visit {
    pub id: String,
    pub patient_id: String,
    pub visit_date: String,
    pub chief_complaint: Option<String>,
    pub clinical_notes: Option<String>,
    pub status: VisitStatus,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, Copy, PartialEq, Eq)]
#[sqlx(rename_all = "lowercase")]
pub enum VisitStatus {
    Open,
    Completed,
    Cancelled,
}

// Treatment
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct TreatmentRecord {
    pub id: String,
    pub visit_id: String,
    pub procedure_id: String,
    pub tooth_quadrant: Option<String>,
    pub quantity: i32,
    pub procedure_price: f64,
    pub treatment_notes: Option<String>,
    pub performed_at: String,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[allow(dead_code)]
pub struct TreatmentTooth {
    pub id: i64,
    pub treatment_record_id: String,
    pub tooth_number: Option<i32>,
}

// Procedure
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Procedure {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub default_price: f64,
    pub category: Option<String>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

// Invoice
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Invoice {
    pub id: String,
    pub visit_id: String,
    pub invoice_number: String,
    pub subtotal: f64,
    pub discount: f64,
    pub total_amount: f64,
    pub paid_amount: f64,
    pub outstanding_amount: f64,
    pub status: InvoiceStatus,
    pub issued_at: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, Copy, PartialEq, Eq)]
#[sqlx(rename_all = "lowercase")]
pub enum InvoiceStatus {
    Unpaid,
    Partial,
    Paid,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[allow(dead_code)]
pub struct InvoiceItem {
    pub id: i64,
    pub invoice_id: String,
    pub treatment_record_id: Option<String>,
    pub procedure_name: String,
    pub quantity: i32,
    pub unit_price: f64,
    pub total_price: f64,
}

// Payment
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Payment {
    pub id: String,
    pub invoice_id: String,
    pub amount: f64,
    pub notes: Option<String>,
    pub received_at: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, Copy, PartialEq, Eq)]
#[sqlx(rename_all = "lowercase")]
pub enum PaymentMethod {
    Cash,
    Card,
    Mobile,
    Insurance,
}

// X-ray
#[derive(Debug, Serialize, Deserialize, FromRow)]
#[allow(dead_code)]
pub struct Xray {
    pub id: String,
    pub patient_id: String,
    pub file_path: String,
    pub is_primary: bool,
    pub uploaded_at: String,
}

// App settings
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct AppSettings {
    pub id: i32,
    pub clinic_name: Option<String>,
    pub clinic_phone: Option<String>,
    pub clinic_address: Option<String>,
    pub language: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

// Reports
#[derive(Debug, Serialize, Deserialize)]
pub struct ReportSummary {
    pub active_patients: i64,
    pub total_visits_this_month: i64,
    pub revenue_this_month: f64,
    pub outstanding_balance: f64,
    pub completed_visits_this_month: i64,
    pub cancelled_visits_this_month: i64,
}

// Input DTOs
#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePatientInput {
    pub full_name: String,
    pub phone: String,
    pub age: i32,
    pub gender: Gender,
    pub address: Option<String>,
    pub allergies: Option<String>,
    pub medications: Option<String>,
    pub clinical_notes: Option<String>,
    pub is_complete_profile: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdatePatientInput {
    pub full_name: Option<String>,
    pub phone: Option<String>,
    pub age: Option<i32>,
    pub gender: Option<Gender>,
    pub address: Option<String>,
    pub allergies: Option<String>,
    pub medications: Option<String>,
    pub clinical_notes: Option<String>,
    pub is_complete_profile: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateVisitInput {
    pub patient_id: String,
    pub visit_date: Option<String>,
    pub chief_complaint: Option<String>,
    pub clinical_notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTreatmentRecordInput {
    pub visit_id: String,
    pub procedure_id: String,
    pub tooth_quadrant: Option<String>,
    pub tooth_numbers: Vec<i32>,
    pub quantity: i32,
    pub procedure_price: f64,
    pub treatment_notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateInvoiceInput {
    pub visit_id: String,
    pub discount: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AddPaymentInput {
    pub invoice_id: String,
    pub amount: f64,
    pub method: PaymentMethod,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PatientPageResult {
    pub items: Vec<Patient>,
    pub total: i64,
    pub page: u32,
    pub per_page: u32,
    pub total_pages: i64,
}

// Tauri state
#[derive(Clone)]
pub struct AppState {
    pub db: sqlx::SqlitePool,
}