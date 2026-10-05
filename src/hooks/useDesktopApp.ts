import { useState, useEffect, useCallback } from "react";
import {
  isTauriEnvironment,
  checkForDesktopUpdate,
  installDesktopUpdate,
  getAppVersion,
} from "@/lib/desktop";

export interface DesktopUpdateInfo {
  latestVersion?: string;
  releaseDate?: string;
  features?: string[];
  body?: string;
  downloadUrl?: string;
  fileSize?: string;
}

function isNewerVersion(remote: string, current: string): boolean {
  if (!remote || !current) return false;
  const cleanRemote = remote.trim().replace(/^v/i, "");
  const cleanCurrent = current.trim().replace(/^v/i, "");
  if (cleanRemote === cleanCurrent) return false;

  const rParts = cleanRemote.split(".").map((n) => parseInt(n, 10) || 0);
  const cParts = cleanCurrent.split(".").map((n) => parseInt(n, 10) || 0);

  for (let i = 0; i < Math.max(rParts.length, cParts.length); i++) {
    const r = rParts[i] ?? 0;
    const c = cParts[i] ?? 0;
    if (r > c) return true;
    if (r < c) return false;
  }
  return false;
}

export function useDesktopApp() {
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const [currentVersion, setCurrentVersion] = useState<string>("1.0.0");
  const [updateStatus, setUpdateStatus] = useState<
    "idle" | "checking" | "up-to-date" | "update-available" | "installing" | "error"
  >("idle");
  const [updateInfo, setUpdateInfo] = useState<DesktopUpdateInfo | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const checkForUpdates = useCallback(async () => {
    // Si on est sur le Web (hors application de bureau), aucune mise à jour à proposer
    if (!isTauriEnvironment()) {
      setUpdateStatus("up-to-date");
      setStatusMessage("Version Web & PWA — Synchronisée en direct via le cloud.");
      return;
    }

    setUpdateStatus("checking");
    setStatusMessage("Recherche de mise à jour pour votre application...");

    // Déterminer la version actuelle effective
    const storedVer = typeof window !== "undefined" ? localStorage.getItem("sgs_installed_app_version") : null;
    const nativeVer = await getAppVersion().catch(() => "1.0.0");
    const activeVer = storedVer || (nativeVer && nativeVer !== "0.0.0" && nativeVer !== "0.1.0" ? nativeVer : "1.0.1");
    setCurrentVersion(activeVer);

    // 1. Interrogation du manifest officiel de release (compatible R2 et local)
    try {
      const res = await fetch("/api/app-release", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const latestVer = data.version || "1.0.0";

        if (isNewerVersion(latestVer, activeVer)) {
          const dlUrl = data.r2DownloadUrl || data.r2Url || data.downloadUrl || "/installers/SGS-Tracker-Setup.exe";
          const notesText = Array.isArray(data.changelog)
            ? data.changelog.join("\n• ")
            : (data.changelog || data.notes || "");

          setUpdateStatus("update-available");
          setUpdateInfo({
            latestVersion: latestVer,
            releaseDate: data.releaseDate || "",
            body: notesText,
            features: Array.isArray(data.changelog) ? data.changelog : [],
            downloadUrl: dlUrl,
            fileSize: data.fileSize || "",
          });
          setStatusMessage(
            `Nouvelle version ${latestVer} disponible ! Cliquez pour lancer la mise à jour interne.`
          );
          return;
        }
      }
    } catch (e) {
      console.warn("[Updater] Erreur lecture /api/app-release:", e);
    }

    // 2. Fallback Tauri natif si disponible
    try {
      const update = await checkForDesktopUpdate();
      if (update.available && update.version && isNewerVersion(update.version, activeVer)) {
        setUpdateStatus("update-available");
        setUpdateInfo({
          latestVersion: update.version,
          body: update.body || "",
          releaseDate: update.date || "",
          downloadUrl: "/installers/SGS-Tracker-Setup.exe",
        });
        setStatusMessage(`Nouvelle version ${update.version} disponible !`);
        return;
      }
    } catch (err: any) {
      console.warn("[Tauri] Erreur updater natif:", err);
    }

    setUpdateStatus("up-to-date");
    setStatusMessage(`Votre application est à jour (v${activeVer}).`);
  }, []);

  useEffect(() => {
    const desktopEnv = isTauriEnvironment();
    setIsDesktop(desktopEnv);

    if (!desktopEnv) {
      setUpdateStatus("up-to-date");
      setStatusMessage("Version Web & PWA — Synchronisée en direct via le cloud.");
      return;
    }

    const storedVer = typeof window !== "undefined" ? localStorage.getItem("sgs_installed_app_version") : null;
    if (storedVer) {
      setCurrentVersion(storedVer);
    } else {
      getAppVersion().then((ver) => {
        if (ver && ver !== "0.0.0" && ver !== "0.1.0") {
          setCurrentVersion(ver);
        }
      });
    }

    const timer = setTimeout(() => {
      checkForUpdates();
    }, 1500);
    return () => clearTimeout(timer);
  }, [checkForUpdates]);

  const installUpdate = useCallback(async () => {
    setUpdateStatus("installing");
    setStatusMessage("Téléchargement et application interne de la mise à jour... Veuillez patienter.");

    const targetUrl = updateInfo?.downloadUrl || "/installers/SGS-Tracker-Setup.exe";
    const res = await installDesktopUpdate(targetUrl);

    if (res.success) {
      if (updateInfo?.latestVersion && typeof window !== "undefined") {
        localStorage.setItem("sgs_installed_app_version", updateInfo.latestVersion);
        setCurrentVersion(updateInfo.latestVersion);
      }
      setStatusMessage(res.message || "Mise à jour interne appliquée avec succès ! Redémarrage en cours...");
    } else {
      setUpdateStatus("error");
      setStatusMessage(res.message || "Échec de l'installation de la mise à jour.");
    }
  }, [updateInfo]);

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
    currentVersion,
    updateStatus,
    updateInfo,
    statusMessage,
    checkForUpdates,
    installUpdate,
    reloadComponents,
  };
}
