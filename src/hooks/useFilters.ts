"use client";

import {
  useState,
  useMemo,
  useCallback,
  useRef,
  useLayoutEffect,
} from "react";
import {
  calculatePerformanceScore,
  detectDominantRole,
  type AgentRole,
} from "@/lib/valorant/performanceScore";
import type { DevStatOverrides } from "@/components/LocalDevStatsPanel";

export interface FiltersState {
  gameMode: string;
  setGameMode: (v: string) => void;
  selectedSeason: string;
  setSelectedSeason: (v: string) => void;
  visibleMatchesCount: number;
  setVisibleMatchesCount: (v: number | ((prev: number) => number)) => void;
  availableSeasons: string[];
  filteredMatches: any[];
  filteredAgents: any[];
  filteredStats: any;
  effectiveStats: any;
  effectiveMatches: any[];
  performanceScoreResult: any;
  dominantRole: AgentRole;
  isSearchingOther: boolean;

  // Game mode pill sliding animation
  gameModeContainerRef: React.RefObject<HTMLDivElement | null>;
  gameModeBtnRefs: React.MutableRefObject<
    Record<string, HTMLButtonElement | null>
  >;
  gameModePillStyle: { left: number; width: number; opacity: number };
}

export function useFilters(
  playerData: any,
  rawMatches: any[],
  rawAgentStats: any[],
  rawStats: any,
  devOverrides: DevStatOverrides | null,
  riotId: string,
  myRiotId: string
): FiltersState {
  const [gameMode, setGameMode] = useState("all");
  const [selectedSeason, setSelectedSeason] = useState("all");
  const [visibleMatchesCount, setVisibleMatchesCount] = useState(10);

  // Game mode pill sliding animation
  const gameModeContainerRef = useRef<HTMLDivElement | null>(null);
  const gameModeBtnRefs = useRef<
    Record<string, HTMLButtonElement | null>
  >({});
  const [gameModePillStyle, setGameModePillStyle] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const updateGameModePill = useCallback(() => {
    if (!gameModeContainerRef.current) return;
    const btn = gameModeBtnRefs.current[gameMode];
    const container = gameModeContainerRef.current;
    if (!btn || !container) {
      setGameModePillStyle((prev) => ({ ...prev, opacity: 0 }));
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    if (btnRect.width > 0) {
      setGameModePillStyle({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
        opacity: 1,
      });
    }
  }, [gameMode]);

  useLayoutEffect(() => {
    updateGameModePill();
    const t1 = setTimeout(updateGameModePill, 40);
    const t2 = setTimeout(updateGameModePill, 120);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [gameMode, playerData, updateGameModePill]);

  const availableSeasons = useMemo(() => {
    if (!playerData?.player?.matchHistory) return [];
    const seasons = new Set<string>();
    playerData.player.matchHistory.forEach((m: any) => {
      if (m.season) seasons.add(m.season);
    });
    return Array.from(seasons).sort((a: any, b: any) => b.localeCompare(a));
  }, [playerData]);

  const filteredMatches = useMemo(() => {
    if (!rawMatches || rawMatches.length === 0) return [];
    return rawMatches.filter((m: any) => {
      const modeMatch =
        gameMode === "all" ||
        (gameMode === "competitive" && m.mode === "competitive") ||
        (gameMode === "unrated" && m.mode === "unrated") ||
        (gameMode === "other" &&
          m.mode !== "competitive" &&
          m.mode !== "unrated");

      const seasonMatch =
        selectedSeason === "all" || m.season === selectedSeason;
      return modeMatch && seasonMatch;
    });
  }, [rawMatches, gameMode, selectedSeason]);

  const filteredAgents = useMemo(() => {
    if (!rawAgentStats || rawAgentStats.length === 0) return [];
    if (gameMode === "all" && selectedSeason === "all") return rawAgentStats;

    const counts: Record<string, any> = {};
    filteredMatches.forEach((m: any) => {
      if (!counts[m.agent])
        counts[m.agent] = {
          games: 0,
          wins: 0,
          kills: 0,
          deaths: 0,
          hoursPlayed: 0,
          icon: m.agentIcon,
        };
      counts[m.agent].games++;
      if (m.won) counts[m.agent].wins++;
      counts[m.agent].kills += m.kills;
      counts[m.agent].deaths += m.deaths;
      counts[m.agent].hoursPlayed += (m.duration || 0) / 3600;
    });

    return Object.keys(counts)
      .map((name) => {
        const data = counts[name];
        const orig = rawAgentStats.find((a: any) => a.name === name);
        return {
          name,
          role: orig?.role || "Agent",
          icon: data.icon,
          games: data.games,
          winRate: Math.round((data.wins / data.games) * 100),
          kd: parseFloat(
            (data.kills / Math.max(data.deaths, 1)).toFixed(2)
          ),
          hoursPlayed: parseFloat(data.hoursPlayed.toFixed(1)),
        };
      })
      .sort((a: any, b: any) => b.games - a.games);
  }, [rawAgentStats, gameMode, selectedSeason, filteredMatches]);

  const filteredStats = useMemo(() => {
    if (!rawStats) return null;
    if (gameMode === "all" && selectedSeason === "all") return rawStats;

    const matches = filteredMatches;
    if (matches.length === 0)
      return {
        ...rawStats,
        kills: 0,
        deaths: 0,
        assists: 0,
        kdRatio: 0,
        winRate: 0,
        matchesPlayed: 0,
        acs: 0,
        headshotPct: 0,
        aceCount: 0,
      };

    const totalKills = matches.reduce(
      (sum: number, m: any) => sum + m.kills,
      0
    );
    const totalDeaths = matches.reduce(
      (sum: number, m: any) => sum + m.deaths,
      0
    );
    const totalAssists = matches.reduce(
      (sum: number, m: any) => sum + m.assists,
      0
    );
    const wins = matches.filter((m: any) => m.won).length;
    const totalHS = matches.reduce(
      (sum: number, m: any) => sum + (m.headshots || 0),
      0
    );
    const totalShots = matches.reduce(
      (sum: number, m: any) =>
        sum +
        (m.headshots || 0) +
        (m.bodyshots || 0) +
        (m.legshots || 0),
      0
    );
    const totalAces = matches.reduce(
      (sum: number, m: any) => sum + (m.aces || 0),
      0
    );

    return {
      ...rawStats,
      kills: totalKills,
      deaths: totalDeaths,
      assists: totalAssists,
      kdRatio: parseFloat(
        (totalKills / Math.max(totalDeaths, 1)).toFixed(2)
      ),
      winRate: Math.round((wins / matches.length) * 100),
      matchesPlayed: matches.length,
      acs: Math.round(
        matches.reduce((sum: number, m: any) => sum + m.acs, 0) /
          matches.length
      ),
      headshotPct:
        totalShots > 0
          ? parseFloat(((totalHS / totalShots) * 100).toFixed(1))
          : rawStats.headshotPct,
      aceCount: totalAces,
    };
  }, [rawStats, gameMode, selectedSeason, filteredMatches]);

  const isSearchingOther = Boolean(
    riotId &&
      myRiotId &&
      riotId.toLowerCase() !== myRiotId.toLowerCase()
  );
  const activeDevOverrides = isSearchingOther ? null : devOverrides;

  const dominantRole = useMemo(() => {
    if (
      activeDevOverrides &&
      activeDevOverrides.enabled &&
      activeDevOverrides.role !== "Auto"
    ) {
      return activeDevOverrides.role;
    }
    return detectDominantRole(filteredAgents);
  }, [filteredAgents, activeDevOverrides]);

  const effectiveStats = useMemo(() => {
    const s = filteredStats || rawStats;
    if (activeDevOverrides && activeDevOverrides.enabled) {
      const deaths = s?.deaths || 100;
      return {
        ...(s || {}),
        kdRatio: activeDevOverrides.kd,
        kills: Math.round(activeDevOverrides.kd * deaths),
        deaths,
        assists: s?.assists || 40,
        acs: activeDevOverrides.acs,
        headshotPct: activeDevOverrides.hs,
        winRate: activeDevOverrides.winRate,
        kast: activeDevOverrides.kast,
        adr: activeDevOverrides.adr,
        ddDelta: activeDevOverrides.dd,
        matchesPlayed: activeDevOverrides.matchesCount,
      };
    }
    return s;
  }, [filteredStats, rawStats, activeDevOverrides]);

  const effectiveMatches = useMemo(() => {
    if (activeDevOverrides && activeDevOverrides.enabled) {
      return Array.from({
        length: activeDevOverrides.matchesCount,
      }).map((_, i) => ({
        firstBloods: activeDevOverrides.firstBloods,
        clutches: i < activeDevOverrides.clutches ? 1 : 0,
        won:
          i <
          activeDevOverrides.matchesCount *
            (activeDevOverrides.winRate / 100),
        kills: Math.round(activeDevOverrides.kd * 15),
        deaths: 15,
        acs: activeDevOverrides.acs,
      }));
    }
    return filteredMatches;
  }, [filteredMatches, activeDevOverrides]);

  const performanceScoreResult = useMemo(() => {
    const s = effectiveStats;
    if (!s) return null;
    const playerTier =
      playerData?.rankTier ??
      playerData?.player?.rankTier ??
      (activeDevOverrides?.enabled ? 21 : 0);
    const rankName =
      playerData?.rank || playerData?.player?.rank || "Non classé";
    const accountLevel =
      playerData?.level ??
      playerData?.player?.level ??
      playerData?.player?.accountLevel ??
      1;
    return calculatePerformanceScore(
      s,
      effectiveMatches,
      dominantRole,
      playerTier,
      { rankName, accountLevel }
    );
  }, [
    effectiveStats,
    effectiveMatches,
    dominantRole,
    playerData,
    activeDevOverrides,
  ]);

  return {
    gameMode,
    setGameMode,
    selectedSeason,
    setSelectedSeason,
    visibleMatchesCount,
    setVisibleMatchesCount,
    availableSeasons,
    filteredMatches,
    filteredAgents,
    filteredStats,
    effectiveStats,
    effectiveMatches,
    performanceScoreResult,
    dominantRole,
    isSearchingOther,
    gameModeContainerRef,
    gameModeBtnRefs,
    gameModePillStyle,
  };
}
