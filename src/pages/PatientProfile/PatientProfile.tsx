import React from "react";
import { useParams } from "react-router-dom";
import { Button } from "../../components/ui";
import { AllergyAlert, PatientStatistics, PersonalDetail, TreatmentEntry } from "../../types/PatientTypes";
import AllergiesMedicalAlertsCard from "../../components/patients/AllergiesMedicalAlertsCard";
import TreatmentHistoryTimeline from "../../components/patients/TreatmentHistoryTimeline";
import PatientAvatarWithStatus from "../../components/patients/PatientAvatarWithStatus";
import StatisticsCard from "../../components/patients/StatisticsCard";
import PersonalDetailsCard from "../../components/patients/PersonalDetailsCard";
import { DeleteIcon, EditIcon, HomeIcon, LocationIcon, PatientIcon, PhoneIcon, PlusIcon } from "../../shared/icons/icons";

const PatientProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();

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

  const patientInfo = {
    id: "PID-8842-AU",
    full_name: "Ahmad Wali",
    location: "Kabul, Afghanistan",
    registered_date: "March 2021",
  };

  const statistics: PatientStatistics = {
    total_spent: 14250,
    total_spent_status: "Fully Paid",
    last_visit_date: "Dec 12, 2023",
    last_visit_procedure: "Root Canal Treatment (Tooth 14)",
    outstanding_balance: 0,
  };

  const personalDetails: PersonalDetail[] = [
    {
      label: "Age / Gender",
      label_localized: "سن / جنسیت",
      value: "34 Years • Male",
      icon: (
        <PatientIcon className="w-5 h-5 text-blue-600" />
      ),
    },
    {
      label: "Phone Number",
      value: "+93 79 987 6543",
      icon: (
        <PhoneIcon className="w-5 h-5 text-blue-600" />
      ),
    },
    {
      label: "Home Address",
      value: "Karte 3, District 6, Kabul City",
      icon: (
        <HomeIcon className="w-5 h-5 text-blue-600" />
      ),
    },
  ];

  const allergiesAlerts: AllergyAlert[] = [
    { label: "ALLERGIES", value: "Penicillin, Latex (Type I Hypersensitivity)" },
    { label: "MEDICAL CONDITIONS", value: "Type 2 Diabetes (Managed), Hypertension" },
    { label: "CURRENT MEDICATIONS", value: "Metformin 500mg, Lisinopril 10mg" },
  ];

  const treatmentHistory: TreatmentEntry[] = [
    {
      id: "1",
      title: "Root Canal Treatment",
      tooth_number: 14,
      date: "2023-12-12",
      time: "10:30 AM",
      cost: 5500,
      status: "Completed",
      notes:
        "Endodontic therapy performed on maxillary first premolar.\nPatient reported mild discomfort post-op.\nScheduled for crown placement in 2 weeks.",
      images: [
        "https://placehold.co/400x300/3b82f6/ffffff?text=X-Ray+1",
        "https://placehold.co/400x300/3b82f6/ffffff?text=Before",
      ],
    },
    {
      id: "2",
      title: "Scaling & Deep Cleaning",
      date: "2023-08-05",
      time: "09:00 AM",
      cost: 1200,
      status: "Completed",
      notes: "Professional cleaning completed. No complications.",
    },
    {
      id: "3",
      title: "Initial Consultation & X-Ray",
      date: "2021-03-22",
      time: "02:15 PM",
      cost: 2500,
      status: "Completed",
      notes: "Initial patient consultation and full mouth X-rays taken.",
    },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Patient Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            <PatientAvatarWithStatus name={patientInfo.full_name} size="xxl" status="online" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {patientInfo.full_name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                  {patientInfo.id}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <LocationIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  {patientInfo.location}
                </span>
                <span>Registered since {patientInfo.registered_date}</span>
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
              <PlusIcon className="w-4 h-4"/>
              <span>New Visit</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatisticsCard
          label="Total Spent"
          value={`${statistics.total_spent.toLocaleString()} AFN`}
          subtitle={statistics.total_spent_status}
          variant="success"
          icon="check"
        />
        <StatisticsCard
          label="Last Visit"
          value={statistics.last_visit_date}
          subtitle={statistics.last_visit_procedure}
          variant="info"
          icon="clock"
        />
        <StatisticsCard
          label="Outstanding Balance"
          value={`${statistics.outstanding_balance.toLocaleString()} AFN`}
          variant="success"
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
          onEdit={() => console.log("Edit allergies")}
          className="bg-red-100 border border-red-400 dark:bg-red-900/30 dark:border-red-700"
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