import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button, SearchInput } from "../ui";
import { AddIcon } from "../../shared/icons/icons";
import {
  GENDER_FILTER_OPTIONS,
  PatientsHeaderProps,
} from "../../types/PatientTypes";
import { ALL_PATIENTS } from "../../shared/constants/PatientsData";

const PatientsHeader: React.FC<PatientsHeaderProps> = ({
  searchQuery,
  selectedGender,
  onSearchChange,
  onGenderChange,
  onAddNewPatient,
}) => {
  const { t } = useTranslation();

  /* ── Derive patient count from data for header badges ── */
  const patientStats = useMemo(() => {
    const total = ALL_PATIENTS.length;
    const active = ALL_PATIENTS.filter((p) => p.isCompleteProfile).length;
    const now = new Date();
    const newThisMonth = ALL_PATIENTS.filter(
      (p) =>
        p.lastVisitDate.getMonth() === now.getMonth() &&
        p.lastVisitDate.getFullYear() === now.getFullYear(),
    ).length;
    const incompleteProfiles = ALL_PATIENTS.filter(
      (p) => !p.isCompleteProfile,
    ).length;
    return { total, active, newThisMonth, incompleteProfiles };
  }, []);

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
