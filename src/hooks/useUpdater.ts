import { useState, useCallback, useEffect } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

interface UpdateState {
  checking: boolean;
  available: boolean;
  downloading: boolean;
  downloaded: boolean;
  version: string | null;
  error: string | null;
  progress: number;
}

export function useUpdater() {
  const [state, setState] = useState<UpdateState>({
    checking: false,
    available: false,
    downloading: false,
    downloaded: false,
    version: null,
    error: null,
    progress: 0,
  });

  const checkForUpdates = useCallback(async () => {
    setState((s) => ({ ...s, checking: true, error: null }));
    try {
      const update = await check();
      if (update?.available) {
        setState((s) => ({
          ...s,
          checking: false,
          available: true,
          version: update.version || null,
        }));
      } else {
        setState((s) => ({
          ...s,
          checking: false,
          available: false,
          version: null,
        }));
      }
    } catch (err) {
      setState((s) => ({
        ...s,
        checking: false,
        error: err instanceof Error ? err.message : "Failed to check for updates",
      }));
    }
  }, []);

  const downloadUpdate = useCallback(async () => {
    setState((s) => ({ ...s, downloading: true, error: null }));
    try {
      const update = await check();
      if (update?.available) {
        await update.download((event) => {
          if ("percent" in event) {
            setState((s) => ({ ...s, progress: (event.percent as number) || 0 }));
          }
        });
        setState((s) => ({
          ...s,
          downloading: false,
          downloaded: true,
          progress: 100,
        }));
      }
    } catch (err) {
      setState((s) => ({
        ...s,
        downloading: false,
        error: err instanceof Error ? err.message : "Failed to download update",
      }));
    }
  }, []);

  const installUpdate = useCallback(async () => {
    try {
      await relaunch();
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : "Failed to install update",
      }));
    }
  }, []);

  useEffect(() => {
    checkForUpdates();
  }, [checkForUpdates]);

  return {
    ...state,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
  };
}
