// export const validateNewVisitForm = () => {
//     const nextErrors: Record<string, string> = {};

//     if (!patientId) {
//       return false;
//     }

//     if (!visitDate) {
//       nextErrors.visitDate = t("newVisit.errors.dateRequired");
//     }

//     if (!chiefComplaint.trim()) {
//       nextErrors.chiefComplaint = t("newVisit.errors.chiefComplaintRequired");
//     }

//     if (selectedProcedureName && !selectedProcedure) {
//       nextErrors.procedure = t("newVisit.errors.procedureRequired");
//     }

//     if (selectedProcedureName && numberOfProcedures < 1) {
//       nextErrors.numberOfProcedures = t("newVisit.errors.quantityRequired");
//     }

//     if (discountAmount < 0) {
//       nextErrors.discount = t("newVisit.errors.nonNegativeAmount");
//     }

//     if (paidAmountValue < 0) {
//       nextErrors.paidAmount = t("newVisit.errors.nonNegativeAmount");
//     }

//     setErrors(nextErrors);

//     return Object.keys(nextErrors).length === 0;
//   };