// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod db;
mod models;
mod services;
mod utils;

use crate::models::*;
use crate::services::*;
use tauri::Manager;
use tauri::State;

#[tauri::command]
async fn greet(name: &str) -> Result<String, String> {
    Ok(format!("Hello, {}! You've been greeted from Rust!", name))
}

// Patient commands
#[tauri::command]
async fn list_patients(
    state: State<'_, AppState>,
    params: PatientListParams,
) -> Result<PatientPageResult, String> {
    let query = params.query.as_deref();
    let gender = params.gender.as_deref();
    let page = params.page.unwrap_or(1);
    let per_page = params.per_page.unwrap_or(10);
    PatientService::list(&state.db, query, gender, page, per_page)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_patient(
    state: State<'_, AppState>,
    input: CreatePatientInput,
) -> Result<CreatedPatient, String> {
    PatientService::create(&state.db, input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_patient(state: State<'_, AppState>, id: String) -> Result<Patient, String> {
    PatientService::find(&state.db, &id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_patient(
    state: State<'_, AppState>,
    id: String,
    input: UpdatePatientInput,
) -> Result<Patient, String> {
    PatientService::update(&state.db, &id, input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_patient(state: State<'_, AppState>, id: String) -> Result<(), String> {
    PatientService::delete(&state.db, &id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_medical_condition(
    state: State<'_, AppState>,
    patient_id: String,
    condition_name: String,
) -> Result<(), String> {
    PatientService::add_medical_condition(&state.db, &patient_id, &condition_name)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_patient_medical_info(
    state: State<'_, AppState>,
    id: String,
) -> Result<PatientMedicalInfoResponse, String> {
    PatientService::get_medical_info(&state.db, &id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_patient_statistics(
    state: State<'_, AppState>,
    id: String,
) -> Result<PatientStatisticsResponse, String> {
    PatientService::get_statistics(&state.db, &id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_patient_medical_info(
    state: State<'_, AppState>,
    patient_id: String,
    input: UpdatePatientMedicalInfoInput,
) -> Result<(), String> {
    PatientService::update_medical_info(&state.db, &patient_id, input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_patient_xrays(
    state: State<'_, AppState>,
    patient_id: String,
) -> Result<Vec<Xray>, String> {
    XrayService::list_for_patient(&state.db, &patient_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn upload_xray(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    patient_id: String,
    treatment_record_id: Option<String>,
    filename: String,
    bytes: Vec<u8>,
) -> Result<Xray, String> {
    XrayService::upload(&state.db, &app, &patient_id, treatment_record_id.as_deref(), &filename, &bytes)
        .await
        .map_err(|e| e.to_string())
}

// Visit commands
#[tauri::command]
async fn create_visit(
    state: State<'_, AppState>,
    input: CreateVisitInput,
) -> Result<Visit, String> {
    VisitService::create(&state.db, input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_visit_status(
    state: State<'_, AppState>,
    id: String,
    status: VisitStatus,
) -> Result<Visit, String> {
    VisitService::update_status(&state.db, &id, status)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_patient_visits(
    state: State<'_, AppState>,
    patient_id: String,
) -> Result<Vec<Visit>, String> {
    VisitService::get_by_patient(&state.db, &patient_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_patient_treatment_history(
    state: State<'_, AppState>,
    patient_id: String,
) -> Result<Vec<PatientVisitWithTreatments>, String> {
    VisitService::get_with_treatments(&state.db, &patient_id)
        .await
        .map_err(|e| e.to_string())
}

// Treatment commands
#[tauri::command]
async fn add_treatment_record(
    state: State<'_, AppState>,
    input: CreateTreatmentRecordInput,
) -> Result<TreatmentRecord, String> {
    TreatmentRecordService::create(&state.db, input)
        .await
        .map_err(|e| e.to_string())
}

// Invoice commands
#[tauri::command]
async fn list_invoices(
    state: State<'_, AppState>,
    params: crate::models::InvoiceListParams,
) -> Result<crate::models::InvoicePageResult, String> {
    InvoiceService::list(&state.db, params)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_invoice(
    state: State<'_, AppState>,
    input: CreateInvoiceInput,
) -> Result<Invoice, String> {
    InvoiceService::create(&state.db, input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_invoice(
    state: State<'_, AppState>,
    id: String,
) -> Result<Invoice, String> {
    InvoiceService::find(&state.db, &id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_visit_invoice(
    state: State<'_, AppState>,
    visit_id: String,
) -> Result<Option<Invoice>, String> {
    InvoiceService::get_for_visit(&state.db, &visit_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_receipt_details(
    state: State<'_, AppState>,
    invoice_id: String,
) -> Result<ReceiptData, String> {
    InvoiceService::get_receipt_details(&state.db, &invoice_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_receipt_details_by_visit(
    state: State<'_, AppState>,
    visit_id: String,
) -> Result<ReceiptData, String> {
    InvoiceService::get_receipt_details_by_visit(&state.db, &visit_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_payment(
    state: State<'_, AppState>,
    input: AddPaymentInput,
) -> Result<Payment, String> {
    PaymentService::add(&state.db, input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_invoice_payments(
    state: State<'_, AppState>,
    invoice_id: String,
) -> Result<Vec<Payment>, String> {
    PaymentService::list_for_invoice(&state.db, &invoice_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn global_search(
    state: State<'_, AppState>,
    query: String,
) -> Result<Vec<SearchResult>, String> {
    SearchService::global_search(&state.db, &query)
        .await
        .map_err(|e| e.to_string())
}

// Reports commands
#[tauri::command]
async fn get_report_summary(state: State<'_, AppState>) -> Result<ReportSummary, String> {
    ReportService::summary(&state.db)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_monthly_revenue(state: State<'_, AppState>) -> Result<Vec<MonthlyRevenuePoint>, String> {
    ReportService::monthly_revenue(&state.db)
        .await
        .map_err(|e| e.to_string())
}

// Dashboard commands
#[tauri::command]
async fn get_dashboard_stats(state: State<'_, AppState>) -> Result<DashboardStats, String> {
    DashboardService::stats(&state.db)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_patients_flow(
    state: State<'_, AppState>,
    mode: String,
) -> Result<Vec<PatientsFlowPoint>, String> {
    DashboardService::patients_flow(&state.db, &mode)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_procedure_distribution(
    state: State<'_, AppState>,
) -> Result<Vec<ProcedureDistribution>, String> {
    DashboardService::procedure_distribution(&state.db)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_recent_patients(
    state: State<'_, AppState>,
) -> Result<Vec<RecentPatient>, String> {
    DashboardService::recent_patients(&state.db)
        .await
        .map_err(|e| e.to_string())
}

// Procedure commands
#[tauri::command]
async fn create_procedure(
    state: State<'_, AppState>,
    input: CreateProcedureInput,
) -> Result<Procedure, String> {
    ProcedureService::create(&state.db, input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn list_procedures(state: State<'_, AppState>) -> Result<Vec<Procedure>, String> {
    ProcedureService::list(&state.db)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn find_procedure_by_name(
    state: State<'_, AppState>,
    name: String,
) -> Result<Option<Procedure>, String> {
    ProcedureService::find_by_name(&state.db, &name)
        .await
        .map_err(|e| e.to_string())
}

// Settings commands
#[tauri::command]
async fn get_settings(state: State<'_, AppState>) -> Result<AppSettings, String> {
    SettingsService::get(&state.db)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_settings(
    state: State<'_, AppState>,
    input: UpdateSettingsInput,
) -> Result<AppSettings, String> {
    SettingsService::update(&state.db, input)
        .await
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let db_path = app
                .path()
                .app_data_dir()
                .unwrap()
                .join("dental_clinic.db")
                .to_string_lossy()
                .to_string();

            println!("Database path: {}", db_path);

            let pool = tauri::async_runtime::block_on(db::init_pool(&db_path));
            match pool {
                Ok(pool) => {
                    if let Err(e) = tauri::async_runtime::block_on(db::run_migrations(&pool)) {
                        eprintln!("Failed to run migrations: {}", e);
                    }
                    app.manage(AppState { db: pool });
                }
                Err(e) => {
                    eprintln!("Failed to init DB: {}", e);
                    return Err(e.into());
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            list_patients,
            create_patient,
            get_patient,
            update_patient,
            delete_patient,
            add_medical_condition,
            update_patient_medical_info,
            get_patient_medical_info,
            get_patient_statistics,
            get_patient_xrays,
            upload_xray,
            create_visit,
            update_visit_status,
            get_patient_visits,
            get_patient_treatment_history,
            add_treatment_record,
            create_invoice,
            get_invoice,
            get_visit_invoice,
            list_invoices,
            get_receipt_details,
            get_receipt_details_by_visit,
            add_payment,
            get_invoice_payments,
            create_procedure,
            list_procedures,
            find_procedure_by_name,
            get_report_summary,
            get_monthly_revenue,
            get_settings,
            update_settings,
            global_search,
            get_dashboard_stats,
            get_patients_flow,
            get_procedure_distribution,
            get_recent_patients,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}