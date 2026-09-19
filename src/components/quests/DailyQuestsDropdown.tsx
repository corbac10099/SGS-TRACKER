"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { DailyQuest, xpForLevel, xpTotalForLevel } from "./types";
import QuestTimelineTrack from "./QuestTimelineTrack";
import QuestCardItem from "./QuestCardItem";
import { IconTrophy, IconClose, IconClock } from "@/components/icons/SpyIcons";
import { sounds } from "@/lib/soundEffects";

export interface DailyQuestsDropdownProps {
  xp: number;
  trackerLevel: number;
  quests: DailyQuest[];
  onClaimQuest: (questId: string) => void;
  compact?: boolean;
}

export default function DailyQuestsDropdown({
  xp,
  trackerLevel,
  quests,
  onClaimQuest,
  compact = false,
}: DailyQuestsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Fermeture lors d'un clic en dehors ou appui sur Échap
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Compte à rebours avant la réinitialisation quotidienne (minuit UTC)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
      );
      const diff = tomorrow.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeUntilReset(
        `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`
      );
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calcul des seuils d'XP pour le niveau actuel
  const currentLevelXp = useMemo(
    () => xpTotalForLevel(trackerLevel),
    [trackerLevel]
  );
  const nextLevelXp = useMemo(
    () => xpForLevel(trackerLevel),
    [trackerLevel]
  );
  const xpInLevel = Math.max(0, xp - currentLevelXp);
  const xpPercent = Math.min(
    100,
    Math.max(0, (xpInLevel / Math.max(1, nextLevelXp)) * 100)
  );

  const claimableCount = quests.filter((q) => q.completed && !q.claimed).length;
  const completedCount = quests.filter((q) => q.completed).length;

  const handleClaim = async (questId: string) => {
    setClaimLoading(true);
    try {
      await onClaimQuest(questId);
    } finally {
      setClaimLoading(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* ═══ BOUTON DÉCLENCHEUR DANS LA CAPSULE DE LA BARRE SUPÉRIEURE ═══ */}
      <button
        type="button"
        onClick={() => {
          sounds.playClick();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => sounds.playHover()}
        title="Défis Quotidiens & Niveau Tracker"
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
          isOpen
            ? "bg-amber-500/20 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)] border border-amber-500/40"
            : "text-neutral-300 hover:text-white hover:bg-white/[0.08]"
        }`}
      >
        <IconTrophy
          size={14}
          className={isOpen ? "text-amber-300" : "text-amber-400"}
        />
        <span className="hidden xl:inline">Défis</span>

        {/* Badge animé si des défis sont prêts à être réclamés */}
        {claimableCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-black text-[9px] font-black animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]">
            {claimableCount}
          </span>
        )}
      </button>

      {/* ═══ PANNEAU DÉPLIANT (Non-bloquant, ne masque pas toute la page) ═══ */}
      {isOpen && (
        <div
          className="absolute right-0 mt-3 w-[330px] xs:w-[380px] sm:w-[480px] md:w-[600px] max-h-[82vh] bg-[#0c1218]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_30px_rgba(245,158,11,0.12)] z-50 flex flex-col overflow-hidden animate-dropdown-spring"
        >
          {/* Liseré Cyber Accent Doré */}
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80" />

          {/* En-tête : Niveau Tracker & Jauge XP globale */}
          <div className="p-3 sm:p-3.5 border-b border-white/10 bg-[#080b11] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-val-red)]/15 border border-[var(--color-val-red)]/40 flex items-center justify-center text-[var(--color-val-red)] font-black text-xs shadow-accent-sm">
                  {trackerLevel}
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-1.5">
                    <span>Protocole Défis</span>
                    <span className="text-[9px] font-mono text-[var(--color-val-red)]">• Niv. {trackerLevel}</span>
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-medium">
                    {completedCount}/{quests.length} défi{completedCount > 1 ? "s" : ""} accompli{completedCount > 1 ? "s" : ""} • Cosmétiques exclusifs
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Fermer"
              >
                <IconClose size={12} />
              </button>
            </div>

            {/* Barre d'XP vers le niveau suivant */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[9px] font-bold">
                <span className="text-neutral-400 uppercase tracking-wider font-mono">
                  XP Tracker
                </span>
                <span className="text-[var(--color-val-red)] font-mono font-bold">
                  {xpInLevel.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${xpPercent}%`,
                    background: `linear-gradient(90deg, var(--color-val-red), #ff7582)`,
                    boxShadow: "0 0 8px var(--accent-glow-md)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* ═══ SECTION 1 : FRISE CHRONOLOGIQUE HORIZONTALE (Auto-centrée) ═══ */}
          <QuestTimelineTrack
            trackerLevel={trackerLevel}
            xpInLevel={xpInLevel}
            nextLevelXp={nextLevelXp}
            isOpen={isOpen}
          />

          {/* ═══ SECTION 2 : DÉFIS DU JOUR (En dessous de la frise) ═══ */}
          <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2 custom-scrollbar max-h-[280px]">
            <div className="flex items-center justify-between mb-1 px-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-white/90">
                  Défis Quotidiens
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-white/10 text-neutral-300 font-bold">
                  {quests.length}
                </span>
              </div>
              {claimableCount > 0 && (
                <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>{claimableCount} récompense{claimableCount > 1 ? "s" : ""} prête{claimableCount > 1 ? "s" : ""}</span>
                </span>
              )}
            </div>

            {quests.length === 0 ? (
              <div className="py-6 text-center text-neutral-500 text-xs font-medium">
                Aucun défi disponible pour le moment.
              </div>
            ) : (
              quests.map((quest) => (
                <QuestCardItem
                  key={quest.id}
                  quest={quest}
                  onClaim={handleClaim}
                  claimLoading={claimLoading}
                />
              ))
            )}
          </div>

          {/* ═══ FOOTER : COMPTE À REBOURS DE ROTATION ═══ */}
          <div className="p-2.5 border-t border-white/10 bg-[#080b11] flex items-center justify-between text-[10px] text-neutral-400">
            <span className="flex items-center gap-1.5">
              <IconClock size={12} className="text-neutral-400" />
              <span>Rotation quotidienne des défis</span>
            </span>
            <span className="font-mono font-bold text-neutral-300 text-xs">
              {timeUntilReset}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
