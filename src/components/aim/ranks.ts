// ══════════════════════════════════════════════════════
// SGS AIM — Rangs Compétitifs
// ══════════════════════════════════════════════════════

import type { AimRankId, AimRankTier } from "./types";

export const AIM_RANKS: Record<AimRankId, AimRankTier> = {
  iron: {
    id: "iron",
    name: "Fer",
    minScore: 0,
    color: "#6b7280",
    bgColor: "rgba(107, 114, 128, 0.15)",
    borderColor: "rgba(107, 114, 128, 0.4)",
    icon: "shield",
    description: "Apprentissage des fondamentaux de la visée et de la prise en main.",
  },
  bronze: {
    id: "bronze",
    name: "Bronze",
    minScore: 25000,
    color: "#b45309",
    bgColor: "rgba(180, 83, 9, 0.15)",
    borderColor: "rgba(180, 83, 9, 0.4)",
    icon: "shield",
    description: "Mémoire musculaire en développement, réflexes de base acquis.",
  },
  silver: {
    id: "silver",
    name: "Argent",
    minScore: 40000,
    color: "#94a3b8",
    bgColor: "rgba(148, 163, 184, 0.15)",
    borderColor: "rgba(148, 163, 184, 0.4)",
    icon: "shield",
    description: "Bonne régularité de tir, temps de réaction sous les 280ms.",
  },
  gold: {
    id: "gold",
    name: "Or",
    minScore: 55000,
    color: "#eab308",
    bgColor: "rgba(234, 179, 8, 0.15)",
    borderColor: "rgba(234, 179, 8, 0.4)",
    icon: "award",
    description: "Niveau intermédiaire solide, micro-ajustements constants.",
  },
  platinum: {
    id: "platinum",
    name: "Platine",
    minScore: 70000,
    color: "#06b6d4",
    bgColor: "rgba(6, 182, 212, 0.15)",
    borderColor: "rgba(6, 182, 212, 0.4)",
    icon: "award",
    description: "Flicks rapides, tracking fluide et régulier, temps de réaction rapide.",
  },
  diamond: {
    id: "diamond",
    name: "Diamant",
    minScore: 85000,
    color: "#a855f7",
    bgColor: "rgba(168, 85, 247, 0.15)",
    borderColor: "rgba(168, 85, 247, 0.4)",
    icon: "gem",
    description: "Précision chirurgicale supérieure à 90%, réactivité sous les 200ms.",
  },
  ascendant: {
    id: "ascendant",
    name: "Ascendant",
    minScore: 100000,
    color: "#10b981",
    bgColor: "rgba(16, 185, 129, 0.15)",
    borderColor: "rgba(16, 185, 129, 0.4)",
    icon: "zap",
    description: "Maîtrise complète du crosshair placement et des micro-flicks 3D.",
  },
  immortal: {
    id: "immortal",
    name: "Immortel",
    minScore: 115000,
    color: "#ef4444",
    bgColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "rgba(239, 68, 68, 0.4)",
    icon: "flame",
    description: "Vitesse et précision quasi-parfaites, digne des meilleurs compétiteurs.",
  },
  radiant_aim: {
    id: "radiant_aim",
    name: "Radiant",
    minScore: 130000,
    color: "#f59e0b",
    bgColor: "rgba(245, 158, 11, 0.2)",
    borderColor: "rgba(245, 158, 11, 0.6)",
    icon: "crown",
    description: "Élite mondiale absolue du tir. Vitesse pure et 98%+ de précision.",
  },
};

export const RANK_ORDER: AimRankId[] = [
  "iron",
  "bronze",
  "silver",
  "gold",
  "platinum",
  "diamond",
  "ascendant",
  "immortal",
  "radiant_aim",
];

export function calculateRankFromScore(score: number): AimRankTier {
  for (let i = RANK_ORDER.length - 1; i >= 0; i--) {
    const tier = AIM_RANKS[RANK_ORDER[i]];
    if (score >= tier.minScore) {
      return tier;
    }
  }
  return AIM_RANKS.iron;
}

/**
 * Retourne le rang supérieur immédiat pour le système de promotion 1er de rang
 */
export function getNextRank(currentRank: AimRankId): AimRankTier | null {
  const currentIndex = RANK_ORDER.indexOf(currentRank);
  if (currentIndex >= 0 && currentIndex < RANK_ORDER.length - 1) {
    return AIM_RANKS[RANK_ORDER[currentIndex + 1]];
  }
  return null;
}

/**
 * Calcule le niveau d'EXP Aim Trainer, la progression et le titre de prestige
 */
export function getAimLevelInfo(totalXp: number): import("./types").AimLevelInfo {
  const safeXp = Math.max(0, totalXp || 0);
  const xpPerLevel = 750;
  const level = Math.floor(safeXp / xpPerLevel) + 1;
  const currentLevelXp = safeXp % xpPerLevel;
  const progressPercent = Math.min(100, Math.round((currentLevelXp / xpPerLevel) * 100));

  let title = "Novice de Visée";
  let badgeColor = "#94a3b8";

  if (level >= 60) {
    title = "Légende Radiant Aim";
    badgeColor = "#f59e0b";
  } else if (level >= 45) {
    title = "Sniper d'Élite";
    badgeColor = "#ef4444";
  } else if (level >= 30) {
    title = "Cyber Duelliste";
    badgeColor = "#10b981";
  } else if (level >= 20) {
    title = "Maître du Flick";
    badgeColor = "#a855f7";
  } else if (level >= 12) {
    title = "Spécialiste Headshot";
    badgeColor = "#06b6d4";
  } else if (level >= 6) {
    title = "Tireur Confirmé";
    badgeColor = "#eab308";
  }

  return {
    level,
    totalXp: safeXp,
    currentLevelXp,
    nextLevelXp: xpPerLevel,
    progressPercent,
    title,
    badgeColor,
  };
}

/**
 * Calcule les métadonnées de la saison mensuelle en cours et le décompte de fin de mois
 */
export function getCurrentMonthlySeason(): import("./types").MonthlySeasonInfo {
  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth();

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];
  const monthName = monthNames[monthIndex] || "Mois";

  // Dernier jour du mois courant
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0);
  const diffTime = lastDayOfMonth.getTime() - now.getTime();
  const daysRemaining = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  return {
    monthName,
    year,
    seasonName: `Saison Mensuelle — ${monthName} ${year}`,
    daysRemaining,
    totalContenders: 248,
  };
}

