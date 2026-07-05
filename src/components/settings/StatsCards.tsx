import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIcon,
  ClockIcon,
  CheckCircleIcon,
  RefreshCwIcon,
} from "../../shared/icons/icons";
import type { BackupRecord, BackupSettings } from "../../types/ApiTypes";

interface StatsCardsProps {
  backups: BackupRecord[];
  backupSettings: BackupSettings | undefined;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sublabel?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  sublabel,
}) => (
  <div className="rounded-lg border border-border bg-card dark:bg-gray-800 p-5 flex items-start gap-4 transition-shadow hover:shadow-sm">
    <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm text-muted-foreground truncate">{label}</p>
      <p className="text-xl font-semibold text-foreground tracking-tight mt-0.5">
        {value}
      </p>
      {sublabel && (
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {sublabel}
        </p>
      )}
    </div>
  </div>
);

const StatsCards: React.FC<StatsCardsProps> = ({ backups, backupSettings }) => {
  const { t } = useTranslation();

  const totalBackups = backups.length;
  const totalStorage = backups.reduce((sum, b) => sum + (b.file_size || 0), 0);
  const lastBackup = backupSettings?.last_backup_at
    ? new Date(backupSettings.last_backup_at).toLocaleString()
    : t("backup.noLastBackup");
  const isAutoBackupEnabled = Boolean(
    backupSettings?.auto_backup_enabled ||
    backupSettings?.gdrive_backup_enabled ||
    backupSettings?.local_backup_enabled,
  );
  const autoBackupStatus = isAutoBackupEnabled
    ? t("settings.statusEnabled")
    : t("settings.statusDisabled");
  const activeFrequency =
    backupSettings?.gdrive_backup_frequency ||
    backupSettings?.local_backup_frequency ||
    backupSettings?.auto_backup_frequency;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4">
        {t("settings.statistics")}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<RefreshCwIcon className="h-5 w-5" />}
          label={t("settings.totalBackups")}
          value={totalBackups}
        />
        <StatCard
          icon={<ActivityIcon className="h-5 w-5" />}
          label={t("settings.totalStorage")}
          value={formatFileSize(totalStorage)}
        />
        <StatCard
          icon={<ClockIcon className="h-5 w-5" />}
          label={t("settings.lastBackupStat")}
          value={lastBackup}
        />
        <StatCard
          icon={<CheckCircleIcon className="h-5 w-5" />}
          label={t("settings.autoBackup")}
          value={autoBackupStatus}
          sublabel={
            isAutoBackupEnabled && activeFrequency
              ? t(
                  `backup.freq${activeFrequency.charAt(0).toUpperCase()}${activeFrequency.slice(1)}`,
                )
              : undefined
          }
        />
      </div>
    </div>
  );
};

export default StatsCards;
