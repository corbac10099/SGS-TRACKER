"use client";

import { useState, useEffect, useCallback } from "react";

export interface DesktopUpdateInfo {
  latestVersion: string;
  releaseDate: string;
  features: string[];
  serverUrl: string;
  downloadUrl: string;
}

export function useDesktopApp() {
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const [updateStatus, setUpdateStatus] = useState<
    "idle" | "checking" | "up-to-date" | "update-available" | "error"
  >("idle");
  const [updateInfo, setUpdateInfo] = useState<DesktopUpdateInfo | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const CURRENT_DESKTOP_VERSION = "1.0.0";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const tauriPresent = Boolean(
        (window as any).__TAURI__ ||
        (window as any).__TAURI_INTERNALS__ ||
        (window as any).__TAURI_METADATA__
      );
      setIsDesktop(tauriPresent);
    }
  }, []);

  const checkForUpdates = useCallback(async () => {
    setUpdateStatus("checking");
    setStatusMessage("Recherche de la dernière version en ligne...");

    try {
      const res = await fetch("/api/desktop/version", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Erreur serveur lors de la vérification");

      const data: DesktopUpdateInfo = await res.json();
      setUpdateInfo(data);

      if (data.latestVersion && data.latestVersion !== CURRENT_DESKTOP_VERSION) {
        setUpdateStatus("update-available");
        setStatusMessage(
          `Nouvelle version ${data.latestVersion} disponible en ligne !`
        );
      } else {
        setUpdateStatus("up-to-date");
        setStatusMessage(
          `Votre application est à jour (${CURRENT_DESKTOP_VERSION}). Vos composants sont synchronisés avec le serveur.`
        );
      }
    } catch (err: any) {
      setUpdateStatus("error");
      setStatusMessage("Impossible de contacter le serveur de mise à jour.");
    }
  }, []);

  const reloadComponents = useCallback(() => {
    if (typeof window !== "undefined") {
      // Purge du cache applicatif si Service Worker actif puis rechargement
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          for (const reg of regs) {
            reg.update();
          }
        });
      }
      window.location.reload();
    }
  }, []);

  return {
    isDesktop,
    currentVersion: CURRENT_DESKTOP_VERSION,
    updateStatus,
    updateInfo,
    statusMessage,
    checkForUpdates,
    reloadComponents,
  };
}
