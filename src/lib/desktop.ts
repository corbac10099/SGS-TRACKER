/**
 * Utilitaires pour l'application bureau (Tauri v2)
 */

export function isTauriEnvironment(): boolean {
  if (typeof window === "undefined") return false;
  const ua = typeof navigator !== "undefined" ? (navigator.userAgent || "") : "";
  return Boolean(
    (window as any).__TAURI__ ||
    (window as any).__TAURI_INTERNALS__ ||
    (window as any).__TAURI_METADATA__ ||
    ua.includes("SGS-Tracker-Desktop") ||
    ua.includes("Tauri")
  );
}


/**
 * Ouvre une URL dans le navigateur web par défaut du système (Chrome, Edge, Firefox...).
 * Utilise la commande Tauri IPC `open_browser` si disponible, sinon fallback standard.
 */
export async function openInExternalBrowser(url: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // 1. Essayer via le plugin opener officiel de Tauri v2
  try {
    const tauri = (window as any).__TAURI__;
    if (tauri?.core?.invoke) {
      await tauri.core.invoke("plugin:opener|open_url", { url });
      return true;
    }
  } catch (e) {
    console.warn("[Tauri] Erreur plugin opener:", e);
  }

  // 2. Essayer via la commande personnalisée Tauri open_browser
  try {
    const tauri = (window as any).__TAURI__;
    if (tauri?.core?.invoke) {
      await tauri.core.invoke("open_browser", { url });
      return true;
    }
  } catch (e) {
    console.warn("[Tauri] Erreur invoke open_browser:", e);
  }

  // 3. Essayer via Tauri __TAURI_INTERNALS__
  try {
    const internals = (window as any).__TAURI_INTERNALS__;
    if (internals?.invoke) {
      try {
        await internals.invoke("plugin:opener|open_url", { url });
        return true;
      } catch {}
      await internals.invoke("open_browser", { url });
      return true;
    }
  } catch (e) {}

  // 4. Fallback standard
  try {
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (newWindow) return true;
  } catch {}

  return false;
}

/**
 * Récupère la version native de l'application depuis le package Tauri.
 */
export async function getAppVersion(): Promise<string> {
  if (typeof window === "undefined" || !isTauriEnvironment()) {
    return "1.0.0";
  }
  try {
    const tauri = (window as any).__TAURI__;
    if (tauri?.core?.invoke) {
      return await tauri.core.invoke("get_app_version");
    }
  } catch {}
  try {
    const internals = (window as any).__TAURI_INTERNALS__;
    if (internals?.invoke) {
      return await internals.invoke("get_app_version");
    }
  } catch {}
  return "1.0.0";
}

/**
 * Déclenche le déplacement fluide natif de la fenêtre à la souris.
 */
export async function startDragWindow(): Promise<void> {
  if (typeof window === "undefined" || !isTauriEnvironment()) return;
  try {
    const tauri = (window as any).__TAURI__;
    if (tauri?.core?.invoke) {
      await tauri.core.invoke("start_drag_window");
      return;
    }
  } catch {}
  try {
    const internals = (window as any).__TAURI_INTERNALS__;
    if (internals?.invoke) {
      await internals.invoke("start_drag_window");
    }
  } catch {}
}

/**
 * Modifie la taille de la fenêtre d'overlay en pixels logiques.
 */
export async function setOverlaySize(width: number, height: number): Promise<void> {
  if (typeof window === "undefined" || !isTauriEnvironment()) return;
  try {
    const tauri = (window as any).__TAURI__;
    if (tauri?.core?.invoke) {
      await tauri.core.invoke("set_overlay_size", { width, height });
      return;
    }
  } catch {}
  try {
    const internals = (window as any).__TAURI_INTERNALS__;
    if (internals?.invoke) {
      await internals.invoke("set_overlay_size", { width, height });
    }
  } catch {}
}

/**
 * Déplace la fenêtre d'overlay selon un delta x et y.
 */
export async function moveOverlayWindow(deltaX: number, deltaY: number): Promise<void> {
  if (typeof window === "undefined" || !isTauriEnvironment()) return;
  const payload = { deltaX, deltaY, delta_x: deltaX, delta_y: deltaY };
  try {
    const tauri = (window as any).__TAURI__;
    if (tauri?.core?.invoke) {
      await tauri.core.invoke("move_overlay_window", payload);
      return;
    }
  } catch {}
  try {
    const internals = (window as any).__TAURI_INTERNALS__;
    if (internals?.invoke) {
      await internals.invoke("move_overlay_window", payload);
    }
  } catch {}
}

/**
 * Récupère les coordonnées (x, y) de la fenêtre d'overlay en pixels logiques.
 */
export async function getOverlayPosition(): Promise<[number, number] | null> {
  if (typeof window === "undefined" || !isTauriEnvironment()) return null;
  try {
    const tauri = (window as any).__TAURI__;
    if (tauri?.core?.invoke) {
      return await tauri.core.invoke("get_overlay_position");
    }
  } catch {}
  try {
    const internals = (window as any).__TAURI_INTERNALS__;
    if (internals?.invoke) {
      return await internals.invoke("get_overlay_position");
    }
  } catch {}
  return null;
}

/**
 * Définit la position absolue (x, y) de la fenêtre d'overlay en pixels logiques.
 */
export async function setOverlayPosition(x: number, y: number): Promise<void> {
  if (typeof window === "undefined" || !isTauriEnvironment()) return;
  const payload = { x, y };
  try {
    const tauri = (window as any).__TAURI__;
    if (tauri?.core?.invoke) {
      await tauri.core.invoke("set_overlay_position", payload);
      return;
    }
  } catch {}
  try {
    const internals = (window as any).__TAURI_INTERNALS__;
    if (internals?.invoke) {
      await internals.invoke("set_overlay_position", payload);
    }
  } catch {}
}

