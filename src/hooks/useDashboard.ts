import { useQuery } from "@tanstack/react-query";
import type { RecentPatient } from "../types/ApiTypes";
import { api } from "../lib/api";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => api.dashboard.stats(),
  });
}

export function usePatientsFlow(mode: "daily" | "weekly" = "daily") {
  return useQuery({
    queryKey: ["dashboard", "patientsFlow", mode],
    queryFn: () => api.dashboard.patientsFlow(mode),
  });
}

export function useProcedureDistribution() {
  return useQuery({
    queryKey: ["dashboard", "procedureDistribution"],
    queryFn: () => api.dashboard.procedureDistribution(),
  });
}

export function useRecentPatients(limit?: number) {
  return useQuery({
    queryKey: ["dashboard", "recentPatients", limit],
    queryFn: () => api.dashboard.recentPatients(),
    select: limit
      ? (data: RecentPatient[] | undefined) => data?.slice(0, limit)
      : undefined,
  });
}
