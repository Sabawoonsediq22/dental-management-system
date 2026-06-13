interface PatientState {
  id?: string;
  fullName: string;
  gender: "Male" | "Female" | "Other" | "";
  phoneNumber: string;
  age: number;
  address: string;
  createdAt?: string;
  updatedAt?: string;
}
interface medicalConditions {
  diabetes: boolean;
  hypertension: boolean;
  heartDisease: boolean;
  asthma: boolean;
  other?: string;
}

interface PatientAllergiesState {
  id?: number;
  patientId: string;
  allergyName: string;
}

interface PatientMedicationsState {
  id?: number;
  patientId: string;
  medicationName: string;
}

interface MedicalConditionsState {
  id?: number;
  patientId: string;
  conditionName: boolean;
  isActive: boolean;
}

interface ProceduresState {
  id: string;
  name: string;
  additionalNote?: string;
  price: number;
  createdAt?: string;
  updatedAt?: string;
}

interface VisitsState {
  id?: string;
  patientId: string;
  visitDate?: string;
  chiefComplaint: string;
  clinicalNotes: string;
  status: "Open" | "Completed" | "Cancelled";
  createdAt?: string;
  updatedAt?: string;
}

interface TreatmentRecordsState {
  id?: string;
  visitId: string;
  procedureId: string;
  toothQuadrant?: string;
  quantity: number;
  procedurePrice: number;
  performedAt?: string;
}

interface TreatmentTeethState {
  id?: number;
  treatmentRecordId: string;
  toothNumber?: number;
}

interface InvoiceState {
  id?: string;
  visitId: string;
  invoiceNumber: string;
  subtotal: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: "Unpaid" | "Partial" | "Paid";
  issuedAt?: string;
}

interface InvoiceItemsState {
  id?: number;
  invoiceId: string;
  treatmentRecordId?: string;
  procedureName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface PaymentsState {
  id?: string;
  invoiceId: string;
  amount: number;
  notes?: string;
  receivedAt?: string;
}

interface XraysState {
  id?: string;
  patientId: string;
  filePath: string;
  isPrimary: boolean;
  uploadedAt?: string;
}

interface AppSettingsState {
  id?: number;
  clinicName?: string;
  clinicPhone?: string;
  clinicAddress?: string;
  language?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface BackupsState {
  id?: number;
  backupType: "daily" | "weekly" | "monthly" | "manual";
  backupPath: string;
  cloudProvider: string;
  status: "success" | "failed" | "pending";
  fileSize?: number;
  errorMessage?: string;
  createdAt?: string;
  completedAt?: string;
}

interface AuditLogState {
  id?: number;
  entity: string;
  entityId: string;
  action: string;
  changedBy?: string;
  changedAt?: string;
  changes?: string;
}

interface FormErrors {
  fullName?: string;
  phoneNumber?: string;
  age?: string;
  address?: string;
  gender?: string;
}
