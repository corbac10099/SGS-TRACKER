"use client";

import React, { useMemo, useState } from "react";
import { sounds } from "@/lib/soundEffects";
import { IconTrophy, IconScale, IconGamepad, IconCrosshair } from "./icons/SpyIcons";

export interface MapPerformanceHeatmapProps {
  matches: any[];
  className?: string;
}

export interface MapStatData {
  mapName: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  kills: number;
  deaths: number;
  assists: number;
  kd: number;
  avgAcs: number;
  topAgentName: string;
  topAgentIcon: string;
  recentMatches: any[];
}

type SortOption = "winRate" | "games" | "kd";

// Couleurs de fond et accents par carte Valorant
const MAP_THEMES: Record<string, { gradient: string; accent: string }> = {
  Ascent: {
    gradient: "from-blue-950/40 via-[#0a0e13] to-[#0a0e13]",
    accent: "#38bdf8",
  },
  Bind: {
    gradient: "from-amber-950/40 via-[#0a0e13] to-[#0a0e13]",
    accent: "#f59e0b",
  },
  Haven: {
    gradient: "from-emerald-950/40 via-[#0a0e13] to-[#0a0e13]",
    accent: "#10b981",
  },
  Split: {
    gradient: "from-purple-950/40 via-[#0a0e13] to-[#0a0e13]",
    accent: "#a855f7",
  },
  Sunset: {
    gradient: "from-rose-950/40 via-[#0a0e13] to-[#0a0e13]",
    accent: "#f43f5e",
  },
  Lotus: {
    gradient: "from-teal-950/40 via-[#0a0e13] to-[#0a0e13]",
    accent: "#14b8a6",
  },
  Abyss: {
    gradient: "from-cyan-950/40 via-[#0a0e13] to-[#0a0e13]",
    accent: "#06b6d4",
  },
  Icebox: {
    gradient: "from-sky-950/40 via-[#0a0e13] to-[#0a0e13]",
    accent: "#7dd3fc",
  },
  Breeze: {
    gradient: "from-lime-950/40 via-[#0a0e13] to-[#0a0e13]",
    accent: "#84cc16",
  },
  Fracture: {
    gradient: "from-orange-950/40 via-[#0a0e13] to-[#0a0e13]",
    accent: "#ea580c",
  },
  Pearl: {
    gradient: "from-indigo-950/40 via-[#0a0e13] to-[#0a0e13]",
    accent: "#6366f1",
  },
};

/**
 * Composant Heatmap de Performance par Carte Valorant.
 * Synthétise les taux de victoire, K/D moyen, scores de combat et agents favoris
 * pour chaque carte jouée, avec code couleur thermique et options de tri dynamique.
 */
