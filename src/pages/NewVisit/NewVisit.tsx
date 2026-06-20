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
  TreatmentToothInput,
} from "../../types/ApiTypes";
import { usePatient } from "../../hooks/usePatients";
import { PROCEDURES } from "../../shared/constants/Procedures";
import PatientAvatarWithStatus from "../../components/patients/PatientAvatarWithStatus";
import { ReceiptPreviewModal } from "../../components/receipt/ReceiptPreviewModal";

const getTodayDateString = () => new Date().toISOString().split("T")[0];

const getCurrencySymbol = (procedureName: string): string => {
  const dollarProcedures = [
    "Zirconium Crown",
    "Orthodontics (Basic)",
    "Orthodontics (Standard)",
    "Implant Surgery Only (Standard)",
    "Implant Surgery Only (Premium)",
    "Bleaching",
  ];

  return dollarProcedures.includes(procedureName) ? "$" : "AFN";
};

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
  const [selectedProcedureName, setSelectedProcedureName] = useState("");
  const [procedureAdditionalNote, setProcedureAdditionalNote] = useState("");
  const [numberOfProcedures, setNumberOfProcedures] = useState(1);
  const [discount, setDiscount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [selectedToothIds, setSelectedToothIds] = useState<string[]>([]);
  const [treatmentTeeth, setTreatmentTeeth] = useState<TreatmentToothInput[]>(
    [],
  );
  const [sealedTeeth, setSealedTeeth] = useState<ToothData[]>([]);
  const [xrayFile, setXrayFile] = useState<File | null>(null);
  const [xrayPreview, setXrayPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptInvoiceId, setReceiptInvoiceId] = useState<string | null>(null);

  const selectedProcedure = PROCEDURES.find(
    (procedure) => procedure.name === selectedProcedureName,
  );

  const discountAmount = parseFloat(discount) || 0;
  const paidAmountValue = parseFloat(paidAmount) || 0;
  const subtotal =
    (selectedProcedure?.price ?? 0) * Math.max(numberOfProcedures, 0);
  const totalDue = Math.max(subtotal - discountAmount, 0);
  const outstandingAmount = Math.max(totalDue - paidAmountValue, 0);
  const currencySymbol = getCurrencySymbol(selectedProcedure?.name ?? "");

  const handleSelectedToothChange = (toothData?: ToothData) => {
    if (!toothData) return;

    setSelectedToothIds((prev) => {
      if (prev.includes(toothData.id)) {
        return prev.filter((id) => id !== toothData.id);
      }

      return [...prev, toothData.id];
    });

    setTreatmentTeeth((prev) => {
      const toothNumber = parseInt(toothData.id, 10);
      const toothQuadrant =
        toothData.quadrant || getToothQuadrant(toothData.id);

      if (prev.some((tooth) => tooth.tooth_number === toothNumber)) {
        return prev.filter((tooth) => tooth.tooth_number !== toothNumber);
      }

      return [
        ...prev,
        {
          tooth_number: toothNumber,
          tooth_quadrant: toothQuadrant,
        },
      ];
    });

    setSealedTeeth((prev) => {
      const next = [
        ...prev.filter((existing) => existing.id !== toothData.id),
        toothData,
      ];

      return next;
    });
  };

  const handleNumberChange = (
    value: string,
    onChange: (value: number) => void,
  ) => {
    const parsed = parseInt(value, 10);
    onChange(Number.isNaN(parsed) ? 0 : parsed);
  };

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
    const nextErrors: Record<string, string> = {};

    if (!patientId) {
      return false;
    }

    if (!visitDate) {
      nextErrors.visitDate = t("newVisit.errors.dateRequired");
    }

    if (!chiefComplaint.trim()) {
      nextErrors.chiefComplaint = t("newVisit.errors.chiefComplaintRequired");
    }

    if (selectedProcedureName && !selectedProcedure) {
      nextErrors.procedure = t("newVisit.errors.procedureRequired");
    }

    if (selectedProcedureName && numberOfProcedures < 1) {
      nextErrors.numberOfProcedures = t("newVisit.errors.quantityRequired");
    }

    if (discountAmount < 0) {
      nextErrors.discount = t("newVisit.errors.nonNegativeAmount");
    }

    if (paidAmountValue < 0) {
      nextErrors.paidAmount = t("newVisit.errors.nonNegativeAmount");
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
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

      if (selectedProcedureName && selectedProcedure) {
        const procedureInput: CreateProcedureInput = {
          visit_id: createdVisit.id,
          name: selectedProcedureName,
          additional_note: trimToNull(procedureAdditionalNote),
          procedure_price: selectedProcedure.price,
        };
        const createdProcedure = await api.procedures.create(procedureInput);
        const treatmentInput: CreateTreatmentRecordInput = {
          visit_id: createdVisit.id,
          procedure_id: createdProcedure.id,
          number_of_procedures: Math.max(numberOfProcedures, 1),
          treatment_teeth: treatmentTeeth.filter(
            (tooth) => tooth.tooth_number > 0 && tooth.tooth_quadrant.trim(),
          ),
        };

        treatmentRecord = await api.treatments.add(treatmentInput);
      }

      if (xrayFile) {
        try {
          await api.patients.upload_xray(
            patient.id,
            treatmentRecord?.id ?? null,
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
        queryKey: ["invoices", "visit", createdVisit.id],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["patients"],
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
        <LoadingSpinner size="lg" text="Loading..." />
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
                  {patient.address ? patient.address : "Address not provided"} •
                </span>
                <span>Registered since {registeredDate}</span>
              </div>
            </div>
          </div>

          {/* Right Side - Action Buttons */}
          <div className="flex items-center justify-center gap-3 mt-5">
            <Button
              variant="outline"
              onClick={() => navigate(`/patients/${patientId}`)}
            >
              View History
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
                    className="min-h-[110px] w-full"
                    disabled={isSubmitting}
                  />
                </FormField>
              <FormField label={t("newVisit.clinicalNotes")}>
                <FormTextarea
                  value={clinicalNotes}
                  onChange={(event) => setClinicalNotes(event.target.value)}
                  placeholder={t("newVisit.clinicalNotesPlaceholder")}
                  className="min-h-[110px] w-full"
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
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                label={t("newVisit.procedure")}
                error={errors.procedure}
              >
                <Select
                  value={selectedProcedureName}
                  onChange={(event) =>
                    setSelectedProcedureName(event.target.value)
                  }
                  disabled={isSubmitting}
                  className="w-full cursor-pointer"
                >
                  <option value="">{t("newVisit.selectProcedure")}</option>
                  {PROCEDURES.map((procedure) => (
                    <option key={procedure.name} value={procedure.name}>
                      {procedure.name} - {formatCurrency(procedure.price)}{" "}
                      {getCurrencySymbol(procedure.name)}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label={t("newPatient.procedureAdditionalNotes")}>
                <FormInput
                  value={procedureAdditionalNote}
                  onChange={(event) =>
                    setProcedureAdditionalNote(event.target.value)
                  }
                  placeholder={t(
                      "newPatient.additionalNotesPlaceholder",
                      "Add procedure notes",
                    )}
                  className="w-full"
                  disabled={isSubmitting}
                />
              </FormField>
              <FormField
                label={t("newVisit.numberOfProcedures")}
                error={errors.numberOfProcedures}
              >
                <FormInput
                  type="number"
                  min={1}
                  value={numberOfProcedures}
                  onChange={(event) =>
                    handleNumberChange(
                      event.target.value,
                      setNumberOfProcedures,
                    )
                  }
                  disabled={isSubmitting}
                  className="w-full"
                />
              </FormField>
            </div>

            <div className="mt-6">
              <DentalChart
                onToothSelect={handleSelectedToothChange}
                selectedToothIds={selectedToothIds}
                teethData={sealedTeeth}
              />
            </div>

            {selectedToothIds.length > 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                {selectedToothIds.length} {t("newVisit.selectedTeethLabel")}
              </p>
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
              <BillingRow
                iconActive={Boolean(selectedProcedure)}
                label={
                  selectedProcedure?.name || t("newVisit.selectedProcedure")
                }
                currency={currencySymbol}
                value={selectedProcedure?.price?.toString() ?? ""}
                onChange={() => {}}
                disabled
              />
              <BillingRow
                iconActive={numberOfProcedures > 0}
                label={t("newVisit.numberOfProcedures")}
                value={numberOfProcedures.toString()}
                onChange={(event) =>
                  handleNumberChange(event.target.value, setNumberOfProcedures)
                }
                disabled={isSubmitting}
              />
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

            <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-b from-amber-50 to-orange-50 p-5 dark:border-gray-700 dark:from-gray-700/50 dark:to-gray-700/30">
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
