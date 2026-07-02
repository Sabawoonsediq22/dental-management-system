import React, { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { openUrl } from "@tauri-apps/plugin-opener";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Switch,
  ConfirmDialog,
  Badge,
  toast,
} from "../ui";
import {
  useBackupSettings,
  useUpdateBackupSettings,
  useBackupNow,
  useGdriveAuth,
  useGdriveStatus,
  useDisconnectGdrive,
  useUpdateGdriveConnection,
} from "../../hooks/useBackup";
import {
  RefreshCwIcon,
  LoadingIcon,
  CheckCircleIcon,
} from "../../shared/icons/icons";
import FrequencyModal from "./FrequencyModal";

const GDRIVE_LOGO_SVG = (
  <svg viewBox="0 0 87.3 78" className="h-8 w-8" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
    <path d="M43.65 25l-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9 9 0 00-1.2 4.5h27.5z" fill="#00ac47" />
    <path d="M73.4 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.5l-13.75 23.8c4.1 2.5 9.3 3.3 14.3 2.75 2.1-.25 4.2-.9 6.3-1.85z" fill="#ea4335" />
    <path d="M73.4 76.8c-2.1.95-4.2 1.6-6.3 1.85-5 .55-10.2-.25-14.3-2.75l-4.1 7.1v7.5c0 1.55.4 3.1 1.2 4.5h27.5l9.9-17.2z" fill="#2684fc" />
    <path d="M43.65 57.7l13.75-23.8h-27.5l-13.75 23.8h27.5z" fill="#ffba00" />
  </svg>
);

const frequencyLabels: Record<string, string> = {
  daily: "freqDaily",
  weekly: "freqWeekly",
  monthly: "freqMonthly",
};

function formatLastSync(dateStr: string | null, t: (key: string, opts?: any) => string): string {
  if (!dateStr) return "";
  const now = Date.now();
  const date = new Date(dateStr);
  const diffMs = now - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return t("backup.justNow");
  if (diffMinutes < 60) return t("backup.minutesAgo", { count: diffMinutes });
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return t("backup.hoursAgo", { count: diffHours });
  const diffDays = Math.floor(diffHours / 24);
  return t("backup.daysAgo", { count: diffDays });
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return dateStr;
  }
}

