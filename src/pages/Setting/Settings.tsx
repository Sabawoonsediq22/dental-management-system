import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
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
} from "../../components/ui";
import {
  useBackups,
  useBackupSettings,
  useDeleteBackup,
} from "../../hooks/useBackup";
import { SettingsIcon } from "../../shared/icons/icons";
import ClinicForm from "../../components/settings/ClinicForm";

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const clinicFormRef = useRef<{ save: () => void }>(null);

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: api.settings.get,
  });
  const { data: backups, isLoading: backupsLoading } = useBackups();
  const { data: backupSettings } = useBackupSettings();
  const deleteBackup = useDeleteBackup();

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
        onSuccess: () =>
          import("../../components/ui").then(({ toast }) =>
            toast.success({ title: t("backup.deleted") }),
          ),
        onError: (err) =>
          import("../../components/ui").then(({ toast }) =>
            toast.error({
              title: t("backup.deleteError"),
              description: err?.toString(),
            }),
          ),
      });
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
      key: "status",
      header: t("backup.table.status"),
      render: (_: unknown, row: Record<string, unknown>) =>
        statusBadge(row.status as string),
    },
    {
      key: "actions",
      header: t("backup.table.actions"),
      render: (_: unknown, row: Record<string, unknown>) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDeleteBackup(row.id as number)}
        >
          {t("common.delete")}
        </Button>
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
        <Button
          onClick={() => clinicFormRef.current?.save()}
          className="shrink-0"
        >
          <SettingsIcon className="mr-1.5" />
          {t("settings.saveChanges")}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="space-y-6">
          <ClinicForm ref={clinicFormRef} settings={settings} />
        </div>

        <div className="space-y-6">
          <BackupSection />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("backup.history")}</CardTitle>
          <CardDescription>
            {backups?.length
              ? t("backup.historyDesc", { count: backups.length })
              : t("backup.noBackups")}
          </CardDescription>
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
    </div>
  );
};

export default Settings;
