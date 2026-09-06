export type PerformanceGrade = "SSS" | "SS" | "S" | "A" | "B" | "C";

export type AgentRole = "Duelist" | "Initiator" | "Controller" | "Sentinel" | "Flex";

export interface PillarScore {
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
  label: string;
  metricSummary: string;
}

export interface PerformanceScoreResult {
  totalScore: number; // 0 - 1000
  grade: PerformanceGrade;
  gradeColor: string;
  gradeBg: string;
  gradeBorder: string;
  gradeGlow: string;
  gradeTitle: string;
  dominantRole: AgentRole;
  matchCount: number;
  pillars: {
    lethality: PillarScore;
    combat: PillarScore;
    teamwork: PillarScore;
    openings: PillarScore;
    precisionClutch: PillarScore;
  };
  tips: string[];
  // Métriques de calibrage et transparence
  experienceFactor?: number;
  experienceLabel?: string;
  tierMultiplier?: number;
  tierLabel?: string;
  consistencyLabel?: string;
  roundWinRatio?: number;
}

export function detectDominantRole(agents?: any[]): AgentRole {
  if (!agents || agents.length === 0) return "Flex";
  const roleCounts: Record<string, number> = {
    Duelist: 0,
    Initiator: 0,
    Controller: 0,
    Sentinel: 0,
  };

  agents.forEach((a) => {
    const r = a.role || "";
    if (roleCounts[r] !== undefined) {
      roleCounts[r] += a.games || 1;
    }
  });

  let bestRole: AgentRole = "Flex";
  let maxGames = 0;
  for (const [r, count] of Object.entries(roleCounts)) {
    if (count > maxGames) {
      maxGames = count;
      bestRole = r as AgentRole;
    }
  }
  return maxGames > 0 ? bestRole : "Flex";
}

export interface TierInfo {
  name: string;
  multiplier: number;
  maxCap: number;
}

/**
 * Résout le multiplicateur de difficulté d'opposition selon le tier compétitif Valorant (0-27)
 */
export function getTierInfo(rankTier?: number): TierInfo {
  const t = typeof rankTier === "number" && rankTier >= 0 ? rankTier : 0;
  // Non classé / Unranked : niveau débutant non étalonné -> cap strict à 420 pts (Grade C)
  if (t <= 2) return { name: "Non classé", multiplier: 0.68, maxCap: 420 };
  if (t <= 5) return { name: "Fer", multiplier: 0.68, maxCap: 420 }; // Iron 1-3
  if (t <= 8) return { name: "Bronze", multiplier: 0.74, maxCap: 520 }; // Bronze 1-3
  if (t <= 11) return { name: "Argent", multiplier: 0.82, maxCap: 640 }; // Silver 1-3
  if (t <= 14) return { name: "Or", multiplier: 0.89, maxCap: 740 }; // Gold 1-3
  if (t <= 17) return { name: "Platine", multiplier: 0.95, maxCap: 840 }; // Platinum 1-3
  if (t <= 20) return { name: "Diamant", multiplier: 1.00, maxCap: 910 }; // Diamond 1-3 (Référence)
  if (t <= 23) return { name: "Ascendant", multiplier: 1.06, maxCap: 960 }; // Ascendant 1-3
  if (t <= 26) return { name: "Immortel", multiplier: 1.15, maxCap: 1000 }; // Immortal 1-3
  return { name: "Radiant", multiplier: 1.25, maxCap: 1000 }; // Radiant
}

/**
 * Déduit le rang numérique Valorant (0 à 27) à partir du nom textuel (FR / EN).
 * Évite qu'un joueur d'élite comme Radiant ou Immortel ne retombe à 0 si l'API
 * ne transmet pas explicitement rankTier.
 */
