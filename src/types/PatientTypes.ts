export interface Patient {
  id: string;
  fullName: string;
  phone: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  address: string;
  lastVisitDate: Date;
  initials: string;
  isCompleteProfile: boolean;
}

export interface Procedure {
  id: number;
  name: string;
  description: string | null;
  defaultPrice: number;
  isActive: number;
}

export interface PatientStats {
  total: number;
  active: number;
  newThisMonth: number;
  incompleteProfiles: number;
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