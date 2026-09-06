import {
  ValorantProfileResponse,
  ValorantMatchData,
  WeaponPerformanceStat,
  AgentPerformanceStat,
  MatchTeamPlayer,
} from "./types";
import { AGENTS_CATALOG, OFFICIAL_WEAPONS } from "./mock";
import { resolveAgentDisplay } from "./agentsCatalog";

const UUID_TO_AGENT_MAP: Record<string, string> = {
  "add6443a-41bd-e414-f6ad-e58d267f4e95": "Jett",
  "a3bfb853-43b2-7238-a4f1-ad90e9e46bcc": "Reyna",
  "f94c3b30-42be-e959-889c-5aa313dba261": "Raze",
  "8e253930-4c05-31dd-1b6c-968525494517": "Omen",
  "1dbf2edd-4729-0984-3115-daa5eed44993": "Clove",
  "320b2a48-4d9b-a075-30f1-1f93a9b638fa": "Sova",
  "ded3520f-4264-bfed-162d-b080e2abccf9": "Sova",
  "117ed9e3-49f3-6512-3ccf-0cada7e3823b": "Cypher",
  "1179a7fd-434f-492b-8234-54522e337923": "Cypher",
  "1e58de9c-4950-5125-93e9-a0aee9f98746": "Killjoy",
  "0e38b510-41a8-5780-5e8f-568b2a4f2d6c": "Iso",
  "115d823a-4e6f-eed9-9d3a-4cd3a9ac5716": "Iso",
  "707eab51-4836-f488-046a-cda6bf494859": "Viper",
  "22697a3d-45bf-8dd7-4fec-84a9e28c69d7": "Chamber",
  "e370fa57-4757-3604-3648-499e1f642d3f": "Gekko",
  "dade69b4-4f5a-8528-247b-219e5a1facd6": "Fade",
  "5f8d3a7f-467b-97f3-062c-13acf203c006": "Breach",
  "5f8d3a7f-467b-97f3-062c-edd4003d00ad": "Breach",
  "cc8b64c8-4b25-4ff9-6e7f-37b4da43d235": "Deadlock",
  "cc8e01d3-47f9-70e4-9294-4abee08ea256": "Deadlock",
  "eb93336a-449b-9c1b-0a54-a891f7921d69": "Phoenix",
  "eb9333ab-4054-7b4e-4e94-c4a31e090bf8": "Phoenix",
  "569fdd95-4d10-43ab-ca70-79becc718b46": "Sage",
  "9f0d8ba9-4140-b941-57d3-a7ad57c6b417": "Brimstone",
  "6f2a04ca-43e0-be17-7f36-b3908627744d": "Skye",
  "7f94d92c-4234-0a36-9646-3a87eb8b5c89": "Yoru",
  "41fb69c1-4189-7b37-f117-bcaf1e96f1bf": "Astra",
  "601dbbe7-43ce-be57-2a40-4abd24953621": "KAY/O",
  "bb2a4828-46eb-8cd1-e765-15848195d751": "Neon",
  "95b78ed7-4637-86d9-7e41-71ba8c293152": "Harbor",
  "efba5359-4016-a1e5-7626-b1ae76895940": "Vyse",
  "b5bb382d-4264-bfeb-a6d9-4886616428f8": "Vyse",
  "b444168c-4e35-8076-db47-ef9bf368f384": "Tejo",
  "7c8a4701-4de6-9355-b254-e09bc2a34b72": "Miks",
  "92eeef5d-43b5-1d4a-8d03-b3927a09034b": "Veto",
  "df1cb487-4902-002e-5c17-d28e83e78588": "Waylay",
};

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

    if (me.competitiveTier && me.competitiveTier > 0) {
      latestRankTier = me.competitiveTier;
    }

    const charId = (me.characterId || "").toLowerCase();
    const agentName = UUID_TO_AGENT_MAP[charId] || "";
    const agent = resolveAgentDisplay(agentName);

    const myTeam = match.teams?.find((t: any) => t.teamId === me.teamId);
    const enemyTeam = match.teams?.find((t: any) => t.teamId !== me.teamId);
    const won = myTeam?.won || false;

    const kills = me.stats?.kills || 0;
    const deaths = me.stats?.deaths || 0;
    const assists = me.stats?.assists || 0;
    const roundsPlayed = match.roundResults?.length || myTeam?.roundsPlayed || 22;
    const myAcs = Math.round((me.stats?.score || 0) / Math.max(1, roundsPlayed));

    const myRoundsWon = myTeam?.roundsWon ?? (won ? 13 : 8);
    const enemyRoundsWon = enemyTeam?.roundsWon ?? (won ? 8 : 13);
    const scoreStr = `${myRoundsWon} - ${enemyRoundsWon}`;

    if (!agentPlayCount[agentName]) {
      agentPlayCount[agentName] = { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0, minutes: 0 };
    }
    agentPlayCount[agentName].games++;
    if (won) agentPlayCount[agentName].wins++;
    agentPlayCount[agentName].kills += kills;
    agentPlayCount[agentName].deaths += deaths;
    agentPlayCount[agentName].assists += assists;
    agentPlayCount[agentName].minutes += Math.round((match.matchInfo?.gameLengthMillis || 1800000) / 60000);

    const hs = me.stats?.headshots || Math.floor(kills * 0.8);
    const bs = me.stats?.bodyshots || Math.floor(kills * 1.8);
    const ls = me.stats?.legshots || Math.floor(kills * 0.2);

    const rawMap = (match.matchInfo?.mapId || "Ascent").toLowerCase();
    const mapName = MAP_ID_MAP[rawMap] || match.matchInfo?.mapId || "Ascent";

    // Teammates and enemies
    const parsedMyTeam: MatchTeamPlayer[] = [];
    const parsedEnemyTeam: MatchTeamPlayer[] = [];

    match.players.forEach((p: any) => {
      const pCharId = (p.characterId || "").toLowerCase();
      const pAgentName = UUID_TO_AGENT_MAP[pCharId] || "";
      const pAgent = resolveAgentDisplay(pAgentName);
      const isMe = p.puuid === puuid;
      const tPlayer: MatchTeamPlayer = {
        puuid: p.puuid,
        name: p.gameName || "Agent",
        tag: p.tagLine || "EU1",
        agent: pAgentName || "Inconnu",
        agentIcon: pAgent.iconUrl,
        score: p.stats?.score || 0,
        acs: Math.round((p.stats?.score || 0) / Math.max(1, roundsPlayed)),
        kills: p.stats?.kills || 0,
        deaths: p.stats?.deaths || 0,
        assists: p.stats?.assists || 0,
        isMe,
      };

      if (p.teamId === me.teamId) {
        parsedMyTeam.push(tPlayer);
      } else {
        parsedEnemyTeam.push(tPlayer);
      }
    });

    const gameDurationMs = match.matchInfo?.gameLengthMillis || 1800000;
    const durMins = Math.floor(gameDurationMs / 60000);
    const durSecs = Math.floor((gameDurationMs % 60000) / 1000);

    matchHistory.push({
      matchId: match.matchInfo?.matchId || `match-${idx}`,
      mode: match.matchInfo?.queueId || "competitive",
      modeIcon: "https://media.valorant-api.com/gamemodes/96bd3920-4f36-d026-2b28-c683eb0bcac5/displayicon.png",
      map: mapName,
      agent: agentName || "Inconnu",
      agentIcon: agent.iconUrl,
      won,
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
      date: new Date(match.matchInfo?.gameStartMillis || Date.now() - idx * 3600000).toISOString(),
      myTeam: parsedMyTeam,
      enemyTeam: parsedEnemyTeam,
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
