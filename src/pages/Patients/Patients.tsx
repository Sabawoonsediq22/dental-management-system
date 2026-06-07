import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Pagination } from "../../components/ui";
import PatientsHeader from "../../components/patients/PatientsHeader";
import PatientTable from "../../components/patients/PatientTable";
import { GenderFilterValue, Patient } from "../../types/PatientTypes";

const Patients: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGender, setSelectedGender] =
    useState<GenderFilterValue>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [patients, setPatients] = useState<Patient[]>([]);


  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const genderOk =
        selectedGender === "All" || patient.gender === selectedGender;

      const q = searchQuery.trim().toLowerCase();
      const searchOk =
        !q ||
        patient.fullName.toLowerCase().includes(q) ||
        patient.phone.replace(/\s+/g, "").includes(q) ||
        patient.id.toLowerCase().includes(q);

      return genderOk && searchOk;
    });
  }, [searchQuery, selectedGender, patients]);

  const totalFiltered = filteredPatients.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / itemsPerPage));

  const effectivePage = Math.min(currentPage, totalPages);
  const paginatedPatients = useMemo(() => {
    const start = (effectivePage - 1) * itemsPerPage;
    return filteredPatients.slice(start, start + itemsPerPage);
  }, [filteredPatients, effectivePage, itemsPerPage]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleGenderChange = (gender: GenderFilterValue) => {
    setSelectedGender(gender);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
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

  return (
    <div className="flex flex-col h-full">
      <PatientsHeader
        patients={filteredPatients}
        searchQuery={searchQuery}
        selectedGender={selectedGender}
        onSearchChange={handleSearchChange}
        onGenderChange={handleGenderChange}
        onAddNewPatient={handleAddNewPatient}
      />

      <div className="flex-1 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <PatientTable
          patients={paginatedPatients}
          currentPage={effectivePage}
          itemsPerPage={itemsPerPage}
          totalItems={totalFiltered}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          onEditPatient={handleEditPatient}
        />
      </div>

      <Pagination
        currentPage={effectivePage}
        totalPages={totalPages}
        totalItems={totalFiltered}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />
    </div>
  );
};

export default Patients;
