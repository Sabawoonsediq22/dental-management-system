import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/button";
import {
  ListIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  CalendarIcon,
  UsersIcon,
} from "../../shared/icons/icons";
import PatientAvatar from "../../components/ui/PatientAvatar";
import type { RecentPatient } from "../../types/ApiTypes";
import { statusConfig } from "../common/badgeStatusConfig";
import { format } from "date-fns";
import { cn } from "../../lib/utils";
import TreatmentStatusChangeModal from "../patients/TreatmentStatusChangeModal";
import { toast } from "../../lib/toast-utils";
import i18n from "../../i18n";

const isRTL = i18n.language === "ps";

const STATUS_DOT_COLORS: Record<string, string> = {
  Completed: "bg-green-500",
  Open: "bg-blue-500",
  Cancelled: "bg-gray-400",
};

interface RecentPatientsTableProps {
  patients: RecentPatient[];
  onUpdateStatus: (visitId: string, newStatus: string) => Promise<void>;
  onRefetch: () => void;
}

const RecentPatientsTable: React.FC<RecentPatientsTableProps> = ({
  patients,
  onUpdateStatus,
  onRefetch,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedPatientForStatus, setSelectedPatientForStatus] =
    useState<RecentPatient | null>(null);

  const handleStatusSave = useCallback(
    async (newStatus: string) => {
      if (!selectedPatientForStatus?.visit_id) {
        toast.error({ title: "Cannot update status: missing visit ID" });
        return;
      }
      try {
        await onUpdateStatus(selectedPatientForStatus.visit_id, newStatus);
        onRefetch();
      } catch {
        toast.error({ title: "Failed to update status" });
      }
    },
    [selectedPatientForStatus, onUpdateStatus, onRefetch],
  );

  const openStatusModal = useCallback(
    (patient: RecentPatient, e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedPatientForStatus(patient);
      setStatusModalOpen(true);
    },
    [],
  );

  if (patients.length === 0) {
    return (
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-3 sm:pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <ListIcon size="md" />
            </div>
            <CardTitle className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
              {t("dashboard.recentPatients", "Recent Patients")}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="py-10 sm:py-14 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
            <UsersIcon size="xl" className="text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
            {t("dashboard.noRecentPatients", "No recent patients")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-3 sm:pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <ListIcon size="md" />
            </div>
            <CardTitle className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
              {t("dashboard.recentPatients", "Recent Patients")}
            </CardTitle>
            <Badge
              variant="default"
              className="text-[10px] font-bold px-2 py-0.5"
            >
              {patients.length} {t("nav.patients", "Patients")}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-[10px] sm:text-xs font-bold text-primary hover:text-primary/80 gap-1"
            onClick={() => navigate("/patients")}
          >
            {t("dashboard.viewAllPatients", "View All Patients")}
            {!isRTL ? (
              <ChevronRightIcon size="xs" />
            ) : (
              <ChevronLeftIcon size="xs" />
            )}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto -mx-px">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/50">
                  <th className="px-3 sm:px-5 py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t("dashboard.table.fullName", "PATIENT")}
                  </th>
                  <th className="px-3 sm:px-5 py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t("dashboard.table.phone", "CONTACT")}
                  </th>
                  <th className="hidden md:table-cell px-3 sm:px-5 py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t("dashboard.table.ageGender", "AGE / GENDER")}
                  </th>
                  <th className="hidden lg:table-cell px-3 sm:px-5 py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t("dashboard.table.address", "ADDRESS")}
                  </th>
                  <th className="hidden md:table-cell px-3 sm:px-5 py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t("dashboard.table.lastVisit", "LAST VISIT")}
                  </th>
                  <th className="px-3 sm:px-5 py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t("billing.status")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 dark:bg-gray-800">
                {patients.map((patient: RecentPatient) => {
                  const statusStyle =
                    statusConfig[patient.status] || statusConfig.Completed;
                  return (
                    <tr
                      key={patient.id}
                      className="group cursor-pointer transition-all duration-200 hover:bg-gray-50/70 dark:hover:bg-gray-800/30"
                      onClick={() => navigate(`/patients/${patient.id}`)}
                    >
                      <td className="px-3 sm:px-5 py-3 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <PatientAvatar
                            name={patient.full_name}
                            size="sm"
                            className="ring-2 ring-gray-100 dark:ring-gray-700 group-hover:ring-primary/30 transition-all"
                          />
                          <span className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm group-hover:text-primary transition-colors truncate max-w-25 sm:max-w-40">
                            {patient.full_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-5 py-3 sm:py-4">
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                          {patient.phone ? (
                            <span className="text-[10px] sm:text-xs font-mono">
                              {patient.phone}
                            </span>
                          ) : (
                            <span className="text-[10px] sm:text-xs text-gray-400">
                              --
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-3 sm:px-5 py-3 sm:py-4">
                        <span className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-300">
                          {patient.age}
                        </span>
                        <span className="text-[10px] sm:text-xs text-gray-400 mx-1">
                          /
                        </span>
                        <span className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-300 capitalize">
                          {patient.gender.toLowerCase()}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell px-3 sm:px-5 py-3 sm:py-4">
                        <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 truncate block max-w-37.5">
                          {patient.address || "—"}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-3 sm:px-5 py-3 sm:py-4">
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                          <CalendarIcon size="xs" className="text-gray-400" />
                          <span className="text-[10px] sm:text-xs font-medium">
                            {format(
                              new Date(patient.visit_date),
                              "MMM dd, yyyy",
                            )}
                          </span>
                        </div>
                      </td>
                      <td
                        className="px-3 sm:px-5 py-3 sm:py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="relative group/status inline-flex">
                          <button
                            onClick={(e) => openStatusModal(patient, e)}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all duration-200 cursor-pointer",
                              statusStyle.bg,
                              statusStyle.text,
                              "hover:shadow-sm active:scale-95",
                            )}
                            title="Click to change status"
                          >
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                STATUS_DOT_COLORS[patient.status] ??
                                  "bg-green-500",
                              )}
                            />
                            {patient.status}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedPatientForStatus && (
        <TreatmentStatusChangeModal
          isOpen={statusModalOpen}
          onClose={() => {
            setStatusModalOpen(false);
            setSelectedPatientForStatus(null);
          }}
          currentStatus={selectedPatientForStatus.status}
          onSave={handleStatusSave}
        />
      )}
    </>
  );
};

export default RecentPatientsTable;
