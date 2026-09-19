"use client";

import React from "react";
import { DailyQuest, getCategoryIcon, getCategoryAccent } from "./types";
import { IconCheck } from "@/components/icons/SpyIcons";
import { sounds } from "@/lib/soundEffects";

interface QuestCardItemProps {
  quest: DailyQuest;
  onClaim: (questId: string) => void;
  claimLoading?: boolean;
}

export default function QuestCardItem({
  quest,
  onClaim,
  claimLoading = false,
}: QuestCardItemProps) {
  const accent = getCategoryAccent(quest.category);
  const progressPercent = Math.min(
    100,
    Math.max(0, (quest.progress / Math.max(1, quest.targetValue)) * 100)
  );

  const handleClaim = () => {
    sounds.playClick();
    onClaim(quest.id);
  };

  return (
    <div
      className={`p-2 sm:p-2.5 rounded-xl border transition-all duration-200 ${
        quest.claimed
          ? "bg-[#080c12]/50 border-white/5 opacity-50"
          : quest.completed
          ? "bg-emerald-500/[0.06] border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.1)]"
          : "bg-[#0b0f16]/80 border-white/8 hover:border-white/15 hover:bg-[#0f141d]"
      }`}
    >
      <div className="flex items-center gap-2.5">
        {/* Icône de catégorie compacte */}
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
          style={{
            backgroundColor: `${accent}15`,
            border: `1px solid ${accent}30`,
            color: accent,
          }}
        >
          {getCategoryIcon(quest.category, 13)}
        </div>

        {/* Détails du défi */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-white truncate leading-tight">
              {quest.title}
            </h4>
            <span
              className="text-[9px] font-black px-1.5 py-0.2 rounded font-mono flex-shrink-0 shadow-sm"
              style={{
                backgroundColor: `${accent}20`,
                color: accent,
              }}
            >
              +{quest.xpReward} XP
            </span>
          </div>

          <p className="text-[10px] text-neutral-400 line-clamp-1 mb-1.5">
            {quest.description}
          </p>

          {/* Jauge de progression & Action */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: quest.completed ? "#10b981" : accent,
                  boxShadow: quest.completed
                    ? "0 0 6px rgba(16,185,129,0.5)"
                    : `0 0 5px ${accent}40`,
                }}
              />
            </div>

            <span className="text-[9px] font-mono text-neutral-400 flex-shrink-0">
              {quest.progress}/{quest.targetValue}
            </span>

            {/* Bouton Réclamer si complété et non-réclamé */}
            {quest.completed && !quest.claimed && (
              <button
                type="button"
                disabled={claimLoading}
                onClick={handleClaim}
                onMouseEnter={() => sounds.playHover()}
                className="px-2 py-0.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-black text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.4)] active:scale-95 flex-shrink-0"
              >
                <IconCheck size={9} />
                <span>Réclamer</span>
              </button>
            )}

            {/* État réclamé */}
            {quest.claimed && (
              <span className="text-[9px] font-bold text-emerald-400/70 uppercase tracking-wider flex items-center gap-0.5 flex-shrink-0 font-mono">
                <IconCheck size={9} />
                <span>Réclamé</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
