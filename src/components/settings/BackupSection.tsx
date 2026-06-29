import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Switch,
  Select,
  Input,
  toast,
} from "../ui";
import { openUrl } from "@tauri-apps/plugin-opener";
import { listen } from "@tauri-apps/api/event";
import {
  useBackupSettings,
  useUpdateBackupSettings,
  useBackupNow,
  useGdriveAuth,
  useGdriveStatus,
  useDisconnectGdrive,
} from "../../hooks/useBackup";
import { RefreshCwIcon } from "../../shared/icons/icons";

const BackupSection: React.FC = () => {
  const { t } = useTranslation();
  const { data: settings } = useBackupSettings();
  const { data: gdriveStatus } = useGdriveStatus();

  const updateSettings = useUpdateBackupSettings();
  const backupNow = useBackupNow();
  const gdriveAuth = useGdriveAuth();
  const disconnectGdrive = useDisconnectGdrive();

  const [autoEnabled, setAutoEnabled] = React.useState(false);
  const [frequency, setFrequency] = React.useState("daily");
  const [target, setTarget] = React.useState("local");
  const [clientId, setClientId] = React.useState("");

  useEffect(() => {
    if (settings) {
      setAutoEnabled(settings.auto_backup_enabled);
      setFrequency(settings.auto_backup_frequency);
      setTarget(settings.auto_backup_target);
      setClientId(settings.gdrive_client_id || "");
    }
  }, [settings]);

  useEffect(() => {
    const unlisten = Promise.all([
      listen("gdrive-auth-success", () => {
        toast.success({ title: t("backup.gdriveConnected") });
      }),
      listen("gdrive-auth-error", () => {
        toast.error({ title: t("backup.gdriveAuthError") });
      }),
    ]);
    return () => {
      unlisten.then((fns) => fns.forEach((fn) => fn()));
    };
  }, [t]);

  const handleSaveSettings = () => {
    updateSettings.mutate({
      auto_backup_enabled: autoEnabled,
      auto_backup_frequency: frequency,
      auto_backup_target: target,
      gdrive_client_id: clientId || null,
    });
  };

  const handleBackupNow = (backupTarget: string) => {
    backupNow.mutate(backupTarget, {
      onSuccess: (records) => {
        const successCount = records.filter(
          (r) => r.status === "success",
        ).length;
        const failCount = records.filter((r) => r.status === "failed").length;
        if (successCount > 0) {
          toast.success({
            title: t("backup.success"),
            description: t("backup.successDesc", { count: successCount }),
          });
        }
        if (failCount > 0) {
          toast.error({
            title: t("backup.failed"),
            description: t("backup.failedDesc", { count: failCount }),
          });
        }
      },
      onError: (err) => {
        toast.error({
          title: t("backup.failed"),
          description: err?.toString(),
        });
      },
    });
  };

  const handleConnectGdrive = () => {
    gdriveAuth.mutate(undefined, {
      onSuccess: (result) => {
        openUrl(result.auth_url);
      },
      onError: (err) => {
        toast.error({
          title: t("backup.gdriveAuthError"),
          description: err?.toString(),
        });
      },
    });
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return t("backup.noLastBackup");
    try {
      const d = new Date(dateStr);
      return d.toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const nowSaving = backupNow.isPending;
  const settingsSaving = updateSettings.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("backup.title")}</CardTitle>
        <CardDescription>{t("backup.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Auto Backup */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold text-foreground">
                {t("backup.autoBackup")}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t("backup.enableAuto")}
              </p>
            </div>
            <Switch checked={autoEnabled} onCheckedChange={setAutoEnabled} />
          </div>

          {autoEnabled && (
            <div className="space-y-3 pl-0 border-l-2 border-primary/20">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {t("backup.frequency")}
                </label>
                <Select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                >
                  <option value="daily">{t("backup.freqDaily")}</option>
                  <option value="weekly">{t("backup.freqWeekly")}</option>
                  <option value="monthly">{t("backup.freqMonthly")}</option>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {t("backup.target")}
                </label>
                <Select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                >
                  <option value="local">{t("backup.targetLocal")}</option>
                  <option value="google_drive">
                    {t("backup.targetGdrive")}
                  </option>
                  <option value="both">{t("backup.targetBoth")}</option>
                </Select>
              </div>
              <Button
                size="sm"
                className="w-full"
                onClick={handleSaveSettings}
                disabled={settingsSaving}
              >
                {settingsSaving ? t("common.saving") : t("backup.saveSettings")}
              </Button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Manual Backup */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">
            {t("backup.manualBackup")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {settings?.last_backup_at
              ? `${t("backup.lastBackup")}: ${formatDate(settings.last_backup_at)}`
              : t("backup.noLastBackup")}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => handleBackupNow("local")}
              disabled={nowSaving}
            >
              {nowSaving ? (
                t("common.saving")
              ) : (
                <>
                  <RefreshCwIcon className="h-3.5 w-3.5" />
                  {t("backup.backupNowLocal")}
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="flex-1"
              onClick={() => handleBackupNow("google_drive")}
              disabled={nowSaving}
            >
              <RefreshCwIcon className="h-3.5 w-3.5" />
              {t("backup.backupNowGdrive")}
            </Button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Cloud Providers */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            {t("settings.cloudProviders")}
          </h3>

          {/* Google Drive */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#34A853] flex items-center justify-center text-white text-xs font-bold shrink-0">
                  G
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    Google Drive
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {gdriveStatus?.connected
                      ? t("backup.gdriveConnected")
                      : t("settings.notConnected")}
                  </p>
                </div>
              </div>
              {gdriveStatus?.connected ? (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => disconnectGdrive.mutate()}
                  className="shrink-0"
                >
                  {t("settings.disconnectProvider")}
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleConnectGdrive}
                  disabled={!clientId}
                  className="shrink-0"
                >
                  {t("settings.connectProvider")}
                </Button>
              )}
            </div>

            {!gdriveStatus?.connected && (
              <div className="flex gap-2">
                <Input
                  placeholder={t("backup.gdriveClientIdPlaceholder")}
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="text-xs h-8 flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleSaveSettings}
                  disabled={settingsSaving}
                  className="shrink-0"
                >
                  {t("backup.save")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BackupSection;
