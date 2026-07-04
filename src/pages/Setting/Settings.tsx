import React, { useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

import BackupSection from "../../components/settings/BackupSection";
import StatsCards from "../../components/settings/StatsCards";
import { useBackupSettings } from "../../hooks/useBackup";
import ClinicForm from "../../components/settings/ClinicForm";

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const clinicFormRef = useRef<{ save: () => void }>(null);
  const [brandingKey, setBrandingKey] = useState(0);

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: api.settings.get,
  });
  const { data: backupSettings } = useBackupSettings();

  const handleClinicSaved = useCallback(() => {
    setBrandingKey((k) => k + 1);
  }, []);

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

      <StatsCards backups={[]} backupSettings={backupSettings} />
    </div>
  );
};

export default Settings;
