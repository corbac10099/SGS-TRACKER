"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

interface LivePlayer {
  name: string;
  tag: string;
  team: "ally" | "enemy";
  agent: string;
  agentIcon: string;
  rank: string;
  rankTier: number;
  kills: number;
  deaths: number;
  assists: number;
  spi: number;
  isMe?: boolean;
}

interface LiveMatchData {
  active: boolean;
  mode?: "live" | "simulation";
  status: string;
  stateLabel?: string;
  message?: string;
  map?: {
    id: string;
    name: string;
    splashUrl?: string;
    displayIcon?: string;
  };
  queue?: string;
  round?: number;
  score?: {
    ally: number;
    enemy: number;
  };
  currentAgent?: string;
  players?: LivePlayer[];
  simulatable?: boolean;
}

export interface LiveMatchOverlayProps {
  onClose: () => void;
  isOpen: boolean;
}

export default function LiveMatchOverlayComponent({ onClose, isOpen }: LiveMatchOverlayProps) {
  const [data, setData] = useState<LiveMatchData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCompactOverlay, setIsCompactOverlay] = useState<boolean>(false);
  const [useSimulation, setUseSimulation] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  const fetchLiveStatus = async (simulate: boolean = useSimulation) => {
    try {
      const res = await fetch(`/api/valorant/live-match?simulate=${simulate}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.warn("[LiveMatch] Erreur polling:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchLiveStatus();
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLiveStatus();
    }, 4000);
    return () => clearInterval(interval);
  }, [isOpen, useSimulation, autoRefresh]);

  if (!isOpen) return null;

  const allyPlayers = data?.players?.filter((p) => p.team === "ally") || [];
  const enemyPlayers = data?.players?.filter((p) => p.team === "enemy") || [];
  const myPlayer = data?.players?.find((p) => p.isMe);

  // ==================== RENDU MINI OVERLAY COMPACT FLOTTANT ====================
  if (isCompactOverlay) {
    return (
      <div
        className="fixed top-4 right-4 z-[99999] w-96 rounded-xl border border-white/15 bg-black/85 p-3.5 shadow-2xl backdrop-blur-md text-white font-sans transition-all animate-in fade-in"
        style={{ boxShadow: "0 8px 32px rgba(0, 0, 0, 0.7), 0 0 16px rgba(255, 70, 85, 0.2)" }}
      >
        {/* Header Compact */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-black tracking-wider uppercase text-emerald-400">
              {data?.mode === "simulation" ? "HUD Simulation" : "HUD Match Direct"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCompactOverlay(false)}
              className="text-xs text-white/70 hover:text-white bg-white/10 px-2 py-0.5 rounded transition"
              title="Agrandir en vue complète"
            >
              ⤢ Normal
            </button>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-red-400 text-sm font-bold leading-none px-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Score & Carte */}
        <div className="flex items-center justify-between bg-white/5 rounded-lg p-2.5 mb-2.5">
          <div>
            <div className="text-[11px] text-white/50 uppercase font-semibold">Carte & Manche</div>
            <div className="text-sm font-black text-white">{data?.map?.name || "Ascent"} — R{data?.round || 1}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-black text-sky-400">{data?.score?.ally ?? 0}</span>
            <span className="text-xs text-white/30 font-bold">:</span>
            <span className="text-lg font-black text-rose-400">{data?.score?.enemy ?? 0}</span>
          </div>
        </div>

        {/* Mes Stats Rapides */}
        {myPlayer && (
          <div className="flex items-center justify-between bg-sky-500/10 border border-sky-500/20 rounded-lg p-2 mb-2">
            <div className="flex items-center gap-2">
              {myPlayer.agentIcon && (
                <img src={myPlayer.agentIcon} alt={myPlayer.agent} className="w-6 h-6 rounded-full" />
              )}
              <span className="text-xs font-bold text-white">{myPlayer.name}</span>
            </div>
            <div className="text-xs font-mono font-bold text-sky-300">
              {myPlayer.kills}K / {myPlayer.deaths}D / {myPlayer.assists}A • SPI {myPlayer.spi}
            </div>
          </div>
        )}

        {/* Mini Classement Kills Direct */}
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          {data?.players?.slice(0, 5).map((p, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between text-xs py-1 px-2 rounded ${
                p.team === "ally" ? "bg-sky-500/5 text-sky-200" : "bg-rose-500/5 text-rose-200"
              }`}
            >
              <div className="flex items-center gap-1.5 truncate max-w-[160px]">
                <span className="text-[10px] text-white/40">#{idx + 1}</span>
                <span className="font-semibold truncate">{p.name}</span>
                <span className="text-[10px] text-white/40">({p.agent})</span>
              </div>
              <div className="font-mono font-bold text-[11px]">
                {p.kills} <span className="text-white/30">/</span> {p.deaths}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==================== RENDU COMPLET DASHBOARD LIVE ====================
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-5xl rounded-2xl border border-white/15 bg-[#0a0e14] p-6 shadow-2xl text-white font-sans max-h-[92vh] flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black uppercase tracking-wider text-white">
                  ⚡ Mode Direct — Assistant In-Game
                </h2>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                  {data?.mode === "simulation" ? "Mode Démo" : "Lockfile Connecté"}
                </span>
              </div>
              <p className="text-xs text-white/50">
                Lecture en temps réel sans injection ni risque de bannissement (Riot Compliant).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsCompactOverlay(true)}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition flex items-center gap-1.5"
            >
              <span>📌</span> Mini Overlay
            </button>
            <button
              onClick={() => {
                const nextSim = !useSimulation;
                setUseSimulation(nextSim);
                fetchLiveStatus(nextSim);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                useSimulation
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-white/5 text-white/70 hover:text-white"
              }`}
            >
              <span>{useSimulation ? "🎮 Simuler In-Game" : "🔍 Détecter Jeu Réel"}</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-white/70 flex items-center justify-center font-bold text-sm transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Corps Principal */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6">
          {/* Bannière de Score et Carte */}
          <div className="relative overflow-hidden rounded-xl border border-white/15 bg-gradient-to-r from-sky-950/40 via-[#0d131d] to-rose-950/40 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Carte 2D Minimap & Nom */}
              <div className="flex items-center gap-4">
                {data?.map?.displayIcon ? (
                  <div className="w-16 h-16 rounded-lg bg-black/60 border border-white/10 p-1 shrink-0">
                    <img
                      src={data.map.displayIcon}
                      alt={data.map.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-sky-500/20 flex items-center justify-center text-2xl font-black text-sky-400">
                    🗺️
                  </div>
                )}
                <div>
                  <div className="text-xs uppercase font-bold text-white/40 tracking-wider">
                    {data?.queue || "Compétitif"} • Manche {data?.round || 1}
                  </div>
                  <div className="text-2xl font-black text-white">{data?.map?.name || "Ascent"}</div>
                  <div className="text-xs text-emerald-400 font-medium">{data?.stateLabel || "En partie"}</div>
                </div>
              </div>

              {/* Tableau de Score Central */}
              <div className="flex items-center gap-6 bg-black/50 px-6 py-3 rounded-xl border border-white/10">
                <div className="text-center">
                  <div className="text-[10px] uppercase font-bold text-sky-400">Votre Équipe</div>
                  <div className="text-3xl font-black text-sky-400">{data?.score?.ally ?? 0}</div>
                </div>
                <div className="text-xl font-bold text-white/30">:</div>
                <div className="text-center">
                  <div className="text-[10px] uppercase font-bold text-rose-400">Adversaires</div>
                  <div className="text-3xl font-black text-rose-400">{data?.score?.enemy ?? 0}</div>
                </div>
              </div>

              {/* Statut auto-refresh */}
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/60">Actualisation auto (4s)</span>
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="accent-emerald-500 rounded"
                  />
                </div>
                <button
                  onClick={() => fetchLiveStatus()}
                  className="text-xs text-white/60 hover:text-white underline"
                >
                  Rafraîchir maintenant
                </button>
              </div>
            </div>
          </div>

          {/* Tableau des Joueurs (Alliés vs Ennemis) */}
          {data?.players && data.players.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Équipe Bleue (Alliés) */}
              <div className="rounded-xl border border-sky-500/20 bg-sky-950/10 p-4 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-sky-500/20 text-xs font-black uppercase tracking-wider text-sky-400">
                  <span>Équipe Alliée (Défense / Attaque)</span>
                  <span>K / D / A • SPI</span>
                </div>
                {allyPlayers.map((player, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded-lg transition ${
                      player.isMe
                        ? "bg-sky-500/20 border border-sky-400/40 shadow-sm"
                        : "bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {player.agentIcon && (
                        <img
                          src={player.agentIcon}
                          alt={player.agent}
                          className="w-7 h-7 rounded-full bg-black/40 p-0.5 shrink-0"
                        />
                      )}
                      <div className="truncate">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-white truncate">
                          <span>{player.name}</span>
                          {player.isMe && (
                            <span className="text-[10px] bg-sky-500 text-black font-black px-1 rounded">
                              VOUS
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-white/50">
                          {player.agent} • <span className="text-amber-400">{player.rank}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-black text-white">
                        {player.kills} <span className="text-white/30">/</span> {player.deaths}{" "}
                        <span className="text-white/30">/</span> {player.assists}
                      </div>
                      <div className="text-[10px] font-bold text-sky-300">SPI {player.spi}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Équipe Rouge (Adversaires) */}
              <div className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-4 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-rose-500/20 text-xs font-black uppercase tracking-wider text-rose-400">
                  <span>Équipe Adverse</span>
                  <span>K / D / A • SPI</span>
                </div>
                {enemyPlayers.map((player, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {player.agentIcon && (
                        <img
                          src={player.agentIcon}
                          alt={player.agent}
                          className="w-7 h-7 rounded-full bg-black/40 p-0.5 shrink-0"
                        />
                      )}
                      <div className="truncate">
                        <div className="text-xs font-bold text-white truncate">{player.name}</div>
                        <div className="text-[10px] text-white/50">
                          {player.agent} • <span className="text-amber-400">{player.rank}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-black text-white">
                        {player.kills} <span className="text-white/30">/</span> {player.deaths}{" "}
                        <span className="text-white/30">/</span> {player.assists}
                      </div>
                      <div className="text-[10px] font-bold text-rose-300">SPI {player.spi}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 rounded-xl bg-white/5 border border-white/10">
              <div className="text-3xl mb-2">🎮</div>
              <h3 className="text-base font-bold text-white mb-1">
                {data?.message || "En attente du lancement d'une partie"}
              </h3>
              <p className="text-xs text-white/50 max-w-md mx-auto mb-4">
                Lancez Valorant sur votre PC ou activez le mode simulation ci-dessus pour prévisualiser l'overlay en direct.
              </p>
              <button
                onClick={() => {
                  setUseSimulation(true);
                  fetchLiveStatus(true);
                }}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs transition"
              >
                ⚡ Tester avec des données simulées
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
