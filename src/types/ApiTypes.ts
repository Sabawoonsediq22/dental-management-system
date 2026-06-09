export interface Patient {
  id: string;
  full_name: string;
  phone: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  address: string | null;
  is_complete_profile: boolean;
  created_at: string;
  updated_at: string;
  initials: string;
  last_visit?: string | null;
}

export interface PatientPageResult {
  items: Patient[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface PatientListParams {
  query?: string;
  gender?: string;
  page?: number;
  perPage?: number;
}

export interface CreatePatientInput {
  full_name: string;
  phone: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  address?: string | null;
  allergies?: string | null;
  medications?: string | null;
  clinical_notes?: string | null;
  is_complete_profile?: boolean;
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
  is_complete_profile?: boolean;
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

export interface TreatmentRecord {
  id: string;
  visit_id: string;
  procedure_id: string;
  tooth_quadrant?: string | null;
  quantity: number;
  procedure_price: number;
  treatment_notes?: string | null;
  performed_at: string;
}

export interface CreateTreatmentRecordInput {
  visit_id: string;
  procedure_id: string;
  tooth_quadrant?: string | null;
  tooth_numbers: number[];
  quantity: number;
  procedure_price: number;
  treatment_notes?: string | null;
}

export interface Procedure {
  id: string;
  name: string;
  description?: string | null;
  default_price: number;
  category?: string | null;
  is_active: boolean;
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
  discount: number;
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  notes?: string | null;
  received_at: string;
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