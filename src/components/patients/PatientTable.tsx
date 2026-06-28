import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { PatientAvatar } from "../ui";
import { PatientTableProps } from "../../types/PatientTypes";
import type { Patient } from "../../types/ApiTypes";
import { Popover } from "../ui/Popover";
import { Modal, Button, toast } from "../ui";
import { useUpdatePatient, useDeletePatient } from "../../hooks/usePatients";

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
  onDeletePatient,
  onNewVisit,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const getGenderLabel = (gender: string) =>
    t(`patients.filters.${gender.toLowerCase()}`, gender);

  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    full_name: "",
    phone: "",
    age: 0,
    gender: "Male" as "Male" | "Female" | "Other",
    address: "",
  });

  const updatePatientMutation = useUpdatePatient();
  const deletePatientMutation = useDeletePatient();

  const handleEditClick = (patient: Patient) => {
    setEditFormData({
      full_name: patient.full_name,
      phone: patient.phone,
      age: patient.age,
      gender: patient.gender,
      address: patient.address || "",
    });
    setActivePatient(patient);
    setShowEditModal(true);
    onEditPatient?.(patient);
  };

  const handleSavePersonalInfo = () => {
    if (!activePatient) return;
    updatePatientMutation.mutate(
      {
        id: activePatient.id,
        input: {
          full_name: editFormData.full_name,
          phone: editFormData.phone,
          age: editFormData.age,
          gender: editFormData.gender,
          address: editFormData.address || null,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["patients"], refetchType: "all" });
          toast.success({ title: t("patients.notifications.addSuccess") });
        },
      },
    );
    setShowEditModal(false);
    setActivePatient(null);
  };

  const handleDeleteClick = (patient: Patient) => {
    setActivePatient(patient);
    setShowDeleteConfirm(true);
    onDeletePatient?.(patient);
  };

  const handleConfirmDelete = () => {
    if (!activePatient) return;
    deletePatientMutation.mutate(activePatient.id, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["patients"], refetchType: "all" });
        toast.success({ title: t("patientProfile.notifications.deleted") });
      },
    });
    setShowDeleteConfirm(false);
    setActivePatient(null);
  };

  const handleNewVisitClick = (patient: Patient) => {
    onNewVisit?.(patient);
    navigate(`/patients/${patient.id}/visits/new`);
  };

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
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-800 dark:text-gray-400 whitespace-nowrap">
                {t("patients.table.no")}
              </th>
              <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-800 dark:text-gray-400">
                {t("patients.table.fullName")}
              </th>
              <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-800 dark:text-gray-400">
                {t("patients.table.phone")}
              </th>
              <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-800 dark:text-gray-400">
                {t("patients.table.ageGender")}
              </th>
              <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-800 dark:text-gray-400 hidden xl:table-cell">
                {t("patients.table.address")}
              </th>
              <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-800 dark:text-gray-400 whitespace-nowrap">
                {t("patients.table.lastVisit")}
              </th>
              <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-800 dark:text-gray-400 w-16">
                {t("patients.table.actions")}
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
                        onClick: () => handleEditClick(patient),
                      },
                      {
                        label: t("patients.actions.newVisit", "New Visit"),
                        onClick: () => handleNewVisitClick(patient),
                      },
                      {
                        label: t("patients.actions.delete", "Delete"),
                        onClick: () => handleDeleteClick(patient),
                        className: "text-red-600",
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
                <Popover
                  actions={[
                    {
                      label: t("patients.actions.view", "View"),
                      onClick: () => navigate(`/patients/${patient.id}`),
                    },
                    {
                      label: t("patients.actions.edit", "Edit"),
                      onClick: () => handleEditClick(patient),
                    },
                    {
                      label: t("patients.actions.delete", "Delete"),
                      onClick: () => handleDeleteClick(patient),
                      className: "text-red-600",
                    },
                    {
                      label: t("patients.actions.newVisit", "New Visit"),
                      onClick: () => handleNewVisitClick(patient),
                    },
                  ]}
                />
              </div>
            </div>
            <div className="mt-2 ml-12 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <span>
                {patient.age} yrs / {getGenderLabel(patient.gender)}
              </span>
              <span>{t("patients.table.last")} {formatDate(patient.last_visit)}</span>
            </div>
          </div>
        ))}
      </div>

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
              onChange={(e) =>
                setEditFormData({ ...editFormData, full_name: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("patientProfile.formLabels.phoneNumber")}</label>
            <input
              type="tel"
              value={editFormData.phone}
              onChange={(e) =>
                setEditFormData({ ...editFormData, phone: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("patientProfile.formLabels.age")}</label>
              <input
                type="number"
                value={editFormData.age}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    age: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("patientProfile.formLabels.gender")}</label>
              <select
                value={editFormData.gender}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    gender: e.target.value as "Male" | "Female" | "Other",
                  })
                }
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
              onChange={(e) =>
                setEditFormData({ ...editFormData, address: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowEditModal(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSavePersonalInfo}
            disabled={updatePatientMutation.isPending}
          >
            {updatePatientMutation.isPending
              ? t("common.saving", "Saving...")
              : t("patientProfile.saveChanges")}
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t("patientProfile.deleteTitle")}
        description={
          activePatient
            ? `${t("patientProfile.deleteConfirm", { name: activePatient.full_name })} ${t("patientProfile.deleteUndo")}`
            : ""
        }
      >
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={deletePatientMutation.isPending}
          >
            {deletePatientMutation.isPending
              ? t("common.deleting", "Deleting...")
              : t("patientProfile.deletePatient")}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default PatientTable;
