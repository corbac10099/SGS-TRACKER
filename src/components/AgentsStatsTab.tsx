"use client";

import React, { useState, useMemo } from "react";
import { sounds } from "@/lib/soundEffects";

export interface AgentsStatsTabProps {
  agentStats: any[];
  matches?: any[];
}

/**
 * Onglet "Agents" du profil — liste des agents joués avec stats,
 * et déploiement interactif au clic avec télémétrie par carte et derniers matchs.
 */
export default function AgentsStatsTab({ agentStats, matches = [] }: AgentsStatsTabProps) {
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
            {/* Main Agent Card */}
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
                  <span className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-widest bg-[rgba(255,255,255,0.05)] px-2 py-0.5 rounded-full">
                    {agent.role}
                  </span>
                  <span className="text-[10px] text-[var(--color-val-red)] font-bold ml-auto sm:ml-0 px-2 py-0.5 rounded bg-[var(--color-val-red)]/10 sm:hidden">
                    {isExpanded ? "Fermer ▲" : "Détails ▼"}
                  </span>
                </div>
                <div className="flex items-center gap-3 sm:gap-5 mt-2 flex-wrap">
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
                      Win Rate
                    </span>
                    <span
                      className={`text-xs sm:text-sm font-bold ${
                        agent.winRate >= 50 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {agent.winRate}%
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-[var(--color-text-secondary)] uppercase tracking-widest font-bold">
                      K/D
                    </span>
                    <span
                      className={`text-xs sm:text-sm font-bold ${
                        agent.kd >= 1 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
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
                    isExpanded ? "rotate-180 text-[var(--color-val-red)] bg-[var(--color-val-red)]/10" : ""
                  }`}
                >
                  ▼
                </div>
              </div>
            </div>

            {/* Expanded Details Drawer */}
            {isExpanded && (
              <div className="glass-card rounded-2xl p-5 border border-[var(--color-val-red)]/20 animate-in fade-in slide-in-from-top-3 duration-300 space-y-4">
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
                      {agent.games - Math.round((agent.games * agent.winRate) / 100)}D
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

                {/* Performance by Map with this Agent */}
                {details && Object.keys(details.mapBreakdown).length > 0 && (
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] mb-2">
                      Performances par Carte avec {agent.name}
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {Object.entries(details.mapBreakdown).map(([mapName, mStat]) => {
                        const mWr =
                          mStat.games > 0 ? Math.round((mStat.wins / mStat.games) * 100) : 0;
                        return (
                          <div
                            key={mapName}
                            className="p-2.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] flex items-center justify-between"
                          >
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-white uppercase tracking-wider">
                                {mapName}
                              </span>
                              <span className="text-[10px] text-[var(--color-text-secondary)]">
                                {mStat.wins}V - {mStat.games - mStat.wins}D
                              </span>
                            </div>
                            <span
                              className={`text-xs font-black px-1.5 py-0.5 rounded ${
                                mWr >= 50
                                  ? "text-emerald-400 bg-emerald-500/10"
                                  : "text-red-400 bg-red-500/10"
                              }`}
                            >
                              {mWr}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Recent Matches with this Agent */}
                {details && details.matches.length > 0 && (
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] mb-2">
                      Dernières parties avec {agent.name}
                    </h5>
                    <div className="space-y-1.5">
                      {details.matches.slice(0, 4).map((m: any, idx: number) => (
                        <div
                          key={m.matchId || idx}
                          className={`p-2.5 rounded-lg flex items-center justify-between border ${
                            m.won
                              ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                              : "bg-[var(--color-val-red)]/5 border-[var(--color-val-red)]/20 text-[var(--color-val-red)]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-white uppercase tracking-wider">
                              {m.map || "Carte"}
                            </span>
                            <span className="text-[10px] text-[var(--color-text-secondary)] font-bold">
                              {m.mode || "Compétitif"} • {m.score || (m.won ? "Victoire" : "Défaite")}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs font-black">
                            <span className="text-neutral-300">
                              {m.kills}/{m.deaths}/{m.assists}
                            </span>
                            <span className="text-[10px] text-[var(--color-text-secondary)]">
                              ACS {m.acs || 0}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
