"use client";

/**
 * Utilitaires pour synchroniser l'état d'authentification dans le navigateur
 * et éliminer le flash de la LandingPage au rafraîchissement (FOUC).
 */

export function setClientSessionActive() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("sgs_user_authenticated", "true");
    document.cookie = "sgs_auth=1; path=/; max-age=2592000; SameSite=Lax";
    document.documentElement.classList.add("sgs-has-session");
  } catch (e) {
    console.error("Erreur setClientSessionActive:", e);
  }
}

export function clearClientSession() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("sgs_user_authenticated");
    localStorage.removeItem("spycam_my_riot_id");
    sessionStorage.removeItem("spycam_guest_mode");
    sessionStorage.removeItem("spycam_guest_id");
    document.cookie = "sgs_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.documentElement.classList.remove("sgs-has-session");
  } catch (e) {
    console.error("Erreur clearClientSession:", e);
  }
}

export function hasClientSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      localStorage.getItem("sgs_user_authenticated") === "true" ||
      sessionStorage.getItem("spycam_guest_mode") === "true" ||
      document.cookie.includes("sgs_auth=1") ||
      Boolean(localStorage.getItem("spycam_my_riot_id"))
    );
  } catch {
    return false;
  }
}
