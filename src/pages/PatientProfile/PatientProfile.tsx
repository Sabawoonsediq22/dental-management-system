import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Modal, LoadingSpinner } from "../../components/ui";
import { usePatient, usePatientMedicalInfo, usePatientStatistics, useUpdatePatient, useDeletePatient, useUpdatePatientMedicalInfo } from "../../hooks/usePatients";
import { usePatientTreatmentHistory } from "../../hooks/useVisits";
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

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const formatTime = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
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

const toTreatmentEntries = (visits: PatientVisitWithTreatments[]): TreatmentEntry[] => visits
  .filter((visit) => visit.procedures.length > 0)
  .map((visit) => {
    const procedures = visit.procedures.map((procedure) => ({
      name: procedure.procedure_name,
      additional_note: procedure.procedure_additional_note ?? undefined,
      quantity: procedure.number_of_procedures,
      unit_price: procedure.unit_price,
      total_price: procedure.total_price,
      tooth_numbers: procedure.teeth.map((tooth) => tooth.tooth_number),
    }));
    const procedureNames = procedures.map((procedure) => procedure.name).join(", ");
    const toothNumbers = procedures.flatMap((procedure) => procedure.tooth_numbers || []);
    const procedureNotes = procedures
      .map((procedure) => procedure.additional_note)
      .filter((note): note is string => Boolean(note))
      .join("\n");
    
    const images = visit.procedures
      .flatMap((procedure) => procedure.xrays || [])
      .filter(Boolean);
    
    return {
      id: visit.visit_id,
      title: visit.chief_complaint?.trim() || procedureNames || "Treatment",
      tooth_number: toothNumbers[0],
      date: visit.visit_date,
      time: formatTime(visit.procedures[0].performed_at || visit.visit_date),
      cost: procedures.reduce((sum, procedure) => sum + procedure.total_price, 0),
      status: visit.status === "Open" || visit.status === "Completed" || visit.status === "Cancelled"
        ? visit.status
        : "Open",
      notes: [visit.clinical_notes, procedureNotes].filter(Boolean).join("\n\n") || undefined,
      procedures,
      images: images.length > 0 ? images : undefined,
    };
  });

const PatientProfile: React.FC = () => {
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
          toast.success("Patient deleted successfully");
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
        toast.success("Medical information updated successfully");
      },
      onError: (error) => {
        toast.error(`Failed to update medical information: ${String(error)}`);
      },
    });
  };

  if (patientQuery.isLoading || medicalInfoQuery.isLoading || statisticsQuery.isLoading || treatmentHistoryQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (patientQuery.error || !patient) {
    return (
      toast.error(`Failed to load patient data: ${String(patientQuery.error)}`)
    );
  }

  if (treatmentHistoryQuery.error) {
    return (
      toast.error(`Failed to load treatment history: ${String(treatmentHistoryQuery.error)}`)
    );
  }

  const personalDetails = [
    {
      label: "Age / Gender",
      value: `${patient.age} Years • ${patient.gender}`,
      icon: (
        <PatientIcon className="w-5 h-5" />
      ),
    },
    {
      label: "Phone Number",
      value: patient.phone,
      icon: (
        <PhoneIcon className="w-5 h-5" />
      ),
    },
    {
      label: "Home Address",
      value: patient.address || "Not provided",
      icon: (
        <HomeIcon className="w-5 h-5" />
      ),
    },
  ];

  const allergiesAlerts: AllergyAlert[] = [
    { label: "ALLERGIES", value: medicalInfo?.allergies?.join(", ") || "None recorded" },
    { label: "MEDICAL CONDITIONS", value: medicalInfo?.medical_conditions?.join(", ") || "None recorded" },
    { label: "CURRENT MEDICATIONS", value: medicalInfo?.medications?.join(", ") || "None recorded" },
  ];

  const registeredDate = formatDate(patient.created_at);
  const totalSpentStatus = statistics?.outstanding_balance === 0 ? "Fully Paid" : statistics?.outstanding_balance
    ? `${statistics?.outstanding_balance.toLocaleString()} AFN outstanding`
    : "No visits yet";

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
                  {patient.address ? patient.address : "Address not provided"}   •
                </span>
                <span>Registered since {registeredDate}</span>
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
              <span>New Visit</span>
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePatient}
              className="cursor-pointer"
            >
              <DeleteIcon className="w-4 h-4" />
              <span>Delete</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatisticsCard
          label="Total Spent"
          value={`${(statistics?.total_spent || 0).toLocaleString()} AFN`}
          subtitle={totalSpentStatus}
          variant="success"
          icon="check"
        />
        <StatisticsCard
          label="Last Visit"
          value={formatDate(statistics?.last_visit_date) || "No visits"}
          subtitle={statistics?.last_visit_procedure ? `${statistics.last_visit_procedure}` : "-"}
          variant="info"
          icon="clock"
        />
        <StatisticsCard
          label="Outstanding Balance"
          value={`${(statistics?.outstanding_balance || 0).toLocaleString()} AFN`}
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
         />
      </div>

      {/* Delete Confirmation Dialog */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Patient"
        description={`Are you sure you want to delete ${patient.full_name}? This action cannot be undone.`}
      >
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirmDelete}>
            Delete Patient
          </Button>
        </div>
      </Modal>

      {/* Edit Personal Info Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Personal Information"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              value={editFormData.full_name}
              onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input
              type="tel"
              value={editFormData.phone}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Age</label>
              <input
                type="number"
                value={editFormData.age}
                onChange={(e) => setEditFormData({ ...editFormData, age: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gender</label>
              <select
                value={editFormData.gender}
                onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value as "Male" | "Female" | "Other" })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
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
            Cancel
          </Button>
          <Button onClick={handleSavePersonalInfo}>
            Save Changes
          </Button>
        </div>
      </Modal>

      {/* Allergies & Medical Alerts Modal */}
      <Modal
        isOpen={showAllergiesModal}
        onClose={() => setShowAllergiesModal(false)}
        title="Allergies & Medical Alerts"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Allergies (comma separated)</label>
            <input
              type="text"
              value={allergiesFormData.allergies}
              onChange={(e) => setAllergiesFormData({ ...allergiesFormData, allergies: e.target.value })}
              placeholder="e.g., Penicillin, Latex"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Medical Conditions (comma separated)</label>
            <input
              type="text"
              value={allergiesFormData.medical_conditions}
              onChange={(e) => setAllergiesFormData({ ...allergiesFormData, medical_conditions: e.target.value })}
              placeholder="e.g., Diabetes, Hypertension"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Current Medications (comma separated)</label>
            <input
              type="text"
              value={allergiesFormData.medications}
              onChange={(e) => setAllergiesFormData({ ...allergiesFormData, medications: e.target.value })}
              placeholder="e.g., Metformin, Lisinopril"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowAllergiesModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveAllergies}>
            Save Changes
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default PatientProfile;