export default function MapPerformanceHeatmap({
  matches = [],
  className = "",
}: MapPerformanceHeatmapProps) {
  const [sortBy, setSortBy] = useState<SortOption>("winRate");
  const [selectedMap, setSelectedMap] = useState<MapStatData | null>(null);

  // Calcul des statistiques par carte
  const mapStats = useMemo(() => {
    const mapMap: Record<string, {
      games: number;
      wins: number;
      kills: number;
      deaths: number;
      assists: number;
      totalAcs: number;
      agentCounts: Record<string, { count: number; icon: string }>;
      matches: any[];
    }> = {};

    matches.forEach((m) => {
      const mapName = m.map || "Inconnue";
      if (!mapMap[mapName]) {
        mapMap[mapName] = {
          games: 0,
          wins: 0,
          kills: 0,
          deaths: 0,
          assists: 0,
          totalAcs: 0,
          agentCounts: {},
          matches: [],
        };
      }

      const entry = mapMap[mapName];
      entry.games++;
      if (m.won) entry.wins++;
      entry.kills += m.kills || 0;
      entry.deaths += m.deaths || 0;
      entry.assists += m.assists || 0;
      entry.totalAcs += m.acs || 0;
      entry.matches.push(m);

      if (m.agent) {
        if (!entry.agentCounts[m.agent]) {
          entry.agentCounts[m.agent] = { count: 0, icon: m.agentIcon || "" };
        }
        entry.agentCounts[m.agent].count++;
        if (m.agentIcon) entry.agentCounts[m.agent].icon = m.agentIcon;
      }
    });

    const result: MapStatData[] = Object.entries(mapMap).map(([mapName, data]) => {
      const losses = data.games - data.wins;
      const winRate = data.games > 0 ? Math.round((data.wins / data.games) * 100) : 0;
      const kd = data.deaths > 0 ? parseFloat((data.kills / data.deaths).toFixed(2)) : data.kills;
      const avgAcs = data.games > 0 ? Math.round(data.totalAcs / data.games) : 0;

      // Détection de l'agent favori sur cette carte
      let topAgent = "";
      let topAgentIcon = "";
      let maxAgentPlays = -1;
      Object.entries(data.agentCounts).forEach(([agName, agData]) => {
        if (agData.count > maxAgentPlays) {
          maxAgentPlays = agData.count;
          topAgent = agName;
          topAgentIcon = agData.icon;
        }
      });

      return {
        mapName,
        games: data.games,
        wins: data.wins,
        losses,
        winRate,
        kills: data.kills,
        deaths: data.deaths,
        assists: data.assists,
        kd,
        avgAcs,
        topAgentName: topAgent,
        topAgentIcon,
        recentMatches: data.matches,
      };
    });

    // Tri selon l'option sélectionnée
    return result.sort((a, b) => {
      if (sortBy === "winRate") {
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        return b.games - a.games;
      }
      if (sortBy === "games") {
        if (b.games !== a.games) return b.games - a.games;
        return b.winRate - a.winRate;
      }
      if (sortBy === "kd") {
        return b.kd - a.kd;
      }
      return 0;
    });
  }, [matches, sortBy]);

  if (!matches || matches.length === 0) return null;

  // Badge d'évaluation thermique selon le winrate
  const getHeatBadge = (winRate: number) => {
    if (winRate >= 65) {
      return {
        label: "Domination",
        bg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]",
      };
    }
    if (winRate >= 50) {
      return {
        label: "Positif",
        bg: "bg-blue-500/15 border-blue-500/30 text-blue-400",
      };
    }
    if (winRate >= 40) {
      return {
        label: "Équilibré",
        bg: "bg-amber-500/15 border-amber-500/30 text-amber-400",
      };
    }
    return {
      label: "À Travailler",
      bg: "bg-[var(--color-val-red)]/15 border-[var(--color-val-red)]/30 text-[var(--color-val-red)]",
    };
  };

  return (
    <div className={`w-full glass-panel rounded-2xl p-5 sm:p-6 space-y-5 border border-[var(--color-border)] shadow-xl ${className}`}>
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <h3 className="font-black text-sm uppercase tracking-widest text-[var(--color-text-on-surface)]">
              Heatmap Performance par Carte
            </h3>
          </div>
          <p className="text-[11px] text-[var(--color-text-secondary)] mt-1 font-medium">
            Télémétrie tactique et taux de réussite par arène ({mapStats.length} cartes analysées)
          </p>
        </div>

        {/* Boutons de Tri */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl glass-pill self-start sm:self-auto">
          <span className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold px-2 hidden sm:inline">
            Trier par :
          </span>
          {(
            [
              { id: "winRate", label: "Win Rate" },
              { id: "games", label: "Parties" },
              { id: "kd", label: "K/D" },
            ] as { id: SortOption; label: string }[]
          ).map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                sounds.playTabSwitch();
                setSortBy(opt.id);
              }}
              onMouseEnter={() => sounds.playHover()}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                sortBy === opt.id
                  ? "bg-[var(--color-val-red)] text-white shadow-[0_0_10px_rgba(255,70,85,0.4)]"
                  : "text-[var(--color-text-secondary)] hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Map Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
        {mapStats.map((item) => {
          const theme = MAP_THEMES[item.mapName] || {
            gradient: "from-neutral-900/40 via-[#0a0e13] to-[#0a0e13]",
            accent: "#ffffff",
          };
          const badge = getHeatBadge(item.winRate);
          const isSelected = selectedMap?.mapName === item.mapName;

          return (
            <div
              key={item.mapName}
              onMouseEnter={() => sounds.playHover()}
              onClick={() => {
                sounds.playClick();
                setSelectedMap(isSelected ? null : item);
              }}
              className={`relative rounded-xl p-4 border transition-all duration-300 cursor-pointer overflow-hidden group bg-gradient-to-b ${
                theme.gradient
              } ${
                isSelected
                  ? "border-cyan-400 ring-1 ring-cyan-400/50 shadow-[0_0_16px_rgba(6,182,212,0.2)]"
                  : "border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)] hover:scale-[1.02]"
              }`}
            >
              {/* Subtle top glowing line */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: theme.accent }}
              />

              {/* Top Row: Map Name & Heat Badge */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-black text-white text-base tracking-wide uppercase">
                    {item.mapName}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-secondary)] font-bold">
                    {item.games} {item.games > 1 ? "matchs" : "match"}
                  </span>
                </div>
                <span
                  className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.bg}`}
                >
                  {badge.label}
                </span>
              </div>

              {/* Progress ratio bar (Wins vs Losses) */}
              <div className="space-y-1 mb-3">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-emerald-400">{item.wins} Victoires</span>
                  <span className="text-white font-black">{item.winRate}%</span>
                  <span className="text-[var(--color-val-red)]">{item.losses} Défaites</span>
                </div>
                <div className="w-full h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${item.winRate}%` }}
                  />
                  <div
                    className="h-full bg-[var(--color-val-red)] transition-all duration-500"
                    style={{ width: `${100 - item.winRate}%` }}
                  />
                </div>
              </div>

              {/* Metrics Grid (K/D, ACS, Agent) */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[rgba(255,255,255,0.06)] text-center">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider text-[var(--color-text-secondary)] font-bold">
                    K/D
                  </span>
                  <span
                    className={`text-xs font-black ${
                      item.kd >= 1 ? "text-emerald-400" : "text-[var(--color-val-red)]"
                    }`}
                  >
                    {item.kd}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider text-[var(--color-text-secondary)] font-bold">
                    ACS
                  </span>
                  <span className="text-xs font-black text-neutral-200">
                    {item.avgAcs}
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-[9px] uppercase tracking-wider text-[var(--color-text-secondary)] font-bold">
                    Favori
                  </span>
                  {item.topAgentIcon ? (
                    <div className="flex items-center gap-1 mt-0.5" title={item.topAgentName}>
                      <img
                        referrerPolicy="no-referrer"
                        src={item.topAgentIcon}
                        alt={item.topAgentName}
                        className="w-4 h-4 rounded-full border border-white/20"
                      />
                      <span className="text-[10px] font-bold text-white truncate max-w-[45px]">
                        {item.topAgentName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-[var(--color-text-secondary)]">-</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Map Match Details Drawer */}
      {selectedMap && (
        <div className="mt-4 p-4 rounded-xl glass-card border border-cyan-500/30 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white uppercase tracking-wider">
                Parties récentes sur {selectedMap.mapName}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">
                {selectedMap.wins}V - {selectedMap.losses}D ({selectedMap.winRate}%)
              </span>
            </div>
            <button
              onClick={() => setSelectedMap(null)}
              className="text-[10px] text-[var(--color-text-secondary)] hover:text-white font-bold cursor-pointer uppercase tracking-widest px-2 py-1"
            >
              Fermer ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {selectedMap.recentMatches.slice(0, 6).map((m: any, idx: number) => (
              <div
                key={m.matchId || idx}
                className={`p-3 rounded-lg flex items-center justify-between border ${
                  m.won
                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                    : "bg-[var(--color-val-red)]/5 border-[var(--color-val-red)]/20 text-[var(--color-val-red)]"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {m.agentIcon && (
                    <img
                      referrerPolicy="no-referrer"
                      src={m.agentIcon}
                      alt={m.agent}
                      className="w-8 h-8 rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-black text-white truncate">
                      {m.agent || "Agent"} • {m.score || (m.won ? "Victoire" : "Défaite")}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-secondary)]">
                      {m.mode || "Compétitif"} {m.season ? `• ${m.season}` : ""}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-black">
                    {m.kills}/{m.deaths}/{m.assists}
                  </span>
                  <div className="text-[9px] text-[var(--color-text-secondary)] font-bold">
                    ACS {m.acs || 0}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
