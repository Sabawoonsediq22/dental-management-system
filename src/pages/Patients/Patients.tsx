import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner, Pagination } from "../../components/ui";
import PatientsHeader from "../../components/patients/PatientsHeader";
import PatientTable from "../../components/patients/PatientTable";
import { usePatients } from "../../hooks/usePatients";
import type { Patient } from "../../types/ApiTypes";

const Patients: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGender, setSelectedGender] = useState<"All" | "Male" | "Female" | "Other">("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { data, isLoading, error } = usePatients({
    query: searchQuery || undefined,
    gender: selectedGender !== "All" ? selectedGender : undefined,
    page: currentPage,
    perPage: itemsPerPage,
  });

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleGenderChange = (gender: "All" | "Male" | "Female" | "Other") => {
    setSelectedGender(gender);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= (data?.total_pages ?? 1)) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  const handleAddNewPatient = () => {
    navigate("/patients/new");
  };

  const handleEditPatient = (patient: Patient) => {
    console.log("Edit patient:", patient);
  };

  const handleDeletePatient = (patient: Patient) => {
    console.log("Delete patient:", patient);
  };

  const handleNewVisit = (patient: Patient) => {
    console.log("New visit for patient:", patient);
  };

  const patients = data?.items ?? [];

  return (
    <div className="flex flex-col h-full">
      <PatientsHeader
        patients={patients}
        totalPatients={data?.total ?? 0}
        searchQuery={searchQuery}
        selectedGender={selectedGender}
        onSearchChange={handleSearchChange}
        onGenderChange={handleGenderChange}
        onAddNewPatient={handleAddNewPatient}
      />

      <div className="flex-1 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 mb-3">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <LoadingSpinner className="mr-4" />
              <div className="text-lg">Loading patients...</div>
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-lg text-red-500">Error loading patients: {String(error)}</div>
            </div>
          ) : (
            <PatientTable
              patients={patients}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              totalItems={data?.total ?? 0}
              totalPages={data?.total_pages ?? 1}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              onEditPatient={handleEditPatient}
              onDeletePatient={handleDeletePatient}
              onNewVisit={handleNewVisit}
              />
          )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={data?.total_pages ?? 1}
        totalItems={data?.total ?? 0}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />
    </div>
  );
};

export default Patients;