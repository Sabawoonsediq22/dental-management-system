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

export type PatientState = Patient;

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
   paidAmount?: number;
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

export interface TreatmentTooth {
   id?: number;
   treatmentRecordId?: string;
   toothNumber: number;
   toothQuadrant: string;
}

export interface invoice {
  id?: string;
  visitId: string;
  invoiceNumber: string;
  subtotal: number;
  discount?: number;
  totalAmount: number;
  PaidAmount: number;
  outstandingAmount: number;
  status: "Unpaid" | "Partial" | "Paid";
  issuedAt?: string;
}

export interface FormErrors {
  fullName?: string;
  phoneNumber?: string;
  age?: string;
  address?: string;
  gender?: string;
}