export function parseRankNameToTier(name?: string): number | null {
  if (!name || typeof name !== "string") return null;
  const n = name.trim().toLowerCase();
  if (n.includes("radiant")) return 27;
  if (n.includes("immort") && (n.includes("3") || n.includes("iii"))) return 26;
  if (n.includes("immort") && (n.includes("2") || n.includes("ii"))) return 25;
  if (n.includes("immort")) return 24;
  if (n.includes("ascendant") && (n.includes("3") || n.includes("iii"))) return 23;
  if (n.includes("ascendant") && (n.includes("2") || n.includes("ii"))) return 22;
  if (n.includes("ascendant")) return 21;
  if (n.includes("diam") && (n.includes("3") || n.includes("iii"))) return 20;
  if (n.includes("diam") && (n.includes("2") || n.includes("ii"))) return 19;
  if (n.includes("diam")) return 18;
  if (n.includes("plat") && (n.includes("3") || n.includes("iii"))) return 17;
  if (n.includes("plat") && (n.includes("2") || n.includes("ii"))) return 16;
  if (n.includes("plat")) return 15;
  if ((n.includes("or") || n.includes("gold")) && (n.includes("3") || n.includes("iii"))) return 14;
  if ((n.includes("or") || n.includes("gold")) && (n.includes("2") || n.includes("ii"))) return 13;
  if (n.includes("or") || n.includes("gold")) return 12;
  if ((n.includes("argent") || n.includes("silver")) && (n.includes("3") || n.includes("iii"))) return 11;
  if ((n.includes("argent") || n.includes("silver")) && (n.includes("2") || n.includes("ii"))) return 10;
  if (n.includes("argent") || n.includes("silver")) return 9;
  if (n.includes("bronze") && (n.includes("3") || n.includes("iii"))) return 8;
  if (n.includes("bronze") && (n.includes("2") || n.includes("ii"))) return 7;
  if (n.includes("bronze")) return 6;
  if ((n.includes("fer") || n.includes("iron")) && (n.includes("3") || n.includes("iii"))) return 5;
  if ((n.includes("fer") || n.includes("iron")) && (n.includes("2") || n.includes("ii"))) return 4;
  if (n.includes("fer") || n.includes("iron")) return 3;
  return null;
}

/**
 * Évalue la maturité de l'échantillon de saison (courbe de confiance statistique)
 * Prend en compte le volume de matchs récents, mais aussi le rang officiel
 * et le niveau de compte (vétérans du jeu).
 */
export function getExperienceInfo(
  matchCount: number,
  accountLevel: number = 0,
  rankTier: number = 0
): {
  factor: number;
  cap: number;
  label: string;
} {
  // 1. Joueurs d'élite compétitive : l'expérience est garantie par le rang MMR Riot Games
  if (rankTier >= 27) {
    return { factor: 1.00, cap: 1000, label: "Top Mondial (Radiant)" };
  }
  if (rankTier >= 24) {
    return { factor: 1.00, cap: 1000, label: "Élite Compétitive (Immortel)" };
  }
  if (rankTier >= 21) {
    return { factor: Math.max(0.92, 0.75 + matchCount * 0.02), cap: 960, label: "Haut Niveau (Ascendant)" };
  }
  if (rankTier >= 18) {
    return { factor: Math.max(0.88, 0.70 + matchCount * 0.02), cap: 910, label: "Compétiteur Confirmé (Diamant)" };
  }
  if (rankTier >= 15) {
    return { factor: Math.max(0.82, 0.65 + matchCount * 0.02), cap: 840, label: "Division Établie (Platine)" };
  }

  // 2. Joueurs vétérans ayant un niveau de compte élevé (centaines / milliers d'heures)
  if (accountLevel >= 150) {
    return { factor: Math.max(0.92, 0.75 + matchCount * 0.02), cap: 920, label: `Vétéran Valorant (Niv. ${accountLevel})` };
  }
  if (accountLevel >= 60) {
    return { factor: Math.max(0.82, 0.65 + matchCount * 0.02), cap: 800, label: `Joueur Expérimenté (Niv. ${accountLevel})` };
  }

  // 3. Rangs débutants / occasionnels (Non classé, Fer, Bronze, Argent, Or)
  if (matchCount <= 0) {
    return { factor: 0.30, cap: 300, label: "Non calibré (0 match)" };
  }
  if (matchCount <= 3) {
    return { factor: 0.42, cap: 380, label: "Débutant (1-3 matchs)" };
  }
  if (matchCount <= 6) {
    return { factor: 0.55, cap: 460, label: "Échantillon initial (4-6 matchs)" };
  }
  if (matchCount <= 12) {
    return { factor: 0.68, cap: 600, label: "Phase de rodage (7-12 matchs)" };
  }
  if (matchCount <= 22) {
    return { factor: 0.84, cap: 760, label: "Saison intermédiaire (13-22 matchs)" };
  }
  if (matchCount <= 35) {
    return { factor: 0.94, cap: 900, label: "Saison consolidée (23-35 matchs)" };
  }
  return { factor: 1.00, cap: 1000, label: "Vétéran de saison (36+ matchs)" };
}

