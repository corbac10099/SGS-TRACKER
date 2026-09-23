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

