import { prisma } from "@/lib/prisma";
import { ValorantMatchData } from "@/lib/valorant/types";

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
    if (!matchId) continue;

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
      try {
        const item = JSON.parse(rec.matchData) as ValorantMatchData;
        if (item) {
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
    if (id) {
      mapById.set(id, m);
    }
  }

  // 2. Les matchs récents de l'API écrasent/enrichissent les détails si plus récents
  for (const m of freshMatches) {
    const id = m.matchId || m.id;
    if (id) {
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
