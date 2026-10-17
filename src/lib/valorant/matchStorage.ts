import { prisma } from "@/lib/prisma";
import { ValorantMatchData, AgentPerformanceStat } from "@/lib/valorant/types";
import { resolveAgentDisplay } from "@/lib/valorant/agentsCatalog";

/**
 * Enregistre et cumule les matchs d'un joueur dans la base Neon DB.
 * Chaque match est stocké de manière unique (par matchId + riotId).
 * Si l'utilisateur a configuré une durée de rétention (ex: 30j, 90j, 365j),
 * les matchs au-delà de cette durée peuvent être purgés.
 * Si la durée est "illimitée" (forever ou days <= 0 ou 9999), aucun match n'est supprimé.
 */
export async function saveMatchesToNeon(
  riotId: string,
  gameName: string,
  tagLine: string,
  puuid: string | null | undefined,
  matches: ValorantMatchData[],
  retentionDays: number = 90
): Promise<number> {
  if (!matches || matches.length === 0) return 0;

  const cleanRiotId = `${gameName.trim()}#${tagLine.trim()}`.toLowerCase();
  let savedCount = 0;

  for (const match of matches) {
    const matchId = String(match.matchId || match.id || "").trim();
    if (
      !matchId ||
      matchId.startsWith("henrik-match-") ||
      match.agent === "Inconnu" ||
      !match.agent
    )
      continue;

    // Détermination de la date du match
    let matchDate: Date;
    try {
      if (match.startedAt || match.date) {
        matchDate = new Date(match.startedAt || match.date);
      } else {
        matchDate = new Date();
      }
      if (isNaN(matchDate.getTime())) {
        matchDate = new Date();
      }
    } catch {
      matchDate = new Date();
    }

    try {
      await prisma.persistedValorantMatch.upsert({
        where: {
          matchId_riotId: {
            matchId,
            riotId: cleanRiotId,
          },
        },
        update: {
          queue: match.mode || null,
          map: match.map || null,
          matchDate,
          matchData: JSON.stringify(match),
          puuid: puuid || undefined,
        },
        create: {
          matchId,
          riotId: cleanRiotId,
          gameName: gameName.trim(),
          tagLine: tagLine.trim(),
          puuid: puuid || null,
          queue: match.mode || null,
          map: match.map || null,
          matchDate,
          matchData: JSON.stringify(match),
        },
      });
      savedCount++;
    } catch (upsertErr) {
      console.warn(`[MatchStorage] Erreur sauvegarde match ${matchId}:`, upsertErr);
    }
  }

  // Purge éventuelle selon la politique de rétention (si différente d'illimitée)
  const isForever = retentionDays <= 0 || retentionDays >= 9999;
  if (!isForever && retentionDays > 0) {
    try {
      const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      await prisma.persistedValorantMatch.deleteMany({
        where: {
          riotId: cleanRiotId,
          matchDate: { lt: cutoff },
        },
      });
    } catch (purgeErr) {
      console.warn(`[MatchStorage] Erreur purge rétention ${cleanRiotId}:`, purgeErr);
    }
  }

  return savedCount;
}

/**
 * Récupère l'ensemble des matchs cumulés d'un joueur depuis Neon DB
 * en appliquant le filtre de date de rétention si applicable.
 */
export async function getPersistedMatchesForPlayer(
  riotId: string,
  puuid?: string | null,
  retentionDays: number = 90
): Promise<ValorantMatchData[]> {
  const cleanRiotId = riotId.trim().toLowerCase();
  const isForever = retentionDays <= 0 || retentionDays >= 9999;
  const cutoff = !isForever && retentionDays > 0
    ? new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
    : null;

  try {
    const records = await prisma.persistedValorantMatch.findMany({
      where: {
        OR: [
          { riotId: cleanRiotId },
          ...(puuid ? [{ puuid }] : []),
        ],
        ...(cutoff ? { matchDate: { gte: cutoff } } : {}),
      },
      orderBy: { matchDate: "desc" },
    });

    const parsed: ValorantMatchData[] = [];
    for (const rec of records) {
      if (rec.matchId.startsWith("henrik-match-")) continue;
      try {
        const item = JSON.parse(rec.matchData) as ValorantMatchData;
        if (
          item &&
          item.agent &&
          item.agent !== "Inconnu" &&
          !String(item.matchId || "").startsWith("henrik-match-")
        ) {
          item.matchId = rec.matchId;
          item.id = rec.matchId;
          parsed.push(item);
        }
      } catch (parseErr) {
        console.warn(`[MatchStorage] Erreur parsing JSON match ${rec.matchId}:`, parseErr);
      }
    }

    return parsed;
  } catch (err) {
    console.warn(`[MatchStorage] Erreur lecture matchs Neon pour ${riotId}:`, err);
    return [];
  }
}

/**
 * Fusionne intelligemment l'historique de matchs renvoyé par l'API (ex: 10 à 15 derniers)
 * avec l'historique cumulé stocké sur Neon DB, en éliminant les doublons
 * et en ordonnant chronologiquement (du plus récent au plus ancien).
 */
