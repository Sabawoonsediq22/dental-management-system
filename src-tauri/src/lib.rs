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
) -> Result<Patient, String> {
    PatientService::create(&state.db, input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_patient_intake(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    input: CreatePatientIntakeInput,
) -> Result<PatientIntakeResult, String> {
    NewPatientIntakeService::create(&state.db, &app, input)
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
async fn upload_xray(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    patient_id: String,
    filename: String,
    bytes: Vec<u8>,
) -> Result<Xray, String> {
    XrayService::upload(&state.db, &app, &patient_id, &filename, &bytes)
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
async fn create_invoice(
    state: State<'_, AppState>,
    input: CreateInvoiceInput,
) -> Result<Invoice, String> {
    InvoiceService::create(&state.db, input)
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

// Reports commands
#[tauri::command]
async fn get_report_summary(state: State<'_, AppState>) -> Result<ReportSummary, String> {
    ReportService::summary(&state.db)
        .await
        .map_err(|e| e.to_string())
}

// Procedure commands
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
            create_patient_intake,
            get_patient,
            update_patient,
            delete_patient,
            add_medical_condition,
            upload_xray,
            create_visit,
            update_visit_status,
            get_patient_visits,
            add_treatment_record,
            create_invoice,
            get_visit_invoice,
            add_payment,
            get_invoice_payments,
            list_procedures,
            find_procedure_by_name,
            get_report_summary,
            get_settings,
            update_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
