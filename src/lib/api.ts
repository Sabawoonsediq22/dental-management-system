import { invoke } from "@tauri-apps/api/core";
import type {
  Patient,
  PatientPageResult,
  CreatePatientInput,
  UpdatePatientInput,
  UpdatePatientMedicalInfoInput,
  Visit,
  CreateVisitInput,
  TreatmentRecord,
  CreateTreatmentRecordInput,
  Procedure,
  Invoice,
  CreateInvoiceInput,
  Payment,
  AddPaymentInput,
  ReportSummary,
  AppSettings,
  UpdateSettingsInput,
  Xray,
  PatientMedicalInfo,
  PatientStatisticsInfo,
  PatientVisitWithTreatments,
} from "../types/ApiTypes";

export const api = {
  patients: {
    list: (params: { query?: string; gender?: string; page?: number; perPage?: number }) =>
      invoke<PatientPageResult>("list_patients", { params }),
    get: (id: string) => invoke<Patient>("get_patient", { id }),
    getMedicalInfo: (id: string) => invoke<PatientMedicalInfo>("get_patient_medical_info", { id }),
    getStatistics: (id: string) => invoke<PatientStatisticsInfo>("get_patient_statistics", { id }),
    create: (input: CreatePatientInput) => invoke<Patient>("create_patient", { input }),
    update: (id: string, input: UpdatePatientInput) => invoke<Patient>("update_patient", { id, input }),
    updateMedicalInfo: (patient_id: string, input: UpdatePatientMedicalInfoInput) => invoke<void>("update_patient_medical_info", { patientId: patient_id, input }),
    delete: (id: string) => invoke<void>("delete_patient", { id }),
    add_medical_condition: (patient_id: string, condition_name: string) => invoke<void>("add_medical_condition", { patientId: patient_id, conditionName: condition_name }),
    upload_xray: (patient_id: string, treatment_record_id: string | null, filename: string, bytes: number[]) => invoke<Xray>("upload_xray", { patientId: patient_id, treatmentRecordId: treatment_record_id, filename, bytes }),
    getXrays: (patient_id: string) => invoke<Xray[]>("get_patient_xrays", { patientId: patient_id }),
  },
  visits: {
    create: (input: CreateVisitInput) => invoke<Visit>("create_visit", { input }),
    updateStatus: (id: string, status: Visit["status"]) => invoke<Visit>("update_visit_status", { id, status }),
    list: (patientId: string) => invoke<Visit[]>("get_patient_visits", { patientId }),
    getWithTreatments: (patientId: string) => invoke<PatientVisitWithTreatments[]>("get_patient_treatment_history", { patientId }),
  },
  treatments: {
    add: (input: CreateTreatmentRecordInput) => invoke<TreatmentRecord>("add_treatment_record", { input }),
  },
  invoices: {
    create: (input: CreateInvoiceInput) => invoke<Invoice>("create_invoice", { input }),
    getForVisit: (visitId: string) => invoke<Invoice | null>("get_visit_invoice", { visitId }),
    getPayments: (invoiceId: string) => invoke<Payment[]>("get_invoice_payments", { invoiceId }),
  },
  payments: {
    add: (input: AddPaymentInput) => invoke<Payment>("add_payment", { input }),
  },
  procedures: {
    list: () => invoke<Procedure[]>("list_procedures"),
    findByName: (name: string) => invoke<Procedure | null>("find_procedure_by_name", { name }),
  },
  reports: {
    summary: () => invoke<ReportSummary>("get_report_summary"),
  },
  settings: {
    get: () => invoke<AppSettings>("get_settings"),
    update: (input: UpdateSettingsInput) => invoke<AppSettings>("update_settings", { input }),
  },
};