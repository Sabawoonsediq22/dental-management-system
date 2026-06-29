import React, { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { openUrl } from "@tauri-apps/plugin-opener";
import { listen } from "@tauri-apps/api/event";
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
  Modal,
  toast,
} from "../ui";
import {
  useBackupSettings,
  useUpdateBackupSettings,
  useBackupNow,
  useGdriveAuth,
  useGdriveStatus,
  useDisconnectGdrive,
} from "../../hooks/useBackup";
import {
  RefreshCwIcon,
  LoadingIcon,
  CheckCircleIcon,
} from "../../shared/icons/icons";

const BackupSection: React.FC = () => {
  const { t } = useTranslation();
  const { data: settings } = useBackupSettings();
  const { data: gdriveStatus } = useGdriveStatus();

  const updateSettings = useUpdateBackupSettings();
  const backupNow = useBackupNow();
  const gdriveAuth = useGdriveAuth();
  const disconnectGdrive = useDisconnectGdrive();

  const [autoEnabled, setAutoEnabled] = useState(false);
  const [frequency, setFrequency] = useState("daily");
  const [target, setTarget] = useState("local");
  const [clientId, setClientId] = useState("");

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [pendingBackupAfterAuth, setPendingBackupAfterAuth] = useState(false);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [showGdriveModal, setShowGdriveModal] = useState(false);
  const backupInProgressRef = useRef(false);

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
        setShowGdriveModal(false);
        if (pendingBackupAfterAuth) {
          setPendingBackupAfterAuth(false);
          executeBackup("google_drive");
        }
      }),
      listen("gdrive-auth-error", (event) => {
        toast.error({
          title: t("backup.gdriveAuthError"),
          description: String(event.payload),
        });
        setPendingBackupAfterAuth(false);
        setShowGdriveModal(false);
      }),
    ]);
    return () => {
      unlisten.then((fns) => fns.forEach((fn) => fn()));
    };
  }, [t, pendingBackupAfterAuth]);

  const handleAutoToggle = (enabled: boolean) => {
    setAutoEnabled(enabled);
    if (enabled) {
      setShowConfigModal(true);
    } else {
      updateSettings.mutate({ auto_backup_enabled: false });
    }
  };

  const handleSaveAutoConfig = () => {
    updateSettings.mutate(
      {
        auto_backup_enabled: true,
        auto_backup_frequency: frequency,
        auto_backup_target: target,
      },
      {
        onSuccess: () => {
          toast.success({ title: t("backup.settingsSaved") });
          setShowConfigModal(false);
        },
        onError: (err) => {
          toast.error({
            title: t("backup.saveError"),
            description: String(err),
          });
        },
      },
    );
  };

  const executeBackup = useCallback(
    (backupTarget: string) => {
      if (backupInProgressRef.current) return;
      backupInProgressRef.current = true;
      setBackupInProgress(true);

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
            description: String(err),
          });
        },
        onSettled: () => {
          backupInProgressRef.current = false;
          setBackupInProgress(false);
        },
      });
    },
    [backupNow, t],
  );

  const handleBackupNow = (backupTarget: string) => {
    if (backupInProgressRef.current) return;

    if (backupTarget === "google_drive") {
      if (gdriveStatus?.connected) {
        executeBackup("google_drive");
      } else {
        setPendingBackupAfterAuth(true);
        setShowGdriveModal(true);
        handleConnectGdrive();
      }
    } else {
      executeBackup(backupTarget);
    }
  };

  const handleConnectGdrive = () => {
    if (!clientId) {
      toast.error({ title: t("backup.gdriveClientIdRequired") });
      return;
    }
    gdriveAuth.mutate(undefined, {
      onSuccess: (result) => {
        openUrl(result.auth_url);
      },
      onError: (err) => {
        toast.error({
          title: t("backup.gdriveAuthError"),
          description: String(err),
        });
        setPendingBackupAfterAuth(false);
        setShowGdriveModal(false);
      },
    });
  };

  const handleDisconnectGdrive = () => {
    disconnectGdrive.mutate(undefined, {
      onSuccess: () => {
        toast.success({ title: t("backup.gdriveDisconnected") });
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

  const settingsSaving = updateSettings.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("backup.title")}</CardTitle>
        <CardDescription>{t("backup.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pb-14">
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
            <Switch checked={autoEnabled} onCheckedChange={handleAutoToggle} />
          </div>

          {autoEnabled && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircleIcon className="h-3.5 w-3.5 text-green-500" />
              {t("backup.configuredSummary", {
                frequency: t(`backup.freq${frequency.charAt(0).toUpperCase() + frequency.slice(1)}`),
                target: target,
              })}
              <button
                onClick={() => setShowConfigModal(true)}
                className="text-primary hover:underline ml-1 cursor-pointer"
              >
                {t("common.edit")}
              </button>
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
              disabled={backupInProgress}
            >
              {backupInProgress ? (
                <>
                  <LoadingIcon size="sm" className="mr-1" />
                  {t("common.backingUp")}
                </>
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
              disabled={backupInProgress}
            >
              {backupInProgress ? (
                <>
                  <LoadingIcon size="sm" className="mr-1" />
                  {t("common.backingUp")}
                </>
              ) : (
                <>
                  <RefreshCwIcon className="h-3.5 w-3.5" />
                  {t("backup.backupNowGdrive")}
                </>
              )}
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
          <div className="space-y-6">
            <div className="flex items-center justify-between px-3 py-6 rounded-lg border border-border bg-muted/30">
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
                  onClick={handleDisconnectGdrive}
                  className="shrink-0"
                >
                  {t("settings.disconnectProvider")}
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    setShowGdriveModal(true);
                  }}
                  disabled={!clientId}
                  className="shrink-0"
                >
                  {t("settings.connectProvider")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      {/* Auto Backup Configuration Modal */}
      <Modal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title={t("backup.autoBackupConfig")}
        description={t("backup.autoBackupConfigDesc")}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfigModal(false);
                if (!autoEnabled) {
                  setAutoEnabled(true);
                }
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSaveAutoConfig}
              disabled={settingsSaving}
            >
              {settingsSaving ? (
                <>
                  <LoadingIcon size="sm" className="mr-1" />
                  {t("common.saving")}
                </>
              ) : (
                t("backup.saveSettings")
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">
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
            <label className="text-sm font-medium text-foreground">
              {t("backup.target")}
            </label>
            <Select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="local">{t("backup.targetLocal")}</option>
              <option value="google_drive">{t("backup.targetGdrive")}</option>
              <option value="both">{t("backup.targetBoth")}</option>
            </Select>
          </div>
        </div>
      </Modal>

      {/* Google Drive Connection Modal */}
      <Modal
        isOpen={showGdriveModal && !gdriveStatus?.connected}
        onClose={() => {
          setShowGdriveModal(false);
          setPendingBackupAfterAuth(false);
        }}
        title={t("backup.connectGdrive")}
        description={t("backup.connectGdriveDesc")}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowGdriveModal(false);
                setPendingBackupAfterAuth(false);
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleConnectGdrive} disabled={!clientId}>
              {t("backup.connectAndBackup")}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {!clientId && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                {t("backup.gdriveClientId")}
              </label>
              <Input
                placeholder={t("backup.gdriveClientIdPlaceholder")}
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              />
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {t("backup.gdriveAuthInstructions")}
          </p>
        </div>
      </Modal>
    </Card>
  );
};

export default BackupSection;
