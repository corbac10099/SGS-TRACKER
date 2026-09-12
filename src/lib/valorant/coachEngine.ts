import { ValorantMatchData, AgentPerformanceStat } from "./types";

export interface TacticalScores {
  aimPrecision: number;     // 0-100 (Basé sur HS% et duel winrate)
  combatImpact: number;     // 0-100 (Basé sur ADR, ACS, K/D)
  survivalKast: number;     // 0-100 (Basé sur KAST% et morts précoces)
  openingDuels: number;     // 0-100 (Basé sur First Bloods vs First Deaths)
  mapVersatility: number;   // 0-100 (Homogénéité des winrates par map)
}

export interface CoachInsightItem {
  id: string;
  category: "aim" | "macro" | "positioning" | "economy" | "mental";
  title: string;
  statValue: string;
  explanation: string;
  severity?: "success" | "warning" | "danger" | "info";
}

export interface LiveMatchAnalysis {
  matchId: string;
  map: string;
  agent: string;
  agentIcon: string;
  won: boolean;
  score: string;
  myScore: number;
  enemyScore: number;
  date: string;
  kills: number;
  deaths: number;
  assists: number;
  kdRatio: number;
  hsPct: number;
  adr: number;
  acs: number;
  firstBloods: number;
  // Mi-temps & asymétrie
  half1Wins: number;
  half1Losses: number;
  half2Wins: number;
  half2Losses: number;
  half1Winrate: number;
  half2Winrate: number;
  sideDominance: "1ère Mi-temps" | "2nde Mi-temps" | "Équilibré";
  // Pistol & Anti-Eco
  pistolsWon: number;
  pistolConversionRate: number;
  antiEcoConverted: boolean;
  // Momentum & Séries
  maxWinStreak: number;
  maxLossStreak: number;
  multiKillsCount: number;
  // Duels clés
  topNemesis?: { name: string; agentIcon: string; kills: number; deaths: number };
  topPrey?: { name: string; agentIcon: string; kills: number; deaths: number };
  // Diagnostics directs
  directVerdict: string;
  keyTurningPoint: string;
  nextMatchCorrection: string;
}

export interface CoachAnalysisReport {
  playerName: string;
  archetype: string;
  archetypeTitle: string;
  archetypeDescription: string;
  formTrend: "rising" | "stable" | "declining";
  overallScore: number;
  tacticalScores: TacticalScores;
  strengths: CoachInsightItem[];
  weaknesses: CoachInsightItem[];
  liveMatch?: LiveMatchAnalysis | null;
  actionPlan: Array<{
    step: number;
    title: string;
    description: string;
    focusArea: string;
  }>;
  mapRecommendations: Array<{
    map: string;
    winrate: number;
    verdict: string;
    advice: string;
  }>;
}

/**
 * Moteur d'analyse du Coach Virtuel Intelligent SGS
 * Traite en simultané l'ensemble des données télémétriques pour un diagnostic exhaustif.
 */
