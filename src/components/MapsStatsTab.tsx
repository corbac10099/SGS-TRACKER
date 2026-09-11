"use client";

import React, { useState, useMemo } from "react";
import { sounds } from "@/lib/soundEffects";
import {
  IconTrophy,
  IconScale,
  IconGamepad,
  IconCrosshair,
  IconFlame,
  IconSword,
  IconChevronRight,
} from "./icons/SpyIcons";

export interface MapsStatsTabProps {
  matches: any[];
}

export interface MapData {
  name: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  kills: number;
  deaths: number;
  assists: number;
  kd: number;
  avgAcs: number;
  avgAdr: number;
  hsPct: number;
  agentBreakdown: Record<string, { games: number; wins: number; icon: string }>;
  matches: any[];
}

type SortOption = "winRate" | "games" | "kd" | "acs";

// Splash arts officiels Valorant-API ou thèmes pour chaque carte
const MAP_INFO: Record<
  string,
  { splash: string; accent: string; bgGradient: string }
> = {
  Ascent: {
    splash: "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png",
    accent: "#38bdf8",
    bgGradient: "from-sky-900/40 via-[#0a0e13] to-[#0a0e13]",
  },
  Bind: {
    splash: "https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/splash.png",
    accent: "#f59e0b",
    bgGradient: "from-amber-900/40 via-[#0a0e13] to-[#0a0e13]",
  },
  Haven: {
    splash: "https://media.valorant-api.com/maps/2bee0dc9-4da5-3a78-9403-bc8fad77b0d0/splash.png",
    accent: "#10b981",
    bgGradient: "from-emerald-900/40 via-[#0a0e13] to-[#0a0e13]",
  },
  Split: {
    splash: "https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/splash.png",
    accent: "#a855f7",
    bgGradient: "from-purple-900/40 via-[#0a0e13] to-[#0a0e13]",
  },
  Sunset: {
    splash: "https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/splash.png",
    accent: "#f43f5e",
    bgGradient: "from-rose-900/40 via-[#0a0e13] to-[#0a0e13]",
  },
  Lotus: {
    splash: "https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/splash.png",
    accent: "#14b8a6",
    bgGradient: "from-teal-900/40 via-[#0a0e13] to-[#0a0e13]",
  },
  Abyss: {
    splash: "https://media.valorant-api.com/maps/224b0a95-48b9-f703-1bd8-67aca101a61f/splash.png",
    accent: "#06b6d4",
    bgGradient: "from-cyan-900/40 via-[#0a0e13] to-[#0a0e13]",
  },
  Icebox: {
    splash: "https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279579a/splash.png",
    accent: "#7dd3fc",
    bgGradient: "from-blue-900/40 via-[#0a0e13] to-[#0a0e13]",
  },
  Breeze: {
    splash: "https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/splash.png",
    accent: "#84cc16",
    bgGradient: "from-lime-900/40 via-[#0a0e13] to-[#0a0e13]",
  },
  Fracture: {
    splash: "https://media.valorant-api.com/maps/b52973d4-454b-cad4-8da6-c683b759f72e/splash.png",
    accent: "#ea580c",
    bgGradient: "from-orange-900/40 via-[#0a0e13] to-[#0a0e13]",
  },
  Pearl: {
    splash: "https://media.valorant-api.com/maps/fd2679d4-43f1-fdc3-70ae-910a9a19c158/splash.png",
    accent: "#6366f1",
    bgGradient: "from-indigo-900/40 via-[#0a0e13] to-[#0a0e13]",
  },
};

