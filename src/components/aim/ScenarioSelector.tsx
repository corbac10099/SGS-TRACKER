"use client";

import React, { useState } from "react";
import type { AimRankId, AimScenarioId, AimLevelInfo } from "./types";
import { SCENARIOS, SCENARIO_CATEGORIES, getScenariosByCategory } from "./scenarios";
import { AIM_RANKS, getNextRank, getAimLevelInfo } from "./ranks";
import { MAPS } from "./maps";

interface Props {
  onSelect: (id: AimScenarioId) => void;
  onOpenCalibration: () => void;
  userRank: AimRankId;
  calibrationDone: boolean;
  adaptiveMultiplier?: number;
  userName?: string;
  themeAccent?: string;
  aimLevelInfo?: AimLevelInfo;
}

const CATEGORY_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  runner: {
    label: "Course & Parkour",
    color: "#38bdf8",
    bg: "rgba(56, 189, 248, 0.12)",
    border: "rgba(56, 189, 248, 0.35)",
  },
  precision: {
    label: "Précision",
    color: "#ff4655",
    bg: "rgba(255, 70, 85, 0.12)",
    border: "rgba(255, 70, 85, 0.35)",
  },
  flicking: {
    label: "Flicking",
    color: "#ffaa00",
    bg: "rgba(255, 170, 0, 0.12)",
    border: "rgba(255, 170, 0, 0.35)",
  },
  tracking: {
    label: "Tracking",
    color: "#00ffaa",
    bg: "rgba(0, 255, 170, 0.12)",
    border: "rgba(0, 255, 170, 0.35)",
  },
  reflexes: {
    label: "Réflexes",
    color: "#c084fc",
    bg: "rgba(192, 132, 252, 0.12)",
    border: "rgba(192, 132, 252, 0.35)",
  },
  elimination: {
    label: "Élimination",
    color: "#f43f5e",
    bg: "rgba(244, 63, 94, 0.12)",
    border: "rgba(244, 63, 94, 0.35)",
  },
};

