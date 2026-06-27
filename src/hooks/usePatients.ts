import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useEffect } from "react";

export function usePatients(params: { query?: string; gender?: string; page?: number; perPage?: number }) {
  const result = useQuery({
    queryKey: ["patients", params],
    queryFn: () => api.patients.list(params),
  });

  useEffect(() => {
    if (result.error) {
      console.error("usePatients error:", result.error);
    }
  }, [result.error]);

  return result;
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: ["patients", id],
    queryFn: () => api.patients.get(id),
    enabled: !!id,
  });
}

export function usePatientMedicalInfo(id: string) {
  return useQuery({
    queryKey: ["patients", id, "medical-info"],
    queryFn: () => api.patients.getMedicalInfo(id),
    enabled: !!id,
  });
}

export function usePatientStatistics(id: string) {
  return useQuery({
    queryKey: ["patients", id, "statistics"],
    queryFn: () => api.patients.getStatistics(id),
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.patients.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"], refetchType: "all" });
      qc.invalidateQueries({ queryKey: ["dashboard"], refetchType: "all" });
      qc.invalidateQueries({ queryKey: ["invoices"], refetchType: "all" });
      qc.invalidateQueries({ queryKey: ["reports"], refetchType: "all" });
    },
  });
}

export function useUpdatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof api.patients.update>[1] }) =>
      api.patients.update(id, input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["patients"], refetchType: "all" });
      qc.invalidateQueries({ queryKey: ["patients", data.id], refetchType: "all" });
      qc.invalidateQueries({ queryKey: ["patients", data.id, "medical-info"], refetchType: "all" });
      qc.invalidateQueries({ queryKey: ["patients", data.id, "statistics"], refetchType: "all" });
      qc.invalidateQueries({ queryKey: ["invoices"], refetchType: "all" });
      qc.invalidateQueries({ queryKey: ["reports"], refetchType: "all" });
    },
  });
}

export function useUpdatePatientMedicalInfo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ patient_id, input }: { patient_id: string; input: Parameters<typeof api.patients.updateMedicalInfo>[1] }) =>
      api.patients.updateMedicalInfo(patient_id, input),
    onSuccess: (_, { patient_id }) => {
      qc.invalidateQueries({ queryKey: ["patients", patient_id, "medical-info"], refetchType: "all" });
    },
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.patients.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"], refetchType: "all" });
      qc.invalidateQueries({ queryKey: ["invoices"], refetchType: "all" });
      qc.invalidateQueries({ queryKey: ["reports"], refetchType: "all" });
    },
  });
}

export function usePatientXrays(patientId: string) {
  return useQuery({
    queryKey: ["patients", patientId, "xrays"],
    queryFn: () => api.patients.getXrays(patientId),
    enabled: !!patientId,
  });
}