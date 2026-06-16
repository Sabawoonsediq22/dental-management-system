import React from "react";
import { useParams } from "react-router-dom";
import { Button } from "../../components/ui";
import { AllergyAlert, TreatmentEntry } from "../../types/PatientTypes";
import { usePatient, usePatientMedicalInfo, usePatientStatistics } from "../../hooks/usePatients";
import { useVisits } from "../../hooks/useVisits";
import AllergiesMedicalAlertsCard from "../../components/patients/AllergiesMedicalAlertsCard";
import TreatmentHistoryTimeline from "../../components/patients/TreatmentHistoryTimeline";
import PatientAvatarWithStatus from "../../components/patients/PatientAvatarWithStatus";
import StatisticsCard from "../../components/patients/StatisticsCard";
import PersonalDetailsCard from "../../components/patients/PersonalDetailsCard";
import { LoadingSpinner } from "../../components/ui";
import type { Visit } from "../../types/ApiTypes";
import { DeleteIcon, HomeIcon, LocationIcon, PatientIcon, PhoneIcon, PlusIcon } from "../../shared/icons/icons";

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

const PatientProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const patientQuery = usePatient(id || "");
  const medicalInfoQuery = usePatientMedicalInfo(id || "");
  const statisticsQuery = usePatientStatistics(id || "");
  const visitsQuery = useVisits(id || "");

  const patient = patientQuery.data;
  const medicalInfo = medicalInfoQuery.data;
  const statistics = statisticsQuery.data;
  const visits = visitsQuery.data;

  const handleEditPersonalInfo = () => {
    console.log("Edit personal info for patient:", id);
  };

  const handleDeletePatient = () => {
    console.log("Delete patient:", id);
  };

  const handleNewVisit = () => {
    console.log("New visit for patient:", id);
  };

  const handleViewAllVisits = () => {
    console.log("View all visits for patient:", id);
  };

  const handleEditTreatment = (treatment: TreatmentEntry) => {
    console.log("Edit treatment:", treatment);
  };

  // Transform visits to treatment entries
  const treatmentHistory: TreatmentEntry[] = visits?.map((visit: Visit) => ({
    id: visit.id,
    title: visit.chief_complaint || "Visit",
    date: visit.visit_date,
    time: formatTime(visit.visit_date),
    cost: 0,
    status: visit.status === "Open" || visit.status === "Completed" || visit.status === "Cancelled"
      ? visit.status
      : "Open",
    notes: visit.clinical_notes || undefined,
  })) || [];

  if (patientQuery.isLoading || medicalInfoQuery.isLoading || statisticsQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (patientQuery.error || !patient) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg text-red-500">Error loading patient: {String(patientQuery.error || "Not found")}</div>
      </div>
    );
  }

  const personalDetails = [
    {
      label: "Age / Gender",
      value: `${patient.age} Years • ${patient.gender}`,
      icon: (
        <PatientIcon className="w-5 h-5 text-blue-600" />
      ),
    },
    {
      label: "Phone Number",
      value: patient.phone,
      icon: (
        <PhoneIcon className="w-5 h-5 text-blue-600" />
      ),
    },
    {
      label: "Home Address",
      value: patient.address || "Not provided",
      icon: (
        <HomeIcon className="w-5 h-5 text-blue-600" />
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {patient.full_name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                  {patient.id}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <LocationIcon className="w-4 h-4 text-gray-400" />
                    {patient.address ? patient.address : "Address not provided"} &nbsp; •
                </span>
                <span>Registered since {registeredDate}</span>
              </div>
            </div>
          </div>

          {/* Right Side - Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="destructive"
              onClick={handleDeletePatient}
              className="cursor-pointer"
            >
              <DeleteIcon className="w-4 h-4" />
              <span>Delete Patient</span>
            </Button>
            <Button
              onClick={handleNewVisit}
              className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" />
              <span>New Visit</span>
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
          variant="destructive"
          icon="currency"
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
          onEdit={() => console.log("Edit allergies")}
        />
      </div>

      {/* Treatment History */}
      <div className="mb-6">
        <TreatmentHistoryTimeline
          treatments={treatmentHistory}
          onViewAll={handleViewAllVisits}
          onEditTreatment={handleEditTreatment}
        />
      </div>
    </div>
  );
};

export default PatientProfile;