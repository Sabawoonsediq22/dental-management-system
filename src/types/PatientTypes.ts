import type { Patient } from "./ApiTypes";

export interface Procedure {
  id: string;
  name: string;
  additional_note: string | null;
  price: number;
}

export interface PatientStats {
  total: number;
  newThisMonth: number;
}

export type GenderFilterValue = "All" | "Male" | "Female" | "Other";

export const GENDER_FILTER_OPTIONS: GenderFilterValue[] = ["All", "Male", "Female", "Other"];

export interface PatientsHeaderProps {
  patients: Patient[];
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