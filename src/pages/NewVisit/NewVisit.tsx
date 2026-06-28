import React, { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  VisitDetailsIcon,
  ToothIcon,
  ImageIcon,
  CheckCircleIcon,
  CrossCircleIcon,
  LocationIcon,
  BillingIcon,
} from "../../shared/icons/icons";
import {
  Button,
  FormField,
  FormInput,
  FormTextarea,
  LoadingSpinner,
  Select,
  toast,
} from "../../components/ui";
import DentalChart from "../../components/dental-chart/DentalChart";
import { isRTL } from "../../i18n";
import { ToothData } from "../../components/dental-chart/types";
import { api } from "../../lib/api";
import type {
  CreateProcedureInput,
  CreateTreatmentRecordInput,
  CreateVisitInput,
  TreatmentRecord,
} from "../../types/ApiTypes";
import { usePatient } from "../../hooks/usePatients";
import { PROCEDURES } from "../../shared/constants/Procedures";
import PatientAvatarWithStatus from "../../components/patients/PatientAvatarWithStatus";
import { ReceiptPreviewModal } from "../../components/receipt/ReceiptPreviewModal";
import { getCurrencySymbol } from "../../components/common/getCurrencySymbol";
import { validateNewVisitForm as validateFormFields } from "../../validation/newVisitValidation";

const getTodayDateString = () => new Date().toISOString().split("T")[0];

