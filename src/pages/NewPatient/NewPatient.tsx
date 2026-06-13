import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  PatientIcon,
  MedicalHistoryIcon,
  VisitDetailsIcon,
  ToothIcon,
  ImageIcon,
  BillingIcon,
  CheckCircleIcon,
} from "../../shared/icons/icons";
import { Button } from "../../components/ui";
import {
  FormField,
  FormInput,
  FormTextarea,
  Select,
} from "../../components/ui";
import DentalChart from "../../components/dental-chart/DentalChart";
import { isRTL } from "../../i18n";
import { ToothData } from "../../components/dental-chart/types";
import { PROCEDURES } from "../../shared/constants/Procedures";
import { toast } from "../../lib/toast-utils";
import { api } from "../../lib/api";
import { useProcedures } from "../../hooks/useVisits";
import type {
  CreatePatientInput,
} from "../../types/ApiTypes";
import { FormErrors, medicalConditions, PatientState } from "../../types/PatientFormTypes";
import { validatePatientForm } from "../../validation/patientValidation";

const NewPatient: React.FC = () => {
  const { t } = useTranslation();
  const { data: procedures = PROCEDURES } = useProcedures();
  const navigate = useNavigate();

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patient, setPatient] = useState<PatientState>({
    fullName: "",
    gender: "",
    phoneNumber: "",
    age: 0,
    address: "",
  });
  const [allergyInput, setAllergyInput] = useState("");
  const [medicationInput, setMedicationInput] = useState("");

  const [formData, setFormData] = useState({
    chiefComplaint: "",
    clinicalNotes: "",
    procedure: "",
    procedureValue: "",
    numberOfProcedures: "1",
    discount: "0",
    medicalConditions: {
      diabetes: false,
      hypertension: false,
      heartDisease: false,
      asthma: false,
      other: "",
    },
  });

  const [xrayFile, setXrayFile] = useState<File | null>(null);
  const [xrayPreview, setXrayPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedToothIds, setSelectedToothIds] = useState<string[]>([]);
  const [sealedTeeth, setSealedTeeth] = useState<ToothData[]>([]);
  // const [visits, setVisits] = useState<VisitsState[]>([]);
  // const [treatmentRecords, setTreatmentRecords] = useState<TreatmentRecordsState[]>([]);
  // const [treatmentTeeth, setTreatmentTeeth] = useState<TreatmentTeethState[]>([]);
  // const [invoice, setInvoice] = useState<InvoiceState>({
  //   invoiceNumber: "",
  //   subtotal: 0,
  //   discount: 0,
  //   totalAmount: 0,
  //   paidAmount: 0,
  //   outstandingAmount: 0,
  //   status: "Unpaid",
  // });
  // const [invoiceItems, setInvoiceItems] = useState<InvoiceItemsState[]>([]);
  // const [payments, setPayments] = useState<PaymentsState[]>([]);
  // const [xrays, setXrays] = useState<XraysState[]>([]);
  // const [appSettings, setAppSettings] = useState<AppSettingsState>({});
  // const [backups, setBackups] = useState<BackupsState[]>([]);
  // const [auditLogs, setAuditLogs] = useState<AuditLogState[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectedToothChange = (toothData?: ToothData) => {
    if (!toothData) return;
    setSelectedToothIds((prev) => {
      if (prev.includes(toothData.id)) {
        return prev.filter((id) => id !== toothData.id);
      }
      return [...prev, toothData.id];
    });
    setSealedTeeth((prev) => {
      const next = [
        ...prev.filter((existing) => existing.id !== toothData.id),
        toothData,
      ];
      return next;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat().format(Math.round(amount));
  };

  const formatCsvList = (value: string) => {
    return Array.from(
      new Set(
        value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    ).join(", ");
  };

  const handleAllergyInputChange = (value: string) => {
    setAllergyInput(value);
  };

  const handleMedicationInputChange = (value: string) => {
    setMedicationInput(value);
  };

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

  const procValue = parseFloat(formData.procedureValue) || 0;
  const numProc = parseInt(formData.numberOfProcedures) || 1;
  const discountAmount = parseFloat(formData.discount) || 0;
  const subtotal = procValue * numProc;
  const totalDue = subtotal - discountAmount;
  const currencySymbol = getCurrencySymbol(formData.procedure);

  const handleToothMeasurements = (toothId: string) => {
    setSealedTeeth((prev) => {
      const exists = prev.find((item) => item.id === toothId);
      if (exists) return prev;
      return [...prev, { id: toothId } as ToothData];
    });
  };

  const handleXrayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setXrayFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setXrayPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeXray = () => {
    setXrayFile(null);
    setXrayPreview(null);
  };

  const handleChange = (
    field: string,
    value: string | boolean | medicalConditions | string[],
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handlePatientChange = (field: string, value: string | boolean) => {
    setPatient((prev) => {
      if (field === "age") {
        return {
          ...prev,
          age: value === "" ? 0 : parseInt(value as string, 10),
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });

    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setXrayFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setXrayPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        alert("Please upload an image file");
      }
    }
  };

  const handlePatient = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePatientForm(patient, setErrors)) return;

    setIsSubmitting(true);
    try {
      const gender = patient.gender as CreatePatientInput["gender"];
      const allergiesCsv = formatCsvList(allergyInput);
      const medicationsCsv = formatCsvList(medicationInput);
      const input: CreatePatientInput = {
        full_name: patient.fullName.trim(),
        phone: patient.phoneNumber.trim(),
        age: patient.age,
        gender,
        address: patient.address?.trim() || null,
        allergies: allergiesCsv || null,
        medications: medicationsCsv || null,
      };

      const created = await api.patients.create(input);

      toast.success({ title: "Patient created successfully" });
      navigate(`/patients/${created.id}`);
    } catch (error) {
      toast.error({ title: "Failed to create patient" });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePatientAllergies = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleMedicalCondition = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handlePatientMedication = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleVisitDetails = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleProcedures = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-6">
      <div className="mb-6 flex justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/patients")}
              className="cursor-pointer"
            >
              {isRTL() ? (
                <ArrowLeftIcon className="rotate-180" />
              ) : (
                <ArrowLeftIcon />
              )}
            </Button>
            <h2 className="text-3xl font-bold text-primary dark:text-white">
              {t("nav.newPatient")}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1 ms-12">
            {t("newPatient.intake")}
          </p>
        </div>
        <div className="text-end text-sm">
          <p className="text-muted-foreground">
            {t("newPatient.date")}:{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {new Date().toISOString().split("T")[0]}
            </span>
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <div className="space-y-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
          <div className="border-b bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-t-lg p-4">
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
              <PatientIcon className="w-5 h-5" />
              {t("newPatient.personalInfo")}
            </h3>
          </div>
          <form
            className="space-y-4 px-4 pb-6"
            onSubmit={handlePatient}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label={t("newPatient.fullName")}
                error={errors.fullName}
              >
                <FormInput
                  placeholder={t(
                    "newPatient.fullNamePlaceholder",
                    "e.g. Ahmad Shah",
                  )}
                  onChange={(e) => handlePatientChange("fullName", e.target.value)}
                  value={patient.fullName}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField
                label={t("newPatient.phoneNumber")}
                error={errors.phoneNumber}
              >
                <FormInput
                  placeholder="+93 7XX XXX XXX"
                  onChange={(e) => handlePatientChange("phoneNumber", e.target.value)}
                  value={patient.phoneNumber}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label={t("newPatient.age")} error={errors.age}>
                <FormInput
                  type="number"
                  placeholder={t("newPatient.agePlaceholder", "Years")}
                  onChange={(e) => handlePatientChange("age", e.target.value)}
                  onFocus={(e) => { e.target.select(); }}
                  value={patient.age}
                  disabled={isSubmitting}
                />
              </FormField>
            </div>

            <div className="flex flex-col md:flex-row md:gap-4">
              <FormField label={t("newPatient.gender")} className="flex-1">
                <Select
                  value={patient.gender}
                  onChange={(e) => handlePatientChange("gender", e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="">-- {t("newPatient.selectGender")} --</option>
                  <option value="Male">{t("newPatient.male")}</option>
                  <option value="Female">{t("newPatient.female")}</option>
                  <option value="Other">{t("newPatient.other")}</option>
                </Select>
              </FormField>

              <FormField
                label={t("newPatient.address")}
                className="flex-2"
                error={errors.address}
              >
                <FormInput
                  placeholder={t(
                    "newPatient.addressPlaceholder",
                    "District, City, Province",
                  )}
                  onChange={(e) => handlePatientChange("address", e.target.value)}
                  value={patient.address}
                  disabled={isSubmitting}
                />
              </FormField>
            </div>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
            <div className="border-b bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-t-lg p-4">
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                <MedicalHistoryIcon className="w-5 h-5" />
                {t("newPatient.medicalHistory")}
              </h3>
            </div>
            <div className="space-y-4 px-4 pb-4">
            <form onSubmit={handlePatientAllergies}>
              <FormField label={t("newPatient.allergies")}>
                <FormInput
                  placeholder={t(
                    "newPatient.allergiesPlaceholder",
                    "e.g. Penicillin, Latex, Peanuts",
                  )}
                  onChange={(e) => handleAllergyInputChange(e.target.value)}
                  value={allergyInput}
                  disabled={isSubmitting}
                />
              </FormField>
            </form>

              <div className="space-y-3 my-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  {t("newPatient.medicalConditions")}
                </p>
              <form onSubmit={handleMedicalCondition}>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.medicalConditions.diabetes}
                      onChange={(e) =>
                        handleChange("medicalConditions", {
                          ...formData.medicalConditions,
                          diabetes: e.target.checked,
                        })
                      }
                      disabled={isSubmitting}
                    />
                    <span>{t("newPatient.diabetes")}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.medicalConditions.hypertension}
                      onChange={(e) =>
                        handleChange("medicalConditions", {
                          ...formData.medicalConditions,
                          hypertension: e.target.checked,
                        })
                      }
                      disabled={isSubmitting}
                    />
                    <span>{t("newPatient.hypertension")}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.medicalConditions.heartDisease}
                      onChange={(e) =>
                        handleChange("medicalConditions", {
                          ...formData.medicalConditions,
                          heartDisease: e.target.checked,
                        })
                      }
                      disabled={isSubmitting}
                    />
                    <span>{t("newPatient.heartDisease")}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.medicalConditions.asthma}
                      onChange={(e) =>
                        handleChange("medicalConditions", {
                          ...formData.medicalConditions,
                          asthma: e.target.checked,
                        })
                      }
                      disabled={isSubmitting}
                    />
                    <span>{t("newPatient.asthma")}</span>
                  </label>
                </div>
                <div className="flex items-center w-full">
                    <FormField label={t("newPatient.typeYours")} className="w-full">
                      <FormInput
                        placeholder={t(
                        "newPatient.medicalConditionPlaceholder",
                        "e.g. Epilepsy, Thyroid Issues, etc.",
                        )}
                        onChange={(e) =>
                        handleChange("medicalConditions", {
                          ...formData.medicalConditions,
                          other: e.target.value,
                        })
                      }
                        value={formData.medicalConditions.other || ""}
                        disabled={isSubmitting}
                      />
                    </FormField>
                  </div>
                </form>
              </div>
              <form onSubmit={handlePatientMedication}>
              <FormField label={t("newPatient.currentMedications")}>
                <FormTextarea
                  placeholder={t(
                    "newPatient.currentMedicationsPlaceholder",
                    "e.g. Metformin, Atorvastatin, Ibuprofen",
                  )}
                  onChange={(e) => handleMedicationInputChange(e.target.value)}
                  value={medicationInput}
                  className="h-20"
                  disabled={isSubmitting}
                />
              </FormField>
              </form>
            </div>
          </div>

          <div className="space-y-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
            <div className="border-b bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-t-lg p-4">
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                <VisitDetailsIcon className="w-5 h-5" />
                {t("newPatient.visitDetails")}
              </h3>
            </div>
            <form onSubmit={handleVisitDetails} className="space-y-4 px-4 pb-4">
              <FormField label={t("newPatient.chiefComplaint")}>
                <FormTextarea
                  placeholder={t("newPatient.chiefComplaintPlaceholder")}
                  onChange={(e) =>
                    handleChange("chiefComplaint", e.target.value)
                  }
                  value={formData.chiefComplaint}
                  className="h-20"
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label={t("newPatient.clinicalNotes")}>
                <FormTextarea
                  placeholder={t("newPatient.clinicalNotesPlaceholder")}
                  onChange={(e) =>
                    handleChange("clinicalNotes", e.target.value)
                  }
                  value={formData.clinicalNotes}
                  className="h-20"
                  disabled={isSubmitting}
                />
              </FormField>
            </form>
          </div>
        </div>

        <div className="space-y-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
          <div className="border-b bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-t-lg p-4">
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
              <ToothIcon className="w-5 h-5" />
              {t("newPatient.treatmentRecording")}
            </h3>
          </div>
          <div className="flex flex-col md:flex-row gap-6 px-4 pb-4">
            <div className="md:col-span-2">
              <DentalChart
                onToothSelect={handleSelectedToothChange}
                onMeasurementChange={handleToothMeasurements}
                selectedToothIds={selectedToothIds}
                teethData={sealedTeeth}
              />
            </div>

            <div className="space-y-4 flex-2">
            <form onSubmit={handleProcedures}>
              <FormField label={t("newPatient.procedure")}>
                <Select
                  value={formData.procedure}
                  onChange={(e) => {
                    const selectedProcedureName = e.target.value;
                    const selectedProcedure = procedures.find(
                      (p) => p.name === selectedProcedureName,
                    );
                    setFormData((prev) => ({
                      ...prev,
                      procedure: selectedProcedureName,
                      procedureValue: selectedProcedure
                        ? selectedProcedure.price.toString()
                        : "",
                    }));
                  }}
                  className="cursor-pointer"
                  disabled={isSubmitting}
                >
                  <option value="">{t("newPatient.selectProcedure")}</option>
                  {procedures.map((procedure) => (
                    <option key={procedure.name} value={procedure.name}>
                      {procedure.name} - {procedure.price}{" "}
                      {getCurrencySymbol(procedure.name)}
                    </option>
                  ))}
                </Select>
              </FormField>
            </form>

              <FormField label={t("newPatient.xray")}>
                <div
                  className={`border border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
                    isDragging
                      ? "border-primary bg-primary/5 dark:bg-primary/10"
                      : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {xrayPreview ? (
                    <div className="space-y-4">
                      <img
                        src={xrayPreview}
                        alt="X-ray preview"
                        className="max-w-full h-96 rounded-lg border border-gray-200 dark:border-gray-700"
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {xrayFile?.name}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={removeXray}
                          disabled={isSubmitting}
                        >
                          {t("newPatient.remove")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {t("newPatient.uploadXray")}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-300">
                        {t("newPatient.dragAndDrop")} {t("newPatient.or")}
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
              </FormField>
            </div>
          </div>
        </div>

        <div className="space-y-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
          <div className="border-b bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-t-lg p-4">
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
              <BillingIcon className="w-5 h-5" />
              {t("newPatient.billing")}
            </h3>
          </div>
          <div className="flex flex-col md:flex-row md:gap-6 px-4 pb-4">
            <div className="space-y-4 flex-4">
              <div className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formData.procedure || t("newPatient.selectedProcedure")}
                    </p>
                  </div>
                  <div className="relative w-40">
                    <FormInput
                      type="number"
                      placeholder={t(
                        "newPatient.procedureValuePlaceholder",
                        "Enter Value",
                      )}
                      onChange={(e) =>
                        handleChange("procedureValue", e.target.value)
                      }
                      value={formData.procedureValue || ""}
                      className="w-full text-right pr-12"
                      disabled={isSubmitting}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                      {currencySymbol}
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t("newPatient.numberOfProcedures")}
                    </p>
                  </div>
                  <FormInput
                    type="number"
                    placeholder={t(
                      "newPatient.numberOfProceduresPlaceholder",
                      "Enter Value",
                    )}
                    onChange={(e) =>
                      handleChange("numberOfProcedures", e.target.value)
                    }
                    value={formData.numberOfProcedures || ""}
                    className="w-28 mr-12"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t("newPatient.discount")}
                    </p>
                  </div>
                  <div className="relative w-40">
                    <FormInput
                      type="number"
                      placeholder={t(
                        "newPatient.discountPlaceholder",
                        "Enter Value",
                      )}
                      onChange={(e) => handleChange("discount", e.target.value)}
                      value={formData.discount || ""}
                      className="w-full text-right pr-12"
                      disabled={isSubmitting}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                      {currencySymbol}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 flex-2">
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-blue-100 dark:bg-gray-700/50 h-full flex flex-col justify-center gap-2">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    {t("newPatient.subtotal")}
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(subtotal)} {currencySymbol}
                  </p>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    {t("newPatient.discount")}
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(discountAmount)} {currencySymbol}
                  </p>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-300 dark:border-gray-600">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {t("newPatient.totalDue")}
                  </p>
                  <p className="text-xl font-bold text-primary dark:text-white">
                    {formatCurrency(totalDue)} {currencySymbol}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 py-6 px-4 border-t border-gray-200 dark:border-gray-700 my-6 bg-white dark:bg-gray-800">
          <Button
            variant="outline"
            onClick={() => navigate("/patients")}
            className="px-6 py-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            disabled={isSubmitting}
          >
            {t("newPatient.discardDraft")}
          </Button>
          <Button
            variant="default"
            type="button"
            onClick={handlePatient}
            className="px-6 py-2 bg-primary hover:bg-primary/90 text-white transition-colors cursor-pointer"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? t("common.saving")
              : t("newPatient.saveAndPrintInvoice")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewPatient;
