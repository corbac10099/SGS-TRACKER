import {
  ValorantProfileResponse,
  ValorantMatchData,
  WeaponPerformanceStat,
  AgentPerformanceStat,
  MatchTeamPlayer,
  MatchDuoTeam,
} from "./types";
import { resolveAgentDisplay } from "./agentsCatalog";
import { resolveGameMode } from "./gameModes";
import { OFFICIAL_WEAPONS } from "./mock";

const MAP_ID_MAP: Record<string, string> = {
  "/game/maps/ascent/ascent": "Ascent",
  "/game/maps/duality/duality": "Bind",
  "/game/maps/bonsai/bonsai": "Split",
  "/game/maps/port/port": "Icebox",
  "/game/maps/foxtrot/foxtrot": "Breeze",
  "/game/maps/canyon/canyon": "Fracture",
  "/game/maps/pitt/pitt": "Pearl",
  "/game/maps/jam/jam": "Lotus",
  "/game/maps/juliett/juliett": "Sunset",
  "/game/maps/hurm/hurm": "Abyss",
  "/game/maps/triad/triad": "Haven",
};

export function parseRiotMatchData(
  matchesDetails: any[],
  puuid: string
): {
  matchHistory: ValorantMatchData[];
  agentStats: AgentPerformanceStat[];
  weapons: WeaponPerformanceStat[];
  stats: any;
  latestRankTier: number;
} {
  const matchHistory: ValorantMatchData[] = [];
  const agentPlayCount: Record<
    string,
    { games: number; wins: number; kills: number; deaths: number; assists: number; minutes: number }
  > = {};
  let latestRankTier = 23; // Default Ascendant 2 if unranked

  matchesDetails.forEach((match, idx) => {
    if (!match || !match.players) return;
    const me = match.players.find((p: any) => p.puuid === puuid);
    if (!me) return;

    const gameModeInfo = resolveGameMode(match.matchInfo?.queueId || match.matchInfo?.gameMode);
    const strategy = gameModeInfo.parsingStrategy || "standard";
    const isDeathmatch = strategy === "ffa";
    const isDuos = strategy === "duos" || strategy === "multi-team" || (match.teams && match.teams.length > 2);
    const isGauntlet =
      gameModeInfo.id === "gauntlet" ||
      isDuos ||
      String(match.matchInfo?.gameMode || "").toLowerCase().includes("abilitydraft") ||
      String(match.matchInfo?.gameMode || "").toLowerCase().includes("gauntlet");

    if (gameModeInfo.isRanked && me.competitiveTier && me.competitiveTier > 0) {
      latestRankTier = me.competitiveTier;
    }

    const defaultAgentIcon = isGauntlet
      ? "https://media.valorant-api.com/agents/773f0c78-4486-752b-68ef-4585d7f4b848/displayicon.png"
      : "https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png";

    const charId = (me.characterId || "").toLowerCase();
    let agentDisp = resolveAgentDisplay(charId);
    if ((!agentDisp.isConfigured || agentDisp.name === "Inconnu") && isGauntlet) {
      agentDisp = resolveAgentDisplay("Robo-Agent");
    }
    const agentName = agentDisp.name || (isGauntlet ? "Robo-Agent" : "Inconnu");

    const myTeam = match.teams?.find((t: any) => t.teamId === me.teamId);
    const enemyTeam = match.teams?.find((t: any) => t.teamId !== me.teamId);
    const won = myTeam?.won || false;

    const kills = me.stats?.kills || 0;
    const deaths = me.stats?.deaths || 0;
    const assists = me.stats?.assists || 0;

    const roundsPlayed = isDeathmatch
      ? 0
      : match.roundResults?.length || myTeam?.roundsPlayed || 22;
    const myAcs = Math.round((me.stats?.score || 0) / Math.max(1, roundsPlayed || 1));

    let isMatchWon = won;
    let scoreStr = "";

    const rawMap = (match.matchInfo?.mapId || "Ascent").toLowerCase();
    const mapName = MAP_ID_MAP[rawMap] || match.matchInfo?.mapId || "Ascent";

    // Teammates and enemies
    const parsedMyTeam: MatchTeamPlayer[] = [];
    const parsedEnemyTeam: MatchTeamPlayer[] = [];

    const allParsedPlayers: MatchTeamPlayer[] = match.players.map((p: any, pIdx: number) => {
      const pCharId = (p.characterId || "").toLowerCase();
      let pAgentDisp = resolveAgentDisplay(pCharId);
      if ((!pAgentDisp.isConfigured || pAgentDisp.name === "Inconnu") && isGauntlet) {
        pAgentDisp = resolveAgentDisplay("Robo-Agent");
      }
      const isMe = p.puuid === puuid;
      const resolvedIcon = pAgentDisp.iconUrl || defaultAgentIcon;
      const resolvedName = p.gameName || p.name || p.riotIdGameName || (isMe ? "Vous" : `Joueur ${pIdx + 1}`);

      return {
        puuid: p.puuid || `p-${pIdx}`,
        name: resolvedName,
        tag: p.tagLine || p.tag || p.riotIdTagLine || "EU1",
        agent: pAgentDisp.name || (isGauntlet ? "Robo-Agent" : (p.characterId ? "Agent" : "Inconnu")),
        agentIcon: resolvedIcon,
        score: p.stats?.score || 0,
        acs: Math.round((p.stats?.score || 0) / Math.max(1, roundsPlayed || 1)),
        kills: p.stats?.kills || 0,
        deaths: p.stats?.deaths || 0,
        assists: p.stats?.assists || 0,
        isMe,
      };
    });

    let duoTeams: MatchDuoTeam[] | undefined;

    if (isDeathmatch) {
      // En Deathmatch (FFA), trier tous les joueurs par frags
      allParsedPlayers.sort((a, b) => b.kills - a.kills || (b.score || 0) - (a.score || 0));
      const myRank = allParsedPlayers.findIndex((p) => p.puuid === puuid) + 1;
      isMatchWon = myRank === 1;
      scoreStr = `#${myRank > 0 ? myRank : 1} (${kills} frags)`;
      // Tous les joueurs sont placés dans une seule liste pour le leaderboard
      parsedMyTeam.push(...allParsedPlayers);
    } else if (isDuos) {
      // En Gauntlet / Mode Duos (8 équipes de 2) ou multi-team
      const teamGroups: Record<string, MatchDuoTeam> = {};
      match.players.forEach((p: any, pIdx: number) => {
        // Grouper par teamId si présent, sinon par blocs de 2 (fallback Gauntlet)
        const tId = String(p.teamId || `team-${Math.floor(pIdx / 2) + 1}`);
        if (!teamGroups[tId]) {
          teamGroups[tId] = { teamId: tId, kills: 0, score: 0, players: [] };
        }
        const tPlayer = allParsedPlayers[pIdx];
        teamGroups[tId].kills += tPlayer.kills;
        teamGroups[tId].score += (tPlayer.score || 0);
        teamGroups[tId].players.push(tPlayer);
      });

      const sortedDuos = Object.values(teamGroups).sort((a, b) => b.kills - a.kills || b.score - a.score);
      const myDuoRank = sortedDuos.findIndex((d) => d.teamId === String(me.teamId)) + 1;
      isMatchWon = myDuoRank === 1;
      scoreStr = `#${myDuoRank > 0 ? myDuoRank : 1} (${kills} frags)`;

      const myDuo = teamGroups[String(me.teamId)];
      if (myDuo) {
        parsedMyTeam.push(...myDuo.players);
      }
      sortedDuos.forEach((d, dIdx) => {
        d.rank = dIdx + 1;
        d.isMyTeam = d.teamId === String(me.teamId);
        if (d.teamId !== String(me.teamId)) {
          parsedEnemyTeam.push(...d.players);
        }
      });
      duoTeams = sortedDuos;
    } else {
      const myRoundsWon = myTeam?.roundsWon ?? (won ? 13 : 8);
      const enemyRoundsWon = enemyTeam?.roundsWon ?? (won ? 8 : 13);
      scoreStr = `${myRoundsWon} - ${enemyRoundsWon}`;

      match.players.forEach((p: any, pIdx: number) => {
        const tPlayer = allParsedPlayers[pIdx];
        if (p.teamId === me.teamId) {
          parsedMyTeam.push(tPlayer);
        } else {
          parsedEnemyTeam.push(tPlayer);
        }
      });
    }

    const shouldCountAgentStats =
      gameModeInfo.trackAgentStats !== false &&
      !isDeathmatch &&
      !isGauntlet &&
      agentName !== "Robo-Agent" &&
      agentName !== "AbilityDraftAgent" &&
      agentName !== "Inconnu";

    if (shouldCountAgentStats) {
      if (!agentPlayCount[agentName]) {
        agentPlayCount[agentName] = { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0, minutes: 0 };
      }
      agentPlayCount[agentName].games++;
      if (isMatchWon) agentPlayCount[agentName].wins++;
      agentPlayCount[agentName].kills += kills;
      agentPlayCount[agentName].deaths += deaths;
      agentPlayCount[agentName].assists += assists;
      agentPlayCount[agentName].minutes += Math.round((match.matchInfo?.gameLengthMillis || 1800000) / 60000);
    }

    const hs = me.stats?.headshots || Math.floor(kills * 0.8);
    const bs = me.stats?.bodyshots || Math.floor(kills * 1.8);
    const ls = me.stats?.legshots || Math.floor(kills * 0.2);

    const gameDurationMs = match.matchInfo?.gameLengthMillis || 1800000;
    const durMins = Math.floor(gameDurationMs / 60000);
    const durSecs = Math.floor((gameDurationMs % 60000) / 1000);

    // Détection robuste de la date
    const matchDateStr = match.matchInfo?.gameStartMillis 
      ? new Date(match.matchInfo.gameStartMillis).toISOString()
      : (match.matchInfo?.gameStart ? new Date(match.matchInfo.gameStart).toISOString() : new Date().toISOString());

    matchHistory.push({
      matchId: match.matchInfo?.matchId || `match-${idx}`,
      mode: gameModeInfo.id,
      modeIcon: gameModeInfo.icon,
      map: mapName,
      agent: agentName || "Inconnu",
      agentIcon: agentDisp.iconUrl || (charId ? `https://media.valorant-api.com/agents/${charId}/displayicon.png` : defaultAgentIcon),
      isRanked: gameModeInfo.isRanked,
      teamFormat: gameModeInfo.teamFormat || "standard",
      won: isMatchWon,
      score: scoreStr,
      kills,
      deaths,
      assists,
      headshots: hs,
      bodyshots: bs,
      legshots: ls,
      aces: 0,
      season: "E9: A3",
      acs: myAcs,
      damage: Math.floor(kills * 150),
      firstBloods: 2,
      roundsPlayed,
      duration: `${durMins}m ${durSecs}s`,
      date: matchDateStr,
      myTeam: parsedMyTeam,
      enemyTeam: parsedEnemyTeam,
      allTeams: duoTeams,
      timeline: [],
      duels: [],
    });
  });

  const agentStats: AgentPerformanceStat[] = Object.entries(agentPlayCount)
    .map(([name, data]) => {
      const ag = resolveAgentDisplay(name);
      return {
        name: ag.name || name,
        uuid: ag.uuid,
        role: ag.role,
        icon: ag.iconUrl,
        games: data.games,
        winRate: Math.round((data.wins / data.games) * 100),
        kd: parseFloat((data.kills / Math.max(data.deaths, 1)).toFixed(2)),
        hoursPlayed: parseFloat((data.minutes / 60).toFixed(1)),
      };
    })
    .sort((a, b) => b.games - a.games);

  const totalKills = matchHistory.reduce((s, m) => s + m.kills, 0);
  const totalDeaths = matchHistory.reduce((s, m) => s + m.deaths, 0);
  const totalAssists = matchHistory.reduce((s, m) => s + m.assists, 0);
  const totalWins = matchHistory.filter((m) => m.won).length;
  const totalHS = matchHistory.reduce((s, m) => s + m.headshots, 0);
  const totalShots = matchHistory.reduce((s, m) => s + m.headshots + m.bodyshots + m.legshots, 0);

  return {
    matchHistory,
    agentStats,
    weapons: OFFICIAL_WEAPONS,
    latestRankTier,
    stats: {
      kills: totalKills,
      deaths: totalDeaths,
      assists: totalAssists,
      kdRatio: parseFloat((totalKills / Math.max(totalDeaths, 1)).toFixed(2)),
      headshotPct: totalShots > 0 ? parseFloat(((totalHS / totalShots) * 100).toFixed(1)) : 24.5,
      winRate: matchHistory.length > 0 ? Math.round((totalWins / matchHistory.length) * 100) : 50,
      matchesPlayed: matchHistory.length,
      acs:
        matchHistory.length > 0
          ? Math.round(matchHistory.reduce((s, m) => s + m.acs, 0) / matchHistory.length)
          : 210,
      aceCount: 0,
      kast: 72.5,
      kastPercentile: "Top 15%",
      ddDelta: 12.0,
      adr: 146.0,
      firstBloods: 15,
    },
  };
}
