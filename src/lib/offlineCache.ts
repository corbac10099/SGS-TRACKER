/**
 * Module de Résilience et Cache Hors-Ligne (Offline Mode) pour SGS-Tracker
 * Permet de continuer à naviguer sur les cartes 2D, les guides d'agents et les stats
 * même en cas de coupure de connexion internet ou d'indisponibilité du serveur.
 */

const CACHE_PREFIX = "sgs_offline_cache_";

export interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

export function isOnline(): boolean {
  if (typeof window === "undefined") return true;
  return navigator.onLine;
}

export function saveToOfflineCache<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry<T> = {
      timestamp: Date.now(),
      data,
    };
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
  } catch (e) {
    console.warn(`[OfflineCache] Impossible de cacher ${key}:`, e);
  }
}

export function getFromOfflineCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    return entry.data;
  } catch {
    return null;
  }
}

/**
 * Exécute un fetch avec fallback automatique et transparent vers le cache local
 * en cas de perte de connexion réseau.
 */
export async function fetchWithOfflineFallback<T>(url: string, cacheKey: string): Promise<{ data: T; fromCache: boolean }> {
  // 1. Si on sait qu'on est hors ligne, renvoyer le cache immédiatement
  if (typeof window !== "undefined" && !navigator.onLine) {
    const cached = getFromOfflineCache<T>(cacheKey);
    if (cached) {
      return { data: cached, fromCache: true };
    }
  }

  // 2. Tenter l'appel réseau
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data: T = await res.json();
      saveToOfflineCache<T>(cacheKey, data);
      return { data, fromCache: false };
    }
    throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.warn(`[OfflineFallback] Erreur réseau pour ${url}, bascule sur le cache local:`, err);
    const cached = getFromOfflineCache<T>(cacheKey);
    if (cached) {
      return { data: cached, fromCache: true };
    }
    throw err;
  }
}

/**
 * Pré-charge les données critiques dans le cache local (Cartes 2D, Guides, Gamemodes).
 */
export async function preloadCriticalDataForOffline(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await Promise.allSettled([
      fetchWithOfflineFallback("/api/cms/maps", "maps_list"),
      fetchWithOfflineFallback("/api/cms/agents", "agents_list"),
      fetchWithOfflineFallback("/api/cms/gamemodes", "gamemodes_list"),
    ]);
    console.log("[OfflineCache] Données critiques pré-chargées pour la consultation hors-ligne.");
  } catch {}
}