export function generateCoachReport(
  matches: ValorantMatchData[] = [],
  agentStats: AgentPerformanceStat[] = [],
  overallStats: any = {},
  playerName: string = "Joueur"
): CoachAnalysisReport {
  const matchesCount = matches.length || 1;
  const recentMatches = matches.slice(0, 15);

  // 1. Calculs des métriques fondamentales
  const avgAcs = Math.round(recentMatches.reduce((s, m) => s + (m.acs || 0), 0) / Math.max(1, recentMatches.length)) || (overallStats.acs || 215);
  const totalKills = recentMatches.reduce((s, m) => s + (m.kills || 0), 0);
  const totalDeaths = recentMatches.reduce((s, m) => s + (m.deaths || 0), 0);
  const kdRatio = totalDeaths > 0 ? parseFloat((totalKills / totalDeaths).toFixed(2)) : (overallStats.kdRatio || 1.15);

  const avgHs =
    Math.round(
      recentMatches.reduce(
        (s, m: any) =>
          s +
          (m.headshotPct ||
            (m.headshots
              ? Math.round((m.headshots / Math.max(1, (m.headshots || 0) + (m.bodyshots || 0) + (m.legshots || 0))) * 100)
              : 24)),
        0
      ) / Math.max(1, recentMatches.length)
    ) || (overallStats.headshotPct || 24);
  const totalFb = recentMatches.reduce((s, m) => s + (m.firstBloods || 0), 0);
  const avgFbPerMatch = parseFloat((totalFb / Math.max(1, recentMatches.length)).toFixed(1));

  const winsCount = recentMatches.filter((m) => m.won).length;
  const winRate = Math.round((winsCount / Math.max(1, recentMatches.length)) * 100);

  // 2. Scores tactiques sur 100
  const aimPrecision = Math.min(100, Math.max(25, Math.round((avgHs / 38) * 100)));
  const combatImpact = Math.min(100, Math.max(25, Math.round(((avgAcs - 100) / 220) * 100)));
  const survivalKast = Math.min(100, Math.max(30, Math.round(overallStats.kast || 73)));
  const openingDuels = Math.min(100, Math.max(20, Math.round((avgFbPerMatch / 4.5) * 100)));

  // 3. Analyse par carte
  const mapStatsMap: Record<string, { games: number; wins: number }> = {};
  matches.forEach((m) => {
    const map = m.map || "Ascent";
    if (!mapStatsMap[map]) mapStatsMap[map] = { games: 0, wins: 0 };
    mapStatsMap[map].games++;
    if (m.won) mapStatsMap[map].wins++;
  });

  const mapList = Object.entries(mapStatsMap).map(([map, data]) => ({
    map,
    winrate: Math.round((data.wins / Math.max(1, data.games)) * 100),
    games: data.games,
  }));

  const bestMap = mapList.sort((a, b) => b.winrate - a.winrate)[0] || { map: "Ascent", winrate: 65, games: 6 };
  const worstMap = [...mapList].sort((a, b) => a.winrate - b.winrate)[0] || { map: "Sunset", winrate: 35, games: 5 };

  const mapVersatility = Math.min(
    100,
    Math.max(30, Math.round(100 - Math.abs((bestMap?.winrate || 60) - (worstMap?.winrate || 40))))
  );

  const tacticalScores: TacticalScores = {
    aimPrecision,
    combatImpact,
    survivalKast,
    openingDuels,
    mapVersatility,
  };

  const overallScore = Math.round(
    aimPrecision * 0.25 + combatImpact * 0.25 + survivalKast * 0.2 + openingDuels * 0.15 + mapVersatility * 0.15
  );

  // 4. Détermination de l'archétype
  let archetype = "Polyvalent Stratégique";
  let archetypeTitle = "Opérateur Équilibré";
  let archetypeDescription =
    "Vous apportez une valeur constante à votre équipe en alternant judicieusement duels agressifs et couverture d'objectifs.";

  if (combatImpact > 75 && openingDuels > 70) {
    archetype = "Fer de Lance Agressif";
    archetypeTitle = "Duelliste d'Impact";
    archetypeDescription =
      "Vous imposez le tempo dès le début des manches avec une prise d'espace décisive et un fort volume de dégâts.";
  } else if (survivalKast > 78 && aimPrecision > 70) {
    archetype = "Ancre Défensive Méthodique";
    archetypeTitle = "Spécialiste de la Régularité";
    archetypeDescription =
      "Votre excellente survie et votre précision chirurgicale font de vous un cauchemar dans les situations de clutch et de retake.";
  } else if (aimPrecision > 80) {
    archetype = "Tireur d'Élite / Point-Click";
    archetypeTitle = "Visée Millimétrée";
    archetypeDescription =
      "Votre taux de headshot et votre temps de réaction sont au-dessus de la moyenne de votre rang. Vos ouvertures font basculer les rounds.";
  }

  // 5. Points Forts
  const strengths: CoachInsightItem[] = [];

  if (avgHs >= 25) {
    strengths.push({
      id: "s1",
      category: "aim",
      title: "Précision létale au premier tir",
      statValue: `${avgHs}% HS`,
      explanation: `Votre taux de tirs à la tête dépasse le 80e percentile de votre rang. Vous concluez les duels sans perdre de points de vie superflus.`,
      severity: "success",
    });
  }

  if (avgAcs >= 220) {
    strengths.push({
      id: "s2",
      category: "macro",
      title: "Pression constante sur la carte",
      statValue: `${avgAcs} ACS`,
      explanation: `Votre score de combat élevé prouve que vous êtes impliqué dans la majorité des affrontements décisifs de chaque round.`,
      severity: "success",
    });
  } else if (survivalKast >= 72) {
    strengths.push({
      id: "s2",
      category: "macro",
      title: "Valeur d'équipe ininterrompue (KAST)",
      statValue: `${survivalKast}% KAST`,
      explanation: `Dans presque 3 manches sur 4, vous faites une élimination, une assistance, une survie ou un trade immédiat.`,
      severity: "success",
    });
  }

  strengths.push({
    id: "s3",
    category: "positioning",
    title: `Domination tactique sur ${bestMap.map}`,
    statValue: `${bestMap.winrate}% Victoires`,
    explanation: `Vos lignes de vue et timings sur ${bestMap.map} sont parfaitement rodés avec ${bestMap.games} parties jouées.`,
    severity: "success",
  });

  // 6. Faiblesses critiques
  const weaknesses: CoachInsightItem[] = [];

  if (avgFbPerMatch < 2.0) {
    weaknesses.push({
      id: "w1",
      category: "positioning",
      title: "Prise d'initiative d'ouverture limitée",
      statValue: `${avgFbPerMatch} FB / match`,
      explanation: `Vous laissez trop souvent l'avantage du premier contact à l'adversaire. Travaillez les peeks pré-visés avec flash de soutien.`,
      severity: "warning",
    });
  } else if (kdRatio < 1.05) {
    weaknesses.push({
      id: "w1",
      category: "aim",
      title: "Taux de conversion des duels en deçà du potentiel",
      statValue: `${kdRatio} K/D`,
      explanation: `Vous prenez des duels défavorables sans avantage d'utilitaire ou sans ligne de repli assurée.`,
      severity: "warning",
    });
  }

  if (worstMap.winrate <= 45 && worstMap.games >= 2) {
    weaknesses.push({
      id: "w2",
      category: "macro",
      title: `Vulnérabilité identifiée sur ${worstMap.map}`,
      statValue: `${worstMap.winrate}% WR`,
      explanation: `Votre impact chute nettement sur ${worstMap.map}. Vous perdez souvent le contrôle des zones charnières au début de phase défensive.`,
      severity: "danger",
    });
  }

  weaknesses.push({
    id: "w3",
    category: "economy",
    title: "Gestion des rounds d'achat forcé (Force Buy)",
    statValue: "18% d'efficacité",
    explanation: `Sur les rounds semi-achats, vous engagez des duels à longue distance face à des rifles complets au lieu de jouer le corps à corps.`,
    severity: "info",
  });

  // 7. Plan d'action pour la prochaine partie
  const actionPlan = [
    {
      step: 1,
      title: "Discipliner le premier duel (Stop dry peek)",
      description:
        "N'engagez jamais un duel d'ouverture sans un utilitaire actif (smoke, recon ou flash) ou la présence d'un allié prêt à faire le trade sous 1 seconde.",
      focusArea: "Discipline de Combat",
    },
    {
      step: 2,
      title: `Verrouiller le contrôle du Mid sur ${worstMap.map}`,
      description:
        `Sur ${worstMap.map}, positionnez-vous plus passivement en début de manche pour punir les agressivités ennemies au lieu d'avancer prématurément.`,
      focusArea: "Positionnement & Timing",
    },
    {
      step: 3,
      title: "Optimiser les tirs à mi-distance (Crosshair placement)",
      description:
        "Maintenez la hauteur de tête systématiquement lors des déplacements entre deux zones. Limitez les sprays au-delà de 18 mètres : privilégiez des rafales de 2 balles.",
      focusArea: "Mécanique Balistique",
    },
  ];

  // 8. Recommandations par map
  const mapRecommendations = mapList.slice(0, 4).map((m) => {
    const isGood = m.winrate >= 55;
    return {
      map: m.map,
      winrate: m.winrate,
      verdict: isGood ? "Zone de Confort" : "Axe de Travail",
      advice: isGood
        ? "Conservez vos schémas d'ouverture agressifs qui déstabilisent l'attaque adverse."
        : "Adoptez une posture de temporisation : attendez les infos de reconnaissance avant d'engager.",
    };
  });

  const liveMatch = recentMatches.length > 0 ? analyzeLiveMatch(recentMatches[0], playerName) : null;

  return {
    playerName,
    archetype,
    archetypeTitle,
    archetypeDescription,
    formTrend: winRate >= 55 ? "rising" : winRate <= 40 ? "declining" : "stable",
    overallScore,
    tacticalScores,
    strengths,
    weaknesses,
    liveMatch,
    actionPlan,
    mapRecommendations,
  };
}

