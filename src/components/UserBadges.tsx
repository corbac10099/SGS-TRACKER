"use client";

import React, { useState } from "react";
import {
  IconBadgeVerified,
  IconBadgePro,
  IconBadgeCreator,
  IconBadgeVip,
  IconBadgeDev,
  IconBadgeModerator,
  IconBadgeChampion,
  IconBadgeCustom,
  IconBadgeRecrue,
  IconBadgeVeteran,
  IconBadgeRadiant,
} from "./icons/SpyIcons";

export interface BadgeDefinition {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  glowClass: string;
}

export const BADGES_REGISTRY: Record<string, BadgeDefinition> = {
  verified: {
    id: "verified",
    label: "Certifié Spycam",
    description: "Compte officiel ou partenaire certifié par l'équipe Spycam.",
    icon: IconBadgeVerified,
    colorClass: "text-sky-400",
    bgClass: "bg-sky-500/10",
    borderClass: "border-sky-400/30",
    glowClass: "shadow-[0_0_12px_rgba(56,189,248,0.25)]",
  },
  pro: {
    id: "pro",
    label: "Joueur Pro",
    description: "Joueur professionnel évoluant sur la scène compétitive Valorant (VCT / Challengers).",
    icon: IconBadgePro,
    colorClass: "text-amber-400",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-400/30",
    glowClass: "shadow-[0_0_12px_rgba(251,191,36,0.25)]",
  },
  creator: {
    id: "creator",
    label: "Créateur de Contenu",
    description: "Créateur de contenu / Streamer partenaire de la communauté Spycam.",
    icon: IconBadgeCreator,
    colorClass: "text-pink-400",
    bgClass: "bg-pink-500/10",
    borderClass: "border-pink-400/30",
    glowClass: "shadow-[0_0_12px_rgba(244,114,182,0.25)]",
  },
  vip: {
    id: "vip",
    label: "Membre VIP",
    description: "Membre émérite et soutien privilégié de Spycam.",
    icon: IconBadgeVip,
    colorClass: "text-purple-400",
    bgClass: "bg-purple-500/10",
    borderClass: "border-purple-400/30",
    glowClass: "shadow-[0_0_12px_rgba(192,132,252,0.25)]",
  },
  dev: {
    id: "dev",
    label: "Développeur Spycam",
    description: "Membre de l'équipe de développement et d'ingénierie technique Spycam.",
    icon: IconBadgeDev,
    colorClass: "text-emerald-400",
    bgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-400/30",
    glowClass: "shadow-[0_0_12px_rgba(52,211,153,0.25)]",
  },
  moderator: {
    id: "moderator",
    label: "Modérateur",
    description: "Responsable de la modération et de la sécurité de la communauté.",
    icon: IconBadgeModerator,
    colorClass: "text-red-400",
    bgClass: "bg-red-500/10",
    borderClass: "border-red-400/30",
    glowClass: "shadow-[0_0_12px_rgba(248,113,113,0.25)]",
  },
  champion: {
    id: "champion",
    label: "Champion",
    description: "Vainqueur d'un tournoi ou d'un événement officiel Spycam.",
    icon: IconBadgeChampion,
    colorClass: "text-orange-400",
    bgClass: "bg-orange-500/10",
    borderClass: "border-orange-400/30",
    glowClass: "shadow-[0_0_12px_rgba(251,146,60,0.25)]",
  },
  recrue: {
    id: "recrue",
    label: "Recrue Tracker",
    description: "Badge officiel de bienvenue décerné à tous les agents actifs (Niveau Tracker 1+).",
    icon: IconBadgeRecrue,
    colorClass: "text-sky-400",
    bgClass: "bg-sky-500/10",
    borderClass: "border-sky-400/30",
    glowClass: "shadow-[0_0_12px_rgba(56,189,248,0.25)]",
  },
  badge_recruit: {
    id: "badge_recruit",
    label: "Recrue Tracker",
    description: "Badge officiel de bienvenue décerné à tous les agents actifs (Niveau Tracker 1+).",
    icon: IconBadgeRecrue,
    colorClass: "text-sky-400",
    bgClass: "bg-sky-500/10",
    borderClass: "border-sky-400/30",
    glowClass: "shadow-[0_0_12px_rgba(56,189,248,0.25)]",
  },
  veteran: {
    id: "veteran",
    label: "Vétéran Spycam",
    description: "Distinction d'honneur accordée aux agents expérimentés et fidèles (Niveau Tracker 4+).",
    icon: IconBadgeVeteran,
    colorClass: "text-amber-400",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-400/30",
    glowClass: "shadow-[0_0_12px_rgba(251,191,36,0.25)]",
  },
  badge_veteran: {
    id: "badge_veteran",
    label: "Vétéran Spycam",
    description: "Distinction d'honneur accordée aux agents expérimentés et fidèles (Niveau Tracker 4+).",
    icon: IconBadgeVeteran,
    colorClass: "text-amber-400",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-400/30",
    glowClass: "shadow-[0_0_12px_rgba(251,191,36,0.25)]",
  },
  radiant: {
    id: "radiant",
    label: "Radiant Master",
    description: "Badge d'élite suprême accordé aux légendes ultimes du Tracker (Niveau Tracker 15+).",
    icon: IconBadgeRadiant,
    colorClass: "text-fuchsia-400",
    bgClass: "bg-fuchsia-500/10",
    borderClass: "border-fuchsia-400/30",
    glowClass: "shadow-[0_0_16px_rgba(217,70,239,0.35)]",
  },
  badge_radiant: {
    id: "badge_radiant",
    label: "Radiant Master",
    description: "Badge d'élite suprême accordé aux légendes ultimes du Tracker (Niveau Tracker 15+).",
    icon: IconBadgeRadiant,
    colorClass: "text-fuchsia-400",
    bgClass: "bg-fuchsia-500/10",
    borderClass: "border-fuchsia-400/30",
    glowClass: "shadow-[0_0_16px_rgba(217,70,239,0.35)]",
  },
};

