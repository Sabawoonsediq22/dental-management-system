import type { TFunction } from "i18next";

interface SelectedProcedure {
  procedureName: string;
  additionalNotes: string;
  procedurePrice: number;
  numberOfProcedures: number;
  selectedToothIds: string[];
  sealedTeeth: { id: string }[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateNewVisitForm = (
  patientId: string | undefined,
  visitDate: string,
  chiefComplaint: string,
  selectedProcedures: SelectedProcedure[],
  discountAmount: number,
  paidAmountValue: number,
  t: TFunction,
): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!patientId) {
    return { isValid: false, errors };
  }

  if (!visitDate) {
    errors.visitDate = t("newVisit.errors.dateRequired");
  }

  if (!chiefComplaint.trim()) {
    errors.chiefComplaint = t("newVisit.errors.chiefComplaintRequired");
  }

  for (const proc of selectedProcedures) {
    const qty = parseInt(proc.numberOfProcedures.toString(), 10) || 0;
    if (qty < 1) {
      errors.numberOfProcedures = t("newVisit.errors.quantityRequired");
      break;
    }
  }

  if (discountAmount < 0) {
    errors.discount = t("newVisit.errors.nonNegativeAmount");
  }

  if (paidAmountValue < 0) {
    errors.paidAmount = t("newVisit.errors.nonNegativeAmount");
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};