const BackupSection: React.FC = () => {
  const { t } = useTranslation();
  const { data: settings, isLoading: settingsLoading } = useBackupSettings();
  const { data: gdriveStatus } = useGdriveStatus();

  const updateSettings = useUpdateBackupSettings();
  const backupNow = useBackupNow();
  const gdriveAuth = useGdriveAuth();
  const disconnectGdrive = useDisconnectGdrive();
  const updateGdriveConnection = useUpdateGdriveConnection();

  const [gdriveEnabled, setGdriveEnabled] = useState(false);
  const [gdriveFrequency, setGdriveFrequency] = useState("daily");

  const [showGdriveFreqModal, setShowGdriveFreqModal] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [connectingGdrive, setConnectingGdrive] = useState(false);
  const [backupInProgress, setBackupInProgress] = useState(false);

  const backupInProgressRef = useRef(false);
  const connectingRef = useRef(false);

  useEffect(() => {
    if (settings) {
      setGdriveEnabled(settings.gdrive_backup_enabled);
      setGdriveFrequency(settings.gdrive_backup_frequency);
    }
  }, [settings]);

  useEffect(() => {
    const unlisten = Promise.all([
      listen("gdrive-auth-success", (event: any) => {
        const payload = event.payload as any;
        const email = payload?.email;
        if (email) {
          updateGdriveConnection.mutate(email, {
            onSuccess: () => {
              toast.success({ title: t("backup.gdriveConnectedStatus") });
              setConnectingGdrive(false);
              connectingRef.current = false;
              setShowGdriveFreqModal(true);
            },
            onError: () => {
              toast.error({ title: t("backup.gdriveConnectionError") });
              setConnectingGdrive(false);
              connectingRef.current = false;
              setGdriveEnabled(false);
            },
          });
        } else {
          toast.success({ title: t("backup.gdriveConnectedStatus") });
          setConnectingGdrive(false);
          connectingRef.current = false;
          setShowGdriveFreqModal(true);
        }
      }),
      listen("gdrive-auth-error", (event) => {
        toast.error({
          title: t("backup.gdriveAuthError"),
          description: String(event.payload),
        });
        setConnectingGdrive(false);
        connectingRef.current = false;
        setGdriveEnabled(false);
      }),
    ]);
    return () => {
      unlisten.then((fns) => fns.forEach((fn) => fn()));
    };
  }, [t, updateGdriveConnection]);

  const handleGdriveToggle = (enabled: boolean) => {
    if (enabled) {

      if (gdriveStatus?.connected) {
        setShowGdriveFreqModal(true);
      } else {
        if (connectingRef.current) return;
        connectingRef.current = true;
        setConnectingGdrive(true);

        gdriveAuth.mutate(undefined, {
          onSuccess: (result) => {
            openUrl(result.auth_url);
          },
          onError: (err) => {
            toast.error({
              title: t("backup.gdriveAuthError"),
              description: String(err),
            });
            setConnectingGdrive(false);
            connectingRef.current = false;
            setGdriveEnabled(false);
          },
        });
      }
    } else {
      setGdriveEnabled(false);
      updateSettings.mutate({ gdrive_backup_enabled: false });
    }
  };

  const handleGdriveFreqSave = (frequency: string) => {
    updateSettings.mutate(
      {
        gdrive_backup_enabled: true,
        gdrive_backup_frequency: frequency,
      },
      {
        onSuccess: () => {
          setGdriveFrequency(frequency);
          setGdriveEnabled(true);
          setShowGdriveFreqModal(false);
          toast.success({ title: t("backup.settingsSaved") });
        },
        onError: (err) => {
          setGdriveEnabled(false);
          setShowGdriveFreqModal(false);
          toast.error({
            title: t("backup.saveError"),
            description: String(err),
          });
        },
      },
    );
  };

  const handleGdriveFreqCancel = () => {
    setShowGdriveFreqModal(false);
    setGdriveEnabled(false);
  };

  const handleDisconnectGdrive = () => {
    setShowDisconnectConfirm(true);
  };

  const confirmDisconnectGdrive = () => {
    disconnectGdrive.mutate(undefined, {
      onSuccess: () => {
        toast.success({ title: t("backup.gdriveDisconnected") });
        setShowDisconnectConfirm(false);
        setGdriveEnabled(false);
      },
      onError: (err) => {
        toast.error({
          title: t("backup.gdriveConnectionError"),
          description: String(err),
        });
        setShowDisconnectConfirm(false);
      },
    });
  };

  const executeBackup = useCallback(
    (backupTarget: string, savePath?: string) => {
      if (backupInProgressRef.current) return;
      backupInProgressRef.current = true;
      setBackupInProgress(true);

      backupNow.mutate({ target: backupTarget, savePath }, {
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

  const handleBackupNow = async (backupTarget: string) => {
    if (backupInProgressRef.current) return;
    if (backupTarget === "google_drive" && !gdriveStatus?.connected) {
      toast.error({ title: t("backup.gdriveNotConnected") });
      return;
    }

    if (backupTarget === "local") {
      const selected = await open({
        directory: true,
        multiple: false,
        title: t("backup.selectBackupFolder"),
      });
      if (!selected) return;
      executeBackup(backupTarget, selected as string);
    } else {
      executeBackup(backupTarget);
    }
  };

  if (settingsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("backup.title")}</CardTitle>
          <CardDescription>{t("backup.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingIcon size="md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("backup.title")}</CardTitle>
        <CardDescription>{t("backup.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Automatic Google Drive Backup */}
        <div className="rounded-lg border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold text-foreground">
                {t("backup.autoGdriveBackup")}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t("backup.autoGdriveBackupDesc")}
              </p>
            </div>
            <Switch
              checked={gdriveEnabled}
              onCheckedChange={handleGdriveToggle}
              disabled={connectingGdrive}
            />
          </div>

          {connectingGdrive && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
              <LoadingIcon size="sm" />
              <span>{t("backup.connecting")}</span>
            </div>
          )}

          {gdriveStatus?.connected && !connectingGdrive && (
            <div className="flex items-center justify-between px-3 py-3 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0">{GDRIVE_LOGO_SVG}</div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-medium text-foreground truncate">
                    {t("backup.gdriveConnectedStatus")}
                  </p>
                  {gdriveStatus.email && (
                    <p className="text-xs text-muted-foreground truncate">
                      {gdriveStatus.email}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-[10px] px-1.5 py-0 h-5">
                      {t("backup.gdriveConnected")}
                    </Badge>
                    {gdriveStatus.last_sync_at && (
                      <span className="text-[10px] text-muted-foreground">
                        {t("backup.lastSynced")}: {formatLastSync(gdriveStatus.last_sync_at, t)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDisconnectGdrive}
                className="shrink-0"
              >
                {t("backup.gdriveDisconnect")}
              </Button>
            </div>
          )}

          {gdriveEnabled && !connectingGdrive && (
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircleIcon className="h-3.5 w-3.5 text-green-500" />
                <span>
                  {t("backup.configuredSummary", {
                    frequency: t(`backup.${frequencyLabels[gdriveFrequency] || "freqDaily"}`),
                  })}
                </span>
                <button
                  onClick={() => setShowGdriveFreqModal(true)}
                  className="text-primary hover:underline ml-1 cursor-pointer"
                >
                  {t("common.edit")}
                </button>
              </div>
              {settings?.gdrive_last_backup_at && (
                <p>
                  {t("backup.lastBackup")}: {formatDate(settings.gdrive_last_backup_at)}
                </p>
              )}
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
              disabled={backupInProgress || !gdriveStatus?.connected}
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
      </CardContent>

      {/* Google Drive Frequency Modal */}
      <FrequencyModal
        isOpen={showGdriveFreqModal}
        onClose={handleGdriveFreqCancel}
        onSave={handleGdriveFreqSave}
        isSaving={updateSettings.isPending}
      />

      {/* Disconnect Google Drive Confirmation */}
      <ConfirmDialog
        isOpen={showDisconnectConfirm}
        onClose={() => setShowDisconnectConfirm(false)}
        onConfirm={confirmDisconnectGdrive}
        title={t("backup.gdriveDisconnectConfirm")}
        description={t("backup.gdriveDisconnectConfirmDesc")}
        confirmText={t("backup.gdriveDisconnect")}
        confirmVariant="destructive"
        isLoading={disconnectGdrive.isPending}
      >
        <p className="text-sm text-muted-foreground">
          {t("backup.gdriveDisconnectConfirmDesc")}
        </p>
      </ConfirmDialog>
    </Card>
  );
};

export default BackupSection;
