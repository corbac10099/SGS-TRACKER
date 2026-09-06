export interface ValorantPlayerIdentity {
  puuid: string;
  gameName: string;
  tagLine: string;
  region: string;
  accountLevel: number;
  level?: number;
  cardUrl?: string;
  cardSmall?: string;
  cardLarge?: string;
  cardWide?: string;
  cardWideUrl?: string;
  badge?: string | null;
  showBadge?: boolean;
  isOwner?: boolean;
  canEdit?: boolean;
  rank?: string;
  rankUrl?: string;
  rankTier?: number;
  mainAgent?: any;
  stats?: any;
  agentStats?: any[];
  weapons?: any[];
  matchHistory?: any[];
}

export interface ValorantPlayerStats {
  kills: number;
  deaths: number;
  assists: number;
  kdRatio: number;
  headshotPct: number;
  winRate: number;
  matchesPlayed: number;
  acs: number;
  aceCount: number;
  kast: number;
  kastPercentile: string;
  ddDelta: number;
  adr: number;
  firstBloods: number;
}

export interface WeaponPerformanceStat {
  id: string;
  name: string;
  category: string;
  icon: string;
  kills: number;
  headshots: number;
  bodyshots: number;
  legshots: number;
}

export interface AgentPerformanceStat {
  name: string;
  uuid: string;
  role: string;
  icon: string;
  games: number;
  winRate: number;
  kd: number;
  hoursPlayed: number;
}

export interface MatchRoundTimeline {
  roundNum: number;
  winner: "myTeam" | "enemyTeam";
  winCondition: "Elimination" | "SpikeExploded" | "SpikeDefused" | "TimeOut";
  myKillsInRound: number;
  diedInRound: boolean;
}

export interface MatchPlayerDuel {
  puuid: string;
  name: string;
  agentIcon: string;
  rank?: string;
  rankUrl?: string;
  rankTier?: number;
  kills: number;
  deaths: number;
}

export interface MatchTeamPlayer {
  puuid: string;
  name: string;
  tag?: string;
  agent: string;
  agentIcon: string;
  rank?: string;
  rankUrl?: string;
  score?: number;
  acs: number;
  kills: number;
  deaths: number;
  assists: number;
  econScore?: number;
  firstBloods?: number;
  isMe: boolean;
  isPublicProfile?: boolean;
}

export interface ValorantMatchData {
  matchId: string;
  mode: string;
  modeIcon: string;
  map: string;
  agent: string;
  agentIcon: string;
  rank?: string;
  rankUrl?: string;
  rankTier?: number;
  won: boolean;
  score: string;
  kills: number;
  deaths: number;
  assists: number;
  headshots: number;
  bodyshots: number;
  legshots: number;
  aces: number;
  season: string;
  acs: number;
  damage: number;
  firstBloods: number;
  roundsPlayed: number;
  duration: string;
  date: string;
  myTeam: MatchTeamPlayer[];
  enemyTeam: MatchTeamPlayer[];
  timeline: MatchRoundTimeline[];
  duels: MatchPlayerDuel[];
}

export interface ValorantProfileResponse {
  player: ValorantPlayerIdentity & {
    theme?: string | null;
    bannerUrl?: string | null;
    bannerOffsetY?: number | null;
    isPublic?: boolean;
    hiddenStats?: string | null;
    dashboardGrid?: string | null;
  };
  rank: string;
  rankUrl: string;
  rankTier: number;
  level: number;
  mainAgent: {
    name: string;
    uuid: string;
    role: string;
    icon: string;
    fullPortrait: string;
  };
  stats: ValorantPlayerStats;
  agentStats: AgentPerformanceStat[];
  weapons: WeaponPerformanceStat[];
  matchHistory: ValorantMatchData[];
  warnings?: Record<string, string>;
  isMock?: boolean;
  apiStatus?: {
    connected?: boolean;
    verified?: boolean;
    accountVerified?: boolean;
    isDevKey?: boolean;
    matchSource?: string;
    puuid?: string;
    message?: string;
    error?: string;
  };
}

export interface LeaderboardPlayerEntry {
  leaderboardRank: number;
  puuid: string;
  gameName: string;
  tagLine: string;
  rankedRating: number;
  numberOfWins: number;
  tier: number;
  tierName: string;
  tierIcon: string;
}