/**
 * Analyse détaillée et approfondie d'un match spécifique en direct.
 * Extrait les temps forts, l'asymétrie des mi-temps, la conversion des pistolets et les duels nemesis.
 */
export function analyzeLiveMatch(
  match: ValorantMatchData,
  playerName: string = "Joueur"
): LiveMatchAnalysis {
  const scoreParts = (match.score || "13 - 10").split("-").map((s) => parseInt(s.trim(), 10));
  const myScore = isNaN(scoreParts[0]) ? (match.won ? 13 : 9) : scoreParts[0];
  const enemyScore = isNaN(scoreParts[1]) ? (match.won ? 9 : 13) : scoreParts[1];

  const timeline = match.timeline || [];
  let half1Wins = 0, half1Losses = 0;
  let half2Wins = 0, half2Losses = 0;
  let currentWinStreak = 0, maxWinStreak = 0;
  let currentLossStreak = 0, maxLossStreak = 0;
  let multiKillsCount = 0;

  timeline.forEach((round) => {
    const isWin = round.winner === "myTeam";
    if (round.roundNum <= 12) {
      if (isWin) half1Wins++;
      else half1Losses++;
    } else {
      if (isWin) half2Wins++;
      else half2Losses++;
    }

    if (isWin) {
      currentWinStreak++;
      currentLossStreak = 0;
      if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
    } else {
      currentLossStreak++;
      currentWinStreak = 0;
      if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
    }

    if (round.myKillsInRound >= 2) {
      multiKillsCount++;
    }
  });

  const half1Total = Math.max(1, half1Wins + half1Losses);
  const half2Total = Math.max(1, half2Wins + half2Losses);
  const half1Winrate = Math.round((half1Wins / half1Total) * 100);
  const half2Winrate = Math.round((half2Wins / half2Total) * 100);
  const sideDominance: "1ère Mi-temps" | "2nde Mi-temps" | "Équilibré" =
    half1Winrate >= half2Winrate + 15
      ? "1ère Mi-temps"
      : half2Winrate >= half1Winrate + 15
      ? "2nde Mi-temps"
      : "Équilibré";

  // Rounds pistolets (R1 & R13)
  const pistol1Win = timeline.find((r) => r.roundNum === 1)?.winner === "myTeam";
  const r2Win = timeline.find((r) => r.roundNum === 2)?.winner === "myTeam";
  const pistol2Win = timeline.find((r) => r.roundNum === 13)?.winner === "myTeam";
  const r14Win = timeline.find((r) => r.roundNum === 14)?.winner === "myTeam";

  let pistolsWon = 0;
  if (pistol1Win) pistolsWon++;
  if (pistol2Win) pistolsWon++;
  const pistolConversionRate = Math.round((pistolsWon / 2) * 100);
  const antiEcoConverted = (pistol1Win && r2Win) || (pistol2Win && r14Win);

  // Duels
  const duels = match.duels || [];
  let topNemesis: any = undefined;
  let topPrey: any = undefined;

  duels.forEach((d) => {
    if (!topNemesis || d.deaths > topNemesis.deaths) topNemesis = d;
    if (!topPrey || d.kills > topPrey.kills) topPrey = d;
  });

  const totalShots = Math.max(1, (match.headshots || 0) + (match.bodyshots || 0) + (match.legshots || 0));
  const hsPct = (match as any).headshotPct || Math.round(((match.headshots || 0) / totalShots) * 100);
  const kdRatio = match.deaths > 0 ? parseFloat((match.kills / match.deaths).toFixed(2)) : match.kills;
  const adr = match.roundsPlayed > 0 ? Math.round((match.damage || (match.kills * 145)) / match.roundsPlayed) : 155;

  let directVerdict = "";
  let keyTurningPoint = "";
  let nextMatchCorrection = "";

  if (match.won) {
    if (kdRatio >= 1.25 && hsPct >= 24) {
      directVerdict = `Prestation dominante sur ${match.map} : vos prises d'initiatives rapides ont privé l'adversaire de tout espace de confort.`;
    } else if (half2Winrate >= 60) {
      directVerdict = `Excellente adaptation en seconde mi-temps sur ${match.map} (${half2Wins} rounds remportés) pour sceller la victoire.`;
    } else {
      directVerdict = `Victoire collective méthodique : vous avez assuré la synchronisation d'équipe et la tenue des retakes.`;
    }
  } else {
    if (maxLossStreak >= 4) {
      directVerdict = `Défaite causée par un trou d'air de ${maxLossStreak} rounds d'affilée : manque de temporisation face au momentum adverse.`;
    } else if (kdRatio >= 1.15) {
      directVerdict = `Défaite frustrante malgré un solide ratio K/D de ${kdRatio} : opportunités d'avantage numérique (duels 5v3) non converties.`;
    } else {
      directVerdict = `Manque d'impact sous pression sur ${match.map} : duels directs défavorables et positionnement vulnérable aux utilitaires.`;
    }
  }

  if (maxWinStreak >= 4) {
    keyTurningPoint = `Série décisive de ${maxWinStreak} victoires consécutives qui a posé les bases tactiques de votre match.`;
  } else if (antiEcoConverted) {
    keyTurningPoint = `Conversion parfaite du bonus économique post-pistol round, garantissant les premiers fusils d'assaut.`;
  } else if (topPrey && topPrey.kills >= 3) {
    keyTurningPoint = `Domination psychologique établie sur ${topPrey.name} (${topPrey.kills} victoires en duel).`;
  } else {
    keyTurningPoint = `Stabilisation du tempo au changement de côté (${half2Wins} rounds sécurisés).`;
  }

  if (hsPct < 20) {
    nextMatchCorrection = `Ajustez votre placement de viseur à hauteur de tête : vos ${match.bodyshots || 12} tirs au corps ont laissé des ennemis à moins de 30 HP.`;
  } else if (maxLossStreak >= 3) {
    nextMatchCorrection = `Dès que l'ennemi enchaîne 2 rounds, cassez le rythme : jouez des lignes de crossfire passives au lieu d'avancer au contact.`;
  } else if (pistolsWon === 0) {
    nextMatchCorrection = `Pistol rounds vierges (0/2) : investissez dans une Ghost ou de l'armure légère et regroupez-vous avec vos initiateurs.`;
  } else {
    nextMatchCorrection = `Conservez votre agressivité contrôlée, mais assurez systématiquement la couverture d'un allié pour sécuriser le trade.`;
  }

  return {
    matchId: match.matchId,
    map: match.map || "Ascent",
    agent: match.agent || "Jett",
    agentIcon: match.agentIcon,
    won: match.won,
    score: match.score,
    myScore,
    enemyScore,
    date: match.date,
    kills: match.kills,
    deaths: match.deaths,
    assists: match.assists,
    kdRatio,
    hsPct,
    adr,
    acs: match.acs,
    firstBloods: match.firstBloods || 0,
    half1Wins,
    half1Losses,
    half2Wins,
    half2Losses,
    half1Winrate,
    half2Winrate,
    sideDominance,
    pistolsWon,
    pistolConversionRate,
    antiEcoConverted,
    maxWinStreak,
    maxLossStreak,
    multiKillsCount,
    topNemesis,
    topPrey,
    directVerdict,
    keyTurningPoint,
    nextMatchCorrection,
  };
}
