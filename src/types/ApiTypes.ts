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
  medical_conditions?: string[] | null;
  visit_date?: string | null;
  chief_complaint?: string | null;
  clinical_notes?: string | null;
  procedure_name?: string | null;
  procedure_additional_note?: string | null;
  procedure_price?: number | null;
  number_of_procedures?: number;
  treatment_teeth?: TreatmentToothInput[] | null;
  discount?: number | null;
  paid_amount?: number | null;
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

export interface TreatmentRecord {
  id: string;
  visit_id: string;
  procedure_id: string;
  number_of_procedures: number;
  performed_at: string;
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