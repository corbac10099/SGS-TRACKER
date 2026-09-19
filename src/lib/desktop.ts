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

  // 1. Essayer via Tauri v2 IPC core.invoke
  try {
    const tauri = (window as any).__TAURI__;
    if (tauri?.core?.invoke) {
      await tauri.core.invoke("open_browser", { url });
      return true;
    }
  } catch (e) {
    console.warn("[Tauri] Erreur invoke open_browser:", e);
  }

  // 2. Essayer via Tauri __TAURI_INTERNALS__
  try {
    const internals = (window as any).__TAURI_INTERNALS__;
    if (internals?.invoke) {
      await internals.invoke("open_browser", { url });
      return true;
    }
  } catch (e) {
    console.warn("[Tauri] Erreur internals invoke open_browser:", e);
  }

  // 3. Fallback standard
  try {
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (newWindow) return true;
  } catch {}

  return false;
}
