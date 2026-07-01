import React, { useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import BackupSection from "../../components/settings/BackupSection";
import StatsCards from "../../components/settings/StatsCards";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Table,
  Badge,
  ConfirmDialog,
  Modal,
  LoadingSpinner,
  toast,
} from "../../components/ui";
import {
  useBackups,
  useBackupSettings,
  useDeleteBackup,
} from "../../hooks/useBackup";
import ClinicForm from "../../components/settings/ClinicForm";

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const clinicFormRef = useRef<{ save: () => void }>(null);
  const [brandingKey, setBrandingKey] = useState(0);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showDbDialog, setShowDbDialog] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<number | null>(null);

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: api.settings.get,
  });
  const { data: backups, isLoading: backupsLoading } = useBackups();
  const { data: backupSettings } = useBackupSettings();
  const deleteBackup = useDeleteBackup();

  const { data: dbStats, refetch: refetchDbStats } = useQuery({
    queryKey: ["db-stats"],
    queryFn: api.database.getStats,
    enabled: false,
  });

  const { data: integrityResult, refetch: refetchIntegrity } = useQuery({
    queryKey: ["db-integrity"],
    queryFn: api.database.checkIntegrity,
    enabled: false,
  });

  const restoreMutation = useMutation({
    mutationFn: (backupId: number) =>
      api.backups.restore({ backup_id: backupId, create_safety_backup: true }),
    onSuccess: () => {
      toast.success({ title: "Database restored successfully. The application will now reload." });
      queryClient.invalidateQueries();
      setTimeout(() => window.location.reload(), 2000);
    },
    onError: (err) => {
      toast.error({ title: "Restore failed", description: err?.toString() });
    },
  });

  const vacuumMutation = useMutation({
    mutationFn: api.database.vacuum,
    onSuccess: () => {
      toast.success({ title: "Database optimized" });
      refetchDbStats();
    },
    onError: (err) => {
      toast.error({ title: "Vacuum failed", description: err?.toString() });
    },
  });

  const handleClinicSaved = useCallback(() => {
    setBrandingKey((k) => k + 1);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const statusBadge = (status: string) => {
    const variant =
      status === "success"
        ? "success"
        : status === "failed"
          ? "destructive"
          : "warning";
    return <Badge variant={variant}>{status}</Badge>;
  };

  const handleDeleteBackup = (id: number) => {
    if (confirm(t("backup.deleteConfirm"))) {
      deleteBackup.mutate(id, {
        onSuccess: () => toast.success({ title: t("backup.deleted") }),
        onError: (err) => toast.error({ title: t("backup.deleteError"), description: err?.toString() }),
      });
    }
  };

  const handleRestore = (backupId: number) => {
    setRestoreTarget(backupId);
    setShowRestoreDialog(true);
  };

  const confirmRestore = () => {
    if (restoreTarget !== null) {
      restoreMutation.mutate(restoreTarget);
      setShowRestoreDialog(false);
    }
  };

  const backupColumns = [
    {
      key: "created_at",
      header: t("backup.table.date"),
      render: (_: unknown, row: Record<string, unknown>) =>
        formatDate(row.created_at as string),
    },
    {
      key: "backup_type",
      header: t("backup.table.type"),
    },
    {
      key: "cloud_provider",
      header: t("backup.table.target"),
    },
    {
      key: "file_size",
      header: t("backup.table.size"),
      render: (_: unknown, row: Record<string, unknown>) =>
        formatFileSize(row.file_size as number),
    },
    {
      key: "backup_path",
      header: t("backup.table.location"),
      render: (_: unknown, row: Record<string, unknown>) => {
        const path = row.backup_path as string;
        if (path.startsWith("gdrive:")) {
          return t("backup.cloudStorage");
        }
        return path || "-";
      },
    },
    {
      key: "status",
      header: t("backup.table.status"),
      render: (_: unknown, row: Record<string, unknown>) =>
        statusBadge(row.status as string),
    },
    {
      key: "actions",
      header: t("backup.table.actions"),
      render: (_: unknown, row: Record<string, unknown>) => (
        <div className="flex gap-2">
          {row.status === "success" && row.cloud_provider === "local" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRestore(row.id as number)}
            >
              Restore
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteBackup(row.id as number)}
          >
            {t("common.delete")}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {t("settings.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("settings.subtitle")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <ClinicForm key={brandingKey} ref={clinicFormRef} settings={settings} onSaved={handleClinicSaved} />
        </div>
        <div className="space-y-6">
          <BackupSection />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Database Management</CardTitle>
          <CardDescription>Monitor and maintain your database health</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDbDialog(true);
                refetchDbStats();
                refetchIntegrity();
              }}
            >
              Check Database Health
            </Button>
            <Button
              variant="outline"
              onClick={() => vacuumMutation.mutate()}
              disabled={vacuumMutation.isPending}
            >
              {vacuumMutation.isPending ? "Optimizing..." : "Optimize Database (VACUUM)"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("backup.history")}</CardTitle>
            <CardDescription>
              {backups?.length
                ? t("backup.historyDesc", { count: backups.length })
                : t("backup.noBackups")}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Table
            data={(backups || []) as unknown as Record<string, unknown>[]}
            columns={backupColumns}
            isLoading={backupsLoading}
            emptyMessage={t("backup.noBackups")}
          />
        </CardContent>
      </Card>

      <StatsCards backups={backups || []} backupSettings={backupSettings} />

      <ConfirmDialog
        isOpen={showRestoreDialog}
        onClose={() => setShowRestoreDialog(false)}
        title="Restore Database"
        description="This will replace the current database with the backup. A safety backup of the current database will be created automatically."
        confirmText="Restore"
        onConfirm={confirmRestore}
        confirmVariant="destructive"
      />

      <Modal isOpen={showDbDialog} onClose={() => setShowDbDialog(false)}>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Database Health Report</h2>
          {dbStats ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Database Size</p>
                <p className="font-medium">{formatFileSize(dbStats.total_size_bytes)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Page Count</p>
                <p className="font-medium">{dbStats.page_count.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Free Pages</p>
                <p className="font-medium">{dbStats.freelist_count.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">WAL Mode</p>
                <p className="font-medium">{dbStats.wal_mode ? "Enabled" : "Disabled"}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          )}

          {integrityResult && (
            <div>
              <h3 className="font-medium mb-2">Integrity Check</h3>
              {integrityResult.length === 1 && integrityResult[0] === "ok" ? (
                <p className="text-green-600">Database integrity: OK</p>
              ) : (
                <div className="text-red-600 text-sm">
                  {integrityResult.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button onClick={() => setShowDbDialog(false)}>Close</Button>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
