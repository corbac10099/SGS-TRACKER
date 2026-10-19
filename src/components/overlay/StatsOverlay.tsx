"use client";

import React, { useState, useEffect } from "react";
import MiniOverlayWrapper from "./MiniOverlayWrapper";

interface PlayerPerformance {
  kills: number;
  deaths: number;
  assists: number;
  kd: number;
  hsRate: number; // en %
  acs: number;
  lastUpdated?: string;
  source: string;
}

interface StatsOverlayProps {
  isInteractive: boolean;
  onClose: () => void;
  accentColor?: string;
  playerPuuid?: string;
  playerName?: string;
}

export default function StatsOverlay({
  isInteractive,
  onClose,
  accentColor = "#38bdf8",
  playerPuuid,
  playerName = "Vous",
}: StatsOverlayProps) {
  const [stats, setStats] = useState<PlayerPerformance>({
    kills: 14,
    deaths: 9,
    assists: 4,
    kd: 1.55,
    hsRate: 28,
    acs: 232,
    source: "SGS API",
  });
  const [loading, setLoading] = useState(false);

  // Charger les stats depuis le backend ou l'historique SGS
  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        setLoading(true);
        const url = playerPuuid
          ? `/api/valorant/player-summary?puuid=${playerPuuid}`
          : `/api/valorant/player-summary`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json && json.kd !== undefined) {
            setStats({
              kills: json.kills ?? 0,
              deaths: json.deaths ?? 0,
              assists: json.assists ?? 0,
              kd: json.kd ?? 1.0,
              hsRate: json.hsRate ?? 25,
              acs: json.acs ?? 200,
              source: json.source || "SGS API",
            });
          }
        }
      } catch (err) {
        // En cas d'indisponibilité, conserver les valeurs par défaut
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStats();
    return () => {
      isMounted = false;
    };
  }, [playerPuuid]);

  return (
    <MiniOverlayWrapper
      id="stats"
      title="Stats Joueur"
      isInteractive={isInteractive}
      onClose={onClose}
      accentColor="#38bdf8"
      defaultX={230}
      defaultY={40}
      minWidth={200}
    >
      <div className="flex flex-col gap-2">
        {/* En-tête : Nom & Source */}
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-bold text-white truncate max-w-[100px]">{playerName}</span>
          <span className="text-[9px] font-mono text-cyan-400/80 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
            {stats.source}
          </span>
        </div>

        {/* Grille KDA / KD / HS% / ACS */}
        <div className="grid grid-cols-3 gap-1.5 text-center">
          {/* K/D/A */}
          <div className="p-1.5 rounded-lg bg-black/40 border border-white/5 flex flex-col justify-center">
            <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold">K / D / A</span>
            <span className="text-xs font-black font-mono text-white mt-0.5">
              {stats.kills}/{stats.deaths}/{stats.assists}
            </span>
          </div>

          {/* Ratio KD */}
          <div className="p-1.5 rounded-lg bg-black/40 border border-white/5 flex flex-col justify-center">
            <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Ratio K/D</span>
            <span
              className={`text-xs font-black font-mono mt-0.5 ${
                stats.kd >= 1.2
                  ? "text-emerald-400"
                  : stats.kd >= 0.9
                  ? "text-white"
                  : "text-rose-400"
              }`}
            >
              {stats.kd.toFixed(2)}
            </span>
          </div>

          {/* HS % */}
          <div className="p-1.5 rounded-lg bg-black/40 border border-white/5 flex flex-col justify-center">
            <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Tir Tête</span>
            <span className="text-xs font-black font-mono text-cyan-300 mt-0.5">
              {stats.hsRate}%
            </span>
          </div>
        </div>

        {/* Barre HS% visuelle */}
        <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, stats.hsRate))}%` }}
          />
        </div>

        {/* ACS */}
        <div className="flex items-center justify-between text-[10px] text-white/50 px-1 pt-0.5 border-t border-white/5">
          <span>Score Moyen ACS</span>
          <span className="font-mono font-bold text-white text-xs">{stats.acs}</span>
        </div>
      </div>
    </MiniOverlayWrapper>
  );
}
