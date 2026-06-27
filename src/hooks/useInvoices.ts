import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useInvoices(params: { query?: string; status?: string; page?: number; perPage?: number }) {
  return useQuery({
    queryKey: ["invoices", params],
    queryFn: () => api.invoices.list(params),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ["invoices", id],
    queryFn: () => api.invoices.get(id),
    enabled: !!id,
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"], refetchType: "all" });
      qc.invalidateQueries({ queryKey: ["payments"], refetchType: "all" });
      qc.invalidateQueries({ queryKey: ["reports"], refetchType: "all" });
    },
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.payments.add,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["invoices"], refetchType: "all" });
      qc.invalidateQueries({ queryKey: ["payments", variables.invoice_id], refetchType: "all" });
      qc.invalidateQueries({ queryKey: ["reports"], refetchType: "all" });
    },
  });
}