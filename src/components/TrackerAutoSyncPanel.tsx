"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

interface TrackedProfile {
  id: string;
  riotId: string;
  gameName: string;
  tagLine: string;
  region: string;
  linkedEmail: string;
  syncIntervalMin: number;
  isActive: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: string;
  lastSyncError: string | null;
  lastRank: string | null;
  lastRankTier: number | null;
  lastRankUrl: string | null;
  totalSyncs: number;
  createdAt: string;
  updatedAt: string;
  snapshots?: any[];
}

const INTERVAL_OPTIONS = [
  { value: 1, label: "1 min" },
  { value: 2, label: "2 min" },
  { value: 5, label: "5 min" },
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 60, label: "1 heure" },
  { value: 360, label: "6 heures" },
  { value: 720, label: "12 heures" },
  { value: 1440, label: "24 heures" },
];

const REGION_OPTIONS = [
  { value: "eu", label: "Europe" },
  { value: "na", label: "Amérique du Nord" },
  { value: "ap", label: "Asie-Pacifique" },
  { value: "kr", label: "Corée" },
  { value: "br", label: "Brésil" },
  { value: "latam", label: "Amérique Latine" },
];

/**
 * Panneau d'auto-synchronisation de profils Valorant.
 * Permet de configurer des profils suivis qui sont automatiquement
 * mis à jour via l'API Henrik Dev dans la base Neon DB.
 */
