"use client";

import React, { useRef, useEffect, useCallback, useMemo } from "react";
import {
  LEVEL_REWARDS_PREVIEW,
  LevelReward,
} from "./types";
import RewardCirclePreview from "./RewardCirclePreview";
import { sounds } from "@/lib/soundEffects";

interface QuestTimelineTrackProps {
  trackerLevel: number;
  xpInLevel: number;
  nextLevelXp: number;
  isOpen: boolean;
}

const TIMELINE_LEVELS = Array.from({ length: 20 }, (_, i) => i + 1);
const ITEM_WIDTH = 96; // Largeur fixe par jalon en pixels pour un calcul d'alignement parfait

export default function QuestTimelineTrack({
  trackerLevel,
  xpInLevel,
  nextLevelXp,
  isOpen,
}: QuestTimelineTrackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentLevelRef = useRef<HTMLDivElement>(null);

  /**
   * Auto-positionnement centré et fluide sur le niveau actuel du joueur.
   */
  const scrollToCurrentLevel = useCallback((smooth = true) => {
    if (!currentLevelRef.current || !containerRef.current) return;
    try {
      currentLevelRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        inline: "center",
        block: "nearest",
      });
    } catch {
      const targetLeft =
        currentLevelRef.current.offsetLeft -
        containerRef.current.clientWidth / 2 +
        currentLevelRef.current.clientWidth / 2;
      containerRef.current.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: smooth ? "smooth" : "auto",
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        scrollToCurrentLevel(true);
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [isOpen, trackerLevel, scrollToCurrentLevel]);

  const handleScroll = (direction: "left" | "right") => {
    if (!containerRef.current) return;
    sounds.playClick();
    const scrollAmount = 240;
    containerRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Calcul de la longueur de la barre d'accentuation en pixels
  const activeTrackWidth = useMemo(() => {
    const clampedLevel = Math.min(20, Math.max(1, trackerLevel));
    const baseOffset = (clampedLevel - 1) * ITEM_WIDTH + ITEM_WIDTH / 2;
    const progressFraction = Math.min(1, Math.max(0, xpInLevel / Math.max(1, nextLevelXp)));
    // Avancement supplémentaire partiel vers le niveau suivant
    const extraOffset = clampedLevel < 20 ? progressFraction * ITEM_WIDTH : 0;
    return baseOffset + extraOffset;
  }, [trackerLevel, xpInLevel, nextLevelXp]);

  return (
    <div className="relative w-full bg-[#080b10] border-y border-white/10 py-2 flex flex-col">
      {/* En-tête de la frise : Label & Contrôles sans aucun emoji */}
      <div className="flex items-center justify-between px-4 mb-1">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-val-red)] shadow-[0_0_8px_var(--color-val-red)] animate-pulse" />
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-white">
            Frise de Progression
          </span>
          <span className="text-[9px] font-mono px-2 py-0.2 rounded-full bg-white/10 text-neutral-300 font-bold">
            Niv. {trackerLevel}
          </span>
        </div>

        {/* Boutons de navigation épurés */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleScroll("left")}
            className="w-5 h-5 rounded-md bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
            title="Défiler vers la gauche"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => scrollToCurrentLevel(true)}
            className="px-2 py-0.5 rounded-md bg-[var(--color-val-red)]/20 hover:bg-[var(--color-val-red)]/30 text-[var(--color-val-red)] hover:text-white text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer border border-[var(--color-val-red)]/30"
            title="Recentrer sur mon niveau"
          >
            Ma Position
          </button>
          <button
            type="button"
            onClick={() => handleScroll("right")}
            className="w-5 h-5 rounded-md bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
            title="Défiler vers la droite"
          >
            ›
          </button>
        </div>
      </div>

      {/* Conteneur défilable horizontalement de la frise (compacté à 148px) */}
      <div
        ref={containerRef}
        className="overflow-x-auto custom-scrollbar px-6 py-2 w-full scroll-smooth select-none relative"
      >
        <div
          className="relative flex items-center min-w-max h-[148px]"
          style={{ width: `${TIMELINE_LEVELS.length * ITEM_WIDTH}px` }}
        >
          {/* ═══ 1. LIGNE DE BASE HORIZONTALE ULTRA-FINE ═══ */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-white/10 z-0 pointer-events-none" />

          {/* ═══ 2. LIGNE D'ACCENTUATION DYNAMIQUE (Progression) ═══ */}
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-[var(--color-val-red)] via-amber-400 to-[var(--color-val-red)] shadow-[0_0_8px_var(--color-val-red)] z-0 pointer-events-none transition-all duration-700"
            style={{ width: `${activeTrackWidth}px` }}
          />

          {/* ═══ 3. ROND OVALE AFFICHANT L'EXP PARFAITEMENT POSÉ SUR LA LIGNE D'ACCENT ═══ */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-30 transition-all duration-700 pointer-events-none"
            style={{ left: `${activeTrackWidth}px` }}
          >
            <div className="px-2 py-0.5 rounded-full bg-[var(--color-val-red)] text-white text-[8px] font-mono font-black shadow-[0_0_10px_var(--color-val-red)] border border-white/40 whitespace-nowrap flex items-center gap-1">
              <span>{xpInLevel.toLocaleString()}</span>
              <span className="text-white/70 font-semibold text-[7px]">XP</span>
            </div>
          </div>

          {/* ═══ 4. COLONNES DES JALONS DE NIVEAUX ═══ */}
          {TIMELINE_LEVELS.map((level) => {
            const reward: LevelReward | undefined = LEVEL_REWARDS_PREVIEW.find(
              (r) => r.level === level
            );
            const hasReward = !!reward;
            const isCompleted = trackerLevel >= level;
            const isCurrent = trackerLevel === level;
            const isLocked = level > trackerLevel;
            // Alternance : les niveaux pairs partent vers le HAUT, les niveaux impairs partent vers le BAS
            const isTop = level % 2 === 0;

            return (
              <div
                key={level}
                ref={isCurrent ? currentLevelRef : undefined}
                className="relative flex flex-col items-center justify-center flex-shrink-0 h-full"
                style={{ width: `${ITEM_WIDTH}px` }}
              >
                {/* JALON SUPÉRIEUR (Niveaux pairs avec récompense : en HAUT) */}
                {hasReward && isTop && (
                  <div className="absolute bottom-1/2 flex flex-col items-center z-20 pointer-events-none">
                    {/* Titre & palier au-dessus du cercle */}
                    <div className="mb-1 text-center max-w-[76px]">
                      <span
                        className={`block text-[8px] font-bold leading-tight truncate ${
                          isCurrent
                            ? "text-amber-300 font-black"
                            : isCompleted
                            ? "text-white"
                            : "text-neutral-400"
                        }`}
                        title={reward.title}
                      >
                        {reward.title}
                      </span>
                      <span className="text-[7px] font-mono text-neutral-500 block leading-tight">
                        Niv. {level}
                      </span>
                    </div>

                    {/* Cercle de récompense */}
                    <div className="pointer-events-auto">
                      <RewardCirclePreview
                        reward={reward}
                        level={level}
                        isCompleted={isCompleted}
                        isCurrent={isCurrent}
                        isLocked={isLocked}
                      />
                    </div>

                    {/* Trait fin vertical reliant directement le cercle à la ligne de base (zéro espace) */}
                    <div
                      className={`w-[1.5px] h-3.5 transition-colors ${
                        isCompleted
                          ? "bg-emerald-400/80 shadow-[0_0_4px_rgba(16,185,129,0.5)]"
                          : isCurrent
                          ? "bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]"
                          : "bg-white/20"
                      }`}
                    />
                  </div>
                )}

                {/* NŒUD SUR LA LIGNE HORIZONTALE (Affiché uniquement s'il y a une récompense ou si niveau actuel) */}
                {hasReward ? (
                  <div className="absolute top-1/2 -translate-y-1/2 z-10 flex items-center justify-center pointer-events-none">
                    <div
                      className={`w-2.5 h-2.5 rounded-full border transition-all ${
                        isCompleted
                          ? "bg-emerald-500 border-emerald-300 shadow-[0_0_6px_rgba(16,185,129,0.8)]"
                          : isCurrent
                          ? "bg-amber-400 border-white shadow-[0_0_8px_rgba(245,158,11,1)] ring-2 ring-amber-400/50 scale-110"
                          : "bg-[#0a0e14] border-white/25"
                      }`}
                    />
                  </div>
                ) : isCurrent ? (
                  /* Marqueur de position actuelle sur un palier sans cosmétique */
                  <div className="absolute top-1/2 -translate-y-1/2 z-10 flex items-center justify-center pointer-events-none">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-white shadow-[0_0_8px_rgba(245,158,11,1)] ring-2 ring-amber-400/50 scale-110" />
                  </div>
                ) : null}

                {/* JALON INFÉRIEUR (Niveaux impairs avec récompense : en BAS) */}
                {hasReward && !isTop && (
                  <div className="absolute top-1/2 flex flex-col items-center z-20 pointer-events-none">
                    {/* Trait fin vertical reliant directement la ligne de base au cercle (zéro espace) */}
                    <div
                      className={`w-[1.5px] h-3.5 transition-colors ${
                        isCompleted
                          ? "bg-emerald-400/80 shadow-[0_0_4px_rgba(16,185,129,0.5)]"
                          : isCurrent
                          ? "bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]"
                          : "bg-white/20"
                      }`}
                    />

                    {/* Cercle de récompense */}
                    <div className="pointer-events-auto">
                      <RewardCirclePreview
                        reward={reward}
                        level={level}
                        isCompleted={isCompleted}
                        isCurrent={isCurrent}
                        isLocked={isLocked}
                      />
                    </div>

                    {/* Titre & palier en-dessous du cercle */}
                    <div className="mt-1 text-center max-w-[76px]">
                      <span
                        className={`block text-[8px] font-bold leading-tight truncate ${
                          isCurrent
                            ? "text-amber-300 font-black"
                            : isCompleted
                            ? "text-white"
                            : "text-neutral-400"
                        }`}
                        title={reward.title}
                      >
                        {reward.title}
                      </span>
                      <span className="text-[7px] font-mono text-neutral-500 block leading-tight">
                        Niv. {level}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