/**
 * Active ou désactive la traversée des clics souris (click-through) sur l'overlay.
 * Si activé, la souris et les tirs traversent directement vers le jeu Valorant.
 */
export async function setOverlayClickThrough(enabled: boolean): Promise<void> {
  if (typeof window === "undefined" || !isTauriEnvironment()) return;
  const payload = { enabled };
  try {
    const tauri = (window as any).__TAURI__;
    if (tauri?.core?.invoke) {
      await tauri.core.invoke("set_overlay_click_through", payload);
      return;
    }
  } catch {}
  try {
    const internals = (window as any).__TAURI_INTERNALS__;
    if (internals?.invoke) {
      await internals.invoke("set_overlay_click_through", payload);
    }
  } catch {}
}


/**
 * Retourne la couleur de fond hexadécimale associée à un thème utilisateur.
 */
export function getThemeBackgroundColor(theme: string | null | undefined): string {
  if (!theme || theme === "dark") return "#0a0e13";
  if (theme === "light") return "#f1f4f9";
  if (theme === "midnight") return "#0d0b1a";
  if (theme === "crimson") return "#120808";
  if (theme === "ocean") return "#071014";
  if (theme.startsWith("custom:")) {
    const matchBg = theme.match(/bg=([^,]+)/);
    if (matchBg && matchBg[1]) return matchBg[1];
  }
  return "#0a0e13";
}

/**
 * Met à jour dynamiquement la couleur de la barre de titre native (Windows 11 DWM).
 */
export async function setTitleBarColor(hexColor: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!isTauriEnvironment()) return false;

  let hex = hexColor.trim().replace("#", "");
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("");
  }
  if (hex.length !== 6) return false;

  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;

  // 1. Essayer via __TAURI__.core.invoke
  try {
    const tauri = (window as any).__TAURI__;
    if (tauri?.core?.invoke) {
      await tauri.core.invoke("set_titlebar_color", { r, g, b });
      return true;
    }
  } catch (e) {
    console.warn("[Tauri] Erreur invoke set_titlebar_color:", e);
  }

  // 2. Essayer via __TAURI_INTERNALS__
  try {
    const internals = (window as any).__TAURI_INTERNALS__;
    if (internals?.invoke) {
      await internals.invoke("set_titlebar_color", { r, g, b });
      return true;
    }
  } catch (e) {}

  return false;
}

export interface DesktopUpdateInfo {
  available: boolean;
  version?: string;
  currentVersion?: string;
  body?: string;
  date?: string;
  error?: string;
}

/**
 * Vérifie si une mise à jour de l'application de bureau est disponible.
 */
export async function checkForDesktopUpdate(): Promise<DesktopUpdateInfo> {
  if (typeof window === "undefined" || !isTauriEnvironment()) {
    return { available: false, error: "Non disponible hors de l'application de bureau." };
  }

  try {
    const tauri = (window as any).__TAURI__;
    if (tauri?.core?.invoke) {
      const res = await tauri.core.invoke("check_app_update");
      return res;
    }
  } catch (e: any) {
    console.warn("[Tauri] Erreur check_app_update:", e);
    return { available: false, error: e?.message || String(e) };
  }

  try {
    const internals = (window as any).__TAURI_INTERNALS__;
    if (internals?.invoke) {
      const res = await internals.invoke("check_app_update");
      return res;
    }
  } catch (e: any) {
    return { available: false, error: e?.message || String(e) };
  }

  return { available: false, error: "Tauri IPC non initialisé." };
}

/**
 * Télécharge et applique la mise à jour puis lance l'installation de la nouvelle version.
 */
export async function installDesktopUpdate(downloadUrl?: string): Promise<{ success: boolean; message: string }> {
  if (typeof window === "undefined") {
    return { success: false, message: "Environnement invalide." };
  }

  // Si on est dans Tauri Desktop
  if (isTauriEnvironment()) {
    const targetUrl = downloadUrl || "/installers/SGS-Tracker-Setup.exe";

    // 1. Mise à jour transparente en interne (in-place silent update)
    try {
      const tauri = (window as any).__TAURI__;
      if (tauri?.core?.invoke) {
        const msg = await tauri.core.invoke("apply_in_place_update", { url: targetUrl });
        return { success: true, message: msg || "Mise à jour interne appliquée ! Redémarrage en cours..." };
      }
    } catch (e: any) {
      console.warn("[Tauri] Erreur apply_in_place_update:", e);
    }

    try {
      const internals = (window as any).__TAURI_INTERNALS__;
      if (internals?.invoke) {
        const msg = await internals.invoke("apply_in_place_update", { url: targetUrl });
        return { success: true, message: msg || "Mise à jour interne appliquée ! Redémarrage en cours..." };
      }
    } catch (e: any) {}

    // 2. Fallback vers l'updater natif de Tauri
    try {
      const tauri = (window as any).__TAURI__;
      if (tauri?.core?.invoke) {
        const msg = await tauri.core.invoke("install_app_update");
        return { success: true, message: msg || "Mise à jour en cours d'installation..." };
      }
    } catch (e: any) {
      console.warn("[Tauri] Fallback install_app_update:", e);
    }
  }

  // Si hors application de bureau ou fallback : ouvrir le lien de téléchargement direct
  if (downloadUrl) {
    try {
      window.open(downloadUrl, "_blank");
      return { success: true, message: "Téléchargement du nouvel installeur démarré dans votre navigateur." };
    } catch (e) {}
  }

  return { success: false, message: "Impossible de joindre le service de mise à jour." };
}


