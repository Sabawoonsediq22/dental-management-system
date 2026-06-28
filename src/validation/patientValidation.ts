import { TFunction } from "i18next";
import { FormErrors, PatientState } from "../types/PatientFormTypes";

export const validatePatientForm = (
  patient: PatientState,
  setErrors: (errors: FormErrors) => void,
  t?: TFunction,
): boolean => {
  const newErrors: FormErrors = {};
  const tr = t || ((_key: string, defaultValue?: string) => defaultValue || "");

  if (!patient.fullName.trim()) {
    newErrors.fullName = tr("validation.fullNameRequired", "Full name is required");
  } else if (patient.fullName.length > 100) {
    newErrors.fullName = tr("validation.fullNameMaxLength", "Name must be 100 characters or less");
  }

  if (!patient.phoneNumber.trim()) {
    newErrors.phoneNumber = tr("validation.phoneRequired", "Phone number is required");
  } else if (!/^[+\d\s-()]+$/.test(patient.phoneNumber)) {
    newErrors.phoneNumber = tr("validation.phoneInvalid", "Invalid phone format");
  }

  if (!patient.gender) {
    newErrors.gender = tr("validation.genderRequired", "Gender is required");
  }

  const ageNum = parseInt(String(patient.age), 10);
  if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
    newErrors.age = tr("validation.ageRange", "Age must be between 1 and 120");
  }

  if (patient.address && patient.address.length > 200) {
    newErrors.address = tr("validation.addressMaxLength", "Address must be 200 characters or less");
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
