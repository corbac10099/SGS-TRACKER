"use client";

import React from "react";
import { PerformanceScoreResult } from "@/lib/valorant/performanceScore";
import PerformanceStarBadge from "./PerformanceStarBadge";
import { IconLock, IconEye, IconLightbulb } from "./icons/SpyIcons";

interface PerformanceScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: PerformanceScoreResult;
  isOwner?: boolean;
  isPublic?: boolean;
  onTogglePrivacy?: () => void;
}

export default function PerformanceScoreModal({
  isOpen,
  onClose,
  result,
  isOwner = false,
  isPublic = true,
  onTogglePrivacy,
}: PerformanceScoreModalProps) {
  if (!isOpen) return null;

  const {
    totalScore,
    grade,
    gradeColor,
    gradeBg,
    gradeBorder,
    gradeGlow,
    gradeTitle,
    dominantRole,
    matchCount,
    pillars,
    tips,
  } = result;

  const pillarList = [
    pillars.lethality,
    pillars.combat,
    pillars.teamwork,
    pillars.openings,
    pillars.precisionClutch,
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl glass-modal p-5 sm:p-7 space-y-6 relative"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: `0 0 50px rgba(0,0,0,0.8), inset 0 0 30px ${gradeBg}`,
        }}
      >
        {/* CLOSE BUTTON */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
        >
          ✕
        </button>

        {/* HEADER */}
        <div className="flex items-center gap-4">
          <PerformanceStarBadge
            grade={grade}
            score={totalScore}
            gradeColor={gradeColor}
            gradeBg={gradeBg}
            gradeBorder={gradeBorder}
            gradeGlow={gradeGlow}
            gradeTitle={gradeTitle}
            size="lg"
            layout="icon-only"
          />

          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-val-red,#ff4655)]">
              Spycam Performance Index (SPI)
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                {totalScore} <span className="text-sm font-normal text-gray-400">/ 1 000 pts</span>
              </h3>
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                style={{
                  color: gradeColor,
                  backgroundColor: gradeBg,
                  border: `1px solid ${gradeBorder}`,
                }}
              >
                Grade {grade}
              </span>
            </div>
          </div>
        </div>

        {/* ROLE CONTEXT BADGE */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl glass-pill text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Rôle Dominant :</span>
            <span className="px-2 py-0.5 rounded bg-[var(--color-val-red,#ff4655)]/20 text-[var(--color-val-red,#ff4655)] font-bold text-[11px] uppercase tracking-wider">
              {dominantRole}
            </span>
            <span className="text-[10px] text-gray-400 hidden sm:inline">
              ({matchCount} match{matchCount > 1 ? "s" : ""} analysé{matchCount > 1 ? "s" : ""})
            </span>
          </div>

          {isOwner && onTogglePrivacy && (
            <button
              type="button"
              onClick={onTogglePrivacy}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isPublic
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
              }`}
              title="Cliquez pour changer la visibilité de votre score aux visiteurs"
            >
              {isPublic ? (
                <>
                  <IconEye size={13} />
                  <span>Public</span>
                </>
              ) : (
                <>
                  <IconLock size={13} />
                  <span>Masqué aux Visiteurs</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* CONTEXTE COMPÉTITIF & MATURATION DE SAISON */}
        {(result.experienceLabel || result.tierLabel || result.consistencyLabel) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
            {result.experienceLabel && (
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Volume Saison</span>
                <span className="font-semibold text-white truncate">{result.experienceLabel}</span>
              </div>
            )}
            {result.tierLabel && (
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Niveau Opposition</span>
                <span className="font-semibold text-white truncate">
                  {result.tierLabel} {result.tierMultiplier ? `(×${result.tierMultiplier.toFixed(2)})` : ""}
                </span>
              </div>
            )}
            {result.consistencyLabel && (
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col col-span-2 sm:col-span-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Stabilité ACS</span>
                <span className="font-semibold text-white truncate">{result.consistencyLabel}</span>
              </div>
            )}
          </div>
        )}

        {/* 5 PILIERS DE PERFORMANCE */}
        <div className="space-y-3.5">
          <h4 className="text-xs font-black uppercase tracking-wider text-gray-300">
            Détail des 5 Piliers Pondérés
          </h4>

          <div className="space-y-3">
            {pillarList.map((p, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl glass-card space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-black text-white">{p.name}</span>
                    <span className="text-[10px] text-gray-400 block">{p.label} • <strong className="text-gray-300">{p.metricSummary}</strong></span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-black text-white text-sm">{p.score}</span>
                    <span className="text-[10px] text-gray-400"> / {p.maxScore} pts</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${p.percentage}%`,
                      backgroundColor:
                        p.percentage >= 80
                          ? "#fbbf24"
                          : p.percentage >= 65
                          ? "#10b981"
                          : p.percentage >= 50
                          ? "#38bdf8"
                          : "#ff4655",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COACH TIPS */}
        {tips && tips.length > 0 && (
          <div className="p-4 rounded-2xl bg-[var(--color-val-red,#ff4655)]/10 border border-[var(--color-val-red,#ff4655)]/25 space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-val-red,#ff4655)] flex items-center gap-1.5">
              <IconLightbulb size={13} />
              <span>Recommandation Tactique Spycam</span>
            </span>
            <p className="text-xs text-gray-300 leading-relaxed">{tips[0]}</p>
          </div>
        )}

        {/* FOOTER */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
          <span>Saison en cours • Mis à jour en direct</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold uppercase cursor-pointer transition-all"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
