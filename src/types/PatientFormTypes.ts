export interface Patient {
  id?: string;
  fullName: string;
  gender: "Male" | "Female" | "Other" | "";
  phoneNumber: string;
  age: number;
  address: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PatientAllergies {
  id?: number;
  patientId: string;
  allergyName: string;
}

export interface PatientMedications {
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

export interface MedicalConditions {
  id?: number;
  patientId: string;
  conditionName: medicalConditions;
  isActive: boolean;
}

export interface PatientVisit {
   id?: string;
   patientId: string;
   visitDate: string;
   chiefComplaint: string;
   clinicalNotes: string;
   status: "Open" | "Completed" | "Canceled";
   discount?: number;
   createdAt?: string;
   updatedAt?: string;
 }

export interface PatientProcedure {
  id?: string;
  visitId?: string;
  procedureName: string;
  additionalNotes?: string | null;
  procedurePrice: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TreatmentRecord {
  id?: string;
  visitId: string;
  procedureId: string;
  numberOfProcedures: number;
  performedAt?: string;
}

export interface TreatmentTeeth {
   id?: number;
   treatmentRecordId?: string;
   toothNumber: number;
   toothQuadrant: string;
}

export interface FormErrors {
  fullName?: string;
  phoneNumber?: string;
  age?: string;
  address?: string;
  gender?: string;
}
