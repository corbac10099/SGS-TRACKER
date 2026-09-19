"use client";

import React from "react";
import { LevelReward } from "./types";
import {
  IconBadgeRecrue,
  IconBadgeVeteran,
  IconBadgeRadiant,
  IconBadgeChampion,
  IconBadgePro,
  IconBadgeVip,
  IconCheck,
  IconLock,
  IconShield,
} from "@/components/icons/SpyIcons";

interface RewardCirclePreviewProps {
  reward?: LevelReward;
  level: number;
  isCompleted: boolean;
  isCurrent: boolean;
  isLocked: boolean;
}

export default function RewardCirclePreview({
  reward,
  level,
  isCompleted,
  isCurrent,
  isLocked,
}: RewardCirclePreviewProps) {
  // S'il n'y a pas de récompense pour ce niveau, on ne rend strictement rien
  if (!reward) return null;

  // Rendu de l'icône de badge vectorielle officielle
  const renderBadgeIcon = (key: string) => {
    switch (key) {
      case "recrue":
        return <IconBadgeRecrue size={18} className="text-sky-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.7)]" />;
      case "veteran":
        return <IconBadgeVeteran size={18} className="text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.7)]" />;
      case "radiant":
        return <IconBadgeRadiant size={18} className="text-fuchsia-400 drop-shadow-[0_0_6px_rgba(232,121,249,0.7)]" />;
      case "champion":
        return <IconBadgeChampion size={18} className="text-orange-400 drop-shadow-[0_0_6px_rgba(251,146,60,0.7)]" />;
      case "pro":
        return <IconBadgePro size={18} className="text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.7)]" />;
      case "vip":
        return <IconBadgeVip size={18} className="text-purple-400 drop-shadow-[0_0_6px_rgba(192,132,252,0.7)]" />;
      default:
        return <IconShield size={16} className="text-neutral-400" />;
    }
  };

  const isBorderConic = reward.type === "banner_border";
  const isBannerEffect = reward.type === "banner_effect";
  const isBadge = reward.type === "badge";

  return (
    <div
      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full relative flex items-center justify-center transition-transform duration-300 hover:scale-110 cursor-pointer ${
        isCurrent
          ? "border-2 border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.5)] ring-2 ring-amber-400/30 scale-105"
          : isCompleted
          ? "border border-emerald-400/60 bg-[#090e15] shadow-[0_0_10px_rgba(16,185,129,0.25)]"
          : "border border-white/10 bg-[#080b11] opacity-60 hover:opacity-90"
      } ${isBorderConic ? "p-0.5" : "bg-[#0b0f17]"}`}
      title={`${reward.title} (Niv. ${level})`}
    >
      {/* Effet bordure rotative animée ou contour dynamique */}
      {isBorderConic && reward.effectKey && (
        <div
          className={`banner-border-layer banner-border-${reward.effectKey} ${
            reward.effectKey === "rgb_conic" ? "banner-border-animated" : ""
          } rounded-full`}
        />
      )}

      {/* Cœur intérieur du cercle avec effet ou badge */}
      <div className="w-full h-full rounded-full relative overflow-hidden flex items-center justify-center bg-[#0a0d14]">
        {isBannerEffect && reward.effectKey && (
          <div
            className={`banner-effect-layer banner-effect-${reward.effectKey} banner-interior-${reward.effectKey} rounded-full`}
          />
        )}

        <div className="relative z-10 flex items-center justify-center">
          {isBadge ? (
            renderBadgeIcon(reward.effectKey)
          ) : isBannerEffect ? (
            <span className="text-[7px] font-black uppercase tracking-wider text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] bg-black/60 px-1 py-0.2 rounded">
              {reward.effectKey.replace("_", " ")}
            </span>
          ) : isBorderConic ? (
            <span className="text-[8px] font-black uppercase text-amber-300 font-mono tracking-wider drop-shadow-md">
              {reward.effectKey === "neon_pulse" ? "NÉON" : "RGB"}
            </span>
          ) : null}
        </div>
      </div>

      {/* Badge de statut supérieur droit (Débloqué / Cadenas / En cours) */}
      <div className="absolute -top-1 -right-1 z-20 pointer-events-none">
        {isCompleted ? (
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-[0_0_6px_rgba(16,185,129,0.8)] border border-[#0a0e13]">
            <IconCheck size={8} />
          </div>
        ) : isCurrent ? (
          <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,1)] animate-ping" />
        ) : (
          <div className="w-3.5 h-3.5 rounded-full bg-black/85 text-neutral-400 flex items-center justify-center border border-white/10">
            <IconLock size={7} />
          </div>
        )}
      </div>
    </div>
  );
}

