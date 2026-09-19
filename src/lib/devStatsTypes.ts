import type { AgentRole } from "@/lib/valorant/performanceScore";

export interface DevStatOverrides {
  enabled: boolean;
  kd: number;
  acs: number;
  hs: number;
  winRate: number;
  kast: number;
  adr: number;
  dd: number;
  firstBloods: number;
  firstDeaths: number;
  clutches: number;
  role: "Auto" | AgentRole;
  matchesCount: number;
  bonusKills?: number;
  bonusWins?: number;
  bonusHeadshots?: number;
  bonusAssists?: number;
  bonusClutches?: number;
  bonusFirstBloods?: number;
}
