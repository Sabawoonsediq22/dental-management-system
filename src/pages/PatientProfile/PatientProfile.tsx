import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Modal, LoadingSpinner } from "../../components/ui";
import { usePatient, usePatientMedicalInfo, usePatientStatistics, useUpdatePatient, useDeletePatient, useUpdatePatientMedicalInfo } from "../../hooks/usePatients";
import { usePatientTreatmentHistory, useUpdateVisitStatus } from "../../hooks/useVisits";
import { useQueryClient } from "@tanstack/react-query";
import { AllergyAlert, TreatmentEntry } from "../../types/PatientTypes";
import AllergiesMedicalAlertsCard from "../../components/patients/AllergiesMedicalAlertsCard";
import TreatmentHistoryTimeline from "../../components/patients/TreatmentHistoryTimeline";
import PatientAvatarWithStatus from "../../components/patients/PatientAvatarWithStatus";
import StatisticsCard from "../../components/patients/StatisticsCard";
import PersonalDetailsCard from "../../components/patients/PersonalDetailsCard";
import { PatientIcon, PhoneIcon, HomeIcon, PlusIcon, DeleteIcon, LocationIcon } from "../../shared/icons/icons";
import { toast } from "sonner";
import type { PatientVisitWithTreatments } from "../../types/ApiTypes";
import i18n from "../../i18n";

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString(i18n.language === "ps" ? "en-US" : i18n.language, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const parseCsv = (value: string): string[] => Array.from(
  new Set(
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  ),
);

const formatCsv = (values: string[]): string => values.join(", ");

const toTreatmentEntries = (visits: PatientVisitWithTreatments[]): TreatmentEntry[] => {
  const entries: TreatmentEntry[] = [];
  
  visits.forEach((visit) => {
    if (visit.procedures.length === 0) return;

    visit.procedures.forEach((procedure, procedureIndex) => {
      const procedureEntry: TreatmentEntry = {
        id: `${visit.visit_id}-procedure-${procedureIndex}`,
        visitId: visit.visit_id,
        title: procedure.procedure_name,
        tooth_number: procedure.teeth.length > 0 ? procedure.teeth[0].tooth_number : undefined,
        date: visit.visit_date,
        time: procedure.performed_at || visit.visit_date,
        cost: procedure.total_price,
        status: visit.status === "Open" || visit.status === "Completed" || visit.status === "Cancelled"
          ? visit.status
          : "Open",
        notes: visit.clinical_notes || procedure.procedure_additional_note || undefined,
        procedures: [{
          name: procedure.procedure_name,
          additional_note: procedure.procedure_additional_note ?? undefined,
          quantity: procedure.number_of_procedures,
          unit_price: procedure.unit_price,
          total_price: procedure.total_price,
          tooth_numbers: procedure.teeth.map((tooth) => tooth.tooth_number),
        }],
        images: procedure.xrays && procedure.xrays.length > 0 ? [...procedure.xrays] : undefined,
      };

      entries.push(procedureEntry);
    });
  });

  return entries;
};

const PatientProfile: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const patientQuery = usePatient(id || "");
  const medicalInfoQuery = usePatientMedicalInfo(id || "");
  const statisticsQuery = usePatientStatistics(id || "");
  const treatmentHistoryQuery = usePatientTreatmentHistory(id || "");
  const updatePatientMutation = useUpdatePatient();
  const deletePatientMutation = useDeletePatient();

  const patient = patientQuery.data;
  const medicalInfo = medicalInfoQuery.data;
  const statistics = statisticsQuery.data;
  const treatmentHistory = toTreatmentEntries(treatmentHistoryQuery.data ?? []);

  const lastVisitProcedure = React.useMemo(() => {
    if (!treatmentHistory || treatmentHistory.length === 0) return null;
    const sorted = [...treatmentHistory].sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.time.localeCompare(a.time);
    });
    const latestEntry = sorted[0];
    if (!latestEntry.procedures || latestEntry.procedures.length === 0) return null;
    return latestEntry.procedures[0].name;
  }, [treatmentHistory]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAllergiesModal, setShowAllergiesModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    full_name: "",
    phone: "",
    age: 0,
    gender: "Male" as "Male" | "Female" | "Other",
    address: "",
  });
  const [allergiesFormData, setAllergiesFormData] = useState({
    allergies: "",
    medical_conditions: "",
    medications: "",
  });

  React.useEffect(() => {
    if (patient) {
      setEditFormData({
        full_name: patient.full_name,
        phone: patient.phone,
        age: patient.age,
        gender: patient.gender,
        address: patient.address || "",
      });
    }
    if (medicalInfo) {
      setAllergiesFormData({
        allergies: medicalInfo.allergies?.join(", ") || "",
        medical_conditions: medicalInfo.medical_conditions?.join(", ") || "",
        medications: medicalInfo.medications?.join(", ") || "",
      });
    }
  }, [patient, medicalInfo]);

  const handleEditPersonalInfo = () => {
    setShowEditModal(true);
  };

  const handleSavePersonalInfo = () => {
    if (patient) {
      updatePatientMutation.mutate({
        id: patient.id,
        input: {
          full_name: editFormData.full_name,
          phone: editFormData.phone,
          age: editFormData.age,
          gender: editFormData.gender,
          address: editFormData.address || null,
        },
      });
    }
    setShowEditModal(false);
  };

  const handleDeletePatient = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (patient) {
      deletePatientMutation.mutate(patient.id, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["patients"] });
          navigate("/patients");
          toast.success(t("patientProfile.notifications.deleted", "Patient deleted successfully"));
        },
      });
    }
    setShowDeleteConfirm(false);
  };

  const handleNewVisit = () => {
    if (patient) {
      navigate(`/patients/${patient.id}/visits/new`);
    }
  };

  const handleViewAllVisits = () => {
    if (patient) {
      navigate(`/patients/${patient.id}/visits`);
    }
  };

  const updateMedicalInfoMutation = useUpdatePatientMedicalInfo();
  const updateVisitStatusMutation = useUpdateVisitStatus();

  const handleSaveAllergies = () => {
    if (!patient) return;

    const allergiesArray = parseCsv(allergiesFormData.allergies);
    const medicationsArray = parseCsv(allergiesFormData.medications);
    const conditionsArray = parseCsv(allergiesFormData.medical_conditions);
    const medicalInfoKey = ["patients", patient.id, "medical-info"];
    const optimisticMedicalInfo = {
      allergies: allergiesArray,
      medications: medicationsArray,
      medical_conditions: conditionsArray,
    };

    updateMedicalInfoMutation.mutate({
      patient_id: patient.id,
      input: {
        allergies: allergiesArray.length > 0 ? formatCsv(allergiesArray) : null,
        medications: medicationsArray.length > 0 ? formatCsv(medicationsArray) : null,
        medical_conditions: conditionsArray.length > 0 ? conditionsArray : null,
      },
    }, {
      onSuccess: () => {
        queryClient.setQueryData(medicalInfoKey, optimisticMedicalInfo);
        queryClient.invalidateQueries({ queryKey: medicalInfoKey });
        setAllergiesFormData({
          allergies: formatCsv(allergiesArray),
          medical_conditions: formatCsv(conditionsArray),
          medications: formatCsv(medicationsArray),
        });
        setShowAllergiesModal(false);
        toast.success(t("patientProfile.notifications.medicalUpdated", "Medical information updated successfully"));
      },
      onError: (error) => {
        toast.error(`${t("patientProfile.notifications.medicalUpdateError", "Failed to update medical information")}: ${String(error)}`);
      },
    });
  };

  const handleStatusChange = (visitId: string, newStatus: string) => {
    const treatmentHistoryKey = ["treatment-history", patient?.id];
    queryClient.setQueryData(treatmentHistoryKey, (old: any) => {
      if (!old) return old;
      return old.map((visit: any) =>
        visit.visit_id === visitId ? { ...visit, status: newStatus } : visit
      );
    });

    updateVisitStatusMutation.mutate({ id: visitId, status: newStatus as "Open" | "Completed" | "Cancelled" }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: treatmentHistoryKey, refetchType: "all" });
        queryClient.invalidateQueries({ queryKey: ["patients", patient?.id, "statistics"], refetchType: "all" });
        toast.success(t("patientProfile.notifications.statusUpdated", "Treatment status updated to {{status}}", { status: newStatus }));
      },
      onError: (error) => {
        queryClient.invalidateQueries({ queryKey: treatmentHistoryKey, refetchType: "all" });
        toast.error(`${t("patientProfile.notifications.statusUpdateError", "Failed to update status")}: ${String(error)}`);
      },
    });
  };

  React.useEffect(() => {
    if ((patientQuery.error || !patient) && !patientQuery.isLoading) {
      navigate("/patients");
    }
  }, [patientQuery.error, patient, patientQuery.isLoading, navigate]);

  if (patientQuery.isLoading || medicalInfoQuery.isLoading || statisticsQuery.isLoading || treatmentHistoryQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" text={t("common.loading", "Loading...")} />
      </div>
    );
  }

  if (patientQuery.error || !patient) {
    return null;
  }

  if (treatmentHistoryQuery.error) {
    return (
      toast.error(`${t("patientProfile.notifications.treatmentHistoryError", "Failed to load treatment history")}: ${String(treatmentHistoryQuery.error)}`)
    );
  }

  const personalDetails = [
    {
      label: t("patientProfile.ageGender"),
      value: `${patient.age} ${t("patientProfile.years")} • ${t(`patients.filters.${patient.gender.toLowerCase()}`)}`,
      icon: (
        <PatientIcon className="w-5 h-5" />
      ),
    },
    {
      label: t("patientProfile.phoneNumber"),
      value: patient.phone,
      icon: (
        <PhoneIcon className="w-5 h-5" />
      ),
    },
    {
      label: t("patientProfile.homeAddress"),
      value: patient.address || t("patientProfile.addressNotProvided"),
      icon: (
        <HomeIcon className="w-5 h-5" />
      ),
    },
  ];

  const allergiesAlerts: AllergyAlert[] = [
    { label: t("patientProfile.allergiesLabel"), value: medicalInfo?.allergies?.join(", ") || t("patientProfile.noneRecorded") },
    { label: t("patientProfile.medicalConditionsLabel"), value: medicalInfo?.medical_conditions?.join(", ") || t("patientProfile.noneRecorded") },
    { label: t("patientProfile.medicationsLabel"), value: medicalInfo?.medications?.join(", ") || t("patientProfile.noneRecorded") },
  ];

  const registeredDate = formatDate(patient.created_at);
  const totalSpentStatus = statistics?.outstanding_balance === 0 ? t("patientProfile.fullyPaid") : statistics?.outstanding_balance
    ? t("patientProfile.amountOutstanding", { amount: statistics?.outstanding_balance.toLocaleString() })
    : t("patientProfile.noVisits");

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Patient Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            <PatientAvatarWithStatus name={patient.full_name} size="xxl" status="online" />
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
                  <LocationIcon className="h-3 w-3"/>
                  {patient.address ? patient.address : t("patientProfile.addressNotProvided")}   •
                </span>
                <span>{t("patientProfile.registeredSince", { date: registeredDate })}</span>
              </div>
            </div>
          </div>

          {/* Right Side - Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleNewVisit}
              className="cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" />
              <span>{t("patientProfile.newVisit")}</span>
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePatient}
              className="cursor-pointer"
            >
              <DeleteIcon className="w-4 h-4" />
              <span>{t("patientProfile.delete")}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatisticsCard
          label={t("patientProfile.totalSpentLabel")}
          value={t("patientProfile.amountAfn", { amount: (statistics?.total_spent || 0).toLocaleString() })}
          subtitle={totalSpentStatus}
          variant="success"
          icon="check"
        />
        <StatisticsCard
          label={t("patientProfile.lastVisitLabel")}
          value={formatDate(statistics?.last_visit_date) || t("patientProfile.noVisits")}
          subtitle={lastVisitProcedure || "-"}
          variant="info"
          icon="clock"
        />
        <StatisticsCard
          label={t("patientProfile.outstandingBalanceLabel")}
          value={t("patientProfile.amountAfn", { amount: (statistics?.outstanding_balance || 0).toLocaleString() })}
          variant={statistics?.outstanding_balance && statistics.outstanding_balance > 0 ? "warning" : "success"}
          icon="check"
        />
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <PersonalDetailsCard
          details={personalDetails}
          onEdit={handleEditPersonalInfo}
        />
        <AllergiesMedicalAlertsCard
          alerts={allergiesAlerts}
          onEdit={() => setShowAllergiesModal(true)}
        />
      </div>

      {/* Treatment History */}
      <div className="mb-6">
        <TreatmentHistoryTimeline
          treatments={treatmentHistory}
          onViewAll={handleViewAllVisits}
          patientId={patient?.id}
          patientName={patient?.full_name}
          onStatusChange={handleStatusChange}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t("patientProfile.deleteTitle")}
        description={`${t("patientProfile.deleteConfirm", { name: patient.full_name })} ${t("patientProfile.deleteUndo")}`}
      >
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
            {t("common.cancel")}
          </Button>
          <Button variant="destructive" onClick={handleConfirmDelete}>
            {t("patientProfile.deletePatient")}
          </Button>
        </div>
      </Modal>

      {/* Edit Personal Info Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={t("patientProfile.editPersonalInfo")}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("patientProfile.formLabels.fullName")}</label>
            <input
              type="text"
              value={editFormData.full_name}
              onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("patientProfile.formLabels.phoneNumber")}</label>
            <input
              type="tel"
              value={editFormData.phone}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("patientProfile.formLabels.age")}</label>
              <input
                type="number"
                value={editFormData.age}
                onChange={(e) => setEditFormData({ ...editFormData, age: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("patientProfile.formLabels.gender")}</label>
              <select
                value={editFormData.gender}
                onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value as "Male" | "Female" | "Other" })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="Male">{t("patients.filters.male")}</option>
                <option value="Female">{t("patients.filters.female")}</option>
                <option value="Other">{t("patients.filters.other")}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("patientProfile.formLabels.address")}</label>
            <textarea
              value={editFormData.address}
              onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowEditModal(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSavePersonalInfo}>
            {t("patientProfile.saveChanges")}
          </Button>
        </div>
      </Modal>

      {/* Allergies & Medical Alerts Modal */}
      <Modal
        isOpen={showAllergiesModal}
        onClose={() => setShowAllergiesModal(false)}
        title={t("patientProfile.allergiesMedicalAlerts")}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("patientProfile.formLabels.allergies")}</label>
            <input
              type="text"
              value={allergiesFormData.allergies}
              onChange={(e) => setAllergiesFormData({ ...allergiesFormData, allergies: e.target.value })}
              placeholder={t("patientProfile.formPlaceholders.allergiesExample")}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("patientProfile.formLabels.medicalConditions")}</label>
            <input
              type="text"
              value={allergiesFormData.medical_conditions}
              onChange={(e) => setAllergiesFormData({ ...allergiesFormData, medical_conditions: e.target.value })}
              placeholder={t("patientProfile.formPlaceholders.conditionsExample")}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("patientProfile.formLabels.medications")}</label>
            <input
              type="text"
              value={allergiesFormData.medications}
              onChange={(e) => setAllergiesFormData({ ...allergiesFormData, medications: e.target.value })}
              placeholder={t("patientProfile.formPlaceholders.medicationsExample")}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowAllergiesModal(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSaveAllergies}>
            {t("patientProfile.saveChanges")}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default PatientProfile;