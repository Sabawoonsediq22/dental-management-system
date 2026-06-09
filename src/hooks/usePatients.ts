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

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.patients.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patients"] }),
  });
}

export function useUpdatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof api.patients.update>[1] }) =>
      api.patients.update(id, input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["patients", data.id] });
    },
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.patients.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patients"] }),
  });
}