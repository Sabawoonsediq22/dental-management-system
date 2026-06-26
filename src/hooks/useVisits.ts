import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { CreateVisitInput } from "../types/ApiTypes";

export function useVisits(patientId: string) {
  return useQuery({
    queryKey: ["visits", patientId],
    queryFn: () => api.visits.list(patientId),
    enabled: !!patientId,
  });
}

export function useCreateVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.visits.create,
    onSuccess: (_, input: CreateVisitInput) => {
      qc.invalidateQueries({ queryKey: ["visits", input.patient_id], refetchType: "all" });
      qc.invalidateQueries({ queryKey: ["treatment-history", input.patient_id], refetchType: "all" });
      qc.invalidateQueries({ queryKey: ["patients", input.patient_id, "statistics"], refetchType: "all" });
    },
  });
}

export function useUpdateVisitStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "Open" | "Completed" | "Cancelled" }) =>
      api.visits.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visits"], refetchType: "all" });
      qc.invalidateQueries({ queryKey: ["treatment-history"], refetchType: "all" });
      qc.invalidateQueries({ queryKey: ["dashboard"], refetchType: "all" });
    },
  });
}

export function useTreatments() {
  return useQuery({
    queryKey: ["treatments"],
    queryFn: async () => [],
  });
}

export function usePatientTreatmentHistory(patientId: string) {
  return useQuery({
    queryKey: ["treatment-history", patientId],
    queryFn: () => api.visits.getWithTreatments(patientId),
    enabled: !!patientId,
  });
}

export function useAddTreatmentRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.treatments.add,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treatments"], refetchType: "all" });
      qc.invalidateQueries({ queryKey: ["treatment-history"], refetchType: "all" });
    },
  });
}

export function useInvoice(visitId: string) {
  return useQuery({
    queryKey: ["invoices", "visit", visitId],
    queryFn: () => api.invoices.getForVisit(visitId),
    enabled: !!visitId,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.invoices.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
}

export function usePayments(invoiceId: string) {
  return useQuery({
    queryKey: ["payments", invoiceId],
    queryFn: () => api.invoices.getPayments(invoiceId),
    enabled: !!invoiceId,
  });
}

export function useAddPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.payments.add,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payments"] }),
  });
}

export function useReportSummary() {
  return useQuery({
    queryKey: ["reports", "summary"],
    queryFn: () => api.reports.summary(),
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => api.settings.get(),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.settings.update,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}