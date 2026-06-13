import { FormErrors, PatientState } from "../types/PatientFormTypes";

export const validatePatientForm = (
  patient: PatientState,
  setErrors: (errors: FormErrors) => void,
): boolean => {
  const newErrors: FormErrors = {};

  if (!patient.fullName.trim()) {
    newErrors.fullName = "Full name is required";
  } else if (patient.fullName.length > 100) {
    newErrors.fullName = "Name must be 100 characters or less";
  }

  if (!patient.phoneNumber.trim()) {
    newErrors.phoneNumber = "Phone number is required";
  } else if (!/^[+\d\s-()]+$/.test(patient.phoneNumber)) {
    newErrors.phoneNumber = "Invalid phone format";
  }

  if (!patient.gender) {
    newErrors.gender = "Gender is required";
  }

  const ageNum = parseInt(String(patient.age), 10);
  if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
    newErrors.age = "Age must be between 1 and 120";
  }

  if (patient.address && patient.address.length > 200) {
    newErrors.address = "Address must be 200 characters or less";
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
