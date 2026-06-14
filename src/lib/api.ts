import { invoke } from "@tauri-apps/api/core";
import type {
  Patient,
  PatientPageResult,
  CreatePatientInput,
  UpdatePatientInput,
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
} from "../types/ApiTypes";

export const api = {
  patients: {
    list: (params: { query?: string; gender?: string; page?: number; perPage?: number }) =>
      invoke<PatientPageResult>("list_patients", { params }),
    get: (id: string) => invoke<Patient>("get_patient", { id }),
    create: (input: CreatePatientInput) => invoke<Patient>("create_patient", { input }),
    update: (id: string, input: UpdatePatientInput) => invoke<Patient>("update_patient", { id, input }),
    delete: (id: string) => invoke<void>("delete_patient", { id }),
    add_medical_condition: (patient_id: string, condition_name: string) => invoke<void>("add_medical_condition", { patient_id, condition_name }),
    upload_xray: (patient_id: string, filename: string, bytes: number[]) => invoke<Xray>("upload_xray", { patient_id, filename, bytes }),
  },
  visits: {
    create: (input: CreateVisitInput) => invoke<Visit>("create_visit", { input }),
    updateStatus: (id: string, status: Visit["status"]) => invoke<Visit>("update_visit_status", { id, status }),
    list: (patientId: string) => invoke<Visit[]>("get_patient_visits", { patient_id: patientId }),
  },
  treatments: {
    add: (input: CreateTreatmentRecordInput) => invoke<TreatmentRecord>("add_treatment_record", { input }),
  },
  invoices: {
    create: (input: CreateInvoiceInput) => invoke<Invoice>("create_invoice", { input }),
    getForVisit: (visitId: string) => invoke<Invoice | null>("get_visit_invoice", { visit_id: visitId }),
    getPayments: (invoiceId: string) => invoke<Payment[]>("get_invoice_payments", { invoice_id: invoiceId }),
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