/**
 * Calcule intelligemment le Score de Performance Spycam (SPI) sur 1 000 points
 * basé sur l'ensemble des données de saison disponibles : volume, rang, constance,
 * différentiel de rounds, premiers duels et efficacité de combat.
 */
export function calculatePerformanceScore(
  stats: any,
  matches: any[] = [],
  role?: AgentRole,
  rankTier?: number,
  extraData?: { hoursPlayed?: number; rankName?: string; accountLevel?: number }
): PerformanceScoreResult {
  const matchCount = Math.max(matches?.length || 0, stats?.matchesPlayed || 0);
  const accountLevel = extraData?.accountLevel || 0;
  let effectiveTier = rankTier ?? stats?.tier ?? stats?.rankTier ?? 0;
  if (effectiveTier <= 2 && extraData?.rankName) {
    const deduced = parseRankNameToTier(extraData.rankName);
    if (deduced !== null) {
      effectiveTier = deduced;
    }
  }

  // Valeurs par défaut strictes pour compte débutant sans match
  if (matchCount === 0 || !stats) {
    return {
      totalScore: 250,
      grade: "C",
      gradeColor: "#94a3b8",
      gradeBg: "rgba(148, 163, 184, 0.15)",
      gradeBorder: "rgba(148, 163, 184, 0.4)",
      gradeGlow: "0 0 10px rgba(148, 163, 184, 0.25)",
      gradeTitle: "En Attente de Calibration",
      dominantRole: role || "Flex",
      matchCount: 0,
      experienceFactor: 0.35,
      experienceLabel: "Non calibré (0 match)",
      tierMultiplier: 0.80,
      tierLabel: "Non classé",
      pillars: {
        lethality: { name: "Létalité & Duels", score: 50, maxScore: 200, percentage: 25, label: "K/D & Dégâts nets", metricSummary: "0.00 K/D" },
        combat: { name: "Pression & Combat", score: 50, maxScore: 200, percentage: 25, label: "ACS & ADR", metricSummary: "0 ACS" },
        teamwork: { name: "Utilité & Collectif", score: 50, maxScore: 200, percentage: 25, label: "KAST % & Assists", metricSummary: "0% KAST" },
        openings: { name: "Premiers Engagements", score: 50, maxScore: 200, percentage: 25, label: "First Bloods", metricSummary: "0 FB" },
        precisionClutch: { name: "Sang-Froid & Précision", score: 50, maxScore: 200, percentage: 25, label: "HS % & Clutches", metricSummary: "0% HS" },
      },
      tips: ["Jouez vos premiers matchs de placement compétitifs pour calibrer votre SPI de saison."],
    };
  }

  const dominantRole: AgentRole = role || "Flex";

  // Extraction des métriques fondamentales
  const kd = stats.kdRatio ?? (stats.deaths > 0 ? stats.kills / stats.deaths : stats.kills || 1.0);
  const acs = stats.acs || 200;
  const adr = stats.adr || (acs * 0.7);
  const hsPct = stats.headshotPct || 20;
  const kastPct = stats.kast || 70;
  const winrate = stats.winRate || 50;
  const ddDelta = stats.ddDelta || (kd > 1 ? (kd - 1) * 30 : (kd - 1) * 40);

  // Données approfondies de l'historique complet des matchs
  const validMatches = Array.isArray(matches) ? matches : [];
  const totalFB = validMatches.reduce((sum, m) => sum + (m.firstBloods || (m.won ? 2 : 1)), 0);
  const avgFB = totalFB / Math.max(1, validMatches.length);
  const totalClutches = validMatches.reduce((sum, m) => sum + (m.clutches || (m.won ? 1 : 0)), 0);

  // 1. Ratio et différentiel de victoires de rounds réels (Round Differential)
  let totalRoundsWon = 0;
  let totalRoundsLost = 0;
  validMatches.forEach((m) => {
    const my = m.myScore ?? (m.won ? 13 : 8);
    const opp = m.enemyScore ?? (m.won ? 8 : 13);
    totalRoundsWon += my;
    totalRoundsLost += opp;
  });
  const totalRounds = totalRoundsWon + totalRoundsLost;
  const roundWinRate = totalRounds > 0 ? totalRoundsWon / totalRounds : winrate / 100;
  // Impact rounds : de -0.06 à +0.05
  const roundBonus = Math.max(-0.06, Math.min(0.05, (roundWinRate - 0.50) * 0.35));

  // 2. Constance / Stabilité statistique (Coefficient de variation d'ACS)
  let consistencyBonus = 0;
  let consistencyLabel = "Régularité standard";
  const acsList = validMatches.map((m) => m.acs || acs).filter((v) => typeof v === "number" && v > 0);
  if (acsList.length >= 3) {
    const avgAcsList = acsList.reduce((a, b) => a + b, 0) / acsList.length;
    const variance = acsList.reduce((sum, val) => sum + Math.pow(val - avgAcsList, 2), 0) / acsList.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / Math.max(1, avgAcsList);

    if (cv < 0.20) {
      consistencyBonus = 0.04;
      consistencyLabel = "Excellente régularité (+4%)";
    } else if (cv < 0.32) {
      consistencyBonus = 0.01;
      consistencyLabel = "Régularité solide";
    } else if (cv > 0.45) {
      consistencyBonus = -0.05;
      consistencyLabel = "Disparité de performance (-5%)";
    }
  }

  // 3. Maturation de l'expérience et niveau de compétition
  const experienceInfo = getExperienceInfo(matchCount, accountLevel, effectiveTier);
  const tierInfo = getTierInfo(effectiveTier);

  // Configuration des pondérations par rôle (Total brut = 1000)
  const roleWeights: Record<AgentRole, { leth: number; combat: number; team: number; open: number; prec: number }> = {
    Duelist:   { leth: 260, combat: 250, team: 130, open: 220, prec: 140 },
    Initiator: { leth: 190, combat: 180, team: 270, open: 170, prec: 190 },
    Controller:{ leth: 170, combat: 160, team: 290, open: 130, prec: 250 },
    Sentinel:  { leth: 190, combat: 170, team: 260, open: 140, prec: 240 },
    Flex:      { leth: 200, combat: 200, team: 200, open: 200, prec: 200 },
  };

  const w = roleWeights[dominantRole] || roleWeights.Flex;

  // Pilier 1 : Létalité & Duels (distribution resserrée en haut elo car tout le monde est d'élite)
  const kdBaseline = effectiveTier >= 24 ? 0.65 : 0.55;
  const kdTarget = effectiveTier >= 24 ? 1.35 : 1.75;
  const normKd = Math.max(0, Math.min(1, (kd - kdBaseline) / (kdTarget - kdBaseline)));
  const normDd = Math.max(0, Math.min(1, (ddDelta + (effectiveTier >= 24 ? 35 : 45)) / (effectiveTier >= 24 ? 70 : 90)));
  const lethalityScore = Math.round((normKd * 0.75 + normDd * 0.25) * w.leth);

  // Pilier 2 : Pression & Combat (ACS adapté au rôle : plus indulgent pour Sentinel & Controller, et calibré en haut elo)
  const isSupportRole = dominantRole === "Sentinel" || dominantRole === "Controller";
  const acsMin = isSupportRole ? 95 : 110;
  const acsMax = isSupportRole ? (effectiveTier >= 24 ? 245 : 290) : (effectiveTier >= 24 ? 285 : 330);
  const adrMin = isSupportRole ? 70 : 80;
  const adrMax = isSupportRole ? (effectiveTier >= 24 ? 155 : 175) : 190;

  const normAcs = Math.max(0, Math.min(1, (acs - acsMin) / (acsMax - acsMin)));
  const normAdr = Math.max(0, Math.min(1, (adr - adrMin) / (adrMax - adrMin)));
  const combatScore = Math.round((normAcs * 0.65 + normAdr * 0.35) * w.combat);

  // Pilier 3 : Utilité & Collectif (KAST 56% à 86% + Assists / match)
  const normKast = Math.max(0, Math.min(1, (kastPct - 56) / 28));
  const assistsPerMatch = (stats.assists || 0) / Math.max(1, matchCount);
  const normAssists = Math.max(0, Math.min(1, assistsPerMatch / 8.5));
  const teamworkScore = Math.round((normKast * 0.8 + normAssists * 0.2) * w.team);

  // Pilier 4 : Premiers Engagements (First Bloods moyen par match: adapté si support)
  const targetFB = isSupportRole ? 2.4 : 3.8;
  const normFB = Math.max(0, Math.min(1, avgFB / targetFB));
  const openingsScore = Math.round(normFB * w.open);

  // Pilier 5 : Précision & Sang-Froid (HS% 12% à 42% + Winrate 30% à 75% + Clutches)
  const normHs = Math.max(0, Math.min(1, (hsPct - 12) / 28));
  const normWr = Math.max(0, Math.min(1, (winrate - 30) / 45));
  const clutchesPerMatch = totalClutches / Math.max(1, matchCount);
  const normClutch = Math.max(0, Math.min(1, clutchesPerMatch / 1.4));
  const precisionClutchScore = Math.round((normHs * 0.45 + normWr * 0.35 + normClutch * 0.2) * w.prec);

  // Coefficient d'impact au combat : adapté selon le rang
  let combatMultiplier = 1.0;
  if (kd < 0.70) {
    combatMultiplier = 0.55 + (kd / 0.70) * 0.15; // 0.55 à 0.70
  } else if (kd < 0.90) {
    combatMultiplier = 0.70 + ((kd - 0.70) / 0.20) * 0.18; // 0.70 à 0.88
  } else if (kd < 1.05) {
    combatMultiplier = 0.88 + ((kd - 0.90) / 0.15) * 0.12; // 0.88 à 1.00
  } else {
    combatMultiplier = Math.min(1.10, 1.0 + (kd - 1.05) * 0.10); // Léger boost haut K/D
  }

  // Plafond statistique pur basé sur le ratio et l'impact général
  // Ne bride pas sévèrement un joueur d'élite Radiant/Immo qui joue ancre
  let statCap = 1000;
  if (effectiveTier < 21) {
    if (kd < 0.72 && acs < 135) {
      statCap = 280; // Plafonné au Grade C bas
    } else if (kd < 0.85 && acs < 160) {
      statCap = 380; // Plafonné au Grade C max
    } else if (kd < 0.98 && acs < 185) {
      statCap = 540; // Plafonné au Grade B
    } else if (kd < 1.12 && acs < 215) {
      statCap = 699; // Plafonné au Grade A
    } else if (kd < 1.28 && acs < 245) {
      statCap = 819; // Plafonné au Grade S
    }
  }

  // Somme brute des piliers (0 - 1000)
  const rawSum = lethalityScore + combatScore + teamworkScore + openingsScore + precisionClutchScore;

  // Calcul du score ajusté par l'expérience de saison, l'opposition compétitive, la régularité et les rounds
  const combinedHistoryMultiplier = 1 + roundBonus + consistencyBonus;
  const adjusted = rawSum * combatMultiplier * experienceInfo.factor * tierInfo.multiplier * combinedHistoryMultiplier;

  // Application du triple plafond infranchissable : Expérience, Rang, Stats
  const maxAllowedScore = Math.min(experienceInfo.cap, tierInfo.maxCap, statCap);
  const totalScore = Math.max(50, Math.min(maxAllowedScore, Math.round(adjusted)));

  // Attribution du Grade officiel Spycam
  let grade: PerformanceGrade = "C";
  let gradeColor = "#94a3b8";
  let gradeBg = "rgba(148, 163, 184, 0.15)";
  let gradeBorder = "rgba(148, 163, 184, 0.4)";
  let gradeGlow = "rgba(148, 163, 184, 0.3)";
  let gradeTitle = "En Apprentissage";

  if (totalScore >= 920) {
    grade = "SSS";
    gradeColor = "#fbbf24";
    gradeBg = "rgba(251, 191, 36, 0.2)";
    gradeBorder = "rgba(251, 191, 36, 0.6)";
    gradeGlow = "0 0 25px rgba(251, 191, 36, 0.5)";
    gradeTitle = "Légende Vivante";
  } else if (totalScore >= 820) {
    grade = "SS";
    gradeColor = "#ff4655";
    gradeBg = "rgba(255, 70, 85, 0.2)";
    gradeBorder = "rgba(255, 70, 85, 0.6)";
    gradeGlow = "0 0 20px rgba(255, 70, 85, 0.4)";
    gradeTitle = "Maître d'Élite";
  } else if (totalScore >= 700) {
    grade = "S";
    gradeColor = "#a855f7";
    gradeBg = "rgba(168, 85, 247, 0.2)";
    gradeBorder = "rgba(168, 85, 247, 0.5)";
    gradeGlow = "0 0 15px rgba(168, 85, 247, 0.35)";
    gradeTitle = "Compétiteur Émérite";
  } else if (totalScore >= 550) {
    grade = "A";
    gradeColor = "#38bdf8";
    gradeBg = "rgba(56, 189, 248, 0.18)";
    gradeBorder = "rgba(56, 189, 248, 0.45)";
    gradeGlow = "0 0 12px rgba(56, 189, 248, 0.3)";
    gradeTitle = "Pilier Solide";
  } else if (totalScore >= 380) {
    grade = "B";
    gradeColor = "#10b981";
    gradeBg = "rgba(16, 185, 129, 0.15)";
    gradeBorder = "rgba(16, 185, 129, 0.4)";
    gradeGlow = "0 0 10px rgba(16, 185, 129, 0.25)";
    gradeTitle = "Régulier en Progression";
  }

  // Conseils dynamiques précis et motivés
  const tips: string[] = [];

  if (matchCount < 12) {
    tips.push(
      `Volume de saison insuffisant (${matchCount} match${matchCount > 1 ? "s" : ""}) : jouez au moins 15 parties compétitives pour stabiliser votre SPI et débloquer les grades supérieurs.`
    );
  } else if (tierInfo.multiplier < 0.90) {
    tips.push(
      `Niveau d'opposition (${tierInfo.name}) : progressez dans les divisions compétitives pour valoriser votre impact face à des adversaires de plus haut calibre.`
    );
  } else if (consistencyBonus < 0) {
    tips.push(
      "Disparité notable entre vos matchs : travaillez votre constance de combat (ACS régulier) pour consolider vos points SPI."
    );
  } else if (roundWinRate < 0.48) {
    tips.push(
      "Différentiel de rounds défavorable : concentrez vos duels sur les objectifs et la pose/désamorçage du Spike plutôt que sur les duels tardifs."
    );
  } else {
    const lethPct = (lethalityScore / w.leth) * 100;
    const teamPct = (teamworkScore / w.team) * 100;
    const openPct = (openingsScore / w.open) * 100;
    const precPct = (precisionClutchScore / w.prec) * 100;

    if (openPct < 55 && dominantRole === "Duelist") {
      tips.push("Améliorez vos premiers duels (FB) : utilisez vos utilitaires d'entrée pour initier les duels avec avantage.");
    } else if (teamPct < 60) {
      tips.push("Votre KAST % est améliorable : restez à portée de trade de vos coéquipiers pour ne pas mourir sans compensation.");
    } else if (precPct < 50) {
      tips.push("Visez davantage la tête : votre HS % actuel limite votre létalité sur les duels à moyenne portée.");
    } else if (lethPct < 55) {
      tips.push("Multipliez votre impact par round : optimisez vos prises de ligne et la gestion de vos ressources.");
    } else {
      tips.push("Profil de jeu remarquable et éprouvé sur toute la saison : continuez sur cette dynamique d'excellence !");
    }
  }

  return {
    totalScore,
    grade,
    gradeColor,
    gradeBg,
    gradeBorder,
    gradeGlow,
    gradeTitle,
    dominantRole,
    matchCount,
    experienceFactor: experienceInfo.factor,
    experienceLabel: experienceInfo.label,
    tierMultiplier: tierInfo.multiplier,
    tierLabel: tierInfo.name,
    consistencyLabel,
    roundWinRatio: parseFloat(roundWinRate.toFixed(2)),
    pillars: {
      lethality: {
        name: "Létalité & Duels",
        score: Math.round(lethalityScore * (totalScore / Math.max(1, rawSum))),
        maxScore: w.leth,
        percentage: Math.min(100, Math.round((lethalityScore / w.leth) * 100)),
        label: "K/D & Différentiel Dégâts",
        metricSummary: `${kd.toFixed(2)} K/D • ${ddDelta >= 0 ? "+" : ""}${Math.round(ddDelta)} DDΔ`,
      },
      combat: {
        name: "Pression & Combat",
        score: Math.round(combatScore * (totalScore / Math.max(1, rawSum))),
        maxScore: w.combat,
        percentage: Math.min(100, Math.round((combatScore / w.combat) * 100)),
        label: "ACS & Dégâts par Round",
        metricSummary: `${Math.round(acs)} ACS • ${Math.round(adr)} ADR`,
      },
      teamwork: {
        name: "Utilité & Collectif",
        score: Math.round(teamworkScore * (totalScore / Math.max(1, rawSum))),
        maxScore: w.team,
        percentage: Math.min(100, Math.round((teamworkScore / w.team) * 100)),
        label: "KAST % & Passes Décisives",
        metricSummary: `${Math.round(kastPct)}% KAST • ${stats.assists || 0} assists`,
      },
      openings: {
        name: "Premiers Engagements",
        score: Math.round(openingsScore * (totalScore / Math.max(1, rawSum))),
        maxScore: w.open,
        percentage: Math.min(100, Math.round((openingsScore / w.open) * 100)),
        label: "Premiers Sangs (First Bloods)",
        metricSummary: `${avgFB.toFixed(1)} FB / match`,
      },
      precisionClutch: {
        name: "Sang-Froid & Précision",
        score: Math.round(precisionClutchScore * (totalScore / Math.max(1, rawSum))),
        maxScore: w.prec,
        percentage: Math.min(100, Math.round((precisionClutchScore / w.prec) * 100)),
        label: "Tirs Tête & Situations Clutch",
        metricSummary: `${Math.round(hsPct)}% HS • ${Math.round(winrate)}% Victoires`,
      },
    },
    tips,
  };
}

