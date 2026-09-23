import { useState, useEffect, useCallback } from "react";
import { isTauriEnvironment, checkForDesktopUpdate, installDesktopUpdate } from "@/lib/desktop";

export interface DesktopUpdateInfo {
  latestVersion?: string;
  releaseDate?: string;
  features?: string[];
  body?: string;
}

export function useDesktopApp() {
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const [updateStatus, setUpdateStatus] = useState<
    "idle" | "checking" | "up-to-date" | "update-available" | "installing" | "error"
  >("idle");
  const [updateInfo, setUpdateInfo] = useState<DesktopUpdateInfo | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const CURRENT_DESKTOP_VERSION = "1.0.0";

  useEffect(() => {
    setIsDesktop(isTauriEnvironment());
  }, []);

  const checkForUpdates = useCallback(async () => {
    setUpdateStatus("checking");
    setStatusMessage("Recherche de mise à jour pour votre application...");

    // 1. Si on est dans l'environnement de bureau Tauri (v2 Updater)
    if (isTauriEnvironment()) {
      try {
        const update = await checkForDesktopUpdate();
        if (update.available && update.version) {
          setUpdateStatus("update-available");
          setUpdateInfo({
            latestVersion: update.version,
            body: update.body || "",
            releaseDate: update.date || "",
          });
          setStatusMessage(
            `Nouvelle version ${update.version} disponible ! Cliquez sur Mettre à jour pour l'installer sans réinstaller.`
          );
          return;
        } else if (update.error) {
          // Si aucune mise à jour n'est disponible (code 204), ou à jour
          setUpdateStatus("up-to-date");
          setStatusMessage(`Votre application est à jour (v${CURRENT_DESKTOP_VERSION}).`);
          return;
        } else {
          setUpdateStatus("up-to-date");
          setStatusMessage(`Votre application est à jour (v${CURRENT_DESKTOP_VERSION}).`);
          return;
        }
      } catch (err: any) {
        setUpdateStatus("error");
        setStatusMessage(err?.message || "Erreur de connexion au serveur de mise à jour.");
        return;
      }
    }

    // 2. Fallback Web / PWA
    try {
      const res = await fetch("/api/tracker/update-manifest?target=online", { cache: "no-store" });
      if (res.status === 204) {
        setUpdateStatus("up-to-date");
        setStatusMessage(`Votre application est à jour (v${CURRENT_DESKTOP_VERSION}).`);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.version && data.version !== CURRENT_DESKTOP_VERSION) {
          setUpdateStatus("update-available");
          setUpdateInfo({ latestVersion: data.version, body: data.notes || "" });
          setStatusMessage(`Nouvelle version ${data.version} disponible.`);
          return;
        }
      }
      setUpdateStatus("up-to-date");
      setStatusMessage(`Votre application est à jour (v${CURRENT_DESKTOP_VERSION}).`);
    } catch {
      setUpdateStatus("up-to-date");
      setStatusMessage(`Votre application est à jour (v${CURRENT_DESKTOP_VERSION}).`);
    }
  }, []);

  const installUpdate = useCallback(async () => {
    if (!isTauriEnvironment()) return;
    setUpdateStatus("installing");
    setStatusMessage("Téléchargement et installation transparente du patch... Redémarrage automatique...");

    const res = await installDesktopUpdate();
    if (!res.success) {
      setUpdateStatus("error");
      setStatusMessage(res.message || "Échec de l'installation de la mise à jour.");
    }
  }, []);

  const reloadComponents = useCallback(() => {
    if (typeof window !== "undefined") {
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
    installUpdate,
    reloadComponents,
  };
}
