import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useBackups() {
  return useQuery({
    queryKey: ["backups"],
    queryFn: () => api.backups.list(),
  });
}

export function useBackupSettings() {
  return useQuery({
    queryKey: ["backupSettings"],
    queryFn: () => api.backups.getSettings(),
  });
}

export function useUpdateBackupSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.backups.updateSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["backupSettings"], refetchType: "all" });
      qc.invalidateQueries({ queryKey: ["settings"], refetchType: "all" });
    },
  });
}

export function useBackupNow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (target: string) => api.backups.backupNow(target),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["backups"], refetchType: "all" });
      qc.invalidateQueries({ queryKey: ["backupSettings"], refetchType: "all" });
    },
  });
}

export function useDeleteBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.backups.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["backups"], refetchType: "all" });
    },
  });
}

export function useGdriveAuth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.backups.startGdriveAuth(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["backupSettings"], refetchType: "all" });
    },
  });
}

export function useGdriveStatus() {
  return useQuery({
    queryKey: ["gdriveStatus"],
    queryFn: () => api.backups.getGdriveStatus(),
    refetchInterval: 3000,
  });
}

export function useDisconnectGdrive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.backups.disconnectGdrive(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gdriveStatus"], refetchType: "all" });
      qc.invalidateQueries({ queryKey: ["backupSettings"], refetchType: "all" });
    },
  });
}

export function useUpdateGdriveConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => api.backups.updateGdriveConnection(email),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gdriveStatus"], refetchType: "all" });
      qc.invalidateQueries({ queryKey: ["backupSettings"], refetchType: "all" });
    },
  });
}