export interface SingleMatchSPIResult {
  score: number; // 0 - 1000
  grade: PerformanceGrade;
  gradeColor: string;
  gradeBg: string;
  gradeBorder: string;
  gradeGlow: string;
}

/**
 * Calcule le Score de Performance Spycam (SPI) spécifique à un match individuel.
 * Pour un match isolé, on évalue la qualité intrinsèque du match en simulant une pleine maturité d'échantillon.
 */
export function calculateSingleMatchSPI(match: any, role?: AgentRole): SingleMatchSPIResult {
  if (!match) {
    return {
      score: 500,
      grade: "B",
      gradeColor: "#10b981",
      gradeBg: "rgba(16, 185, 129, 0.15)",
      gradeBorder: "rgba(16, 185, 129, 0.4)",
      gradeGlow: "rgba(16, 185, 129, 0.3)",
    };
  }

  const deaths = match.deaths ?? 0;
  const kills = match.kills ?? 0;
  const assists = match.assists ?? 0;
  const kd = deaths > 0 ? Number((kills / deaths).toFixed(2)) : kills;
  const acs = match.acs || 180;
  const hsPct = match.headshotPct || (match.headshots && kills ? Math.round((match.headshots / (kills + assists || 1)) * 100) : 20);
  const won = !!match.won;

  const matchStats = {
    kdRatio: kd,
    kills,
    deaths,
    assists,
    acs,
    adr: acs * 0.72,
    headshotPct: hsPct,
    kast: won ? 76 : 64,
    winRate: won ? 100 : 0,
    ddDelta: (kd - 1) * 35,
    matchesPlayed: 40, // Match unique évalué en pleine maturité
  };

  const matchTier = match.rankTier || match.tier || 20;
  const res = calculatePerformanceScore(matchStats, [match], role || match.role || "Flex", matchTier);

  return {
    score: res.totalScore,
    grade: res.grade,
    gradeColor: res.gradeColor,
    gradeBg: res.gradeBg,
    gradeBorder: res.gradeBorder,
    gradeGlow: res.gradeGlow,
  };
}