export default function TrackerAutoSyncPanel() {
  const [profiles, setProfiles] = useState<TrackedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Formulaire d'ajout
  const [newRiotId, setNewRiotId] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newInterval, setNewInterval] = useState(5);
  const [newRegion, setNewRegion] = useState("eu");
  const [addLoading, setAddLoading] = useState(false);

  // Timers auto-sync côté client
  const timerRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  // Charger les profils
  const fetchProfiles = useCallback(async () => {
    try {
      const res = await fetch("/api/tracker/auto-sync");
      const data = await res.json();
      if (data.success) {
        setProfiles(data.profiles || []);
      }
    } catch (err) {
      console.error("[AutoSync] Erreur chargement:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // Auto-sync côté client : lancer un setInterval pour chaque profil actif
  useEffect(() => {
    // Nettoyer les anciens timers
    Object.values(timerRefs.current).forEach(clearInterval);
    timerRefs.current = {};

    for (const profile of profiles) {
      if (profile.isActive && profile.syncIntervalMin > 0) {
        const intervalMs = profile.syncIntervalMin * 60 * 1000;
        timerRefs.current[profile.id] = setInterval(() => {
          triggerSync(profile.id, true);
        }, intervalMs);
      }
    }

    return () => {
      Object.values(timerRefs.current).forEach(clearInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles]);

  // Sync manuelle d'un profil
  const triggerSync = async (id: string, silent = false) => {
    if (!silent) setSyncing(id);
    try {
      const res = await fetch(`/api/cron/valorant-sync?id=${id}`);
      const data = await res.json();
      if (data.success) {
        if (!silent) setMsg({ text: `✅ Synchronisation réussie : ${data.results?.[0]?.rank || "OK"}`, type: "success" });
        fetchProfiles();
      } else {
        if (!silent) setMsg({ text: `❌ Erreur : ${data.error || "Échec de synchronisation"}`, type: "error" });
      }
    } catch (err: any) {
      if (!silent) setMsg({ text: `❌ ${err.message}`, type: "error" });
    } finally {
      if (!silent) setSyncing(null);
    }
  };

  // Ajouter un profil
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRiotId.includes("#")) {
      setMsg({ text: "Format invalide. Utilisez Pseudo#Tag", type: "error" });
      return;
    }
    if (!newEmail.includes("@")) {
      setMsg({ text: "Email invalide.", type: "error" });
      return;
    }

    setAddLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/tracker/auto-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          riotId: newRiotId.trim(),
          linkedEmail: newEmail.trim(),
          syncIntervalMin: newInterval,
          region: newRegion,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ text: "Profil ajouté avec succès ! La synchronisation automatique est active.", type: "success" });
        setNewRiotId("");
        setNewEmail("");
        setNewInterval(5);
        setShowAddForm(false);
        fetchProfiles();

        // Lancer la première sync immédiatement
        if (data.profile?.id) {
          setTimeout(() => triggerSync(data.profile.id), 500);
        }
      } else {
        setMsg({ text: data.error || "Erreur lors de l'ajout.", type: "error" });
      }
    } catch (err: any) {
      setMsg({ text: err.message, type: "error" });
    } finally {
      setAddLoading(false);
    }
  };

  // Toggle activation d'un profil
  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/tracker/auto-sync", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentActive }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({
          text: currentActive ? "Synchronisation mise en pause." : "Synchronisation réactivée !",
          type: "success",
        });
        fetchProfiles();
      }
    } catch (err: any) {
      setMsg({ text: err.message, type: "error" });
    }
  };

  // Modifier l'intervalle d'un profil
  const updateInterval = async (id: string, newIntervalMin: number) => {
    try {
      const res = await fetch("/api/tracker/auto-sync", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, syncIntervalMin: newIntervalMin }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ text: `Intervalle mis à jour : ${newIntervalMin} min`, type: "success" });
        fetchProfiles();
      }
    } catch (err: any) {
      setMsg({ text: err.message, type: "error" });
    }
  };

  // Supprimer un profil
  const deleteProfile = async (id: string, riotId: string) => {
    if (!confirm(`Supprimer le suivi de ${riotId} ? Cette action est irréversible.`)) return;
    try {
      const res = await fetch("/api/tracker/auto-sync", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ text: `Profil ${riotId} supprimé.`, type: "success" });
        fetchProfiles();
      }
    } catch (err: any) {
      setMsg({ text: err.message, type: "error" });
    }
  };

  // Formater le temps relatif
  const timeAgo = (dateStr: string | null) => {
    if (!dateStr) return "Jamais";
    const diff = Date.now() - new Date(dateStr).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `il y a ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `il y a ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours}h`;
    return `il y a ${Math.floor(hours / 24)}j`;
  };

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🔄</span>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Auto-Sync Valorant Profiles
            </h3>
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Synchronisation automatique des données via Henrik Dev API → Neon DB
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3.5 py-2 rounded-xl bg-[var(--color-val-red,#ff4655)] hover:brightness-110 text-white text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-red-500/20"
        >
          <span>{showAddForm ? "✕" : "+"}</span>
          {showAddForm ? "Fermer" : "Ajouter un profil"}
        </button>
      </div>

      {/* MESSAGE */}
      {msg && (
        <div
          className={`p-3 rounded-xl text-xs font-bold animate-in fade-in duration-200 ${
            msg.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
              : "bg-red-500/15 border border-red-500/30 text-red-300"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* FORMULAIRE D'AJOUT */}
      {showAddForm && (
        <form
          onSubmit={handleAdd}
          className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-4 animate-in slide-in-from-top-2 duration-200"
        >
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>🎯</span> Nouveau profil à suivre
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Riot ID */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase">
                Profil Valorant (Riot ID)
              </label>
              <input
                type="text"
                value={newRiotId}
                onChange={(e) => setNewRiotId(e.target.value)}
                placeholder="ex: SENPAII#6767"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-val-red,#ff4655)] transition-all"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase">
                Compte Email associé
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="ex: ryzeapex64@gmail.com"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-val-red,#ff4655)] transition-all"
              />
            </div>

            {/* Intervalle */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase">
                Intervalle de synchronisation
              </label>
              <select
                value={newInterval}
                onChange={(e) => setNewInterval(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-[var(--color-val-red,#ff4655)] transition-all cursor-pointer"
              >
                {INTERVAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    Toutes les {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Région */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase">
                Région
              </label>
              <select
                value={newRegion}
                onChange={(e) => setNewRegion(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-[var(--color-val-red,#ff4655)] transition-all cursor-pointer"
              >
                {REGION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl bg-white/10 text-gray-300 text-[11px] font-bold uppercase cursor-pointer hover:bg-white/15 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={addLoading}
              className="px-5 py-2 rounded-xl bg-[var(--color-val-red,#ff4655)] hover:brightness-110 text-white text-[11px] font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50 transition-all shadow-md shadow-red-500/20"
            >
              {addLoading ? "Ajout en cours..." : "Ajouter & Synchroniser"}
            </button>
          </div>
        </form>
      )}

      {/* LISTE DES PROFILS SUIVIS */}
      {loading ? (
        <div className="p-8 text-center">
          <div className="w-6 h-6 border-2 border-[var(--color-val-red,#ff4655)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[10px] text-gray-400 font-bold uppercase mt-2">Chargement...</p>
        </div>
      ) : profiles.length === 0 ? (
        <div className="p-8 rounded-2xl bg-black/20 border border-white/5 text-center space-y-2">
          <span className="text-3xl">📡</span>
          <p className="text-xs text-gray-400">
            Aucun profil Valorant en synchronisation automatique.
          </p>
          <p className="text-[10px] text-gray-500">
            Cliquez sur <strong>&quot;Ajouter un profil&quot;</strong> pour commencer le suivi.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className={`rounded-2xl border transition-all ${
                profile.isActive
                  ? "bg-black/30 border-white/10 hover:border-white/20"
                  : "bg-black/10 border-white/5 opacity-60"
              }`}
            >
              {/* Ligne principale */}
              <div className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Icône de rang */}
                  <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {profile.lastRankUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.lastRankUrl}
                        alt={profile.lastRank || "rank"}
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <span className="text-lg">🎮</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-white truncate">
                        {profile.riotId}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                          profile.isActive
                            ? profile.lastSyncStatus === "success"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : profile.lastSyncStatus === "error"
                              ? "bg-red-500/20 text-red-300 border border-red-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-gray-700 text-gray-400"
                        }`}
                      >
                        {profile.isActive
                          ? profile.lastSyncStatus === "success"
                            ? "Actif"
                            : profile.lastSyncStatus === "error"
                            ? "Erreur"
                            : "En attente"
                          : "Pausé"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-gray-400">
                        📧 {profile.linkedEmail}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        🕐 {timeAgo(profile.lastSyncAt)}
                      </span>
                      {profile.lastRank && (
                        <span className="text-[10px] text-amber-300 font-bold">
                          🏆 {profile.lastRank}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-500">
                        #{profile.totalSyncs} syncs
                      </span>
                    </div>

                    {profile.lastSyncError && (
                      <p className="text-[10px] text-red-400 mt-1 truncate max-w-[300px]">
                        ⚠️ {profile.lastSyncError}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Sélecteur d'intervalle */}
                  <select
                    value={profile.syncIntervalMin}
                    onChange={(e) => updateInterval(profile.id, Number(e.target.value))}
                    className="px-2 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[10px] text-white cursor-pointer focus:outline-none focus:border-[var(--color-val-red,#ff4655)]"
                    title="Intervalle de synchronisation"
                  >
                    {INTERVAL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        ⏱ {opt.label}
                      </option>
                    ))}
                  </select>

                  {/* Bouton sync manuelle */}
                  <button
                    type="button"
                    onClick={() => triggerSync(profile.id)}
                    disabled={syncing === profile.id}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs transition-all cursor-pointer disabled:opacity-50"
                    title="Synchroniser maintenant"
                  >
                    {syncing === profile.id ? (
                      <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>🔄</span>
                    )}
                  </button>

                  {/* Toggle pause/active */}
                  <button
                    type="button"
                    onClick={() => toggleActive(profile.id, profile.isActive)}
                    className={`p-2 rounded-lg border text-xs transition-all cursor-pointer ${
                      profile.isActive
                        ? "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300"
                        : "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                    }`}
                    title={profile.isActive ? "Mettre en pause" : "Réactiver"}
                  >
                    {profile.isActive ? "⏸" : "▶️"}
                  </button>

                  {/* Supprimer */}
                  <button
                    type="button"
                    onClick={() => deleteProfile(profile.id, profile.riotId)}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs transition-all cursor-pointer"
                    title="Supprimer"
                  >
                    🗑
                  </button>
                </div>
              </div>

              {/* Barre de progression de l'intervalle */}
              {profile.isActive && profile.lastSyncAt && (
                <SyncProgressBar
                  lastSyncAt={profile.lastSyncAt}
                  intervalMin={profile.syncIntervalMin}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* FOOTER INFO */}
      {profiles.length > 0 && (
        <div className="flex items-center justify-between text-[10px] text-gray-500 pt-2 border-t border-white/5">
          <span>
            {profiles.filter((p) => p.isActive).length} profil(s) actif(s) sur{" "}
            {profiles.length}
          </span>
          <button
            type="button"
            onClick={() => {
              fetch("/api/cron/valorant-sync")
                .then((r) => r.json())
                .then((data) => {
                  setMsg({
                    text: `Sync globale : ${data.synced || 0} profil(s) mis à jour.`,
                    type: "success",
                  });
                  fetchProfiles();
                })
                .catch(() =>
                  setMsg({ text: "Erreur sync globale", type: "error" })
                );
            }}
            className="text-[10px] text-gray-400 hover:text-white transition-all cursor-pointer underline"
          >
            Forcer la sync globale
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Barre de progression visuelle montrant le temps restant avant la prochaine sync
 */
function SyncProgressBar({
  lastSyncAt,
  intervalMin,
}: {
  lastSyncAt: string;
  intervalMin: number;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const elapsed = Date.now() - new Date(lastSyncAt).getTime();
      const intervalMs = intervalMin * 60 * 1000;
      const pct = Math.min(100, (elapsed / intervalMs) * 100);
      setProgress(pct);
    };

    updateProgress();
    const timer = setInterval(updateProgress, 1000);
    return () => clearInterval(timer);
  }, [lastSyncAt, intervalMin]);

  return (
    <div className="px-4 pb-2">
      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            progress >= 100
              ? "bg-[var(--color-val-red,#ff4655)] animate-pulse"
              : "bg-emerald-500/60"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-[9px] text-gray-500">
          {progress >= 100 ? "Prochaine sync imminente" : `${Math.round(progress)}%`}
        </span>
        <span className="text-[9px] text-gray-500">
          toutes les {intervalMin} min
        </span>
      </div>
    </div>
  );
}
