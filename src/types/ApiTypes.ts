export interface Patient {
  id: string;
  full_name: string;
  phone: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  address: string | null;
  created_at: string;
  updated_at: string;
  initials: string;
  last_visit?: string | null;
}

export interface CreatedPatient {
  id: string;
  full_name: string;
  phone: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  address: string | null;
  created_at: string;
  updated_at: string;
  last_visit?: string | null;
  visit_id: string;
  invoice_id: string;
  invoice_number: string;
  treatment_record_id: string | null;
}

export interface PatientMedicalInfo {
  allergies: string[];
  medications: string[];
  medical_conditions: string[];
}

export interface PatientStatisticsInfo {
  total_spent: number;
  last_visit_date: string | null;
  last_visit_procedure: string | null;
  outstanding_balance: number;
}

export interface UpdatePatientMedicalInfoInput {
  allergies: string | null;
  medications: string | null;
  medical_conditions: string[] | null;
}

export interface PatientPageResult {
  items: Patient[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface InvoicePageResult {
  items: InvoiceListItem[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  unpaid_count: number;
  partial_count: number;
  paid_count: number;
  total_outstanding: number;
}

export interface InvoiceListItem {
  id: string;
  invoice_number: string;
  patient_id: string;
  patient_name: string;
  patient_phone: string | null;
  visit_id: string;
  visit_date: string;
  subtotal: number;
  discount: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  status: "Unpaid" | "Partial" | "Paid";
  issued_at: string;
}

export interface InvoiceListParams {
  query?: string;
  status?: string;
  page?: number;
  perPage?: number;
}

export type InvoiceStatusFilter = "All" | "Unpaid" | "Partial" | "Paid";

export interface CreatePatientInput {
  full_name: string;
  phone: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  address?: string | null;
  allergies?: string | null;
  medications?: string | null;
  medical_conditions?: string[] | null;
  visit_date?: string | null;
  chief_complaint?: string | null;
  clinical_notes?: string | null;
  procedures: CreateProcedureWithTreatmentInput[];
  discount?: number | null;
  paid_amount?: number | null;
}

export interface CreateProcedureWithTreatmentInput {
  procedure_name: string;
  procedure_additional_note?: string | null;
  procedure_price: number;
  number_of_procedures: number;
  treatment_teeth: TreatmentToothInput[];
}

export interface UpdatePatientInput {
  full_name?: string;
  phone?: string;
  age?: number;
  gender?: "Male" | "Female" | "Other";
  address?: string | null;
  allergies?: string | null;
  medications?: string | null;
  clinical_notes?: string | null;
}

export interface Visit {
  id: string;
  patient_id: string;
  visit_date: string;
  chief_complaint?: string | null;
  clinical_notes?: string | null;
  status: "Open" | "Completed" | "Cancelled";
  created_at: string;
  updated_at: string;
}

export interface CreateVisitInput {
  patient_id: string;
  visit_date?: string;
  chief_complaint?: string | null;
  clinical_notes?: string | null;
}

export interface CreateProcedureInput {
  visit_id: string;
  name: string;
  additional_note?: string | null;
  procedure_price: number;
}

export interface TreatmentRecord {
  id: string;
  visit_id: string;
  procedure_id: string;
  number_of_procedures: number;
  performed_at: string;
}

export interface TreatmentTooth {
  id: number;
  treatment_record_id: string;
  tooth_number: number;
  tooth_quadrant: string;
}

export interface TreatmentProcedure {
  treatment_record_id: string;
  procedure_name: string;
  procedure_additional_note: string | null;
  number_of_procedures: number;
  unit_price: number;
  total_price: number;
  performed_at: string;
  teeth: TreatmentTooth[];
  xrays: string[];
}

export interface PatientVisitWithTreatments {
  visit_id: string;
  visit_date: string;
  chief_complaint: string | null;
  clinical_notes: string | null;
  status: "Open" | "Completed" | "Cancelled";
  procedures: TreatmentProcedure[];
}

export interface TreatmentToothInput {
  tooth_number: number;
  tooth_quadrant: string;
}

export interface CreateTreatmentRecordInput {
  visit_id: string;
  procedure_id: string;
  treatment_teeth: TreatmentToothInput[];
  number_of_procedures: number;
}

export interface Procedure {
  id: string;
  name: string;
  additional_note?: string | null;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  visit_id: string;
  invoice_number: string;
  subtotal: number;
  discount: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  status: "Unpaid" | "Partial" | "Paid";
  issued_at: string;
}

export interface CreateInvoiceInput {
    visit_id: string;
    subtotal: number;
    discount: number;
    paid_amount: number;
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  notes?: string | null;
  received_at: string;
}

export interface ReceiptClinic {
  name: string;
  address: string;
  phone: string;
  logoUrl?: string | null;
}

export interface ReceiptPatient {
  id: string;
  fullName: string;
  phone?: string | null;
}

export interface ReceiptPayment {
  id: string;
  amount: number;
  method?: string | null;
  notes?: string | null;
  receivedAt: string;
}

export interface ReceiptProcedure {
  treatmentRecordId?: string;
  procedureName: string;
  additionalNote?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  performedAt?: string;
  toothNumbers?: string | number[];
}

export interface ReceiptData {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  patientPhone?: string | null;
  visitId: string;
  issueDate: string;
  currency: "AFN" | "USD";
  subtotal: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: "Unpaid" | "Partial" | "Paid";
  procedures: ReceiptProcedure[];
  payments: ReceiptPayment[];
  clinic: ReceiptClinic;
}

export interface AddPaymentInput {
  invoice_id: string;
  amount: number;
  method: "Cash" | "Card" | "Mobile" | "Insurance";
  notes?: string | null;
}

export interface Xray {
  id: string;
  patient_id: string;
  treatment_record_id: string | null;
  file_path: string;
  is_primary: boolean;
  uploaded_at: string;
}

export interface ReportSummary {
  active_patients: number;
  total_visits_this_month: number;
  revenue_this_month: number;
  outstanding_balance: number;
  completed_visits_this_month: number;
  cancelled_visits_this_month: number;
}

export interface AppSettings {
  id: number;
  clinic_name?: string | null;
  clinic_phone?: string | null;
  clinic_address?: string | null;
  language?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateSettingsInput {
  clinic_name?: string | null;
  clinic_phone?: string | null;
  clinic_address?: string | null;
  language?: string | null;
}

export interface SearchResult {
  id: string;
  result_type: string;
  title: string;
  subtitle: string;
  route: string | null;
}

export interface DashboardStats {
  daily_revenue: number;
  patients_today: number;
  outstanding_balance: number;
  outstanding_invoices_count: number;
  procedures_performed: number;
}

export interface PatientsFlowPoint {
  label: string;
  check_ins: number;
  visits: number;
  completed: number;
}

export interface ProcedureDistribution {
  name: string;
  count: number;
}

export interface RecentPatient {
  id: string;
  full_name: string;
  phone: string;
  age: number;
  gender: string;
  address: string;
  visit_date: string;
  status: string;
  visit_id: string;
}