export function mergeMatchHistories(
  freshMatches: ValorantMatchData[] = [],
  persistedMatches: ValorantMatchData[] = []
): ValorantMatchData[] {
  const mapById = new Map<string, ValorantMatchData>();

  // 1. D'abord les matchs persistés de Neon
  for (const m of persistedMatches) {
    const id = m.matchId || m.id;
    if (
      id &&
      m.agent &&
      m.agent !== "Inconnu" &&
      !String(id).startsWith("henrik-match-")
    ) {
      mapById.set(id, m);
    }
  }

  // 2. Les matchs récents de l'API écrasent/enrichissent les détails si plus récents
  for (const m of freshMatches) {
    const id = m.matchId || m.id;
    if (
      id &&
      m.agent &&
      m.agent !== "Inconnu" &&
      !String(id).startsWith("henrik-match-")
    ) {
      mapById.set(id, m);
    }
  }

  const merged = Array.from(mapById.values());

  // Tri décroissant par date de début de match
  merged.sort((a, b) => {
    const timeA = new Date(a.startedAt || a.date || 0).getTime();
    const timeB = new Date(b.startedAt || b.date || 0).getTime();
    return timeB - timeA;
  });

  return merged;
}

/**
 * Recalcule fidèlement les statistiques d'agents et les statistiques globales
 * à partir d'une liste de matchs déjà parsés (ValorantMatchData).
 */
export function recomputeStatsFromParsedMatches(
  matches: ValorantMatchData[],
  existingStats?: any
): {
  agentStats: AgentPerformanceStat[];
  mainAgentObj: any;
  statsObj: any;
} {
  if (!matches || matches.length === 0) {
    return {
      agentStats: [],
      mainAgentObj: null,
      statsObj: existingStats || null,
    };
  }

  const agentMap: Record<
    string,
    {
      name: string;
      games: number;
      wins: number;
      kills: number;
      deaths: number;
      minutes: number;
      icon?: string;
    }
  > = {};

  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let totalWins = 0;
  let totalScore = 0;
  let totalRounds = 0;
  let totalHS = 0;
  let totalBS = 0;
  let totalLS = 0;
  let totalFirstBloods = 0;
  let totalAces = 0;

  for (const m of matches) {
    const agName = m.agent || "Inconnu";
    const kills = Number(m.kills) || 0;
    const deaths = Number(m.deaths) || 0;
    const assists = Number(m.assists) || 0;
    const won = !!m.won;

    let durMin = 30;
    if (typeof m.duration === "number") {
      durMin = m.duration > 180 ? Math.round(m.duration / 60) : m.duration;
    } else if (typeof m.duration === "string") {
      const parsed = parseFloat(m.duration);
      if (!isNaN(parsed)) {
        durMin = parsed;
      }
    }

    if (!agentMap[agName]) {
      agentMap[agName] = {
        name: agName,
        games: 0,
        wins: 0,
        kills: 0,
        deaths: 0,
        minutes: 0,
        icon: m.agentIcon,
      };
    }

    agentMap[agName].games += 1;
    if (won) agentMap[agName].wins += 1;
    agentMap[agName].kills += kills;
    agentMap[agName].deaths += deaths;
    agentMap[agName].minutes += durMin;

    totalKills += kills;
    totalDeaths += deaths;
    totalAssists += assists;
    if (won) totalWins += 1;
    totalFirstBloods += Number(m.firstBloods) || 0;
    totalAces += Number(m.aces) || 0;
    totalHS += Number(m.headshots) || 0;
    totalBS += Number(m.bodyshots) || 0;
    totalLS += Number(m.legshots) || 0;
    const rounds = Number(m.roundsPlayed) || 20;
    totalRounds += rounds;
    totalScore += (Number(m.acs) || 200) * rounds;
  }

  // Filtrer les entités non jouables et trier par nombre de parties jouées
  const agentStats: AgentPerformanceStat[] = Object.values(agentMap)
    .filter(
      (a) =>
        a.name &&
        a.name !== "Robo-Agent" &&
        a.name !== "AbilityDraftAgent" &&
        a.name !== "Inconnu"
    )
    .map((data) => {
      const agDisp = resolveAgentDisplay(data.name);
      return {
        name: agDisp.name || data.name,
        uuid: agDisp.uuid,
        role: agDisp.role,
        icon:
          agDisp.iconUrl ||
          data.icon ||
          "https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png",
        games: data.games,
        winRate: Math.round((data.wins / Math.max(data.games, 1)) * 100),
        kd: parseFloat((data.kills / Math.max(data.deaths, 1)).toFixed(2)),
        hoursPlayed: parseFloat((data.minutes / 60).toFixed(1)),
      };
    })
    .sort((a, b) => b.games - a.games);

  const topAgent = agentStats[0];
  let mainAgentObj = null;
  if (topAgent) {
    const disp = resolveAgentDisplay(topAgent.name);
    mainAgentObj = {
      name: disp.name || topAgent.name,
      uuid: disp.uuid,
      role: disp.role,
      icon: disp.iconUrl || topAgent.icon,
      fullPortrait: disp.fullPortrait,
    };
  }

  const matchesCount = Math.max(matches.length, 1);
  const totalShots = totalHS + totalBS + totalLS;
  const calculatedKd = parseFloat(
    (totalKills / Math.max(totalDeaths, 1)).toFixed(2)
  );
  const calculatedHs =
    totalShots > 0
      ? parseFloat(((totalHS / totalShots) * 100).toFixed(1))
      : existingStats?.headshotPct || 24;
  const calculatedWinRate = Math.round((totalWins / matchesCount) * 100);
  const calculatedAcs =
    totalRounds > 0
      ? Math.round(totalScore / totalRounds)
      : existingStats?.acs || 215;

  const statsObj = {
    ...(existingStats || {}),
    kills: totalKills,
    deaths: totalDeaths,
    assists: totalAssists,
    kdRatio: calculatedKd,
    headshotPct: calculatedHs,
    winRate: calculatedWinRate,
    matchesPlayed: matches.length,
    acs: calculatedAcs > 0 ? calculatedAcs : existingStats?.acs || 215,
    aceCount: totalAces,
    firstBloods: totalFirstBloods,
  };

  return { agentStats, mainAgentObj, statsObj };
}