export function parseBadges(badgeRaw: string | string[] | null | undefined): string[] {
  if (!badgeRaw) return [];
  if (Array.isArray(badgeRaw)) return badgeRaw.filter(Boolean);
  const trimmed = badgeRaw.trim();
  if (!trimmed || trimmed === "none" || trimmed === "null") return [];

  // JSON Array
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map((s) => String(s).trim()).filter(Boolean);
    } catch (_) {}
  }

  // Comma-separated or single
  if (trimmed.includes(",")) {
    return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
  }

  return [trimmed];
}

interface UserBadgesProps {
  badges: string | string[] | null | undefined;
  showBadge?: boolean;
  size?: number;
  className?: string;
  hiddenBadges?: string[];
  maxBadges?: number;
}

export function UserBadges({
  badges,
  showBadge = true,
  size = 18,
  className = "",
  hiddenBadges = [],
  maxBadges = 3,
}: UserBadgesProps) {
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);

  if (!showBadge) return null;

  const parsedList = parseBadges(badges)
    .filter((b) => {
      const bl = b.toLowerCase().trim();
      return !hiddenBadges.some((hb) => hb.toLowerCase().trim() === bl);
    })
    .slice(0, maxBadges);
  if (parsedList.length === 0) return null;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.6)] ${className}`}
    >
      {parsedList.map((badgeId, idx) => {
        const key = badgeId.toLowerCase().trim();
        const def = BADGES_REGISTRY[key] || {
          id: key,
          label: badgeId.charAt(0).toUpperCase() + badgeId.slice(1),
          description: `Badge spécial attribué au joueur : ${badgeId}`,
          icon: IconBadgeCustom,
          colorClass: "text-[#ff4655]",
          bgClass: "bg-[#ff4655]/10",
          borderClass: "border-[#ff4655]/30",
          glowClass: "shadow-[0_0_12px_rgba(255,70,85,0.25)]",
        };

        const IconComponent = def.icon;
        const isHovered = hoveredBadge === `${badgeId}-${idx}`;

        return (
          <div
            key={`${badgeId}-${idx}`}
            className="relative flex items-center group cursor-help select-none"
            onMouseEnter={() => setHoveredBadge(`${badgeId}-${idx}`)}
            onMouseLeave={() => setHoveredBadge(null)}
          >
            <div
              className={`p-1 rounded-full border flex items-center justify-center transition-all duration-200 hover:scale-115 ${def.bgClass} ${def.borderClass} ${def.glowClass}`}
            >
              <IconComponent size={size} className={def.colorClass} />
            </div>

            {/* Crisp Glassmorphism Tooltip on Hover */}
            {isHovered && (
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 w-64 max-w-[85vw] p-3 rounded-xl bg-[#0d1117]/95 border border-[var(--color-border)] backdrop-blur-xl shadow-[0_12px_32px_rgba(0,0,0,0.8)] pointer-events-none animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`p-1 rounded border ${def.bgClass} ${def.borderClass}`}>
                    <IconComponent size={14} className={def.colorClass} />
                  </div>
                  <span className="font-bold text-xs text-white uppercase tracking-wider">
                    {def.label}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed m-0 font-normal">
                  {def.description}
                </p>
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#0d1117]/95" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
