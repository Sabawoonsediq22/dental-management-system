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
  Table,
  Badge,
  ConfirmDialog,
  Popover,
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
  const [restoreTarget, setRestoreTarget] = useState<number | null>(null);

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: api.settings.get,
  });
  const { data: backups, isLoading: backupsLoading } = useBackups();
  const { data: backupSettings } = useBackupSettings();
  const deleteBackup = useDeleteBackup();

  const restoreMutation = useMutation({
    mutationFn: (backupId: number) =>
      api.backups.restore({ backup_id: backupId, create_safety_backup: true }),
    onSuccess: () => {
      toast.success({
        title:
          "Database restored successfully. The application will now reload.",
      });
      queryClient.invalidateQueries();
      setTimeout(() => window.location.reload(), 2000);
    },
    onError: (err) => {
      toast.error({ title: "Restore failed", description: err?.toString() });
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
        onError: (err) =>
          toast.error({
            title: t("backup.deleteError"),
            description: err?.toString(),
          }),
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
        if (path?.startsWith("gdrive:")) {
          return t("backup.cloudStorage");
        }
        if (!path) return "-";
        const parts = path.replace(/\\/g, "/").split("/");
        const filename = parts[parts.length - 1];
        const folder = parts.length > 1 ? parts.slice(-2, -1)[0] : "";
        const shortPath = folder ? `${folder}/${filename}` : filename;
        return (
          <span
            title={path}
            className="text-xs font-mono truncate max-w-50 inline-block"
            style={{ textOverflow: "ellipsis" }}
          >
            {shortPath}
          </span>
        );
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
      render: (_: unknown, row: Record<string, unknown>) => {
        const actions: Array<{
          label: string;
          onClick: () => void;
          className?: string;
        }> = [];

        if (row.status === "success" && row.cloud_provider === "local") {
          actions.push({
            label: "Restore",
            onClick: () => handleRestore(row.id as number),
          });
        }
        // Allow restoring from Google Drive backups as well
        if (row.status === "success" && row.cloud_provider === "google_drive") {
          actions.push({
            label: "Restore",
            onClick: () => handleRestore(row.id as number),
          });
        }
        actions.push({
          label: t("common.delete"),
          onClick: () => handleDeleteBackup(row.id as number),
          className: "text-destructive",
        });

        return <Popover actions={actions} />;
      },
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
          <ClinicForm
            key={brandingKey}
            ref={clinicFormRef}
            settings={settings}
            onSaved={handleClinicSaved}
          />
        </div>
        <div className="space-y-6">
          <BackupSection />
        </div>
      </div>

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
        isLoading={restoreMutation.isLoading}
      />
    </div>
  );
};

export default Settings;
