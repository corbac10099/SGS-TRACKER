"use client";

import React from "react";
import { IconBrain, IconCrosshair, IconTarget, IconSparkles } from "./icons/SpyIcons";
import { generateCoachReport } from "@/lib/valorant/coachEngine";

export interface AiCoachWidgetProps {
  matches?: any[];
  agentStats?: any[];
  stats?: any;
  playerName?: string;
  onOpenModal: () => void;
}

export default function AiCoachWidget({
  matches = [],
  agentStats = [],
  stats = {},
  playerName = "Joueur",
  onOpenModal,
}: AiCoachWidgetProps) {
  const report = React.useMemo(() => {
    return generateCoachReport(matches, agentStats, stats, playerName);
  }, [matches, agentStats, stats, playerName]);

  return (
    <div className="w-full h-full p-3 sm:p-4 rounded-2xl glass-panel-interactive flex flex-col justify-between relative overflow-hidden group">
      {/* Accent glow corner */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-val-red)]/10 rounded-full blur-2xl pointer-events-none group-hover:bg-[var(--color-val-red)]/15 transition-all"></div>

      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--color-val-red)]/15 border border-[var(--color-val-red)]/30 flex items-center justify-center text-[var(--color-val-red)]">
            <IconBrain size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black text-white uppercase tracking-wider">
              Coach Tactique Spycam
            </span>
            <span className="text-[10px] text-[var(--color-text-secondary)] font-medium">
              Diagnostic Télémétrique en Direct
            </span>
          </div>
        </div>

        {/* Global Tactical Score Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl glass-pill">
          <span className="text-[9px] text-[var(--color-text-secondary)] font-bold uppercase tracking-wider">Indice</span>
          <span className="text-xs font-black text-emerald-400 font-mono">
            {report.overallScore}/100
          </span>
        </div>
      </div>

      {/* Body: Live Match Strip & Archetype */}
      <div className="my-2.5 space-y-2 relative z-10">
        {report.liveMatch && (
          <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px]">
            <span className="text-emerald-300 font-bold flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
              <span className="truncate">Direct : {report.liveMatch.map} ({report.liveMatch.score})</span>
            </span>
            <span className="text-gray-300 font-mono text-[9px] flex-shrink-0 ml-1">
              {report.liveMatch.kdRatio} K/D • {report.liveMatch.hsPct}% HS
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">
            Archétype Tactique
          </span>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/10 text-amber-300 border border-amber-400/20">
            {report.archetype}
          </span>
        </div>

        <p className="text-[11px] text-gray-300 leading-snug line-clamp-2">
          {report.archetypeDescription}
        </p>

        {/* 2 Quick Tactical Bars */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-1.5 rounded-lg glass-pill flex flex-col gap-1">
            <div className="flex items-center justify-between text-[9px] font-bold">
              <span className="text-[var(--color-text-secondary)] flex items-center gap-1">
                <IconCrosshair size={10} className="text-emerald-400" />
                <span>Précision</span>
              </span>
              <span className="text-emerald-400 font-mono">{report.tacticalScores.aimPrecision}%</span>
            </div>
            <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${report.tacticalScores.aimPrecision}%` }}
              ></div>
            </div>
          </div>

          <div className="p-1.5 rounded-lg glass-pill flex flex-col gap-1">
            <div className="flex items-center justify-between text-[9px] font-bold">
              <span className="text-[var(--color-text-secondary)] flex items-center gap-1">
                <IconTarget size={10} className="text-[var(--color-val-red)]" />
                <span>Ouvertures</span>
              </span>
              <span className="text-[var(--color-val-red)] font-mono">{report.tacticalScores.openingDuels}%</span>
            </div>
            <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-[var(--color-val-red)] rounded-full"
                style={{ width: `${report.tacticalScores.openingDuels}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Action Button */}
      <button
        type="button"
        onClick={onOpenModal}
        className="w-full py-2 px-3 rounded-xl bg-[var(--color-surface)] hover:bg-[var(--color-val-red)] border border-white/10 hover:border-[var(--color-val-red)] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md group-hover:scale-[1.01]"
      >
        <IconSparkles size={14} className="text-amber-300" />
        <span>Ouvrir l&apos;Analyse Complète du Coach</span>
      </button>
    </div>
  );
}