export default function MapsStatsTab({ matches = [] }: MapsStatsTabProps) {
  const [sortBy, setSortBy] = useState<SortOption>("winRate");
  const [expandedMap, setExpandedMap] = useState<string | null>(null);

  // Agrégation des statistiques par carte
  const aggregatedMaps = useMemo<MapData[]>(() => {
    const mapMap: Record<string, {
      games: number;
      wins: number;
      kills: number;
      deaths: number;
      assists: number;
      totalAcs: number;
      totalAdr: number;
      totalHs: number;
      totalShots: number;
      agentBreakdown: Record<string, { games: number; wins: number; icon: string }>;
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
          totalAdr: 0,
          totalHs: 0,
          totalShots: 0,
          agentBreakdown: {},
          matches: [],
        };
      }

      const e = mapMap[mapName];
      e.games++;
      if (m.won) e.wins++;
      e.kills += m.kills || 0;
      e.deaths += m.deaths || 0;
      e.assists += m.assists || 0;
      e.totalAcs += m.acs || 0;
      e.totalAdr += m.adr || 0;

      const hs = m.headshots || 0;
      const bs = m.bodyshots || 0;
      const ls = m.legshots || 0;
      e.totalHs += hs;
      e.totalShots += hs + bs + ls;

      if (m.agent) {
        if (!e.agentBreakdown[m.agent]) {
          e.agentBreakdown[m.agent] = {
            games: 0,
            wins: 0,
            icon: m.agentIcon || "",
          };
        }
        e.agentBreakdown[m.agent].games++;
        if (m.won) e.agentBreakdown[m.agent].wins++;
        if (m.agentIcon && !e.agentBreakdown[m.agent].icon) {
          e.agentBreakdown[m.agent].icon = m.agentIcon;
        }
      }

      e.matches.push(m);
    });

    return Object.keys(mapMap).map((name) => {
      const e = mapMap[name];
      const winRate = e.games > 0 ? Math.round((e.wins / e.games) * 100) : 0;
      const kd = e.deaths > 0 ? parseFloat((e.kills / e.deaths).toFixed(2)) : e.kills;
      const avgAcs = e.games > 0 ? Math.round(e.totalAcs / e.games) : 0;
      const avgAdr = e.games > 0 ? Math.round(e.totalAdr / e.games) : 0;
      const hsPct = e.totalShots > 0 ? Math.round((e.totalHs / e.totalShots) * 100) : 0;

      return {
        name,
        games: e.games,
        wins: e.wins,
        losses: e.games - e.wins,
        winRate,
        kills: e.kills,
        deaths: e.deaths,
        assists: e.assists,
        kd,
        avgAcs,
        avgAdr,
        hsPct,
        agentBreakdown: e.agentBreakdown,
        matches: e.matches,
      };
    });
  }, [matches]);

  // Tri dynamique
  const sortedMaps = useMemo(() => {
    return [...aggregatedMaps].sort((a, b) => {
      if (sortBy === "winRate") {
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        return b.games - a.games;
      }
      if (sortBy === "games") return b.games - a.games;
      if (sortBy === "kd") return b.kd - a.kd;
      if (sortBy === "acs") return b.avgAcs - a.avgAcs;
      return 0;
    });
  }, [aggregatedMaps, sortBy]);

  // Statistiques de synthèse
  const summaryStats = useMemo(() => {
    if (aggregatedMaps.length === 0) return null;

    let totalGames = 0;
    let totalWins = 0;
    let bestMap = aggregatedMaps[0];
    let mostPlayed = aggregatedMaps[0];

    aggregatedMaps.forEach((m) => {
      totalGames += m.games;
      totalWins += m.wins;
      if (m.winRate > bestMap.winRate && m.games >= 2) {
        bestMap = m;
      }
      if (m.games > mostPlayed.games) {
        mostPlayed = m;
      }
    });

    const globalWr = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

    return {
      mapsCount: aggregatedMaps.length,
      bestMap,
      mostPlayed,
      globalWr,
    };
  }, [aggregatedMaps]);

  if (matches.length === 0) {
    return (
      <div className="w-full glass-panel rounded-2xl p-8 text-center text-[var(--color-text-secondary)]">
        Aucun historique de match disponible pour analyser les cartes.
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-500">
      {/* Top Summary Cards */}
      {summaryStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="glass-panel p-3.5 rounded-xl border border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--color-val-red)]/20 border border-[var(--color-val-red)]/40 flex items-center justify-center text-[var(--color-val-red)]">
              <IconGamepad size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] tracking-wider">
                Cartes Jouées
              </span>
              <span className="text-lg font-black text-white">
                {summaryStats.mapsCount}
              </span>
            </div>
          </div>

          <div className="glass-panel p-3.5 rounded-xl border border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <IconTrophy size={18} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] tracking-wider truncate">
                Meilleure Carte
              </span>
              <div className="flex items-baseline gap-1.5 truncate">
                <span className="text-base font-black text-white truncate">
                  {summaryStats.bestMap.name}
                </span>
                <span className="text-xs font-black text-emerald-400">
                  {summaryStats.bestMap.winRate}%
                </span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-3.5 rounded-xl border border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <IconFlame size={18} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] tracking-wider truncate">
                Plus Disputée
              </span>
              <div className="flex items-baseline gap-1.5 truncate">
                <span className="text-base font-black text-white truncate">
                  {summaryStats.mostPlayed.name}
                </span>
                <span className="text-xs font-black text-amber-400">
                  {summaryStats.mostPlayed.games} parties
                </span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-3.5 rounded-xl border border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <IconScale size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] tracking-wider">
                Win Rate Global
              </span>
              <span className="text-lg font-black text-blue-400">
                {summaryStats.globalWr}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar / Options de tri */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
            Performance par Carte ({sortedMaps.length})
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-[var(--color-surface)]/80 border border-white/10 p-1 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] px-2">
            Trier par:
          </span>
          {(
            [
              { id: "winRate", label: "Winrate" },
              { id: "games", label: "Parties" },
              { id: "kd", label: "K/D" },
              { id: "acs", label: "ACS" },
            ] as { id: SortOption; label: string }[]
          ).map((s) => (
            <button
              key={s.id}
              onClick={() => {
                sounds.playClick();
                setSortBy(s.id);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                sortBy === s.id
                  ? "bg-[var(--color-val-red)] text-white shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map Rows List */}
      <div className="space-y-3 w-full">
        {sortedMaps.map((map) => {
          const isExpanded = expandedMap === map.name;
          const info = MAP_INFO[map.name] || {
            splash: "",
            accent: "#ff4655",
            bgGradient: "from-zinc-900/40 via-[#0a0e13] to-[#0a0e13]",
          };

          const topAgents = Object.entries(map.agentBreakdown).sort(
            (a, b) => b[1].games - a[1].games
          );

          return (
            <div
              key={map.name}
              className="w-full flex flex-col rounded-2xl overflow-hidden border border-white/10 bg-[#0a0e13] shadow-lg transition-all"
            >
              {/* Main Interactive Row */}
              <div
                onMouseEnter={() => sounds.playHover()}
                onClick={() => {
                  sounds.playClick();
                  setExpandedMap(isExpanded ? null : map.name);
                }}
                className={`relative w-full p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer group hover:border-white/20 transition-all overflow-hidden ${
                  isExpanded ? "border-b border-white/10" : ""
                }`}
              >
                {/* Background Map Splash with overlay */}
                {info.splash && (
                  <div className="absolute inset-0 z-0 pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity">
                    <img
                      src={info.splash}
                      alt={map.name}
                      className="w-full h-full object-cover object-center filter blur-[1px]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e13] via-[#0a0e13]/80 to-transparent" />
                  </div>
                )}

                {/* Gauche : Nom + Badges de base */}
                <div className="relative z-10 flex items-center gap-3.5 min-w-0 sm:max-w-[30%]">
                  <div
                    className="w-12 h-12 rounded-xl border-2 flex items-center justify-center font-black text-sm tracking-wider uppercase shadow-md flex-shrink-0 bg-black/70 overflow-hidden"
                    style={{ borderColor: `${info.accent}80` }}
                  >
                    {info.splash ? (
                      <img
                        src={info.splash}
                        alt={map.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      map.name.slice(0, 3)
                    )}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg sm:text-xl font-black text-white tracking-tight truncate group-hover:text-[var(--color-val-red)] transition-colors">
                        {map.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-white/60">
                      {map.games} {map.games > 1 ? "parties" : "partie"} • {map.wins}V - {map.losses}D
                    </span>
                  </div>
                </div>

                {/* Centre-Droit : Métriques Principales */}
                <div className="relative z-10 flex items-center gap-4 sm:gap-6 flex-wrap w-full sm:w-auto justify-between sm:justify-end">
                  {/* Win Rate */}
                  <div className="flex flex-col items-start sm:items-end min-w-[75px]">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] tracking-wider">
                      Win Rate
                    </span>
                    <span
                      className={`text-base sm:text-lg font-black ${
                        map.winRate >= 50 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {map.winRate}%
                    </span>
                    <div className="w-16 h-1.5 rounded-full bg-white/10 mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          map.winRate >= 50 ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                        style={{ width: `${map.winRate}%` }}
                      />
                    </div>
                  </div>

                  {/* K/D Ratio */}
                  <div className="flex flex-col items-start sm:items-end min-w-[65px]">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] tracking-wider">
                      Ratio K/D
                    </span>
                    <span
                      className={`text-base sm:text-lg font-black ${
                        map.kd >= 1.0 ? "text-white" : "text-white/70"
                      }`}
                    >
                      {map.kd.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-white/50 font-bold">
                      {map.kills}K / {map.deaths}D
                    </span>
                  </div>

                  {/* ACS Moyen */}
                  <div className="hidden xs:flex flex-col items-start sm:items-end min-w-[60px]">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] tracking-wider">
                      ACS
                    </span>
                    <span className="text-base sm:text-lg font-black text-amber-400">
                      {map.avgAcs}
                    </span>
                    <span className="text-[10px] text-white/50 font-bold">
                      moyen
                    </span>
                  </div>

                  {/* ADR */}
                  <div className="hidden md:flex flex-col items-end min-w-[60px]">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] tracking-wider">
                      ADR
                    </span>
                    <span className="text-base sm:text-lg font-black text-white">
                      {map.avgAdr || "N/A"}
                    </span>
                    <span className="text-[10px] text-white/50 font-bold">
                      dégâts/t
                    </span>
                  </div>

                  {/* Headshot % */}
                  <div className="hidden lg:flex flex-col items-end min-w-[50px]">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] tracking-wider">
                      HS %
                    </span>
                    <span className="text-base sm:text-lg font-black text-cyan-400">
                      {map.hsPct}%
                    </span>
                  </div>

                  {/* Chevron Expand */}
                  <div className="flex items-center text-white/40 group-hover:text-white transition-colors pl-2">
                    <IconChevronRight
                      size={18}
                      className={`transform transition-transform duration-300 ${
                        isExpanded ? "rotate-90 text-[var(--color-val-red)]" : ""
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Expanded Detailed View */}
              {isExpanded && (
                <div className="p-4 sm:p-6 bg-black/40 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                  {/* Agents joués sur cette carte */}
                  {topAgents.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)]">
                        Agents Déployés sur {map.name}
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {topAgents.map(([agentName, agentData]) => {
                          const wr =
                            agentData.games > 0
                              ? Math.round((agentData.wins / agentData.games) * 100)
                              : 0;
                          return (
                            <div
                              key={agentName}
                              className="glass-card p-2.5 rounded-xl border border-white/10 flex items-center gap-2.5"
                            >
                              {agentData.icon ? (
                                <img
                                  src={agentData.icon}
                                  alt={agentName}
                                  className="w-8 h-8 rounded-lg object-cover bg-black/50 border border-white/15 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-black text-xs">
                                  {agentName.slice(0, 2)}
                                </div>
                              )}
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-black text-white truncate">
                                  {agentName}
                                </span>
                                <span className="text-[10px] font-bold text-white/60">
                                  {agentData.games} {agentData.games > 1 ? "parties" : "partie"} •{" "}
                                  <span
                                    className={
                                      wr >= 50
                                        ? "text-emerald-400"
                                        : "text-rose-400"
                                    }
                                  >
                                    {wr}% WR
                                  </span>
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Derniers matchs sur cette carte */}
                  <div className="space-y-2">
                    <span className="text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)]">
                      Dernières Parties ({map.matches.length})
                    </span>
                    <div className="space-y-1.5">
                      {map.matches.slice(0, 5).map((m: any, idx: number) => {
                        const d = m.date ? new Date(m.date) : new Date();
                        const dateStr = !isNaN(d.getTime())
                          ? d.toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                            })
                          : "N/A";
                        const mKd =
                          m.deaths > 0
                            ? (m.kills / m.deaths).toFixed(2)
                            : (m.kills || 0).toString();

                        return (
                          <div
                            key={m.id || m.matchId || idx}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                              m.won
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`px-2 py-0.5 rounded-md font-black text-[10px] uppercase ${
                                  m.won
                                    ? "bg-emerald-500/30 text-emerald-300"
                                    : "bg-rose-500/30 text-rose-300"
                                }`}
                              >
                                {m.won ? "Victoire" : "Défaite"}
                              </span>
                              <span className="font-bold text-white">
                                {m.score || "Score inconnu"}
                              </span>
                              <span className="text-[10px] text-white/50">
                                {dateStr}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 text-white font-bold">
                              {m.agent && (
                                <span className="text-white/80 hidden sm:inline">
                                  {m.agent}
                                </span>
                              )}
                              <span>
                                {m.kills || 0} / {m.deaths || 0} / {m.assists || 0}
                              </span>
                              <span className="text-white/60 font-mono text-[11px]">
                                {mKd} K/D
                              </span>
                              {m.acs && (
                                <span className="text-amber-400 font-mono text-[11px] hidden xs:inline">
                                  {m.acs} ACS
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