export default function ScenarioSelector({
  onSelect,
  onOpenCalibration,
  userRank,
  calibrationDone,
  adaptiveMultiplier = 1.0,
  userName = "Agent",
  themeAccent = "#ff4655",
  aimLevelInfo,
}: Props) {
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const rankTier = AIM_RANKS[userRank] || AIM_RANKS.gold;
  const nextRankTier = getNextRank(userRank);
  const effectiveLevelInfo = aimLevelInfo || getAimLevelInfo(4500);

  const filteredScenarios = SCENARIOS.filter((s) => {
    const matchesCat = selectedCat === "all" || s.category === selectedCat;
    const matchesSearch =
      searchQuery.trim() === "" ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in pb-12">
      {/* Top Hero Card (Style Tracker Profil & Agents) */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-black/85 via-white/[0.04] to-black/85 border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ backgroundColor: themeAccent }} />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl font-black border shadow-xl flex-shrink-0"
              style={{
                backgroundColor: rankTier.bgColor,
                borderColor: rankTier.borderColor,
                color: rankTier.color,
              }}
            >
              {rankTier.name.charAt(0)}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)]">
                  Stand de Tir 3D Valorant
                </span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border font-bold"
                  style={{
                    color: rankTier.color,
                    borderColor: rankTier.borderColor,
                    backgroundColor: rankTier.bgColor,
                  }}
                >
                  Rang {rankTier.name}
                </span>

                {/* Badge Niveau d'Aim */}
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 border border-white/15 text-white flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: effectiveLevelInfo.badgeColor }} />
                  <span>Niveau {effectiveLevelInfo.level} • {effectiveLevelInfo.title}</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                {userName}
              </h1>

              {/* Barre de progression XP Aim */}
              <div className="pt-1.5 max-w-md w-full">
                <div className="flex items-center justify-between text-[10px] font-black text-gray-300 uppercase tracking-wider mb-1">
                  <span>EXP Stand de Tir</span>
                  <span className="text-amber-300 font-mono">
                    {effectiveLevelInfo.currentLevelXp} / {effectiveLevelInfo.nextLevelXp} XP ({effectiveLevelInfo.progressPercent}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden border border-white/5 p-0.5">
                  <div
                    className="h-full rounded-full transition-all duration-500 shadow-sm"
                    style={{
                      width: `${effectiveLevelInfo.progressPercent}%`,
                      backgroundColor: themeAccent,
                      boxShadow: `0 0 10px ${themeAccent}80`,
                    }}
                  />
                </div>
              </div>

              {/* Bannière Objectif Promotion de Rang */}
              {nextRankTier && (
                <div className="pt-2 flex items-center gap-2 text-xs font-bold text-amber-300">
                  <span>👑</span>
                  <span>
                    Objectif Promotion : <strong>1ère place du mois en {rankTier.name}</strong> pour passer{" "}
                    <strong className="underline decoration-emerald-400 decoration-2">{nextRankTier.name}</strong> !
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status or Calibration Trigger */}
          <div className="flex items-center gap-3">
            {calibrationDone ? (
              <div className="flex items-center gap-4 bg-white/[0.04] p-3.5 rounded-2xl border border-white/10">
                <div className="text-right">
                  <div className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">
                    Difficulté IA
                  </div>
                  <div className="text-base font-black text-emerald-400 font-mono">
                    x{adaptiveMultiplier} Adaptatif
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenCalibration}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Re-calibrer
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenCalibration}
                className="px-6 py-4 rounded-2xl bg-[var(--color-val-red)] hover:brightness-110 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg hover:scale-105 cursor-pointer flex items-center gap-2"
              >
                <span>Faire la Calibration Initiale</span>
                <span>➔</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Non-intrusive warning banner if not calibrated (free to browse!) */}
      {!calibrationDone && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-amber-400">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-white">
                Scénarios d&apos;entraînement en attente de calibration
              </div>
              <div className="text-xs text-amber-200/80 mt-0.5">
                Vous pouvez explorer les modes et régler votre réticule librement. Effectuez le test en 4 épreuves pour débloquer les lancements.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenCalibration}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shadow-md"
          >
            Lancer le Test (2 min)
          </button>
        </div>
      )}

      {/* Search Bar & Role/Category Filter Pills (Like Agents Catalog) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCat("all")}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              selectedCat === "all"
                ? "bg-[var(--color-val-red)] text-white shadow-md scale-105"
                : "bg-white/[0.04] text-[var(--color-text-secondary)] hover:text-white border border-white/10"
            }`}
          >
            Tous ({SCENARIOS.length})
          </button>
          {SCENARIO_CATEGORIES.map((cat) => {
            const meta = CATEGORY_META[cat.id] || {
              color: "#fff",
              bg: "rgba(255,255,255,0.08)",
              border: "rgba(255,255,255,0.15)",
            };
            const isSelected = selectedCat === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCat(cat.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
                  isSelected ? "scale-105 shadow-md" : "border-white/10 hover:border-white/25"
                }`}
                style={{
                  backgroundColor: isSelected ? meta.bg : "rgba(255,255,255,0.03)",
                  borderColor: isSelected ? meta.color : "rgba(255,255,255,0.1)",
                  color: isSelected ? meta.color : "var(--color-text-secondary)",
                }}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <input
            type="text"
            placeholder="Rechercher un scénario ou map..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-xs font-bold text-white placeholder-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-val-red)] transition-colors"
          />
          <svg
            className="absolute left-3.5 top-3 w-4 h-4 text-[var(--color-text-secondary)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      {/* Grid of Scenario Cards (Styling exact de la liste des Agents Tracker) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredScenarios.map((s) => {
          const map = MAPS[s.mapId];
          const isLocked = !calibrationDone;
          const meta = CATEGORY_META[s.category] || {
            color: "#ff4655",
            bg: "rgba(255, 70, 85, 0.12)",
            border: "rgba(255, 70, 85, 0.35)",
          };

          return (
            <div
              key={s.id}
              onClick={() => {
                if (isLocked) {
                  onOpenCalibration();
                } else {
                  onSelect(s.id);
                }
              }}
              className={`group relative rounded-3xl p-6 border text-left transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between backdrop-blur-md ${
                isLocked
                  ? "bg-white/[0.02] border-white/5 opacity-85 hover:opacity-100"
                  : "bg-white/[0.03] hover:bg-white/[0.07] border-white/10 hover:border-[var(--color-val-red)] hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,70,85,0.2)]"
              }`}
            >
              {/* Glow accent */}
              <div
                className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-10 group-hover:opacity-30 transition-opacity pointer-events-none"
                style={{ backgroundColor: meta.color }}
              />

              <div>
                {/* Header row: Category Pill + Difficulty Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border"
                    style={{
                      color: meta.color,
                      backgroundColor: meta.bg,
                      borderColor: meta.border,
                    }}
                  >
                    {meta.label}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-400/15 border border-amber-400/30 text-amber-300">
                      +120 XP
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-white/5 border border-white/10 text-gray-300">
                      {s.difficulty}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                      3D
                    </span>
                  </div>
                </div>

                {/* Scenario Title */}
                <h3 className="text-xl font-black text-white group-hover:text-[var(--color-val-red)] transition-colors">
                  {s.name}
                </h3>
                <p className="text-[11px] font-black uppercase tracking-wider mt-0.5 mb-2.5" style={{ color: meta.color }}>
                  {s.tagline}
                </p>

                {/* Description */}
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-3">
                  {s.description}
                </p>
              </div>

              {/* Card Footer: Map Name & Specific perks */}
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-bold text-[var(--color-text-secondary)]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                  <span className="text-white/80 font-mono">{map?.name || "The Range"}</span>
                </div>

                <div className="flex items-center gap-2">
                  {s.isRunnerMode && (
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-black animate-pulse">
                      PARKOUR WASD
                    </span>
                  )}
                  {s.allowMovement && !s.isRunnerMode && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black">
                      MOUVEMENT
                    </span>
                  )}
                  {s.defaultDurationSec > 0 && <span>{s.defaultDurationSec}s</span>}
                </div>
              </div>

              {/* Lock overlay if calibration not done */}
              {isLocked && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center rounded-3xl transition-opacity group-hover:bg-black/50">
                  <div className="px-4 py-2.5 rounded-2xl bg-black/85 border border-white/10 flex items-center gap-2 text-xs font-bold text-gray-200 shadow-xl">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-val-red)" strokeWidth="2.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span>Calibration Requise pour Lancer</span>
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
