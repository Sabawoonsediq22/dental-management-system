interface MedicalConditions {
  diabetes: boolean;
  hypertension: boolean;
  heartDisease: boolean;
  asthma: boolean;
  other?: string;
}

interface PatientFormData {
  fullName: string;
  gender: "Male" | "Female" | "Other" | "";
  phoneNumber: string;
  age: string;
  address: string;
  allergies: string;
  chiefComplaint: string;
  currentMedications: string;
  clinicalNotes: string;
  medicalConditions: MedicalConditions;
  procedure: string;
  procedureValue: string;
  numberOfProcedures: string;
  discount: string;
}

interface FormErrors {
  fullName?: string;
  phoneNumber?: string;
  age?: string;
  address?: string;
}