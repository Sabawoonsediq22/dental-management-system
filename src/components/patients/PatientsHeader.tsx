import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button, SearchInput } from "../ui";
import { AddIcon } from "../../shared/icons/icons";
import { GENDER_FILTER_OPTIONS, PatientsHeaderProps } from "../../types/PatientTypes";

const PatientsHeader: React.FC<PatientsHeaderProps> = ({
  patients,
  searchQuery,
  selectedGender,
  onSearchChange,
  onGenderChange,
  onAddNewPatient,
}) => {
  const { t } = useTranslation();

  const patientStats = useMemo(() => {
    const total = patients.length;
    const active = patients.filter((p) => p.is_complete_profile).length;
    const now = new Date();
    const newThisMonth = patients.filter(
      (p) =>
        p.last_visit &&
        new Date(p.last_visit).getMonth() === now.getMonth() &&
        new Date(p.last_visit).getFullYear() === now.getFullYear(),
    ).length;
    const incompleteProfiles = patients.filter(
      (p) => !p.is_complete_profile,
    ).length;
    return { total, active, newThisMonth, incompleteProfiles };
  }, [patients]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={t(
            "patients.searchPlaceholder",
            "Search by name, phone, or Patient ID",
          )}
        />
        <Button onClick={onAddNewPatient} className="cursor-pointer">
          <AddIcon size="sm" />
          <span>{t("patients.actions.add", "Add New Patient")}</span>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3 gap-4 my-6">
        {/* Stats row */}
        <div className="flex items-center gap-2 py-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {t("patients.TotalPatients")} |{" "}
          </span>
          <span className="text-xs font-bold text-gray-900 dark:text-white">
            {patientStats.total}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {t("patients.filters.Gender", "Gender")}
          <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-800 rounded-lg p-0.5 px-1 py-1">
            {GENDER_FILTER_OPTIONS.map((opt) => (
              <Button
                key={opt}
                variant={selectedGender === opt ? "default" : "ghost"}
                size="sm"
                onClick={() => onGenderChange(opt)}
                className="cursor-pointer"
              >
                {t(
                  `patients.filters.${opt.toLowerCase() === "all" ? "all" : opt.toLowerCase()}`,
                  opt,
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientsHeader;