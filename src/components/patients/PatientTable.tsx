import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button, PatientAvatar } from "../ui";
import { EditIcon, MoreVerticalIcon, EyeIcon, MoreHorizontalIcon } from "../../shared/icons/icons";
import { PatientTableProps } from "../../types/PatientTypes";
import { Popover } from "../ui/Popover";

function formatDate(date: string | null | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

const PatientTable: React.FC<PatientTableProps> = ({
  patients,
  onEditPatient,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const getGenderLabel = (gender: string) =>
    t(`patients.filters.${gender.toLowerCase()}`, gender);

  if (patients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {t(
            "patients.table.empty",
            "No patients match your current search and filters.",
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-800 dark:text-gray-400 whitespace-nowrap">
                NO.
              </th>
              <th className="text-left py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-800 dark:text-gray-400">
                FULL NAME
              </th>
              <th className="text-left py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-800 dark:text-gray-400">
                PHONE
              </th>
              <th className="text-left py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-800 dark:text-gray-400">
                AGE / GENDER
              </th>
              <th className="text-left py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-800 dark:text-gray-400 hidden xl:table-cell">
                ADDRESS
              </th>
              <th className="text-left py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-800 dark:text-gray-400 whitespace-nowrap">
                LAST VISIT
              </th>
              <th className="text-left py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-800 dark:text-gray-400 w-16">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
            {patients.map((patient, index) => (
              <tr
                key={patient.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors cursor-pointer"
                onClick={() => navigate(`/patients/${patient.id}`)}
              >
                <td className="py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                  {index + 1}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <PatientAvatar name={patient.full_name} size="md" />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {patient.full_name}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                  {patient.phone}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                  {patient.age} / {getGenderLabel(patient.gender)}
                </td>
                <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 hidden xl:table-cell truncate max-w-xs">
                  {patient.address || "-"}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                  {formatDate(patient.last_visit)}
                </td>
                <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                  <Popover
                    actions={[
                      {
                        label: t("patients.actions.view", "View"),
                        onClick: () => navigate(`/patients/${patient.id}`),
                      },
                      {
                        label: t("patients.actions.edit", "Edit"),
                        onClick: () => onEditPatient?.(patient),
                      },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700/60">
        {patients.map((patient) => (
          <div
            key={patient.id}
            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors cursor-pointer"
            onClick={() => navigate(`/patients/${patient.id}`)}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <PatientAvatar name={patient.full_name} size="md" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {patient.full_name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {patient.phone}
                  </span>
                </div>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                
              </div>
            </div>
            <div className="mt-2 ml-12 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <span>
                {patient.age} yrs / {getGenderLabel(patient.gender)}
              </span>
              <span>Last: {formatDate(patient.last_visit)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientTable;