export interface PatientState {
  id?: string;
  fullName: string;
  gender: "Male" | "Female" | "Other" | "";
  phoneNumber: string;
  age: number;
  address: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PatientAllergiesState {
  id?: number;
  patientId: string;
  allergyName: string;
}

export interface PatientMedicationsState {
  id?: number;
  patientId: string;
  medicationName: string;
}

export interface medicalConditions {
  diabetes: boolean;
  hypertension: boolean;
  heartDisease: boolean;
  asthma: boolean;
  other?: string;
}

export interface MedicalConditionsState {
  id?: number;
  patientId: string;
  conditionName: medicalConditions;
  isActive: boolean;
}

export interface FormErrors {
  fullName?: string;
  phoneNumber?: string;
  age?: string;
  address?: string;
  gender?: string;
}