const getToothQuadrant = (toothId: string) => {
  const fdiNumber = parseInt(toothId, 10);

  if (fdiNumber >= 11 && fdiNumber <= 17) return "Upper Right";
  if (fdiNumber >= 21 && fdiNumber <= 27) return "Upper Left";
  if (fdiNumber >= 31 && fdiNumber <= 37) return "Lower Left";
  if (fdiNumber >= 41 && fdiNumber <= 47) return "Lower Right";

  return "";
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat().format(Math.round(amount));

  
const NewVisit: React.FC = () => {
  const { t } = useTranslation();
  const { id: patientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const patientQuery = usePatient(patientId || "");
  const patient = patientQuery.data;
  const registeredDate = patient?.created_at
    ? new Date(patient.created_at).toISOString().split("T")[0]
    : "";

  const [visitDate, setVisitDate] = useState(getTodayDateString());
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");

  interface SelectedProcedure {
    procedureName: string;
    additionalNotes: string;
    procedurePrice: number;
    numberOfProcedures: number;
    selectedToothIds: string[];
    sealedTeeth: ToothData[];
  }

  const [selectedProcedures, setSelectedProcedures] =
    useState<SelectedProcedure[]>([]);
  const [activeProcedureIndex, setActiveProcedureIndex] = useState<number>(0);
  const [newProcedureName, setNewProcedureName] = useState("");

  const [discount, setDiscount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [xrayFile, setXrayFile] = useState<File | null>(null);
  const [xrayPreview, setXrayPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptInvoiceId, setReceiptInvoiceId] = useState<string | null>(null);

  const updateActiveProcedure = <K extends keyof SelectedProcedure>(
    field: K,
    value: SelectedProcedure[K],
  ) => {
    setSelectedProcedures((prev) => {
      const next = [...prev];
      if (next.length === 0 || activeProcedureIndex >= next.length) {
        return prev;
      }
      next[activeProcedureIndex] = {
        ...next[activeProcedureIndex],
        [field]: value,
      };
      return next;
    });
  };

  const addProcedure = () => {
    const selectedProcedure = PROCEDURES.find(
      (p) => p.name === newProcedureName,
    );
    const newProc: SelectedProcedure = {
      procedureName: newProcedureName,
      additionalNotes: "",
      procedurePrice: selectedProcedure?.price ?? 0,
      numberOfProcedures: 1,
      selectedToothIds: [],
      sealedTeeth: [],
    };
    setSelectedProcedures((prev) => {
      const next = [...prev, newProc];
      setActiveProcedureIndex(next.length - 1);
      return next;
    });
    setNewProcedureName("");
  };

  const removeProcedure = (index: number) => {
    setSelectedProcedures((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) {
        setActiveProcedureIndex(0);
      } else if (index < activeProcedureIndex) {
        setActiveProcedureIndex((prevIndex) => prevIndex - 1);
      } else if (index === activeProcedureIndex) {
        setActiveProcedureIndex(Math.max(0, next.length - 1));
      }
      return next;
    });
  };

  const handleSelectedToothChange = (toothData?: ToothData) => {
    if (!toothData) return;
    const index = activeProcedureIndex;
    setSelectedProcedures((prev) => {
      const next = [...prev];
      const current = { ...next[index] };
      if (!current.selectedToothIds) current.selectedToothIds = [];
      if (!current.sealedTeeth) current.sealedTeeth = [];
      current.selectedToothIds = current.selectedToothIds.includes(toothData.id)
        ? current.selectedToothIds.filter((id) => id !== toothData.id)
        : [...current.selectedToothIds, toothData.id];

      current.sealedTeeth = [
        ...current.sealedTeeth.filter((existing) => existing.id !== toothData.id),
        toothData,
      ];

      next[index] = current;
      return next;
    });
  };

  const handleToothMeasurements = (toothId: string) => {
    setSelectedProcedures((prev) => {
      const next = [...prev];
      const current = { ...next[activeProcedureIndex] };
      if (!current.sealedTeeth) current.sealedTeeth = [];
      const exists = current.sealedTeeth.find(
        (item: ToothData) => item.id === toothId,
      );
      if (!exists) {
        current.sealedTeeth = [...current.sealedTeeth, { id: toothId } as ToothData];
      }
      next[activeProcedureIndex] = current;
      return next;
    });
  };

  const discountAmount = parseFloat(discount) || 0;
  const paidAmountValue = parseFloat(paidAmount) || 0;
  const subtotal = selectedProcedures.reduce(
    (sum, p) => sum + (parseFloat(p.procedurePrice.toString()) || 0) * (parseInt(p.numberOfProcedures.toString(), 10) || 1),
    0,
  );
  const totalDue = Math.max(subtotal - discountAmount, 0);
  const outstandingAmount = Math.max(totalDue - paidAmountValue, 0);
  const currencySymbol = getCurrencySymbol(
    selectedProcedures.length > 0
      ? selectedProcedures[0].procedureName
      : "",
  );

  const BillingStatusIcon: React.FC<{
    isActive: boolean;
    className?: string;
  }> = ({ isActive, className = "" }) => {
    const Icon = isActive ? CheckCircleIcon : CrossCircleIcon;

    return (
      <Icon
        className={`h-5 w-5 ${
          isActive ? "text-green-500" : "text-red-500"
        } ${className}`}
      />
    );
  };

  const trimToNull = (value: string) => {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  const fileToUint8Array = (file: File): Promise<number[]> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const buffer = reader.result as ArrayBuffer;
        resolve(Array.from(new Uint8Array(buffer)));
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });

  const handleXrayChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setXrayFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setXrayPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeXray = () => {
    setXrayFile(null);
    setXrayPreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

   const validateNewVisitForm = () => {
      const result = validateFormFields(
        patientId,
        visitDate,
        chiefComplaint,
        selectedProcedures,
        discountAmount,
        paidAmountValue,
        t,
      );
      setErrors(result.errors);
      return result.isValid;
    };

  const handleReceiptClose = () => {
    setReceiptInvoiceId(null);
    navigate(`/patients/${patientId}`);
  };

   const handleSubmit = async (event: React.FormEvent) => {
     event.preventDefault();

     if (!patient || !patientId || !validateNewVisitForm()) return;

     setIsSubmitting(true);

     try {
       const visitInput: CreateVisitInput = {
         patient_id: patientId,
         visit_date: visitDate || undefined,
         chief_complaint: trimToNull(chiefComplaint),
         clinical_notes: trimToNull(clinicalNotes),
       };
       const createdVisit = await api.visits.create(visitInput);
       let treatmentRecord: TreatmentRecord | null = null;
       let xrayUploadFailed = false;

       for (const proc of selectedProcedures) {
         const procedureInput: CreateProcedureInput = {
           visit_id: createdVisit.id,
           name: proc.procedureName,
           additional_note: proc.additionalNotes?.trim() || null,
           procedure_price: proc.procedurePrice,
         };
         const createdProcedure = await api.procedures.create(procedureInput);
         const treatmentInput: CreateTreatmentRecordInput = {
           visit_id: createdVisit.id,
           procedure_id: createdProcedure.id,
           number_of_procedures: Math.max(proc.numberOfProcedures, 1),
           treatment_teeth: proc.selectedToothIds
             .map((id) => ({
               tooth_number: parseInt(id, 10),
               tooth_quadrant: getToothQuadrant(id),
             }))
             .filter((t) => t.tooth_number > 0 && t.tooth_quadrant.trim()),
         };

         treatmentRecord = await api.treatments.add(treatmentInput);
       }

       if (xrayFile && treatmentRecord) {
         try {
           await api.patients.upload_xray(
             patient.id,
             treatmentRecord.id,
             xrayFile.name,
             await fileToUint8Array(xrayFile),
           );
         } catch (xrayError) {
           xrayUploadFailed = true;
           console.error("X-ray upload failed:", xrayError);
         }
       }

       const createdInvoice = await api.invoices.create({
         visit_id: createdVisit.id,
         subtotal,
         discount: discountAmount,
         paid_amount: paidAmountValue,
       });

        queryClient.invalidateQueries({
          queryKey: ["patients", patientId],
          refetchType: "all",
        });
        queryClient.invalidateQueries({
          queryKey: ["patients", patientId, "statistics"],
          refetchType: "all",
        });
        queryClient.invalidateQueries({
          queryKey: ["treatment-history", patientId],
          refetchType: "all",
        });
        queryClient.invalidateQueries({
          queryKey: ["visits", patientId],
          refetchType: "all",
        });
        queryClient.invalidateQueries({
          queryKey: ["invoices"],
          refetchType: "all",
        });
        queryClient.invalidateQueries({
          queryKey: ["reports"],
          refetchType: "all",
        });
        queryClient.invalidateQueries({
          queryKey: ["dashboard"],
          refetchType: "all",
        });

       setReceiptInvoiceId(createdInvoice.id);

       toast.success({
         title: t("newVisit.notifications.addSuccess"),
         description: xrayUploadFailed
           ? t("newVisit.notifications.partialSuccess")
           : undefined,
       });
     } catch (error) {
       console.error("Failed to create visit:", error);
       toast.error({
         title: t("newVisit.notifications.addError"),
         description: String(error),
       });
     } finally {
       setIsSubmitting(false);
     }
    };

   if (patientQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" text={t("common.loading")} />
      </div>
    );
  }

  if (patientQuery.error || !patient) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-destructive">
        <p className="font-medium">{t("newVisit.errors.patientLoadFailed")}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/patients")}
        >
          {t("patients.table.columnActions")}
        </Button>
      </div>
    );
  }

  return (
    <>
      <ReceiptPreviewModal
        isOpen={Boolean(receiptInvoiceId)}
        invoiceId={receiptInvoiceId ?? undefined}
        patientId={patientId}
        onClose={handleReceiptClose}
      />
      <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/patients/${patientId}`)}
          >
            {isRTL() ? (
              <ArrowLeftIcon className="rotate-180" />
            ) : (
              <ArrowLeftIcon />
            )}
          </Button>
          <div>
            <h2 className="text-3xl font-bold text-primary dark:text-white">
              {t("newVisit.title")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("newVisit.description")}
            </p>
          </div>
        </div>
        <div className="text-sm">
          <p className="text-muted-foreground">
            {t("newPatient.date")}:{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {new Date().toISOString().split("T")[0]}
            </span>
          </p>
        </div>
      </div>

      {/* Patient Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            <PatientAvatarWithStatus
              name={patient.full_name}
              size="xxl"
              status="online"
            />
            <div>
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {patient.full_name}
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                  {patient.id}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <LocationIcon className="w-4 h-4" />
                  {patient.address ? patient.address : t("patientProfile.addressNotProvided")} •
                </span>
                <span>{t("patientProfile.registeredSince", { date: registeredDate })}</span>
              </div>
            </div>
          </div>

          {/* Right Side - Action Buttons */}
          <div className="flex items-center justify-center gap-3 mt-5">
            <Button
              variant="outline"
              onClick={() => navigate(`/patients/${patientId}`)}
            >
              {t("newPatient.viewHistory")}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <section className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="rounded-t-lg border-b border-gray-200 bg-gray-100 dark:bg-gray-700 p-4 dark:border-gray-700">
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
              <VisitDetailsIcon className="h-5 w-5 text-blue-600" />
              {t("newVisit.visitDetails")}
            </h3>
          </div>
          <div className="p-6">
            <div>
                <FormField
                  label={t("newVisit.date")}
                  error={errors.visitDate}
                  required
                >
                  <FormInput
                    type="date"
                    value={visitDate}
                    onChange={(event) => setVisitDate(event.target.value)}
                    disabled={isSubmitting}
                    className="w-full"
                  />
                </FormField>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mt-6">
                <FormField
                  label={t("newVisit.chiefComplaint")}
                  error={errors.chiefComplaint}
                  required
                >
                  <FormTextarea
                    value={chiefComplaint}
                    onChange={(event) => setChiefComplaint(event.target.value)}
                    placeholder={t("newVisit.chiefComplaintPlaceholder")}
                    className="min-h-27.5 w-full"
                    disabled={isSubmitting}
                  />
                </FormField>
              <FormField label={t("newVisit.clinicalNotes")}>
                <FormTextarea
                  value={clinicalNotes}
                  onChange={(event) => setClinicalNotes(event.target.value)}
                  placeholder={t("newVisit.clinicalNotesPlaceholder")}
                  className="min-h-27.5 w-full"
                  disabled={isSubmitting}
                />
              </FormField>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="rounded-t-lg border-b border-gray-200 bg-gray-100 dark:bg-gray-700 p-4 dark:border-gray-700">
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
              <ToothIcon className="h-5 w-5 text-green-600" />
              {t("newVisit.treatmentRecording")}
            </h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <FormField label={t("newVisit.procedure")} className="flex-1">
                <Select
                  value={newProcedureName}
                  onChange={(e) => {
                    setNewProcedureName(e.target.value);
                  }}
                  className="cursor-pointer w-full"
                  disabled={isSubmitting}
                >
                  <option value="">{t("newVisit.selectProcedure")}</option>
                  {PROCEDURES.map((procedure, index) => (
                    <option key={index} value={procedure.name}>
                      {procedure.name} - {formatCurrency(procedure.price)}{" "}
                      {getCurrencySymbol(procedure.name)}
                    </option>
                  ))}
                </Select>
              </FormField>
              <Button
                type="button"
                onClick={addProcedure}
                disabled={isSubmitting || !newProcedureName}
                className="cursor-pointer"
              >
                {t("newPatient.addProcedure")}
              </Button>
            </div>

            {selectedProcedures.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {t("newPatient.noProceduresAdded")}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  {selectedProcedures.map((proc, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setActiveProcedureIndex(index)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        index === activeProcedureIndex
                          ? "border-l-4 border-l-green-500 border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20 dark:text-white"
                          : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                      }`}
                    >
                      <span>#{index + 1} {proc.procedureName}</span>
                      <span className="text-xs text-muted-foreground">
                        x{proc.numberOfProcedures}
                      </span>
                      {proc.selectedToothIds.length > 0 && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                          {proc.selectedToothIds.length} {t("newPatient.teeth")}
                        </span>
                      )}
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(event) => {
                          event.stopPropagation();
                          removeProcedure(index);
                        }}
                        className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
                      >
                        ×
                      </span>
                    </button>
                  ))}
                </div>

                <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <h4 className="text-base font-bold text-gray-900 dark:text-white">
                        {selectedProcedures[activeProcedureIndex]?.procedureName || t("newVisit.selectedProcedure")}
                      </h4>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(selectedProcedures[activeProcedureIndex]?.procedurePrice || 0)}{" "}
                        {getCurrencySymbol(selectedProcedures[activeProcedureIndex]?.procedureName || "")}
                      </span>
                      {selectedProcedures[activeProcedureIndex]?.selectedToothIds.length ? (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                          {selectedProcedures[activeProcedureIndex].selectedToothIds.length} {t("newPatient.teeth")}
                        </span>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProcedure(activeProcedureIndex)}
                      disabled={isSubmitting}
                      className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      {t("newVisit.remove")}
                    </Button>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField label={t("newPatient.procedureAdditionalNotes")}>
                        <FormInput
                          placeholder={t(
                            "newPatient.additionalNotesPlaceholder",
                            "Add procedure notes",
                          )}
                          value={selectedProcedures[activeProcedureIndex]?.additionalNotes ?? ""}
                          onChange={(e) =>
                            updateActiveProcedure(
                              "additionalNotes",
                              e.target.value,
                            )
                          }
                          disabled={isSubmitting}
                          className="w-full"
                        />
                      </FormField>
                      <FormField label={t("newVisit.numberOfProcedures")}>
                        <FormInput
                          type="number"
                          min={1}
                          value={selectedProcedures[activeProcedureIndex]?.numberOfProcedures ?? 1}
                          onChange={(e) =>
                            updateActiveProcedure(
                              "numberOfProcedures",
                              Math.max(parseInt(e.target.value, 10) || 1, 1),
                            )
                          }
                          disabled={isSubmitting}
                          className="w-full"
                        />
                      </FormField>
                    </div>

                    <div className="rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="px-4 pt-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {t("newPatient.dentalChart")}
                      </p>
                      <DentalChart
                        onToothSelect={handleSelectedToothChange}
                        onMeasurementChange={handleToothMeasurements}
                        selectedToothIds={selectedProcedures[activeProcedureIndex]?.selectedToothIds ?? []}
                        teethData={selectedProcedures[activeProcedureIndex]?.sealedTeeth ?? []}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="rounded-t-lg border-b border-gray-200 bg-gray-100 dark:bg-gray-700 p-4 dark:border-gray-700">
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
              <ImageIcon className="h-5 w-5 text-purple-600" />
              {t("newVisit.xray")}
            </h3>
          </div>
          <div className="p-6">
            <div
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-purple-300 bg-purple-50/50 p-8 text-center transition-all hover:border-purple-400 hover:bg-purple-100/50 dark:border-gray-600 dark:bg-gray-700/50"
              onClick={() => fileInputRef.current?.click()}
            >
              {xrayPreview ? (
                <div className="w-full space-y-4">
                  <img
                    src={xrayPreview}
                    alt="X-ray preview"
                    className="h-64 w-full rounded-lg border border-gray-200 object-contain dark:border-gray-700"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                      {xrayFile?.name}
                      {xrayFile?.size &&
                        ` (${(xrayFile.size / 1024).toFixed(2)} KB)`}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeXray();
                      }}
                      disabled={isSubmitting}
                    >
                      {t("newVisit.remove")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <ImageIcon className="h-14 w-14 text-purple-500" />
                  <p className="text-base font-medium text-gray-700 dark:text-gray-200">
                    {t("newVisit.uploadXray")}
                  </p>
                  <p className="text-sm">
                    {t("newVisit.dragAndDrop")} {t("newVisit.or")}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleXrayChange}
                    disabled={isSubmitting}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="rounded-t-lg border-b border-gray-200 bg-gray-100 dark:bg-gray-700 p-4 dark:border-gray-700">
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
              <BillingIcon className="h-5 w-5 text-amber-600" />
              {t("newVisit.billing")}
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1fr_340px]">
            <div className="space-y-4">
              {selectedProcedures.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/50">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("newPatient.noProceduresAdded")}
                  </p>
                </div>
              ) : (
                selectedProcedures.map((proc, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/50"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <BillingStatusIcon isActive={Boolean(proc.procedureName)} />
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {proc.procedureName || t("newVisit.selectedProcedure")}
                        </p>
                      </div>
                      <div className="relative w-36">
                        <FormInput
                          type="number"
                          readOnly
                          value={proc.procedurePrice || ""}
                          className="w-full text-right pr-10"
                          disabled={isSubmitting}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          {getCurrencySymbol(proc.procedureName)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/50">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <BillingStatusIcon isActive={selectedProcedures.length > 0} />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("newVisit.numberOfProcedures")}
                    </p>
                  </div>
                  <div className="text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                    {selectedProcedures.reduce((sum, p) => sum + (parseInt(p.numberOfProcedures.toString(), 10) || 0), 0)}
                  </div>
                </div>
              </div>
              <BillingRow
                iconActive={discountAmount > 0}
                label={t("newVisit.discount")}
                currency={currencySymbol}
                value={discount}
                placeholder={t("newPatient.discount")}
                error={errors.discount}
                onChange={(event) => setDiscount(event.target.value)}
                disabled={isSubmitting}
              />
              <BillingRow
                iconActive={paidAmountValue > 0}
                label={t("newVisit.paidAmount")}
                currency={currencySymbol}
                value={paidAmount}
                placeholder={t("newPatient.paidAmount")}
                error={errors.paidAmount}
                onChange={(event) => setPaidAmount(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="rounded-xl border-2 border-amber-200 bg-linear-to-b from-amber-50 to-orange-50 p-5 dark:border-gray-700 dark:from-gray-700/50 dark:to-gray-700/30">
              <div className="mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                  {t("newVisit.billingSummary")}
                </p>
              </div>
              <SummaryRow
                label={t("newVisit.subtotal")}
                value={formatCurrency(subtotal)}
                currency={currencySymbol}
              />
              <SummaryRow
                label={t("newVisit.discount")}
                value={formatCurrency(discountAmount)}
                currency={currencySymbol}
              />
              <SummaryRow
                label={t("newVisit.paidAmount")}
                value={formatCurrency(paidAmountValue)}
                currency={currencySymbol}
              />
              <div className="my-3 border-t border-amber-300 dark:border-gray-600" />
              <SummaryRow
                label={t("newVisit.totalDue")}
                value={formatCurrency(totalDue)}
                currency={currencySymbol}
                strong
              />
              <div className="mt-3 pt-3 border-t-2 border-amber-500" />
              <SummaryRow
                label={t("newVisit.outstanding")}
                value={formatCurrency(outstandingAmount)}
                currency={currencySymbol}
                strong
                danger
              />
            </div>
          </div>
        </section>
      </div>

      <div className="sticky bottom-0 -mx-6 flex justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(`/patients/${patientId}`)}
          disabled={isSubmitting}
        >
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("common.saving") : t("newVisit.saveVisit")}
        </Button>
      </div>
    </form>
    </>
  );
};

interface BillingRowProps {
  label: string;
  value: string;
  placeholder?: string;
  iconActive: boolean;
  currency?: string;
  error?: string;
  disabled?: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const BillingRow: React.FC<BillingRowProps> = ({
  label,
  value,
  placeholder,
  iconActive,
  currency,
  error,
  disabled,
  onChange,
}) => {
  const Icon = iconActive ? CheckCircleIcon : CrossCircleIcon;

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/50">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Icon className={iconActive ? "text-green-500" : "text-red-500"} />
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
        <div className="relative w-40">
          <FormInput
            type={currency ? "number" : "number"}
            value={value}
            placeholder={placeholder}
            onChange={onChange}
            disabled={disabled}
            className="w-full pr-12 text-right"
          />
          {currency && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {currency}
            </span>
          )}
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
};

interface SummaryRowProps {
  label: string;
  value: string;
  currency: string;
  strong?: boolean;
  danger?: boolean;
}

const SummaryRow: React.FC<SummaryRowProps> = ({
  label,
  value,
  currency,
  strong,
  danger,
}) => (
  <div className="flex items-center justify-between space-y-4">
    <p
      className={
        strong
          ? "text-sm font-bold text-gray-900 dark:text-white"
          : "text-sm text-gray-700 dark:text-gray-200"
      }
    >
      {label}
    </p>
    <p
      className={
        strong
          ? "text-xl font-bold text-primary dark:text-white"
          : "text-sm font-medium text-gray-900 dark:text-white"
      }
    >
      <span className={danger ? "text-red-600 dark:text-red-400" : undefined}>
        {value}
      </span>{" "}
      {currency}
    </p>
  </div>
);

export default NewVisit;
