import React, { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { openUrl } from "@tauri-apps/plugin-opener";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { exit } from "@tauri-apps/plugin-process";
import { api } from "../../lib/api";
import type { GDriveBackupFile } from "../../types/ApiTypes";
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
  useUpdateGdriveConnection,
} from "../../hooks/useBackup";
import {
  RefreshCwIcon,
  LoadingIcon,
  CheckCircleIcon,
  GDRIVE_LOGO_SVG_Icon,
} from "../../shared/icons/icons";
import FrequencyModal from "./FrequencyModal";

const frequencyLabels: Record<string, string> = {
  daily: "freqDaily",
  weekly: "freqWeekly",
  monthly: "freqMonthly",
};

function formatLastSync(
  dateStr: string | null,
  t: (key: string, opts?: any) => string,
): string {
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
  const [localBackupInProgress, setLocalBackupInProgress] = useState(false);
  const [gdriveBackupInProgress, setGdriveBackupInProgress] = useState(false);
  const [showGdriveRestoreModal, setShowGdriveRestoreModal] = useState(false);
  const [gdriveFiles, setGdriveFiles] = useState<GDriveBackupFile[]>([]);
  const [gdriveFilesLoading, setGdriveFilesLoading] = useState(false);
  const [gdriveFilesError, setGdriveFilesError] = useState<string | null>(null);
  const [showRestoreSuccess, setShowRestoreSuccess] = useState(false);
  const [restoreInProgress, setRestoreInProgress] = useState(false);
  const [localRestoreInProgress, setLocalRestoreInProgress] = useState(false);

  const localBackupInProgressRef = useRef(false);
  const gdriveBackupInProgressRef = useRef(false);
  const connectingRef = useRef(false);

  const restoreGdriveMutation = useMutation({
    mutationFn: (fileId: string) =>
      api.backups.restoreGdriveFile({ file_id: fileId, file_name: null }),
  });

  const restoreLocalMutation = useMutation({
    mutationFn: (filePath: string) =>
      api.backups.restoreLocalFile({ file_path: filePath }),
  });

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
    (backupTarget: string, localPath?: string) => {
      const isLocal = backupTarget === "local";
      const progressRef = isLocal
        ? localBackupInProgressRef
        : gdriveBackupInProgressRef;
      const setProgress = isLocal
        ? setLocalBackupInProgress
        : setGdriveBackupInProgress;
      if (progressRef.current) return;
      progressRef.current = true;
      setProgress(true);

      backupNow.mutate(
        { target: backupTarget, localPath },
        {
          onSuccess: (records) => {
            const successCount = records.filter(
              (r) => r.status === "success",
            ).length;
            const failCount = records.filter(
              (r) => r.status === "failed",
            ).length;
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
            progressRef.current = false;
            setProgress(false);
          },
        },
      );
    },
    [backupNow, t],
  );

  const handleBackupNow = async (backupTarget: string) => {
    const progressRef =
      backupTarget === "local"
        ? localBackupInProgressRef
        : gdriveBackupInProgressRef;
    if (progressRef.current) return;
    if (backupTarget === "google_drive" && !gdriveStatus?.connected) {
      toast.error({ title: t("backup.gdriveNotConnected") });
      return;
    }

    if (backupTarget === "local") {
      const selected = await open({
        directory: true,
        multiple: false,
        title: t("backup.selectFolder"),
      });
      if (!selected) return;

      let folderPath = selected as string;
      if (folderPath.startsWith("file://")) {
        const match = folderPath.match(
          /^file:\/\/\/([A-Za-z]:[/\\].*)$/
        );
        if (match) {
          folderPath = match[1];
        } else {
          folderPath = folderPath.replace(/^file:\/\//, "");
        }
      }
      folderPath = folderPath.trim().replace(/[/\\]+$/, "");
      if (!folderPath) return;

      executeBackup(backupTarget, folderPath);
    } else {
      executeBackup(backupTarget);
    }
  };

  const handleOpenGdriveRestore = async () => {
    setShowGdriveRestoreModal(true);
    setGdriveFilesLoading(true);
    setGdriveFilesError(null);
    try {
      const files = await api.backups.listGdriveFiles();
      setGdriveFiles(files);
    } catch (err) {
      setGdriveFilesError((err as Error)?.toString());
    } finally {
      setGdriveFilesLoading(false);
    }
  };

  const handleRestoreGdriveFile = async (fileId: string) => {
    setShowGdriveRestoreModal(false);
    setRestoreInProgress(true);
    const loadingToastId = toast.loading("Restoring backup...");
    try {
      await restoreGdriveMutation.mutateAsync(fileId);
      toast.dismiss(loadingToastId);
      setRestoreInProgress(false);
      setShowRestoreSuccess(true);
    } catch (err) {
      toast.dismiss(loadingToastId);
      setRestoreInProgress(false);
      toast.error({
        title: "Restore failed",
        description: (err as Error)?.toString(),
      });
    }
  };

  const handleRestoreExit = async () => {
    await exit(0);
  };

  const handleRestoreLocal = async () => {
    const selected = await open({
      multiple: false,
      title: t("backup.selectBackupFile"),
      filters: [
        {
          name: t("backup.databaseFiles"),
          extensions: ["db", "sqlite", "sqlite3"],
        },
      ],
    });
    if (!selected) return;

    let filePath = selected as string;
    if (filePath.startsWith("file://")) {
      const match = filePath.match(/^file:\/\/\/([A-Za-z]:[/\\].*)$/);
      if (match) {
        filePath = match[1];
      } else {
        filePath = filePath.replace(/^file:\/\//, "");
      }
    }
    filePath = filePath.trim();
    if (!filePath) return;

    setLocalRestoreInProgress(true);
    const loadingToastId = toast.loading(t("backup.restoring"));
    try {
      await restoreLocalMutation.mutateAsync(filePath);
      toast.dismiss(loadingToastId);
      setLocalRestoreInProgress(false);
      setShowRestoreSuccess(true);
    } catch (err) {
      toast.dismiss(loadingToastId);
      setLocalRestoreInProgress(false);
      toast.error({
        title: t("backup.restoreFailed"),
        description: (err as Error)?.toString(),
      });
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
                <div className="shrink-0">{<GDRIVE_LOGO_SVG_Icon/>}</div>
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
                    <Badge
                      variant="default"
                      className="text-[10px] px-1.5 py-0 h-5"
                    >
                      {t("backup.gdriveConnected")}
                    </Badge>
                    {gdriveStatus.last_sync_at && (
                      <span className="text-[10px] text-muted-foreground">
                        {t("backup.lastSynced")}:{" "}
                        {formatLastSync(gdriveStatus.last_sync_at, t)}
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
                    frequency: t(
                      `backup.${frequencyLabels[gdriveFrequency] || "freqDaily"}`,
                    ),
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
                  {t("backup.lastBackup")}:{" "}
                  {formatDate(settings.gdrive_last_backup_at)}
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
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              className="w-full"
              onClick={() => handleBackupNow("local")}
              disabled={localBackupInProgress}
            >
              {localBackupInProgress ? (
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
              className="w-full"
              onClick={() => handleBackupNow("google_drive")}
              disabled={gdriveBackupInProgress || !gdriveStatus?.connected}
            >
              {gdriveBackupInProgress ? (
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
            <Button
              size="sm"
              variant="outline"
              onClick={handleRestoreLocal}
              disabled={localRestoreInProgress}
            >
              {localRestoreInProgress ? (
                <>
                  <LoadingIcon size="sm" className="mr-1" />
                  {t("common.restoring")}
                </>
              ) : (
                t("backup.restoreLocal")
              )}
            </Button>
            {gdriveStatus?.connected && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenGdriveRestore}
              >
                {t("backup.restoreFromGdrive")}
              </Button>
            )}
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

      {/* GDrive Restore Modal */}
      <Modal
        isOpen={showGdriveRestoreModal}
        onClose={() => setShowGdriveRestoreModal(false)}
        title={t("backup.restoreFromGdrive")}
        size="lg"
        showCloseButton={!restoreInProgress}
      >
        {gdriveFilesLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingIcon size="md" />
          </div>
        ) : gdriveFilesError ? (
          <div className="text-sm text-destructive py-4">
            {gdriveFilesError}
          </div>
        ) : gdriveFiles.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No backups found in Google Drive.
          </p>
        ) : (
          <div className="space-y-1 max-h-80 overflow-y-auto -mx-1">
            {gdriveFiles.map((file) => (
              <button
                key={file.id}
                onClick={() => handleRestoreGdriveFile(file.id)}
                disabled={restoreInProgress}
                className="w-full text-left px-3 py-3 rounded-lg border border-border hover:bg-accent transition-colors disabled:opacity-50 cursor-pointer"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {file.modified_time
                        ? formatDate(file.modified_time)
                        : "Unknown date"}
                    </p>
                  </div>
                  {file.size != null && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </Modal>

      {/* Restore Success Blocking Overlay */}
      {showRestoreSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm">
          <div className="mx-auto max-w-sm text-center space-y-4 p-8">
            <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold">
              Restore Complete
            </h2>
            <p className="text-sm text-muted-foreground">
              The backup has been restored. Please restart the application to
              apply the changes.
            </p>
            <Button onClick={handleRestoreExit}>
              OK
            </Button>
          </div>
        </div>
      )}

      {/* Restore In Progress Overlay */}
      {(restoreInProgress || localRestoreInProgress) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm">
          <div className="mx-auto max-w-sm text-center space-y-4 p-8">
            <LoadingIcon size="lg" />
            <p className="text-sm text-muted-foreground">
              Restoring backup...
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default BackupSection;
