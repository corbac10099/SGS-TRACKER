"use client";

import React, { useState } from "react";
import {
  IconBrain,
  IconCrosshair,
  IconTarget,
  IconShield,
  IconMap,
  IconSparkles,
  IconFlame,
  IconInfo,
  IconX,
  IconSword,
  IconTrophy,
} from "./icons/SpyIcons";
import { generateCoachReport, analyzeLiveMatch, CoachAnalysisReport } from "@/lib/valorant/coachEngine";

export interface AiCoachModalProps {
  isOpen?: boolean;
  onClose: () => void;
  matches?: any[];
  agentStats?: any[];
  stats?: any;
  playerName?: string;
}

export default function AiCoachModal({
  isOpen = true,
  onClose,
  matches = [],
  agentStats = [],
  stats = {},
  playerName = "Joueur",
}: AiCoachModalProps) {
  const [activeTab, setActiveTab] = useState<"live" | "global">("live");
  const [selectedMatchId, setSelectedMatchId] = useState<string>(matches[0]?.matchId || "");

  const report: CoachAnalysisReport = React.useMemo(() => {
    return generateCoachReport(matches, agentStats, stats, playerName);
  }, [matches, agentStats, stats, playerName]);

  const selectedMatch = matches.find((m) => m.matchId === selectedMatchId) || matches[0];
  const liveMatch = React.useMemo(() => {
    if (!selectedMatch) return report.liveMatch;
    return analyzeLiveMatch(selectedMatch, playerName);
  }, [selectedMatch, playerName, report.liveMatch]);

  // Diagramme Radar Pentagonal (5 axes) calculé avec trigo pure
  const radarAxes = [
    { key: "aimPrecision", label: "Visée & HS%", val: report.tacticalScores.aimPrecision },
    { key: "combatImpact", label: "Impact & Frags", val: report.tacticalScores.combatImpact },
    { key: "survivalKast", label: "Survie (KAST)", val: report.tacticalScores.survivalKast },
    { key: "openingDuels", label: "1ers Duels", val: report.tacticalScores.openingDuels },
    { key: "mapVersatility", label: "Polyvalence Maps", val: report.tacticalScores.mapVersatility },
  ];

  const center = 110;
  const radius = 80;

  const points = radarAxes.map((axis, i) => {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const r = (axis.val / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, angle, label: axis.label, val: axis.val };
  });

  const polygonPath = points.map((p) => `${p.x},${p.y}`).join(" ");

  if (isOpen === false) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl glass-modal rounded-3xl p-4 sm:p-6 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--color-val-red)]/20 border border-[var(--color-val-red)]/40 flex items-center justify-center text-[var(--color-val-red)] shadow-lg shadow-[var(--color-val-red)]/10">
              <IconBrain size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                  Coach Tactique SGS
                </h3>
                <span className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Télémétrie en Direct
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Diagnostic esport et analyse télémétrique pour <span className="text-white font-bold">{playerName}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
          >
            <IconX size={16} />
          </button>
        </div>

        {/* View Mode Navigation Tabs */}
        <div className="flex items-center gap-2 pt-3 pb-1 border-b border-white/5 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("live")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "live"
                ? "bg-[var(--color-val-red)] text-white shadow-[0_0_15px_rgba(255,70,85,0.4)] font-black"
                : "bg-white/5 hover:bg-white/10 text-gray-300"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Débriefing Match en Direct</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("global")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "global"
                ? "bg-[var(--color-val-red)] text-white shadow-[0_0_15px_rgba(255,70,85,0.4)] font-black"
                : "bg-white/5 hover:bg-white/10 text-gray-300"
            }`}
          >
            <IconTrophy size={13} />
            <span>Bilan Télémétrique & Radar</span>
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 my-3 custom-scrollbar">
          {activeTab === "live" ? (
            /* ================= VUE DÉBRIEFING MATCH EN DIRECT ================= */
            <div className="space-y-4">
              {/* Match Selector Strip */}
              {matches.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex-shrink-0">
                    Match analysé :
                  </span>
                  {matches.slice(0, 8).map((m, idx) => {
                    const isSelected = (selectedMatch?.matchId || matches[0]?.matchId) === m.matchId;
                    return (
                      <button
                        key={m.matchId || idx}
                        type="button"
                        onClick={() => setSelectedMatchId(m.matchId)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all flex-shrink-0 cursor-pointer ${
                          isSelected
                            ? "bg-[var(--color-val-red)]/20 border-[var(--color-val-red)] text-white shadow-sm"
                            : "bg-black/40 hover:bg-white/5 border-white/10 text-gray-400 hover:text-gray-200"
                        }`}
                      >
                        <img
                          src={m.agentIcon}
                          alt=""
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span>{m.map}</span>
                        <span
                          className={`text-[10px] px-1 py-0.2 rounded font-black ${
                            m.won ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {m.score || (m.won ? "V" : "D")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {liveMatch ? (
                <>
                  {/* Live Match Summary Header Card */}
                  <div className="p-4 sm:p-5 rounded-2xl glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
                    <div className="flex items-center gap-3.5 relative z-10">
                      <img
                        src={liveMatch.agentIcon}
                        alt={liveMatch.agent}
                        className="w-14 h-14 rounded-2xl border border-white/20 object-cover shadow-lg"
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider ${
                              liveMatch.won
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-[var(--color-val-red)]/20 text-[var(--color-val-red)] border border-[var(--color-val-red)]/30"
                            }`}
                          >
                            {liveMatch.won ? "Victoire" : "Défaite"} {liveMatch.score}
                          </span>
                          <span className="text-xs text-gray-400">• {liveMatch.map}</span>
                          <span className="text-xs text-gray-500 font-mono">({liveMatch.date})</span>
                        </div>
                        <h4 className="text-base font-black text-white">
                          {liveMatch.agent} • {liveMatch.kills}K / {liveMatch.deaths}D / {liveMatch.assists}A
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-gray-300 font-mono pt-0.5">
                          <span>Ratio K/D : <strong className={liveMatch.kdRatio >= 1.0 ? "text-emerald-400" : "text-[var(--color-val-red)]"}>{liveMatch.kdRatio}</strong></span>
                          <span>•</span>
                          <span>Headshot : <strong className="text-white">{liveMatch.hsPct}%</strong></span>
                          <span>•</span>
                          <span>ADR : <strong className="text-white">{liveMatch.adr}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-4">
                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                        Combat Score
                      </span>
                      <span className="text-2xl font-black text-white font-mono">
                        {liveMatch.acs} <span className="text-xs text-gray-400 font-normal">ACS</span>
                      </span>
                    </div>
                  </div>

                  {/* Synthèse Express en 1 coup d'œil */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-white/5 to-[var(--color-val-red)]/10 border border-white/15 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                      <IconSparkles size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                          Recommandation Prioritaire
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-gray-300 font-bold">
                          Impact Immédiat
                        </span>
                      </div>
                      <p className="text-xs text-white font-medium leading-relaxed">
                        {liveMatch.nextMatchCorrection}
                      </p>
                    </div>
                  </div>

                  {/* 4 Télémétrie Live KPI Cards Simplifiées */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* KPI 1 : Attaque vs Défense */}
                    <div className="p-3.5 rounded-xl glass-card space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-300 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                          <span>⚖️ Attaque vs Défense</span>
                        </span>
                        <span className="text-[11px] font-bold text-amber-300 px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                          {liveMatch.half1Winrate > liveMatch.half2Winrate ? "Fort en Attaque" : liveMatch.half2Winrate > liveMatch.half1Winrate ? "Fort en Défense" : "Équilibré"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                          <span className="text-[9px] text-gray-400 uppercase block font-bold">1ère Mi-temps</span>
                          <span className="font-mono font-black text-white text-sm">
                            {liveMatch.half1Wins} - {liveMatch.half1Losses}
                          </span>
                          <span className="text-[10px] text-gray-400 block font-mono">({liveMatch.half1Winrate}% de victoires)</span>
                        </div>
                        <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                          <span className="text-[9px] text-gray-400 uppercase block font-bold">2nde Mi-temps</span>
                          <span className="font-mono font-black text-white text-sm">
                            {liveMatch.half2Wins} - {liveMatch.half2Losses}
                          </span>
                          <span className="text-[10px] text-gray-400 block font-mono">({liveMatch.half2Winrate}% de victoires)</span>
                        </div>
                      </div>
                    </div>

                    {/* KPI 2 : Rounds Pistolets (Économie) */}
                    <div className="p-3.5 rounded-xl glass-card space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-300 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                          <span>🔫 Rounds Pistolets (Rounds 1 & 13)</span>
                        </span>
                        <span className={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded border ${liveMatch.pistolsWon > 0 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-[var(--color-val-red)] border-red-500/20"}`}>
                          {liveMatch.pistolsWon}/2 Gagnés
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                          <span className="text-[9px] text-gray-400 uppercase block font-bold">Taux de Réussite</span>
                          <span className="font-mono font-black text-white text-sm">
                            {liveMatch.pistolConversionRate}%
                          </span>
                          <span className="text-[10px] text-gray-400 block">Round 1 & Round 13</span>
                        </div>
                        <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                          <span className="text-[9px] text-gray-400 uppercase block font-bold">Round suivant (Bonus)</span>
                          <span className={`font-mono font-black text-sm ${liveMatch.antiEcoConverted ? "text-emerald-400" : "text-amber-400"}`}>
                            {liveMatch.antiEcoConverted ? "Sécurisé ✅" : "Perdu ⚠️"}
                          </span>
                          <span className="text-[10px] text-gray-400 block">Gestion de l&apos;avantage</span>
                        </div>
                      </div>
                    </div>

                    {/* KPI 3 : Séries de Rounds consécutifs */}
                    <div className="p-3.5 rounded-xl glass-card space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-300 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                          <span>📈 Séries & Rythme du match</span>
                        </span>
                        <span className="text-[11px] font-bold text-gray-200 px-1.5 py-0.5 rounded bg-white/10 border border-white/10">
                          {liveMatch.multiKillsCount} Multi-kills (2+)
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                          <span className="text-[9px] text-gray-400 uppercase block font-bold">Meilleure série</span>
                          <span className="font-mono font-black text-emerald-400 text-sm">
                            +{liveMatch.maxWinStreak} Rounds
                          </span>
                          <span className="text-[10px] text-gray-400 block">Victoires consécutives</span>
                        </div>
                        <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                          <span className="text-[9px] text-gray-400 uppercase block font-bold">Pire passage à vide</span>
                          <span className="font-mono font-black text-[var(--color-val-red)] text-sm">
                            -{liveMatch.maxLossStreak} Rounds
                          </span>
                          <span className="text-[10px] text-gray-400 block">Défaites consécutives</span>
                        </div>
                      </div>
                    </div>

                    {/* KPI 4 : Duels Clés Nemesis & Proie */}
                    <div className="p-3.5 rounded-xl glass-card space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-300 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                          <span>🎯 Duels Individuels Clés</span>
                        </span>
                        <span className="text-[10px] text-gray-400">
                          Face-à-Face
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-lg bg-[var(--color-val-red)]/10 border border-[var(--color-val-red)]/20">
                          <span className="text-[9px] text-[var(--color-val-red)] uppercase block font-bold">Bête Noire</span>
                          <span className="font-bold text-white text-xs truncate block">
                            {liveMatch.topNemesis?.name || "Aucun"}
                          </span>
                          <span className="text-[10px] text-[var(--color-val-red)] font-mono">
                            {liveMatch.topNemesis ? `${liveMatch.topNemesis.deaths} duels concédés` : "Pas de bête noire"}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <span className="text-[9px] text-emerald-300 uppercase block font-bold">Cible Facile</span>
                          <span className="font-bold text-white text-xs truncate block">
                            {liveMatch.topPrey?.name || "Équilibré"}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono">
                            {liveMatch.topPrey ? `${liveMatch.topPrey.kills} duels remportés` : "Kills équilibrés"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Verdict & Tournant Clé */}
                  <div className="p-4 rounded-2xl glass-card space-y-2">
                    <div className="flex items-center gap-2 text-white">
                      <IconCrosshair size={16} className="text-[var(--color-val-red)]" />
                      <h4 className="text-xs font-black uppercase tracking-wider">
                        Diagnostic Direct de la Rencontre
                      </h4>
                    </div>
                    <p className="text-xs text-gray-200 leading-relaxed font-medium">
                      {liveMatch.directVerdict}
                    </p>
                    <div className="pt-2 border-t border-white/5 flex items-start gap-2 text-xs text-gray-300">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 shrink-0">
                        Tournant clé :
                      </span>
                      <span>{liveMatch.keyTurningPoint}</span>
                    </div>
                  </div>

                  {/* Correction Immédiate Prochain Match */}
                  <div className="p-4 rounded-2xl glass-card border-[var(--color-val-red)]/40 bg-[var(--color-val-red)]/10 space-y-1.5">
                    <div className="flex items-center gap-2 text-[var(--color-val-red)]">
                      <IconTarget size={16} />
                      <h4 className="text-xs font-black uppercase tracking-wider">
                        Correction Immédiate pour le Prochain Match
                      </h4>
                    </div>
                    <p className="text-xs text-gray-100 font-semibold leading-relaxed">
                      {liveMatch.nextMatchCorrection}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-400 text-xs">
                  Aucun match récent disponible pour le débriefing en direct.
                </div>
              )}
            </div>
          ) : (
            /* ================= VUE BILAN TÉLÉMÉTRIQUE & RADAR ================= */
            <div className="space-y-5">
              {/* Section 1: Archetype & Radar Diagram */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center glass-card p-4 sm:p-5 rounded-2xl">
                <div className="md:col-span-7 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-val-red)] bg-[var(--color-val-red)]/10 px-2 py-0.5 rounded">
                      Profil Tactique
                    </span>
                    <span className="text-xs font-black text-white">{report.archetypeTitle}</span>
                  </div>

                  <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {report.archetype}
                  </h4>

                  <p className="text-xs text-gray-300 leading-relaxed">
                    {report.archetypeDescription}
                  </p>

                  <div className="flex items-center gap-4 pt-1 flex-wrap">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Indice Global</span>
                      <span className="text-lg font-black text-emerald-400 font-mono">{report.overallScore}/100</span>
                    </div>
                    <div className="w-px h-8 bg-white/10"></div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Dynamique Récente</span>
                      <span className={`text-xs font-bold ${report.formTrend === "rising" ? "text-emerald-400" : "text-amber-400"}`}>
                        {report.formTrend === "rising" ? "En Progression Positive" : "Constante & Stable"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Radar Diagram Pentagone */}
                <div className="md:col-span-5 flex flex-col items-center justify-center">
                  <svg width="220" height="220" viewBox="0 0 220 220" className="overflow-visible select-none">
                    {/* Background Concentric Circles */}
                    {[0.25, 0.5, 0.75, 1].map((scale, i) => (
                      <circle
                        key={i}
                        cx={center}
                        cy={center}
                        r={radius * scale}
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeDasharray="2,2"
                      />
                    ))}

                    {/* Axes lines */}
                    {points.map((p, i) => {
                      const endX = center + radius * Math.cos(p.angle);
                      const endY = center + radius * Math.sin(p.angle);
                      return (
                        <line
                          key={`axis-${i}`}
                          x1={center}
                          y1={center}
                          x2={endX}
                          y2={endY}
                          stroke="rgba(255,255,255,0.12)"
                        />
                      );
                    })}

                    {/* Radar Filled Shape */}
                    <polygon
                      points={polygonPath}
                      fill="rgba(255, 70, 85, 0.25)"
                      stroke="var(--color-val-red, #ff4655)"
                      strokeWidth="2.2"
                    />

                    {/* Data Points */}
                    {points.map((p, i) => (
                      <circle key={`pt-${i}`} cx={p.x} cy={p.y} r="3.5" fill="var(--color-val-red, #ff4655)" stroke="#ffffff" strokeWidth="1.5" />
                    ))}

                    {/* Labels around radar */}
                    {points.map((p, i) => {
                      const labelRadius = radius + 20;
                      const lx = center + labelRadius * Math.cos(p.angle);
                      const ly = center + labelRadius * Math.sin(p.angle);
                      return (
                        <text
                          key={`lbl-${i}`}
                          x={lx}
                          y={ly}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="fill-gray-300 text-[8.5px] font-bold"
                        >
                          {p.label}
                        </text>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Section 2: Points Forts & Diagnostics Critiques */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Forces Clés */}
                <div className="p-4 sm:p-5 rounded-2xl glass-card space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <IconFlame size={18} />
                      <h4 className="text-xs font-black uppercase tracking-wider">Vos Points Forts Majeurs</h4>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      🟢 À maintenir
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {report.strengths.map((item) => (
                      <div key={item.id} className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span className="text-emerald-400 text-xs">✔</span>
                            <span>{item.title}</span>
                          </span>
                          <span className="text-xs font-black text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{item.statValue}</span>
                        </div>
                        <p className="text-[11px] text-gray-300 leading-relaxed">{item.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Axes d'Amélioration */}
                <div className="p-4 sm:p-5 rounded-2xl glass-card space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[var(--color-val-red)]">
                      <IconTarget size={18} />
                      <h4 className="text-xs font-black uppercase tracking-wider">Axes Prioritaires d&apos;Entraînement</h4>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-[var(--color-val-red)] border border-red-500/30">
                      🔴 Priorité haute
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {report.weaknesses.map((item) => (
                      <div key={item.id} className="p-3 rounded-xl bg-[var(--color-val-red)]/5 border border-[var(--color-val-red)]/20 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span className="text-[var(--color-val-red)] text-xs">⚠</span>
                            <span>{item.title}</span>
                          </span>
                          <span className="text-xs font-black text-[var(--color-val-red)] font-mono bg-[var(--color-val-red)]/10 px-2 py-0.5 rounded border border-[var(--color-val-red)]/20">{item.statValue}</span>
                        </div>
                        <p className="text-[11px] text-gray-300 leading-relaxed">{item.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 3: Plan d'Action Prochaine Partie */}
              <div className="p-4 sm:p-5 rounded-2xl glass-card space-y-3">
                <div className="flex items-center gap-2 text-amber-300">
                  <IconSparkles size={18} />
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    Plan d&apos;Action Concret (Prochaine Partie Compétitive)
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {report.actionPlan.map((action) => (
                    <div key={action.step} className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="w-5 h-5 rounded-full bg-amber-400 text-black text-[10px] font-black flex items-center justify-center">
                            {action.step}
                          </span>
                          <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">
                            {action.focusArea}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-white mt-1">{action.title}</div>
                        <p className="text-[11px] text-gray-300 leading-snug">{action.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Recommandations par Map */}
              {report.mapRecommendations.length > 0 && (
                <div className="p-4 rounded-2xl glass-card space-y-3">
                  <div className="flex items-center gap-2 text-[var(--color-val-red)]">
                    <IconMap size={18} />
                    <h4 className="text-xs font-black uppercase tracking-wider">Recommandations par Carte</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {report.mapRecommendations.map((mr) => (
                      <div key={mr.map} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3">
                        <div className="flex flex-col items-center justify-center w-12 flex-shrink-0">
                          <span className="text-xs font-black text-white">{mr.map}</span>
                          <span className={`text-[10px] font-black font-mono ${mr.winrate >= 50 ? "text-emerald-400" : "text-[var(--color-val-red)]"}`}>
                            {mr.winrate}%
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wide block mb-0.5">
                            {mr.verdict}
                          </span>
                          <p className="text-[11px] text-gray-300 leading-snug">{mr.advice}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs text-gray-400 flex-shrink-0">
          <span className="text-[10px] text-gray-500">
            Analyse recalculée automatiquement après chaque match
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors cursor-pointer text-xs"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
