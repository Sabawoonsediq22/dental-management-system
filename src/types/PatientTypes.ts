import type { Patient } from "./ApiTypes";

export interface Procedure {
  id: string;
  name: string;
  additional_note?: string | null;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface PatientStats {
  total: number;
  newThisMonth: number;
}

export type GenderFilterValue = "All" | "Male" | "Female" | "Other";

export const GENDER_FILTER_OPTIONS: GenderFilterValue[] = ["All", "Male", "Female", "Other"];

export interface PatientsHeaderProps {
  patients: Patient[];
  totalPatients: number;
  searchQuery: string;
  selectedGender: GenderFilterValue;
  onSearchChange: (query: string) => void;
  onGenderChange: (gender: GenderFilterValue) => void;
  onAddNewPatient: () => void;
}

export interface PatientTableProps {
  patients: Patient[];
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (items: number) => void;
  onEditPatient?: (patient: Patient) => void;
}

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export interface PatientHeaderInfo {
  id: string;
  full_name: string;
  location: string;
  registered_date: string;
}

export interface PatientStatistics {
  total_spent: number;
  total_spent_status: "Fully Paid" | "Partially Paid" | "Overdue";
  last_visit_date: string;
  last_visit_procedure: string;
  outstanding_balance: number;
}

export interface PersonalDetail {
  label: string;
  label_localized?: string;
  value: string;
  icon: React.ReactNode;
}

export interface AllergyAlert {
  label: string;
  value: string;
}

export interface TreatmentEntry {
  id: string;
  visitId: string;
  title: string;
  tooth_number?: number;
  date: string;
  time: string;
  cost: number;
  status: "Open" | "Completed" | "Cancelled";
  notes?: string;
  images?: string[];
  procedures?: {
    name: string;
    additional_note?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    tooth_numbers?: number[];
  }[];
}

export interface PatientProfileProps {
  patient: PatientHeaderInfo;
  statistics: PatientStatistics;
  personalDetails: PersonalDetail[];
  allergiesAlerts: AllergyAlert[];
  treatmentHistory: TreatmentEntry[];
  onEditPersonalInfo?: () => void;
  onDeletePatient?: () => void;
  onNewVisit?: () => void;
}