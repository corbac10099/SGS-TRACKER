/**
 * Gestionnaire Discord Rich Presence (RPC) pour SGS-Tracker
 * Permet d'afficher l'activité en cours sur le profil Discord.
 * Contrôlé par l'utilisateur via l'interrupteur dans les Paramètres.
 */

const STORAGE_KEY = "sgs_discord_rpc_enabled";
const STORAGE_MODE_KEY = "sgs_discord_rpc_mode"; // "full" ou "discrete"

export function isDiscordRpcEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const val = localStorage.getItem(STORAGE_KEY);
  return val === "true"; // Désactivé par défaut par respect de la vie privée
}

export function setDiscordRpcEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
  if (!enabled) {
    clearDiscordActivity();
  }
}

export function getDiscordRpcMode(): "full" | "discrete" {
  if (typeof window === "undefined") return "full";
  return (localStorage.getItem(STORAGE_MODE_KEY) as "full" | "discrete") || "full";
}

export function setDiscordRpcMode(mode: "full" | "discrete"): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_MODE_KEY, mode);
}

export async function updateDiscordActivity(activity: {
  details: string;
  state: string;
  mapName?: string;
  agentName?: string;
}): Promise<boolean> {
  if (!isDiscordRpcEnabled()) return false;

  const mode = getDiscordRpcMode();
  const payload =
    mode === "discrete"
      ? {
          details: "Sur SGS-Tracker",
          state: "Analyse des statistiques",
        }
      : activity;

  try {
    const res = await fetch("/api/discord/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function clearDiscordActivity(): Promise<void> {
  try {
    await fetch("/api/discord/presence", {
      method: "DELETE",
    });
  } catch {}
}
