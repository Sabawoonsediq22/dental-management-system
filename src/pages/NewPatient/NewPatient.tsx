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
import type { CreatePatientInput } from "../../types/ApiTypes";
import {
  FormErrors,
  medicalConditions,
  PatientProcedure,
  Patient,
  PatientVisit,
  TreatmentRecord,
  TreatmentTooth,
} from "../../types/PatientFormTypes";
import { validatePatientForm } from "../../validation/patientValidation";

/**
 * NewPatient page collects the complete intake record for a new dental patient.
 *
 * The form combines patient demographics, medical history, visit notes, dental
 * chart selections, X-ray upload, treatment recording, and billing summary into
 * a single API payload before creating the patient and navigating to the detail
 * page.
 */
const NewPatient: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Tracks validation messages for required patient fields and submission state.
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Core patient demographics sent to the create-patient API endpoint.
  const [patient, setPatient] = useState<Patient>({
    fullName: "",
    gender: "",
    phoneNumber: "",
    age: 0,
    address: "",
  });

  // Medical history inputs are normalized into comma-separated strings before submission.
  const [allergyInput, setAllergyInput] = useState("");
  const [medicationInput, setMedicationInput] = useState("");
  const [medicalConditions, setMedicalConditions] = useState<medicalConditions>(
    {
      diabetes: false,
      hypertension: false,
      heartDisease: false,
      asthma: false,
      other: "",
    },
  );

  // Visit details and optional discount are kept separate from patient demographics.
  const [patientVisit, setPatientVisit] = useState<PatientVisit>({
    patientId: "",
    visitDate: new Date().toISOString().split("T")[0],
    chiefComplaint: "",
    clinicalNotes: "",
    status: "Open",
  });

  // Treatment and billing state are combined with selected teeth when creating the record.
  const [patientProcedure, setPatientProcedure] = useState<PatientProcedure>({
    procedureName: "",
    additionalNotes: "",
    procedurePrice: 0,
  });
  const [treatmentRecord, setTreatmentRecord] = useState<TreatmentRecord>({
    visitId: "",
    procedureId: "",
    numberOfProcedures: 1,
  });
  const [treatmentTeeth, setTreatmentTeeth] = useState<TreatmentTooth[]>([]);

  // X-ray, drag-drop, and dental chart state are independent from the main patient form.
  const [xrayFile, setXrayFile] = useState<File | null>(null);
  const [xrayPreview, setXrayPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedToothIds, setSelectedToothIds] = useState<string[]>([]);
  const [sealedTeeth, setSealedTeeth] = useState<ToothData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Updates the dental chart selection and keeps the tooth state used for API
   * submission in sync with the visual chart state.
   *
   * The same tooth can be represented by three state sources: selectedToothIds
   * for visual highlighting, treatmentTeeth for API payload generation, and
   * sealedTeeth for DentalChart measurement data.
   */
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
      // Use the quadrant from the chart when available; otherwise derive it from the FDI tooth number.
      const toothQuadrant =
        toothData.quadrant || getToothQuadrant(toothData.id);

      // Keep treatment teeth unique so toggling the same tooth removes it instead of duplicating it.
      if (prev.some((tooth) => tooth.toothNumber === toothNumber)) {
        return prev.filter((tooth) => tooth.toothNumber !== toothNumber);
      }

      return [
        ...prev,
        {
          treatmentRecordId: "",
          toothNumber,
          toothQuadrant,
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

  /**
   * Formats numeric currency amounts without decimal places for compact billing display.
   */
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat().format(Math.round(amount));
  };

  /**
   * Converts a user-entered comma-separated list into a trimmed, deduplicated CSV string.
   */
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

  /**
   * Maps a two-digit FDI tooth number to the dental quadrant used by the API.
   */
  const getToothQuadrant = (toothId: string) => {
    const fdiNumber = parseInt(toothId, 10);

    if (fdiNumber >= 11 && fdiNumber <= 17) return "Upper Right";
    if (fdiNumber >= 21 && fdiNumber <= 27) return "Upper Left";
    if (fdiNumber >= 31 && fdiNumber <= 37) return "Lower Left";
    if (fdiNumber >= 41 && fdiNumber <= 47) return "Lower Right";

    return "";
  };

  /**
   * Filters selected teeth into the snake_case payload shape expected by the API.
   */
  const getTreatmentTeethInput = () => {
    return treatmentTeeth
      .filter((tooth) => tooth.toothNumber > 0 && tooth.toothQuadrant.trim())
      .map((tooth) => ({
        tooth_number: tooth.toothNumber,
        tooth_quadrant: tooth.toothQuadrant.trim(),
      }));
  };

  /**
   * Builds the medical condition list from checkbox selections and the custom "other" field.
   */
  const getSelectedMedicalConditions = () => {
    const labels: Record<string, string> = {
      diabetes: "Diabetes",
      hypertension: "Hypertension",
      heartDisease: "Heart Disease",
      asthma: "Asthma",
    };

    // Convert checked medical condition keys to display names for the patient record.
    const selectedConditions = Object.entries(medicalConditions)
      .filter(([key, value]) => key !== "other" && value === true)
      .map(([key]) => labels[key] ?? key);

    // Preserve custom conditions separately because the checkbox keys only cover common cases.
    const otherCondition = medicalConditions.other?.trim();

    if (otherCondition) {
      selectedConditions.push(otherCondition);
    }

    return Array.from(new Set(selectedConditions));
  };

  /**
   * Stores raw allergy text before it is normalized to CSV during submission.
   */
  const handleAllergyInputChange = (value: string) => {
    setAllergyInput(value);
  };

  /**
   * Stores raw medication text before it is normalized to CSV during submission.
   */
  const handleMedicationInputChange = (value: string) => {
    setMedicationInput(value);
  };

  /**
   * Updates any visit detail field using a dynamic key from the PatientVisit type.
   */
  const handlePatientVisitChange = (
    field: keyof PatientVisit,
    value: string | number,
  ) => {
    setPatientVisit((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * Updates any treatment procedure field using a dynamic key from the PatientProcedure type.
   */
  const handlePatientProcedureChange = (
    field: keyof PatientProcedure,
    value: string | number,
  ) => {
    setPatientProcedure((prev) => ({
      ...prev,
      [field]: value,
    }));
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

  const procValue = parseFloat(patientProcedure.procedurePrice.toString()) || 0;
  const numProc = parseInt(treatmentRecord.numberOfProcedures.toString()) || 1;
  const discountAmount =
    parseFloat(patientVisit.discount?.toString() || "0") || 0;
  const subtotal = procValue * numProc;
  const totalDue = subtotal - discountAmount;
  const currencySymbol = getCurrencySymbol(patientProcedure.procedureName);

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

  const fileToUint8Array = (file: File): Promise<number[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const buffer = reader.result as ArrayBuffer;
        const uint8 = new Uint8Array(buffer);
        resolve(Array.from(uint8));
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleTreatmentRecordChange = (
    field: keyof TreatmentRecord,
    value: string | number,
  ) => {
    setTreatmentRecord((prev) => ({
      ...prev,
      [field]: value,
    }));
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
      const selectedMedicalConditions = getSelectedMedicalConditions();
      const treatmentTeethInput = getTreatmentTeethInput();
      const input: CreatePatientInput = {
        full_name: patient.fullName.trim(),
        phone: patient.phoneNumber.trim(),
        age: patient.age,
        gender,
        address: patient.address?.trim() || null,
        allergies: allergiesCsv || null,
        medications: medicationsCsv || null,
        medical_conditions:
          selectedMedicalConditions.length > 0
            ? selectedMedicalConditions
            : null,
        visit_date: patientVisit.visitDate || null,
        chief_complaint: patientVisit.chiefComplaint.trim() || null,
        clinical_notes: patientVisit.clinicalNotes.trim() || null,
        procedure_name: patientProcedure.procedureName.trim() || null,
        procedure_additional_note:
          patientProcedure.additionalNotes?.trim() || null,
        procedure_price:
          patientProcedure.procedurePrice > 0
            ? patientProcedure.procedurePrice
            : null,
        number_of_procedures:
          parseInt(treatmentRecord.numberOfProcedures.toString(), 10) || 1,
        treatment_teeth:
          treatmentTeethInput.length > 0 ? treatmentTeethInput : null,
      };

      const created = await api.patients.create(input);

      if (xrayFile && created.id) {
        try {
          if (!api.patients.upload_xray) {
            throw new Error("upload_xray command is not available");
          }
          const bytes = await fileToUint8Array(xrayFile);
          await api.patients.upload_xray(created.id, xrayFile.name, bytes);
        } catch (xrayError) {
          console.error("X-ray upload failed:", xrayError);
          toast.error({
            title: "X-ray upload failed",
            description: String(xrayError),
          });
        }
      }

      toast.success({ title: "Patient added successfully" });
      navigate(`/patients/${created.id}`);
    } catch (error) {
      toast.error({ title: "Failed to add patient" });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handlePatient} className="space-y-6">
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
        <section className="space-y-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
          <div className="border-b bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-t-lg p-4">
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
              <PatientIcon className="w-5 h-5" />
              {t("newPatient.personalInfo")}
            </h3>
          </div>
          <div className="space-y-4 px-4 pb-6">
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
                  onChange={(e) =>
                    handlePatientChange("fullName", e.target.value)
                  }
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
                  onChange={(e) =>
                    handlePatientChange("phoneNumber", e.target.value)
                  }
                  value={patient.phoneNumber}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label={t("newPatient.age")} error={errors.age}>
                <FormInput
                  type="number"
                  placeholder={t("newPatient.agePlaceholder", "Years")}
                  onChange={(e) => handlePatientChange("age", e.target.value)}
                  onFocus={(e) => {
                    e.target.select();
                  }}
                  value={patient.age}
                  disabled={isSubmitting}
                />
              </FormField>
            </div>

            <div className="flex flex-col md:flex-row md:gap-4">
              <FormField label={t("newPatient.gender")} className="flex-1">
                <Select
                  value={patient.gender}
                  onChange={(e) =>
                    handlePatientChange("gender", e.target.value)
                  }
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
                  onChange={(e) =>
                    handlePatientChange("address", e.target.value)
                  }
                  value={patient.address}
                  disabled={isSubmitting}
                />
              </FormField>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="space-y-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
            <div className="border-b bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-t-lg p-4">
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                <MedicalHistoryIcon className="w-5 h-5" />
                {t("newPatient.medicalHistory")}
              </h3>
            </div>
            <div className="space-y-4 px-4 pb-4">
              <div>
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
              </div>

              <div className="space-y-3 my-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  {t("newPatient.medicalConditions")}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={medicalConditions.diabetes}
                      onChange={(e) =>
                        setMedicalConditions({
                          ...medicalConditions,
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
                      checked={medicalConditions.hypertension}
                      onChange={(e) =>
                        setMedicalConditions({
                          ...medicalConditions,
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
                      checked={medicalConditions.heartDisease}
                      onChange={(e) =>
                        setMedicalConditions({
                          ...medicalConditions,
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
                      checked={medicalConditions.asthma}
                      onChange={(e) =>
                        setMedicalConditions({
                          ...medicalConditions,
                          asthma: e.target.checked,
                        })
                      }
                      disabled={isSubmitting}
                    />
                    <span>{t("newPatient.asthma")}</span>
                  </label>
                </div>
                <div className="flex items-center w-full">
                  <FormField
                    label={t("newPatient.typeYours")}
                    className="w-full"
                  >
                    <FormInput
                      placeholder={t(
                        "newPatient.medicalConditionPlaceholder",
                        "e.g. Epilepsy, Thyroid Issues, etc.",
                      )}
                      onChange={(e) =>
                        setMedicalConditions({
                          ...medicalConditions,
                          other: e.target.value,
                        })
                      }
                      value={medicalConditions.other || ""}
                      disabled={isSubmitting}
                    />
                  </FormField>
                </div>
              </div>
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
            </div>
          </section>

          <section className="space-y-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
            <div className="border-b bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-t-lg p-4">
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                <VisitDetailsIcon className="w-5 h-5" />
                {t("newPatient.visitDetails")}
              </h3>
            </div>
            <div className="space-y-4 px-4 pb-4">
              <FormField label={t("newPatient.chiefComplaint")}>
                <FormTextarea
                  placeholder={t("newPatient.chiefComplaintPlaceholder")}
                  onChange={(e) =>
                    handlePatientVisitChange("chiefComplaint", e.target.value)
                  }
                  value={patientVisit.chiefComplaint}
                  className="h-20"
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label={t("newPatient.clinicalNotes")}>
                <FormTextarea
                  placeholder={t("newPatient.clinicalNotesPlaceholder")}
                  onChange={(e) =>
                    handlePatientVisitChange("clinicalNotes", e.target.value)
                  }
                  value={patientVisit.clinicalNotes}
                  className="h-20"
                  disabled={isSubmitting}
                />
              </FormField>
            </div>
          </section>
        </div>

        <section className="space-y-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
          <div className="border-b bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-t-lg p-4">
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
              <ToothIcon className="w-5 h-5" />
              {t("newPatient.treatmentRecording")}
            </h3>
          </div>
          <div className="flex flex-col md:flex-row gap-6 px-4 pb-4">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:gap-4">
                <FormField label={t("newPatient.procedure")} className="flex-1">
                  <Select
                    value={patientProcedure.procedureName}
                    onChange={(e) => {
                      const selectedProcedureName = e.target.value;
                      const selectedProcedure = PROCEDURES.find(
                        (p) => p.name === selectedProcedureName,
                      );
                      setPatientProcedure((prev) => ({
                        ...prev,
                        procedureName: selectedProcedureName,
                        procedurePrice: selectedProcedure?.price ?? 0,
                      }));
                    }}
                    className="cursor-pointer"
                    disabled={isSubmitting}
                  >
                    <option value="">{t("newPatient.selectProcedure")}</option>
                    {PROCEDURES.map((procedure, index) => (
                      <option key={index} value={procedure.name}>
                        {procedure.name} - {procedure.price}{" "}
                        {getCurrencySymbol(procedure.name)}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField className="flex-1">
                  <FormInput
                    placeholder={t(
                      "newPatient.additionalNotesPlaceholder",
                      "Add procedure notes",
                    )}
                    onChange={(e) =>
                      handlePatientProcedureChange(
                        "additionalNotes",
                        e.target.value,
                      )
                    }
                    value={patientProcedure.additionalNotes ?? ""}
                    disabled={isSubmitting}
                  />
                </FormField>
              </div>
              <div className="">
                <DentalChart
                  onToothSelect={handleSelectedToothChange}
                  onMeasurementChange={handleToothMeasurements}
                  selectedToothIds={selectedToothIds}
                  teethData={sealedTeeth}
                />
              </div>
            </div>

            <div className="flex-2">
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
                        className="max-w-full h-80 rounded-lg border border-gray-200 dark:border-gray-700"
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
                          className="cursor-pointer"
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
        </section>

        <section className="space-y-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
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
                      {patientProcedure.procedureName ||
                        t("newPatient.selectedProcedure")}
                    </p>
                  </div>
                  <div className="relative w-40">
                    <FormInput
                      type="number"
                      readOnly
                      placeholder={t(
                        "newPatient.procedureValuePlaceholder",
                        "Enter Value",
                      )}
                      onChange={(e) =>
                        handlePatientProcedureChange(
                          "procedurePrice",
                          e.target.value,
                        )
                      }
                      value={patientProcedure.procedurePrice || ""}
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
                      handleTreatmentRecordChange(
                        "numberOfProcedures",
                        e.target.value,
                      )
                    }
                    value={treatmentRecord.numberOfProcedures?.toString() || ""}
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
                      onChange={(e) =>
                        handlePatientVisitChange("discount", e.target.value)
                      }
                      value={""}
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
        </section>

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
            type="submit"
            className="px-6 py-2 bg-primary hover:bg-primary/90 text-white transition-colors cursor-pointer"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? t("common.saving")
              : t("newPatient.saveAndPrintInvoice")}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default NewPatient;
