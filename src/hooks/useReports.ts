import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useReportSummary() {
  return useQuery({
    queryKey: ["reports", "summary"],
    queryFn: () => api.reports.summary(),
  });
}

export function useMonthlyRevenue() {
  return useQuery({
    queryKey: ["reports", "monthlyRevenue"],
    queryFn: () => api.reports.monthlyRevenue(),
  });
}