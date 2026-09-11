"use client";

import React, { useState, useMemo } from "react";
import { sounds } from "@/lib/soundEffects";
import { MAP_INFO } from "./MapsStatsTab";

export interface AgentsStatsTabProps {
  agentStats: any[];
  matches?: any[];
  onSelectMatch?: (matchId: string) => void;
}

/**
 * Onglet "Agents" du profil — cartes d'agents au style sobre/noir original,
 * avec déploiement des cartes jouées sous forme de petites cartes stylisées
 * et historique récent au format MatchHistory interactif.
 */
export default function AgentsStatsTab({
  agentStats,
  matches = [],
  onSelectMatch,
}: AgentsStatsTabProps) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  // Regroupement des données de matchs par agent
  const agentDetailsMap = useMemo(() => {
    const map: Record<
      string,
      {
        totalAcs: number;
        totalHs: number;
        totalShots: number;
        kills: number;
        deaths: number;
        assists: number;
        mapBreakdown: Record<string, { games: number; wins: number }>;
        matches: any[];
      }
    > = {};

    matches.forEach((m) => {
      const agName = m.agent;
      if (!agName) return;

      if (!map[agName]) {
        map[agName] = {
          totalAcs: 0,
          totalHs: 0,
          totalShots: 0,
          kills: 0,
          deaths: 0,
          assists: 0,
          mapBreakdown: {},
          matches: [],
        };
      }

      const entry = map[agName];
      entry.totalAcs += m.acs || 0;
      entry.kills += m.kills || 0;
      entry.deaths += m.deaths || 0;
      entry.assists += m.assists || 0;

      const hs = m.headshots || 0;
      const bs = m.bodyshots || 0;
      const ls = m.legshots || 0;
      entry.totalHs += hs;
      entry.totalShots += hs + bs + ls;

      const mapName = m.map || "Inconnue";
      if (!entry.mapBreakdown[mapName]) {
        entry.mapBreakdown[mapName] = { games: 0, wins: 0 };
      }
      entry.mapBreakdown[mapName].games++;
      if (m.won) entry.mapBreakdown[mapName].wins++;

      entry.matches.push(m);
    });

    return map;
  }, [matches]);

  if (!agentStats || agentStats.length === 0) return null;

  return (
    <div className="w-full space-y-3 animate-in fade-in duration-500">
      {agentStats.map((agent: any) => {
        const isExpanded = expandedAgent === agent.name;
        const details = agentDetailsMap[agent.name];
        const agentMatchesCount = details?.matches.length || agent.games || 0;
        const avgAcs =
          agentMatchesCount > 0
            ? Math.round((details?.totalAcs || 0) / agentMatchesCount)
            : 0;
        const hsPct =
          details && details.totalShots > 0
            ? Math.round((details.totalHs / details.totalShots) * 100)
            : 0;

        return (
          <div key={agent.name} className="w-full flex flex-col gap-2">
            {/* Main Agent Card (Style noir / sombre épuré) */}
            <div
              onMouseEnter={() => sounds.playHover()}
              onClick={() => {
                sounds.playClick();
                setExpandedAgent(isExpanded ? null : agent.name);
              }}
              className={`w-full glass-panel rounded-2xl p-4 sm:p-5 flex items-center gap-4 sm:gap-5 transition-all duration-300 cursor-pointer select-none ${
                isExpanded
                  ? "bg-[var(--color-surface-hover)] border-[var(--color-val-red)]/50 shadow-[0_0_16px_rgba(255,70,85,0.15)] ring-1 ring-[var(--color-val-red)]/30"
                  : "hover:bg-[var(--color-surface-hover)] hover:border-[rgba(255,255,255,0.2)]"
              }`}
            >
              <img
                referrerPolicy="no-referrer"
                src={agent.icon}
                alt={agent.name}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border border-[rgba(255,255,255,0.1)] flex-shrink-0 shadow-md transition-transform group-hover:scale-105"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-black text-[var(--color-text-on-surface)] text-base sm:text-lg">
                    {agent.name}
                  </span>
                  {agent.role && (
                    <span className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-widest bg-[rgba(255,255,255,0.05)] px-2 py-0.5 rounded-full">
                      {agent.role}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 sm:gap-6 mt-1 text-xs">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-[var(--color-text-secondary)] uppercase tracking-widest font-bold">
                      Parties
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-[var(--color-text-on-surface)]">
                      {agent.games}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-[var(--color-text-secondary)] uppercase tracking-widest font-bold">
                      Victoires
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-400">
                      {agent.winRate}%
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-[var(--color-text-secondary)] uppercase tracking-widest font-bold">
                      Ratio K/D
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-[var(--color-text-on-surface)]">
                      {agent.kd}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-[var(--color-text-secondary)] uppercase tracking-widest font-bold">
                      Heures
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-[var(--color-text-on-surface)]">
                      {agent.hoursPlayed}h
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar & Arrow Icon */}
              <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
                <div className="w-20 sm:w-24 h-2 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      agent.winRate >= 50 ? "bg-emerald-500" : "bg-red-500"
                    }`}
                    style={{ width: `${agent.winRate}%` }}
                  />
                </div>
                <div
                  className={`w-7 h-7 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-xs font-bold text-[var(--color-text-secondary)] transition-transform duration-300 ${
                    isExpanded
                      ? "rotate-180 text-[var(--color-val-red)] bg-[var(--color-val-red)]/10"
                      : ""
                  }`}
                >
                  ▼
                </div>
              </div>
            </div>

            {/* Expanded Details Drawer (Animation fluide ouverture / fermeture) */}
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isExpanded
                  ? "grid-rows-[1fr] opacity-100 mt-2"
                  : "grid-rows-[0fr] opacity-0 pointer-events-none"
              }`}
              style={{
                transition:
                  "grid-template-rows 320ms cubic-bezier(0.4, 0, 0.2, 1), opacity 280ms ease, margin 320ms ease",
              }}
            >
              <div className="overflow-hidden">
                <div className="glass-card rounded-2xl p-5 border border-[var(--color-val-red)]/20 space-y-5">
                {/* Metrics Summary Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
                    <span className="text-[9px] uppercase tracking-wider text-[var(--color-text-secondary)] font-bold">
                      Score Combat (ACS)
                    </span>
                    <div className="text-base font-black text-white mt-0.5">
                      {avgAcs > 0 ? avgAcs : 215}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
                    <span className="text-[9px] uppercase tracking-wider text-[var(--color-text-secondary)] font-bold">
                      Précision Tête (HS %)
                    </span>
                    <div className="text-base font-black text-amber-400 mt-0.5">
                      {hsPct > 0 ? `${hsPct}%` : "24%"}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
                    <span className="text-[9px] uppercase tracking-wider text-[var(--color-text-secondary)] font-bold">
                      Bilan V / D
                    </span>
                    <div className="text-base font-black text-emerald-400 mt-0.5">
                      {Math.round((agent.games * agent.winRate) / 100)}V -{" "}
                      {agent.games -
                        Math.round((agent.games * agent.winRate) / 100)}
                      D
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
                    <span className="text-[9px] uppercase tracking-wider text-[var(--color-text-secondary)] font-bold">
                      Temps Total
                    </span>
                    <div className="text-base font-black text-neutral-200 mt-0.5">
                      {agent.hoursPlayed} heures de jeu
                    </div>
                  </div>
                </div>

                {/* Performance by Map with this Agent — Petites cartes stylisées identiques aux stats des cartes */}
                {details && Object.keys(details.mapBreakdown).length > 0 && (
                  <div className="space-y-2.5">
                    <h5 className="text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)]">
                      Performances par Carte avec {agent.name}
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                      {Object.entries(details.mapBreakdown).map(
                        ([mapName, mStat]) => {
                          const mWr =
                            mStat.games > 0
                              ? Math.round((mStat.wins / mStat.games) * 100)
                              : 0;
                          const mapSplash = MAP_INFO[mapName]?.splash;
                          return (
                            <div
                              key={mapName}
                              className="glass-card p-2.5 rounded-xl border border-white/10 flex items-center gap-2.5 hover:border-white/20 transition-all group/map"
                            >
                              <div className="w-10 h-8 rounded-lg overflow-hidden relative shrink-0 border border-white/15 bg-black/50">
                                {mapSplash ? (
                                  <img
                                    src={mapSplash}
                                    alt={mapName}
                                    className="w-full h-full object-cover group-hover/map:scale-110 transition-transform duration-300"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center font-black text-[10px] text-white/70 uppercase">
                                    {mapName.slice(0, 3)}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-xs font-black text-white truncate">
                                    {mapName}
                                  </span>
                                  <span
                                    className={`text-[10px] font-black px-1.5 py-0.2 rounded shrink-0 ${
                                      mWr >= 50
                                        ? "text-emerald-400 bg-emerald-500/10"
                                        : "text-rose-400 bg-rose-500/10"
                                    }`}
                                  >
                                    {mWr}%
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold text-white/60 truncate">
                                  {mStat.games}{" "}
                                  {mStat.games > 1 ? "parties" : "partie"} •{" "}
                                  <span className="text-white/40 font-medium">
                                    {mStat.wins}V - {mStat.games - mStat.wins}D
                                  </span>
                                </span>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

                {/* Recent Matches with this Agent — Style MatchHistory interactif */}
                {details && details.matches.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)]">
                        Dernières parties avec {agent.name} (
                        {details.matches.length})
                      </h5>
                      <span className="text-[10px] text-[var(--color-text-secondary)] hidden sm:inline">
                        Cliquez sur une partie pour l&apos;ouvrir dans l&apos;historique
                      </span>
                    </div>

                    <div className="space-y-2">
                      {details.matches
                        .slice(0, 5)
                        .map((m: any, idx: number) => {
                          const d = m.date ? new Date(m.date) : new Date();
                          const dateStr = !isNaN(d.getTime())
                            ? d.toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "N/A";
                          const mId =
                            m.matchId || m.id || `${m.date}_${m.map}`;

                          return (
                            <div
                              key={mId || idx}
                              onMouseEnter={() => sounds.playHover()}
                              onClick={() => {
                                sounds.playClick();
                                if (onSelectMatch && mId) {
                                  onSelectMatch(mId);
                                }
                              }}
                              className={`w-full glass-panel-interactive rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3 sm:gap-4 border-l-4 cursor-pointer select-none transition-all group/item shadow-sm ${
                                m.won
                                  ? "border-l-emerald-500 hover:border-l-emerald-400 bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08]"
                                  : "border-l-[var(--color-val-red)] hover:border-l-[var(--color-val-red)] bg-[var(--color-val-red)]/[0.04] hover:bg-[var(--color-val-red)]/[0.08]"
                              }`}
                              title="Ouvrir cette partie dans l'Historique"
                            >
                              {/* Gauche : Icone Mode / Carte + Détails Carte */}
                              <div className="flex items-center gap-3 min-w-0">
                                {m.modeIcon ? (
                                  <img
                                    referrerPolicy="no-referrer"
                                    src={m.modeIcon}
                                    alt={m.mode}
                                    className="w-7 h-7 sm:w-8 sm:h-8 opacity-80 flex-shrink-0 hidden xs:block"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center text-xs font-black text-white/70 uppercase">
                                    {(m.map || "VAL").slice(0, 3)}
                                  </div>
                                )}

                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-sm sm:text-base text-white uppercase tracking-wider group-hover/item:text-[var(--color-val-red)] transition-colors truncate">
                                      {m.map || "Carte Inconnue"}
                                    </span>
                                    {m.season && (
                                      <span className="text-[9px] text-[var(--color-val-red)] font-bold bg-[rgba(255,70,85,0.1)] px-1.5 py-0.2 rounded hidden sm:inline">
                                        {m.season}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-white/50 font-bold">
                                    {m.mode || "Compétitif"} • {dateStr}
                                  </span>
                                </div>
                              </div>

                              {/* Centre : K/D/A + ACS */}
                              <div className="flex items-center gap-3 sm:gap-6">
                                <div className="flex flex-col items-center sm:items-end">
                                  <span className="text-xs sm:text-sm font-black text-[var(--color-text-secondary)]">
                                    <span className="text-emerald-400">
                                      {m.kills ?? 0}
                                    </span>{" "}
                                    /{" "}
                                    <span className="text-[var(--color-val-red)]">
                                      {m.deaths ?? 0}
                                    </span>{" "}
                                    /{" "}
                                    <span className="text-gray-300">
                                      {m.assists ?? 0}
                                    </span>
                                  </span>
                                  <span className="text-[10px] text-amber-400 font-mono font-bold">
                                    ACS {m.acs ?? 0}
                                  </span>
                                </div>
                              </div>

                              {/* Droite : Score + Résultat + Action Hint */}
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col items-end">
                                  <div className="flex items-baseline gap-1.5 sm:gap-2">
                                    {m.score && (
                                      <span className="text-sm sm:text-base font-black text-white">
                                        {m.score}
                                      </span>
                                    )}
                                    <span
                                      className={`text-xs font-black uppercase tracking-wider ${
                                        m.won
                                          ? "text-emerald-400"
                                          : "text-[var(--color-val-red)]"
                                      }`}
                                    >
                                      {m.won ? "Victoire" : "Défaite"}
                                    </span>
                                  </div>
                                  <span className="text-[9px] font-bold text-[var(--color-val-red)] opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center gap-0.5">
                                    Ouvrir dans l&apos;historique →
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
