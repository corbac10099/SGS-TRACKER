"use client";

import React, { useState, useEffect, useRef, useCallback, useLayoutEffect, useMemo } from "react";
import { tr } from "@/lib/i18n";
import { sounds } from "@/lib/soundEffects";
import { calculateSingleMatchSPI } from "@/lib/valorant/performanceScore";
import { resolveGameMode } from "@/lib/valorant/gameModes";
import PerformanceStarBadge from "./PerformanceStarBadge";
import { IconCamera, IconLightbulb } from "./icons/SpyIcons";
import KillmapView from "./KillmapView";
import AdBanner from "./AdBanner";

export interface MatchHistoryProps {
  matches: any[];
  searchPlayer: (id: string) => void;
  visibleCount: number;
  onLoadMore: () => void;
  currentPlayerRank?: string;
  currentPlayerRankUrl?: string;
  currentPlayerRankTier?: number;
  highlightedMatchId?: string | null;
  isLoading?: boolean;
}

export const SkullIcon = React.memo(({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor" className={className}>
    <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm-2 9H8V9h2v2zm6 0h-2V9h2v2zm-2.5 4h-3v-1.5h3V15z" />
  </svg>
));
SkullIcon.displayName = "SkullIcon";

export const SpikeExplodeIcon = React.memo(({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor" className={className}>
    <path d="M12 2L14.5 8.5L21 11L14.5 13.5L12 20L9.5 13.5L3 11L9.5 8.5L12 2Z" />
  </svg>
));
SpikeExplodeIcon.displayName = "SpikeExplodeIcon";

export const SpikeDefuseIcon = React.memo(({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor" className={className}>
    <path d="M12 2l2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5L12 2zm-8 18l16-16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
));
SpikeDefuseIcon.displayName = "SpikeDefuseIcon";

export const RoundBar = React.memo(function RoundBar({ round }: { round: any }) {
  const isWin = round.winner === "myTeam";
  const hasSpikeAction = round.winCondition === "SpikeExploded" || round.winCondition === "SpikeDefused";

  return (
    <div className="flex flex-col items-center gap-1.5 group relative cursor-crosshair">
      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0a0e13] border border-[var(--color-border)] px-3 py-2 rounded-lg text-xs whitespace-nowrap z-20 shadow-xl pointer-events-none flex flex-col gap-1">
        <span className="font-black uppercase tracking-widest text-[10px] text-[var(--color-text-secondary)]">Manche {round.roundNum}</span>
        <span className={`font-bold ${isWin ? "text-[#0ebf99]" : "text-[#ff4655]"}`}>
          {isWin ? "Gagné" : "Perdu"} ({round.winCondition})
        </span>
      </div>

      <span className="text-[10px] text-[var(--color-text-secondary)] font-bold tracking-widest mb-1">{round.roundNum}</span>

      {/* Main round bar avec croissance verticale animée en cascade */}
      <div
        style={{
          animationDelay: `${Math.min((round.roundNum || 1) * 30, 650)}ms`,
        }}
        className={`w-3.5 sm:w-4 h-10 sm:h-12 rounded-sm ${
          isWin ? "bg-[#0ebf99]" : "bg-[#ff4655]"
        } animate-round-grow transition-transform group-hover:-translate-y-1 shadow-sm`}
      />

      {/* Events below the bar */}
      <div className="flex flex-col items-center gap-1.5 mt-1 h-14">
        {hasSpikeAction && (
          <div className="text-[var(--color-text-secondary)] flex justify-center mb-0.5">
            {round.winCondition === "SpikeExploded" ? <SpikeExplodeIcon /> : <SpikeDefuseIcon />}
          </div>
        )}
        {round.myKillsInRound > 0 && (
          <div className="flex items-center gap-0.5 text-[#0ebf99] font-black text-[9px]">
            {round.myKillsInRound} <SkullIcon />
          </div>
        )}
        {round.diedInRound && (
          <div className="flex items-center gap-0.5 text-[#ff4655] font-black text-[9px]">
            1 <SkullIcon />
          </div>
        )}
      </div>
    </div>
  );
});

export const TIER_NAMES: Record<number, string> = {
  0: "Non classé",
  3: "Fer 1", 4: "Fer 2", 5: "Fer 3",
  6: "Bronze 1", 7: "Bronze 2", 8: "Bronze 3",
  9: "Argent 1", 10: "Argent 2", 11: "Argent 3",
  12: "Or 1", 13: "Or 2", 14: "Or 3",
  15: "Platine 1", 16: "Platine 2", 17: "Platine 3",
  18: "Diamant 1", 19: "Diamant 2", 20: "Diamant 3",
  21: "Ascendant 1", 22: "Ascendant 2", 23: "Ascendant 3",
  24: "Immortel 1", 25: "Immortel 2", 26: "Immortel 3",
  27: "Radiant",
};

export const UNRANKED_ICON =
  "https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/0/largeicon.png";

export function getPlayerRank(
  player: any,
  defaultRank?: { name?: string; icon?: string; tier?: number }
): { name: string; icon: string } {
  // 1. Si le joueur est explicitement non classé ou tier 0
  if (
    player?.rank === "Non classé" ||
    player?.rankTier === 0 ||
    player?.competitiveTier === 0
  ) {
    return {
      name: "Non classé",
      icon: player?.rankUrl || UNRANKED_ICON,
    };
  }

  // 2. Si le joueur a déjà un rang explicite et une icône valide
  if (player?.rank && player?.rankUrl) {
    return { name: player.rank, icon: player.rankUrl };
  }
  if (player?.rankUrl) {
    return { name: player.rank || "Non classé", icon: player.rankUrl };
  }

  // 3. Si le joueur a un rankTier numérique valide (> 0)
  if (
    typeof player?.rankTier === "number" &&
    player.rankTier > 0 &&
    TIER_NAMES[player.rankTier]
  ) {
    const tier = player.rankTier;
    return {
      name: player.rank || TIER_NAMES[tier],
      icon: `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${tier}/largeicon.png`,
    };
  }

  if (
    typeof player?.competitiveTier === "number" &&
    player.competitiveTier > 0 &&
    TIER_NAMES[player.competitiveTier]
  ) {
    const tier = player.competitiveTier;
    return {
      name: player.rank || TIER_NAMES[tier],
      icon: `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${tier}/largeicon.png`,
    };
  }

  // 4. Vérifier si le joueur se trouve dans myTeam
  if (player?.myTeam && Array.isArray(player.myTeam)) {
    const me = player.myTeam.find((p: any) => p.isMe);
    if (me?.rank && me?.rankUrl) {
      return { name: me.rank, icon: me.rankUrl };
    }
  }

  // 5. Si un defaultRank valide est fourni
  if (defaultRank?.icon) {
    return { name: defaultRank.name || "Non classé", icon: defaultRank.icon };
  }
  if (
    typeof defaultRank?.tier === "number" &&
    defaultRank.tier > 0 &&
    TIER_NAMES[defaultRank.tier]
  ) {
    return {
      name: defaultRank.name || TIER_NAMES[defaultRank.tier],
      icon: `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${defaultRank.tier}/largeicon.png`,
    };
  }

  // 6. Fin de chaîne : renvoyer "Non classé" avec l'icône unranked officielle
  return {
    name: player?.rank || "Non classé",
    icon: UNRANKED_ICON,
  };
}

export const PlayerRow = React.memo(function PlayerRow({
  player,
  isWinnerTeam,
  mySpi,
}: {
  player: any;
  isWinnerTeam?: boolean;
  mySpi?: any;
}) {
  const spi =
    player.isMe && mySpi
      ? mySpi
      : calculateSingleMatchSPI(
          {
            ...player,
            won: player.won !== undefined ? player.won : isWinnerTeam ?? false,
          },
          player.role
        );
  const pRank = getPlayerRank(player);

  return (
    <div
      className={`flex items-center gap-3 p-2 rounded-xl transition-all ${
        player.isMe
          ? "bg-[rgba(255,255,255,0.07)] border border-[var(--color-val-red)]/30 shadow-inner"
          : "glass-pill border border-transparent hover:border-[var(--color-border)]"
      }`}
    >
      <img
        referrerPolicy="no-referrer"
        src={player.agentIcon || "https://media.valorant-api.com/agents/773f0c78-4486-752b-68ef-4585d7f4b848/displayicon.png"}
        onError={(e) => {
          e.currentTarget.src = "https://media.valorant-api.com/agents/773f0c78-4486-752b-68ef-4585d7f4b848/displayicon.png";
        }}
        className="w-10 h-10 rounded-lg shadow-sm object-cover"
        alt={player.agent || "Agent"}
        loading="lazy"
      />
      {/* Rang du joueur */}
      {pRank.icon && pRank.name !== "Non classé" ? (
        <img
          referrerPolicy="no-referrer"
          src={pRank.icon}
          alt={pRank.name}
          title={pRank.name}
          className="w-7 h-7 object-contain flex-shrink-0 drop-shadow-sm cursor-help"
          loading="lazy"
        />
      ) : null}
      <div className="flex-1 min-w-0">
        <div
          className={`font-bold text-sm truncate ${
            player.isMe ? "text-[var(--color-val-red)] drop-shadow-[0_0_5px_rgba(255,70,85,0.3)]" : "text-[var(--color-text-on-surface)]"
          }`}
        >
          {player.isMe ? tr("Vous") : player.name}
        </div>
        <div className="text-[9px] text-[var(--color-text-secondary)] uppercase tracking-widest">{player.agent}</div>
      </div>
      <div className="flex items-center gap-3 text-xs font-bold px-2">
        {/* SPI Star with Letter (no contour, hover displays score) */}
        <div
          className="flex items-center justify-center cursor-help transition-transform hover:scale-110 flex-shrink-0"
          title={`Score SPI : ${spi.score} pts (Grade ${spi.grade})`}
        >
          <PerformanceStarBadge
            grade={spi.grade}
            score={spi.score}
            gradeColor={spi.gradeColor}
            gradeBg={spi.gradeBg}
            gradeBorder={spi.gradeBorder}
            gradeGlow={spi.gradeGlow}
            size="xs"
            layout="icon-only"
          />
        </div>

        <span className="w-8 text-right text-[var(--color-text-on-surface)] font-black" title="Score de combat">
          {player.acs}
        </span>
        <span className="w-[72px] text-right">
          <span className="text-emerald-400">{player.kills}</span>
          <span className="text-[var(--color-text-secondary)] font-normal mx-0.5">/</span>
          <span className="text-[var(--color-val-red)]">{player.deaths}</span>
          <span className="text-[var(--color-text-secondary)] font-normal mx-0.5">/</span>
          <span className="text-gray-300">{player.assists}</span>
        </span>
      </div>
    </div>
  );
});

function getCubicBezierPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const tension = 0.22;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export type EcoViewMode = "me" | "myTeam" | "enemyTeam" | "all";

export const MatchEconomyChart = React.memo(function MatchEconomyChart({ match }: { match: any }) {
  const [ecoView, setEcoView] = useState<EcoViewMode>("all");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Pilule animée glissante pour les onglets
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });

  const updatePill = useCallback(() => {
    if (!containerRef.current) return;
    const btn = btnRefs.current[ecoView];
    const container = containerRef.current;
    if (!btn || !container) {
      setPillStyle((prev) => ({ ...prev, opacity: 0 }));
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    if (btnRect.width > 0) {
      setPillStyle({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
        opacity: 1,
      });
    }
  }, [ecoView]);

  useLayoutEffect(() => {
    updatePill();
    const t = setTimeout(updatePill, 40);
    return () => clearTimeout(t);
  }, [ecoView, updatePill]);

  const roundsCount = Math.max(match.roundsPlayed || (match.roundEconomy?.length ?? 20), 1);
  const myTeamPlayers = match.myTeam || [];
  const enemyTeamPlayers = match.enemyTeam || [];

  const dataPoints = useMemo(() => {
    if (Array.isArray(match.roundEconomy) && match.roundEconomy.length > 0) {
      return match.roundEconomy;
    }
    return Array.from({ length: Math.min(roundsCount, 26) }).map((_, rIdx) => {
      const rNum = rIdx + 1;
      const isPistol = rNum === 1 || rNum === 13;
      const isEco = rNum === 2 || rNum === 14;
      return {
        roundNum: rNum,
        mySpend: isPistol ? 800 : isEco ? 1900 : Math.min(5000, 3100 + ((rIdx * 37) % 1800)),
        myTeamAvgSpend: isPistol ? 800 : isEco ? 2100 : Math.min(5000, 3300 + ((rIdx * 41) % 1600)),
        enemyTeamAvgSpend: isPistol ? 800 : isEco ? 2000 : Math.min(5000, 3200 + ((rIdx * 29) % 1700)),
      };
    });
  }, [match.roundEconomy, roundsCount]);

  const myAvgSpend = useMemo(() => {
    if (dataPoints.length === 0) return 3600;
    return Math.round(dataPoints.reduce((acc: number, d: any) => acc + d.mySpend, 0) / dataPoints.length);
  }, [dataPoints]);

  const myTeamAvgSpend = useMemo(() => {
    if (dataPoints.length === 0) return 3800;
    return Math.round(dataPoints.reduce((acc: number, d: any) => acc + d.myTeamAvgSpend, 0) / dataPoints.length);
  }, [dataPoints]);

  const enemyTeamAvgSpend = useMemo(() => {
    if (dataPoints.length === 0) return 3700;
    return Math.round(dataPoints.reduce((acc: number, d: any) => acc + d.enemyTeamAvgSpend, 0) / dataPoints.length);
  }, [dataPoints]);

  // Dimensions SVG calquées sur PerformanceCharts
  const svgWidth = 900;
  const svgHeight = 240;
  const padding = { top: 30, right: 35, bottom: 40, left: 60 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;
  const maxSpend = 5000;
  const thresholdVal = 3900; // Seuil Full Buy (Vandal / Phantom + Armure Lourde)
  const thresholdY = padding.top + graphHeight - (thresholdVal / maxSpend) * graphHeight;

  const pointsMe = useMemo(() => {
    return dataPoints.map((d: any, i: number) => {
      const x = padding.left + (i / Math.max(1, dataPoints.length - 1)) * graphWidth;
      const y = padding.top + graphHeight - (Math.min(d.mySpend, maxSpend) / maxSpend) * graphHeight;
      return { x, y, val: d.mySpend, round: d.roundNum };
    });
  }, [dataPoints, graphWidth, graphHeight, padding.left, padding.top]);

  const pointsMyTeam = useMemo(() => {
    return dataPoints.map((d: any, i: number) => {
      const x = padding.left + (i / Math.max(1, dataPoints.length - 1)) * graphWidth;
      const y = padding.top + graphHeight - (Math.min(d.myTeamAvgSpend, maxSpend) / maxSpend) * graphHeight;
      return { x, y, val: d.myTeamAvgSpend, round: d.roundNum };
    });
  }, [dataPoints, graphWidth, graphHeight, padding.left, padding.top]);

  const pointsEnemyTeam = useMemo(() => {
    return dataPoints.map((d: any, i: number) => {
      const x = padding.left + (i / Math.max(1, dataPoints.length - 1)) * graphWidth;
      const y = padding.top + graphHeight - (Math.min(d.enemyTeamAvgSpend, maxSpend) / maxSpend) * graphHeight;
      return { x, y, val: d.enemyTeamAvgSpend, round: d.roundNum };
    });
  }, [dataPoints, graphWidth, graphHeight, padding.left, padding.top]);

  const pathMe = useMemo(() => getCubicBezierPath(pointsMe), [pointsMe]);
  const pathMyTeam = useMemo(() => getCubicBezierPath(pointsMyTeam), [pointsMyTeam]);
  const pathEnemyTeam = useMemo(() => getCubicBezierPath(pointsEnemyTeam), [pointsEnemyTeam]);

  const areaMe = useMemo(() => {
    if (pointsMe.length === 0) return "";
    return `${pathMe} L ${pointsMe[pointsMe.length - 1].x.toFixed(1)} ${(padding.top + graphHeight).toFixed(1)} L ${pointsMe[0].x.toFixed(1)} ${(padding.top + graphHeight).toFixed(1)} Z`;
  }, [pathMe, pointsMe, graphHeight, padding.top]);

  const areaMyTeam = useMemo(() => {
    if (pointsMyTeam.length === 0) return "";
    return `${pathMyTeam} L ${pointsMyTeam[pointsMyTeam.length - 1].x.toFixed(1)} ${(padding.top + graphHeight).toFixed(1)} L ${pointsMyTeam[0].x.toFixed(1)} ${(padding.top + graphHeight).toFixed(1)} Z`;
  }, [pathMyTeam, pointsMyTeam, graphHeight, padding.top]);

  const areaEnemyTeam = useMemo(() => {
    if (pointsEnemyTeam.length === 0) return "";
    return `${pathEnemyTeam} L ${pointsEnemyTeam[pointsEnemyTeam.length - 1].x.toFixed(1)} ${(padding.top + graphHeight).toFixed(1)} L ${pointsEnemyTeam[0].x.toFixed(1)} ${(padding.top + graphHeight).toFixed(1)} Z`;
  }, [pathEnemyTeam, pointsEnemyTeam, graphHeight, padding.top]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const mouseX = ((e.clientX - rect.left) / rect.width) * svgWidth;
    let closest = 0;
    let minDist = Infinity;
    pointsMe.forEach((p: any, idx: number) => {
      const dist = Math.abs(p.x - mouseX);
      if (dist < minDist) {
        minDist = dist;
        closest = idx;
      }
    });
    setHoveredIdx(closest);
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
  };

  const activeData = hoveredIdx !== null ? dataPoints[hoveredIdx] : null;
  const activePtMe = hoveredIdx !== null ? pointsMe[hoveredIdx] : null;
  const activePtAlly = hoveredIdx !== null ? pointsMyTeam[hoveredIdx] : null;
  const activePtEnemy = hoveredIdx !== null ? pointsEnemyTeam[hoveredIdx] : null;

  const ECO_MODES: { id: EcoViewMode; label: string; color: string }[] = [
    { id: "me", label: "Moi", color: "#10b981" },
    { id: "myTeam", label: "Mon Équipe", color: "#06b6d4" },
    { id: "enemyTeam", label: "Équipe Adverse", color: "#ff4655" },
    { id: "all", label: "Tous", color: "#f59e0b" },
  ];

  const chartId = `eco-chart-${match.matchId || "current"}`;

  return (
    <div className="space-y-4 py-2">
      {/* 4 Cartes KPI Synthétiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl glass-card text-center border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/60 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-[10px] text-[var(--color-text-secondary)] uppercase font-extrabold tracking-wider">
            Votre Dépense Moy.
          </span>
          <div className="text-xl font-black text-emerald-400 mt-1 flex items-center justify-center gap-1">
            <span>{myAvgSpend.toLocaleString("fr-FR")}</span>
            <span className="text-xs text-emerald-500/80">¤</span>
          </div>
        </div>
        <div className="p-3.5 rounded-2xl glass-card text-center border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500/0 via-cyan-500/60 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-[10px] text-[var(--color-text-secondary)] uppercase font-extrabold tracking-wider">
            Moy. Équipe Alliée
          </span>
          <div className="text-xl font-black text-cyan-400 mt-1 flex items-center justify-center gap-1">
            <span>{myTeamAvgSpend.toLocaleString("fr-FR")}</span>
            <span className="text-xs text-cyan-500/80">¤</span>
          </div>
        </div>
        <div className="p-3.5 rounded-2xl glass-card text-center border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500/0 via-red-500/60 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-[10px] text-[var(--color-text-secondary)] uppercase font-extrabold tracking-wider">
            Moy. Équipe Adverse
          </span>
          <div className="text-xl font-black text-red-400 mt-1 flex items-center justify-center gap-1">
            <span>{enemyTeamAvgSpend.toLocaleString("fr-FR")}</span>
            <span className="text-xs text-red-500/80">¤</span>
          </div>
        </div>
        <div className="p-3.5 rounded-2xl glass-card text-center border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/0 via-amber-500/60 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-[10px] text-[var(--color-text-secondary)] uppercase font-extrabold tracking-wider">
            Note Économique
          </span>
          <div className="text-xl font-black text-white mt-1 flex items-center justify-center gap-1">
            <span>{match.econRating || 82}</span>
            <span className="text-xs text-[var(--color-text-secondary)]">/100</span>
          </div>
        </div>
      </div>

      {/* Le Grand Graphique Interactif Unique (Style PerformanceCharts) */}
      <div className="glass-panel p-3.5 sm:p-5 rounded-2xl border border-white/10 shadow-xl flex flex-col justify-between relative overflow-hidden">
        {/* Header du graphique avec sélecteur d'onglets et légende */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
              Évolution Budgétaire par Manche
            </span>
          </div>

          {/* Switcher en haut : Moi | Mon Équipe | Équipe Adverse | Tous */}
          <div
            ref={containerRef}
            className="relative flex items-center gap-1 bg-[var(--color-surface)] p-1 rounded-xl border border-[var(--color-border)] shadow-inner"
          >
            {/* Pilule animée glissante */}
            <div
              className="absolute top-1 bottom-1 rounded-lg pointer-events-none z-0 transition-all"
              style={{
                transform: `translateX(${pillStyle.left}px)`,
                width: `${pillStyle.width}px`,
                opacity: pillStyle.opacity,
                backgroundColor:
                  ecoView === "me"
                    ? "#10b981"
                    : ecoView === "myTeam"
                    ? "#06b6d4"
                    : ecoView === "enemyTeam"
                    ? "#ff4655"
                    : "#f59e0b",
                boxShadow:
                  ecoView === "me"
                    ? "0 0 14px rgba(16,185,129,0.5)"
                    : ecoView === "myTeam"
                    ? "0 0 14px rgba(6,182,212,0.5)"
                    : ecoView === "enemyTeam"
                    ? "0 0 14px rgba(255,70,85,0.5)"
                    : "0 0 14px rgba(245,158,11,0.5)",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />

            {ECO_MODES.map((mode) => {
              const isSelected = ecoView === mode.id;
              return (
                <button
                  key={mode.id}
                  ref={(el) => {
                    btnRefs.current[mode.id] = el;
                  }}
                  onClick={() => {
                    sounds.playTabSwitch();
                    setEcoView(mode.id);
                  }}
                  className={`relative z-10 px-3 py-1 text-[11px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer select-none ${
                    isSelected ? "text-white" : "text-[var(--color-text-secondary)] hover:text-white"
                  }`}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Légende interactive en mode "Tous" */}
        {ecoView === "all" && (
          <div className="flex items-center gap-4 text-[10px] font-bold text-[var(--color-text-secondary)] mb-2 px-1">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span>Moi</span>
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              <span>Mon Équipe</span>
            </span>
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(255,70,85,0.8)]" />
              <span>Équipe Adverse</span>
            </span>
            <span className="flex items-center gap-1.5 text-amber-300 ml-auto hidden sm:flex">
              <span className="w-4 h-0.5 border-t border-dashed border-amber-300/80" />
              <span>Seuil Full Buy (3 900 ¤)</span>
            </span>
          </div>
        )}

        {/* Grand Conteneur SVG avec Tooltip et Courbes Bézier */}
        <div className="w-full relative select-none">
          {/* Tooltip flottant interactif */}
          {activeData && (
            <div
              className="absolute pointer-events-none z-30 transition-all duration-75 px-3 py-2 rounded-xl glass-card border border-white/20 shadow-2xl flex flex-col gap-1 text-xs"
              style={{
                left: `${Math.min(Math.max(activePtMe ? (activePtMe.x / svgWidth) * 100 : 50, 15), 85)}%`,
                top: "10px",
                transform: "translateX(-50%)",
              }}
            >
              <div className="flex items-center justify-between gap-4 font-black text-[11px] pb-1 border-b border-white/10">
                <span className="text-white">Manche {activeData.roundNum}</span>
                <span className="text-[10px] text-amber-300 uppercase tracking-widest">
                  {activeData.roundNum === 1 || activeData.roundNum === 13 ? "Pistol Round" : activeData.mySpend >= 3900 ? "Full Buy" : activeData.mySpend <= 2000 ? "Éco" : "Demi-achat"}
                </span>
              </div>
              {ecoView === "me" && (
                <div className="flex items-center justify-between gap-3 text-emerald-400 font-bold">
                  <span>Votre Dépense :</span>
                  <span className="font-mono font-black">{activeData.mySpend.toLocaleString("fr-FR")} ¤</span>
                </div>
              )}
              {ecoView === "myTeam" && (
                <div className="flex items-center justify-between gap-3 text-cyan-400 font-bold">
                  <span>Moyenne Alliée :</span>
                  <span className="font-mono font-black">{activeData.myTeamAvgSpend.toLocaleString("fr-FR")} ¤</span>
                </div>
              )}
              {ecoView === "enemyTeam" && (
                <div className="flex items-center justify-between gap-3 text-red-400 font-bold">
                  <span>Moyenne Adverse :</span>
                  <span className="font-mono font-black">{activeData.enemyTeamAvgSpend.toLocaleString("fr-FR")} ¤</span>
                </div>
              )}
              {ecoView === "all" && (
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-4 text-emerald-400 font-bold">
                    <span>Moi :</span>
                    <span className="font-mono font-black">{activeData.mySpend.toLocaleString("fr-FR")} ¤</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-cyan-400 font-bold">
                    <span>Mon Équipe :</span>
                    <span className="font-mono font-black">{activeData.myTeamAvgSpend.toLocaleString("fr-FR")} ¤</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-red-400 font-bold">
                    <span>Adversaires :</span>
                    <span className="font-mono font-black">{activeData.enemyTeamAvgSpend.toLocaleString("fr-FR")} ¤</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <svg
            ref={svgRef}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-52 sm:h-64 overflow-visible cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              {/* Gradients pour chaque courbe */}
              <linearGradient id={`ecoGradMe-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                <stop offset="85%" stopColor="#10b981" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>

              <linearGradient id={`ecoGradAlly-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                <stop offset="85%" stopColor="#06b6d4" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>

              <linearGradient id={`ecoGradEnemy-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff4655" stopOpacity="0.38" />
                <stop offset="85%" stopColor="#ff4655" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#ff4655" stopOpacity="0.0" />
              </linearGradient>

              {/* Glow filter */}
              <filter id={`ecoGlow-${chartId}`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Grille horizontale */}
            {[1000, 2000, 3000, 4000, 5000].map((val) => {
              const y = padding.top + graphHeight - (val / maxSpend) * graphHeight;
              return (
                <g key={val}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={svgWidth - padding.right}
                    y2={y}
                    stroke="rgba(255,255,255,0.06)"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    fill="rgba(255,255,255,0.3)"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {val.toLocaleString("fr-FR")} ¤
                  </text>
                </g>
              );
            })}

            {/* Ligne seuil Full Buy (3 900 ¤) */}
            <line
              x1={padding.left}
              y1={thresholdY}
              x2={svgWidth - padding.right}
              y2={thresholdY}
              stroke="#f59e0b"
              strokeWidth="1.2"
              strokeDasharray="5 3"
              opacity="0.65"
            />
            <text
              x={svgWidth - padding.right - 6}
              y={thresholdY - 5}
              textAnchor="end"
              fill="#f59e0b"
              fontSize="9"
              fontWeight="bold"
              opacity="0.8"
            >
              Full Buy (3 900 ¤)
            </text>

            {/* Ligne de base (0 ¤) */}
            <line
              x1={padding.left}
              y1={padding.top + graphHeight}
              x2={svgWidth - padding.right}
              y2={padding.top + graphHeight}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1"
            />

            {/* Courbes et Aires selon le mode sélectionné */}

            {/* MODE: ME */}
            {(ecoView === "me" || ecoView === "all") && (
              <>
                <path
                  d={areaMe}
                  fill={`url(#ecoGradMe-${chartId})`}
                  opacity={ecoView === "all" ? 0.18 : 1}
                />
                <path
                  d={pathMe}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth={ecoView === "me" ? "3" : "2.5"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter={`url(#ecoGlow-${chartId})`}
                />
                {pointsMe.map((pt: any, idx: number) => (
                  <circle
                    key={`me-${idx}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredIdx === idx ? 6 : 3}
                    fill={hoveredIdx === idx ? "#10b981" : "#0a0e13"}
                    stroke="#10b981"
                    strokeWidth={hoveredIdx === idx ? "2.5" : "1.8"}
                    className="transition-all duration-150"
                  />
                ))}
              </>
            )}

            {/* MODE: MY TEAM */}
            {(ecoView === "myTeam" || ecoView === "all") && (
              <>
                <path
                  d={areaMyTeam}
                  fill={`url(#ecoGradAlly-${chartId})`}
                  opacity={ecoView === "all" ? 0.15 : 1}
                />
                <path
                  d={pathMyTeam}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth={ecoView === "myTeam" ? "3" : "2.4"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter={`url(#ecoGlow-${chartId})`}
                />
                {pointsMyTeam.map((pt: any, idx: number) => (
                  <circle
                    key={`ally-${idx}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredIdx === idx ? 6 : 3}
                    fill={hoveredIdx === idx ? "#06b6d4" : "#0a0e13"}
                    stroke="#06b6d4"
                    strokeWidth={hoveredIdx === idx ? "2.5" : "1.8"}
                    className="transition-all duration-150"
                  />
                ))}
              </>
            )}

            {/* MODE: ENEMY TEAM */}
            {(ecoView === "enemyTeam" || ecoView === "all") && (
              <>
                <path
                  d={areaEnemyTeam}
                  fill={`url(#ecoGradEnemy-${chartId})`}
                  opacity={ecoView === "all" ? 0.15 : 1}
                />
                <path
                  d={pathEnemyTeam}
                  fill="none"
                  stroke="#ff4655"
                  strokeWidth={ecoView === "enemyTeam" ? "3" : "2.4"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter={`url(#ecoGlow-${chartId})`}
                />
                {pointsEnemyTeam.map((pt: any, idx: number) => (
                  <circle
                    key={`enemy-${idx}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredIdx === idx ? 6 : 3}
                    fill={hoveredIdx === idx ? "#ff4655" : "#0a0e13"}
                    stroke="#ff4655"
                    strokeWidth={hoveredIdx === idx ? "2.5" : "1.8"}
                    className="transition-all duration-150"
                  />
                ))}
              </>
            )}

            {/* Ligne verticale de mire (crosshair) au survol */}
            {hoveredIdx !== null && activePtMe && (
              <line
                x1={activePtMe.x}
                y1={padding.top}
                x2={activePtMe.x}
                y2={padding.top + graphHeight}
                stroke="rgba(255,255,255,0.3)"
                strokeDasharray="3 3"
                strokeWidth="1.2"
              />
            )}

            {/* Axe X (Numéros de manche) */}
            {dataPoints.map((d: any, idx: number) => {
              const x = padding.left + (idx / Math.max(1, dataPoints.length - 1)) * graphWidth;
              const isPistol = d.roundNum === 1 || d.roundNum === 13;
              return (
                <text
                  key={`lbl-${idx}`}
                  x={x}
                  y={padding.top + graphHeight + 18}
                  textAnchor="middle"
                  fill={isPistol ? "#f59e0b" : hoveredIdx === idx ? "#ffffff" : "rgba(255,255,255,0.4)"}
                  fontSize="10"
                  fontWeight={isPistol || hoveredIdx === idx ? "bold" : "normal"}
                >
                  {d.roundNum}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Labels repères de bas de graphique */}
        <div className="flex justify-between text-[10px] text-[var(--color-text-secondary)] font-bold mt-2 px-3">
          <span className="flex items-center gap-1">
            <span className="text-amber-400 font-extrabold">M 1</span>
            <span>(Pistolet)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="text-amber-400 font-extrabold">M {Math.min(13, Math.round(roundsCount / 2))}</span>
            <span>(Changement de côté)</span>
          </span>
          <span>Manche Finale ({roundsCount})</span>
        </div>
      </div>

      {/* Conseil d'Analyse Économique Contextuelle */}
      <div className="glass-card p-4 rounded-2xl text-xs text-[var(--color-text-secondary)] flex items-center gap-3 border border-white/5">
        <IconLightbulb size={18} className="text-amber-300 flex-shrink-0" />
        <div>
          <strong className="text-white">Analyse Tactique du Trésorier :</strong>{" "}
          {myTeamAvgSpend >= enemyTeamAvgSpend ? (
            <span>
              Votre équipe a dominé les cycles d&apos;achats avec un investissement moyen supérieur de{" "}
              <strong className="text-emerald-400">
                +{(myTeamAvgSpend - enemyTeamAvgSpend).toLocaleString("fr-FR")} ¤
              </strong>{" "}
              par manche, assurant une supériorité d&apos;armement constante.
            </span>
          ) : (
            <span>
              L&apos;équipe adverse a maintenu une pression économique supérieure de{" "}
              <strong className="text-red-400">
                +{(enemyTeamAvgSpend - myTeamAvgSpend).toLocaleString("fr-FR")} ¤
              </strong>{" "}
              par manche. Optimisez les manches d&apos;éco pour forcer des resets adverses.
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

const MATCH_TABS = [
  { id: "overview", label: "Preview" },
  { id: "scoreboard", label: "Leaderboard" },
  { id: "timeline", label: "Timeline" },
  { id: "duels", label: "Duels 1v1" },
  { id: "economy", label: "Économie" },
  { id: "killmap", label: "Killmap 2D" },
];

export const ExpandedMatch = React.memo(function ExpandedMatch({
  match,
  searchPlayer,
  spi,
}: {
  match: any;
  searchPlayer: (id: string) => void;
  spi?: any;
}) {
  const modeInfo = resolveGameMode(match.mode);
  const [tab, setTab] = useState<"overview" | "scoreboard" | "timeline" | "duels" | "economy" | "killmap">("overview");
  const [isExporting, setIsExporting] = useState(false);

  // Sliding Red Underline State
  const matchTabsContainerRef = useRef<HTMLDivElement>(null);
  const matchTabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [matchUnderlineStyle, setMatchUnderlineStyle] = useState({ left: 0, width: 0, opacity: 0 });

  const updateMatchUnderline = useCallback(() => {
    if (!matchTabsContainerRef.current) return;
    const btn = matchTabRefs.current[tab];
    const container = matchTabsContainerRef.current;
    if (!btn || !container) {
      setMatchUnderlineStyle((prev) => ({ ...prev, opacity: 0 }));
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    if (btnRect.width > 0) {
      setMatchUnderlineStyle({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
        opacity: 1,
      });
    }
  }, [tab]);

  useLayoutEffect(() => {
    updateMatchUnderline();
    const t1 = setTimeout(updateMatchUnderline, 30);
    const t2 = setTimeout(updateMatchUnderline, 100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [tab, updateMatchUnderline]);

  // Function to export Match Card as high quality PNG
  const exportMatchCard = () => {
    setIsExporting(true);
    sounds.playClick();

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      // Dark background with gradient
      const bgGrad = ctx.createRadialGradient(200, 150, 50, 600, 315, 700);
      bgGrad.addColorStop(0, match.won ? "#062b20" : "#2d080c");
      bgGrad.addColorStop(1, "#0a0e13");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1200, 630);

      // Accent Border
      ctx.strokeStyle = match.won ? "rgba(14, 191, 153, 0.4)" : "rgba(255, 70, 85, 0.4)";
      ctx.lineWidth = 4;
      ctx.strokeRect(16, 16, 1168, 598);

      // Top Logo
      ctx.fillStyle = "#ff4655";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText("SGS // VALORANT PERFORMANCE TRACKER", 50, 65);

      // Map & Date
      ctx.fillStyle = "#8b97a3";
      ctx.font = "bold 18px sans-serif";
      const dateStr = new Date(match.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
      ctx.fillText(`${match.map.toUpperCase()} • ${modeInfo.displayName.toUpperCase()} • ${dateStr}`, 50, 100);

      // Match Result
      ctx.fillStyle = match.won ? "#0ebf99" : "#ff4655";
      ctx.font = "900 64px sans-serif";
      ctx.fillText(modeInfo.id === "deathmatch" ? (match.won ? "TOP 1" : "CLASSEMENT") : (match.won ? "VICTOIRE" : "DÉFAITE"), 50, 180);

      // Score
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 52px sans-serif";
      ctx.fillText(match.score || "13 - 10", 420, 180);

      // Stats Blocks
      const statBlocks = [
        { label: "AGENT", val: match.agent },
        { label: "K / D / A", val: `${match.kills} / ${match.deaths} / ${match.assists}` },
        { label: "RATIO K/D", val: (match.deaths > 0 ? (match.kills / match.deaths).toFixed(2) : match.kills) },
        { label: "SCORE COMBAT (ACS)", val: String(match.acs) },
        { label: "TIRS TÊTE (HS)", val: `${match.headshotPct || 25}%` },
      ];

      statBlocks.forEach((b, idx) => {
        const x = 50 + idx * 220;
        const y = 240;
        ctx.fillStyle = "rgba(15, 25, 35, 0.8)";
        ctx.fillRect(x, y, 200, 100);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, 200, 100);

        ctx.fillStyle = "#8b97a3";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText(b.label, x + 15, y + 35);

        ctx.fillStyle = "#ffffff";
        ctx.font = "900 26px sans-serif";
        ctx.fillText(String(b.val), x + 15, y + 75);
      });

      // Scoreboard Summary text
      ctx.fillStyle = "#8b97a3";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText("Top Joueurs du Match :", 50, 390);

      const allPlayers = [...(match.myTeam || []), ...(match.enemyTeam || [])].sort((a, b) => b.acs - a.acs).slice(0, 5);
      allPlayers.forEach((p, idx) => {
        const y = 425 + idx * 36;
        ctx.fillStyle = p.isMe ? "rgba(255, 70, 85, 0.15)" : "rgba(255, 255, 255, 0.03)";
        ctx.fillRect(50, y - 22, 1100, 30);

        ctx.fillStyle = p.isMe ? "#ff4655" : "#ffffff";
        ctx.font = "bold 16px sans-serif";
        ctx.fillText(`${idx + 1}. ${p.name || (p.isMe ? "Vous" : "Joueur")} (${p.agent})`, 65, y);

        ctx.fillStyle = "#8b97a3";
        ctx.fillText(`ACS : ${p.acs}`, 500, y);
        ctx.fillText(`K/D/A : ${p.kills}/${p.deaths}/${p.assists}`, 750, y);
      });

      // Download
      const link = document.createElement("a");
      link.download = `sgs_match_${match.map}_${match.won ? "win" : "loss"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Export match card error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-6 mt-1 border border-[var(--color-border)] animate-in fade-in slide-in-from-top-4 duration-300 shadow-[0_15px_40px_rgba(0,0,0,0.5)] z-10 relative">
      {/* Top Bar with Tabs and Export PNG Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--color-border)] mb-6 pb-2">
        <div ref={matchTabsContainerRef} className="relative flex flex-wrap gap-4 sm:gap-6 overflow-x-auto custom-scrollbar">
          {/* Sliding Red Underline Indicator */}
          <div
            className="absolute bottom-0 h-[2.5px] rounded-full bg-[var(--color-val-red)] shadow-accent-md pointer-events-none z-10"
            style={{
              transform: `translateX(${matchUnderlineStyle.left}px)`,
              width: `${matchUnderlineStyle.width}px`,
              opacity: matchUnderlineStyle.opacity,
              transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />

          {MATCH_TABS.map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                ref={(el) => {
                  matchTabRefs.current[t.id] = el;
                }}
                onMouseEnter={() => sounds.playHover()}
                onClick={() => {
                  sounds.playTabSwitch();
                  setTab(t.id as any);
                }}
                className={`pb-2 text-[10px] sm:text-xs uppercase tracking-widest font-black transition-colors duration-300 relative cursor-pointer select-none active:scale-95 whitespace-nowrap ${
                  isActive
                    ? "text-[var(--color-val-red)] drop-shadow-[0_0_8px_var(--accent-glow-md)]"
                    : "text-[var(--color-text-secondary)] hover:text-white"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={exportMatchCard}
          disabled={isExporting}
          className="px-3 py-1.5 rounded-xl bg-[var(--color-surface)] hover:bg-[var(--color-val-red)] border border-[var(--color-border)] hover:border-[var(--color-val-red)] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm flex-shrink-0"
        >
          <IconCamera size={14} />
          <span>{isExporting ? "Génération..." : "Exporter Carte (PNG)"}</span>
        </button>
      </div>

      {/* Overview */}
      {tab === "overview" && (
        !modeInfo.hasTeams ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                Classement Général ({[...(match.myTeam || []), ...(match.enemyTeam || [])].length} Joueurs)
              </span>
              <span className="text-[10px] text-amber-200/70 font-bold uppercase tracking-wider">
                Mode Free-For-All
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[...(match.myTeam || []), ...(match.enemyTeam || [])]
                .sort((a, b) => b.kills - a.kills || b.acs - a.acs)
                .map((p: any, pIdx: number) => (
                  <PlayerRow key={p.puuid} player={p} isWinnerTeam={pIdx === 0} mySpi={spi} />
                ))}
            </div>
          </div>
        ) : (match.teamFormat === "duos" || (match.allTeams && match.allTeams.length > 2)) ? (
          /* Multi-équipes / Mode Duos (Gauntlet : 8 duos) */
          <div className="space-y-4">
            <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-xl">
              <span className="text-[11px] font-black uppercase tracking-wider text-[var(--color-text-primary)]">
                Classement par Équipe ({match.allTeams?.length || 8} Duos)
              </span>
              <span className="text-[10px] text-[var(--color-val-red)] font-black uppercase tracking-wider">
                Format {modeInfo.displayName || "Duos"}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {match.allTeams?.map((team: any, tIdx: number) => {
                const isTop1 = (team.rank || tIdx + 1) === 1;
                const isMy = team.isMyTeam || team.players?.some((p: any) => p.isMe);
                return (
                  <div
                    key={team.teamId || tIdx}
                    className={`rounded-2xl p-3 border transition-all ${
                      isMy
                        ? "bg-cyan-500/5 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                        : isTop1
                        ? "bg-emerald-500/5 border-emerald-500/30"
                        : "bg-[var(--color-surface)] border-[var(--color-border)]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[var(--color-border)]/40">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                            isTop1
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]"
                          }`}
                        >
                          #{team.rank || tIdx + 1}
                        </span>
                        <span className="text-xs font-bold text-[var(--color-text-primary)]">
                          {team.teamName || `Duo ${team.rank || tIdx + 1}`}
                        </span>
                        {isMy && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                            Votre Équipe
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-[var(--color-text-secondary)]">
                        {team.kills} Frags • {team.score} Pts
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {team.players?.map((p: any) => (
                        <PlayerRow key={p.puuid} player={p} isWinnerTeam={isTop1} mySpi={spi} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-3 text-center bg-emerald-500/10 py-1 rounded border border-emerald-500/20">
                Équipe Victoire
              </h4>
              {(match.won ? match.myTeam : match.enemyTeam)?.map((p: any) => (
                <PlayerRow key={p.puuid} player={p} isWinnerTeam={true} mySpi={spi} />
              ))}
            </div>
            <div className="w-px bg-[var(--color-border)] hidden md:block"></div>
            <div className="flex-1 space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-3 text-center bg-red-500/10 py-1 rounded border border-red-500/20">
                Équipe Défaite
              </h4>
              {(match.won ? match.enemyTeam : match.myTeam)?.map((p: any) => (
                <PlayerRow key={p.puuid} player={p} isWinnerTeam={false} mySpi={spi} />
              ))}
            </div>
          </div>
        )
      )}

      {/* Scoreboard */}
      {tab === "scoreboard" && (
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-[500px]">
            <thead>
              <tr className="text-[9px] text-[var(--color-text-secondary)] uppercase tracking-widest border-b border-[var(--color-border)]">
                <th className="pb-3 px-2 font-bold w-12 text-center">#</th>
                <th className="pb-3 px-2 font-bold">Joueur</th>
                <th className="pb-3 px-2 font-bold text-center">Rang</th>
                <th className="pb-3 px-2 font-bold text-center">SPI</th>
                <th className="pb-3 px-2 font-bold text-center">Score Combat</th>
                <th className="pb-3 px-2 font-bold text-center">K / D / A</th>
                <th className="pb-3 px-2 font-bold text-center hidden sm:table-cell">Éco</th>
                <th className="pb-3 px-2 font-bold text-center hidden sm:table-cell">1er Sang</th>
              </tr>
            </thead>
            <tbody>
              {[...(match.myTeam || []), ...(match.enemyTeam || [])]
                .sort((a, b) => b.acs - a.acs)
                .map((p: any, idx: number) => {
                  const pWon = p.won !== undefined ? p.won : (match.myTeam?.some((m: any) => m.puuid === p.puuid) ? match.won : !match.won);
                  const pSpi =
                    p.isMe && spi
                      ? spi
                      : calculateSingleMatchSPI(
                          {
                            ...p,
                            won: pWon,
                          },
                          p.role
                        );
                  const pRank = getPlayerRank(p);

                  return (
                    <tr
                      key={p.puuid}
                      className={`border-b border-[rgba(255,255,255,0.02)] transition-colors ${
                        p.isMe ? "bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)]" : "hover:bg-[var(--color-surface-hover)]"
                      }`}
                    >
                      <td className="py-2 px-2 text-center text-[10px] text-[var(--color-text-secondary)] font-bold">{idx + 1}</td>
                      <td className="py-2 px-2 flex items-center gap-3">
                        <img referrerPolicy="no-referrer" src={p.agentIcon} className="w-8 h-8 rounded-lg shadow-sm" alt={p.agent} loading="lazy" />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (p.isPublicProfile && p.tag) {
                                  searchPlayer(`${p.name}#${p.tag}`);
                                }
                              }}
                              className={`font-bold ${p.isPublicProfile ? "hover:underline cursor-pointer" : "cursor-default opacity-70"} ${
                                p.isMe ? "text-[var(--color-val-red)] drop-shadow-[0_0_5px_rgba(255,70,85,0.3)]" : "text-[var(--color-text-on-surface)]"
                              }`}
                            >
                              {p.isMe ? tr("Vous") : p.name}
                            </button>
                            {!p.isPublicProfile && (
                              <span className="text-[8px] bg-[var(--color-background)] border border-[var(--color-border)] px-1.5 py-0.5 rounded text-[var(--color-text-secondary)] opacity-75 whitespace-nowrap">
                                Profil privé
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-[var(--color-text-secondary)] uppercase tracking-wider">{p.agent}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <img
                          referrerPolicy="no-referrer"
                          src={pRank.icon}
                          alt={pRank.name}
                          title={pRank.name}
                          className="w-6 h-6 sm:w-7 sm:h-7 object-contain inline-block drop-shadow-sm cursor-help"
                          loading="lazy"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <div
                          className="inline-flex items-center justify-center cursor-help transition-transform hover:scale-110"
                          title={`Score SPI : ${pSpi.score} pts (Grade ${pSpi.grade})`}
                        >
                          <PerformanceStarBadge
                            grade={pSpi.grade}
                            score={pSpi.score}
                            gradeColor={pSpi.gradeColor}
                            gradeBg={pSpi.gradeBg}
                            gradeBorder={pSpi.gradeBorder}
                            gradeGlow={pSpi.gradeGlow}
                            size="xs"
                            layout="icon-only"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center font-black text-[var(--color-text-on-surface)]">{p.acs}</td>
                      <td className="py-2 px-2 text-center text-xs font-bold">
                        <span className="text-emerald-400">{p.kills}</span> <span className="text-[var(--color-text-secondary)] font-normal">/</span>{" "}
                        <span className="text-red-400">{p.deaths}</span> <span className="text-[var(--color-text-secondary)] font-normal">/</span>{" "}
                        <span className="text-blue-400">{p.assists}</span>
                      </td>
                    <td className="py-2 px-2 text-center text-[var(--color-text-secondary)] font-bold hidden sm:table-cell">{p.econScore}</td>
                    <td className="py-2 px-2 text-center text-[var(--color-text-secondary)] font-bold hidden sm:table-cell">{p.firstBloods}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Timeline */}
      {tab === "timeline" && (
        !modeInfo.hasRounds || !match.timeline || match.timeline.length === 0 ? (
          <div className="p-8 text-center glass-card rounded-2xl space-y-2 border border-white/5 my-2">
            <div className="text-3xl">🎯</div>
            <h4 className="font-bold text-sm text-[var(--color-text-primary)]">
              Chronologie des manches non applicable
            </h4>
            <p className="text-xs text-[var(--color-text-secondary)] max-w-md mx-auto leading-relaxed">
              Le mode <strong>{modeInfo.displayName}</strong> est une élimination continue sans manches classiques ni pose de Spike. Consultez l&apos;onglet <strong>Leaderboard</strong> pour le détail des frags et duels.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 py-2">
            <div className="flex items-start justify-center gap-1.5 sm:gap-2 overflow-x-auto pb-4 pt-16">
              {match.timeline?.slice(0, 12).map((r: any) => (
                <RoundBar key={r.roundNum} round={r} />
              ))}
              {match.timeline?.length > 12 && (
                <div className="flex flex-col items-center justify-center h-20 px-1 sm:px-3">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-secondary)]">
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    <path d="M12 7v5l3 3"></path>
                  </svg>
                </div>
              )}
              {match.timeline?.slice(12).map((r: any) => (
                <RoundBar key={r.roundNum} round={r} />
              ))}
            </div>

            <div className="glass-card p-4 sm:p-5 rounded-2xl text-xs space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar">
              <h4 className="font-bold text-[var(--color-text-primary)] uppercase tracking-widest text-[10px] mb-4">
                Journal des événements marqués
              </h4>
              {match.timeline?.map((r: any) => (
                <div
                  key={r.roundNum}
                  className="flex gap-4 border-b border-[rgba(255,255,255,0.04)] pb-3 items-center group hover:bg-[rgba(255,255,255,0.02)] transition-colors px-2 rounded-lg"
                >
                  <span className="text-[10px] text-[var(--color-text-secondary)] w-12 font-black tracking-widest">M {r.roundNum}</span>

                  <div className="flex-1 flex gap-3">
                    {r.myKillsInRound > 0 && (
                      <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {r.myKillsInRound} élimination(s)
                      </span>
                    )}
                    {r.diedInRound && (
                      <span className="text-[var(--color-val-red)] font-bold bg-[var(--color-val-red)]/10 px-2 py-0.5 rounded border border-[var(--color-val-red)]/20">
                        Mort(e)
                      </span>
                    )}
                    {!r.myKillsInRound && !r.diedInRound && (
                      <span className="text-[var(--color-text-secondary)] italic">Pas d&apos;événement majeur</span>
                    )}
                  </div>

                  <span className="text-[9px] uppercase tracking-widest text-right flex flex-col items-end gap-0.5">
                    <span className="text-[var(--color-text-secondary)]">Victoire</span>
                    <span className={`font-black ${r.winner === "myTeam" ? "text-emerald-400" : "text-[var(--color-val-red)]"}`}>{r.winCondition}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* Duels 1v1 avec vraies données Henrik API */}
      {tab === "duels" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {match.duels?.map((d: any, idx: number) => {
            const kills = d.kills || 0;
            const deaths = d.deaths || 0;
            const totalDuels = kills + deaths;
            const winRate = totalDuels > 0 ? Math.round((kills / totalDuels) * 100) : 50;
            const diff = kills - deaths;
            const enemyPlayer = match.enemyTeam?.find((e: any) => e.name === d.name || e.puuid === d.puuid);
            const dRank = getPlayerRank(d.rankUrl ? d : (enemyPlayer || d));
            const agentName = d.agent || (enemyPlayer?.agent ? enemyPlayer.agent : "Adversaire");
            const playerTag = d.tag ? `#${d.tag}` : (enemyPlayer?.tag ? `#${enemyPlayer.tag}` : "");

            return (
              <div
                key={idx}
                className="glass-card p-4 rounded-2xl flex flex-col justify-between gap-3 border border-white/5 hover:border-white/15 transition-all shadow-lg group relative overflow-hidden"
              >
                {/* Liseré lumineux supérieur selon le différentiel */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-60 group-hover:opacity-100 transition-opacity ${
                    diff > 0
                      ? "from-emerald-500/0 via-emerald-500/80 to-emerald-500/0"
                      : diff < 0
                      ? "from-[var(--color-val-red)]/0 via-[var(--color-val-red)]/80 to-[var(--color-val-red)]/0"
                      : "from-white/0 via-white/40 to-white/0"
                  }`}
                />

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex-shrink-0">
                      <img
                        referrerPolicy="no-referrer"
                        src={d.agentIcon}
                        className="w-11 h-11 rounded-xl shadow-md border border-white/10 object-cover bg-black/40"
                        alt={agentName}
                        loading="lazy"
                      />
                      {dRank.icon && (
                        <img
                          referrerPolicy="no-referrer"
                          src={dRank.icon}
                          alt={dRank.name}
                          title={dRank.name}
                          className="w-5 h-5 object-contain absolute -bottom-1 -right-1 drop-shadow-md cursor-help"
                          loading="lazy"
                        />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-black text-sm text-white truncate group-hover:text-emerald-400 transition-colors">
                        {agentName}
                      </span>
                      <span className="text-[11px] text-[var(--color-text-secondary)] truncate">
                        {d.name} {playerTag}
                      </span>
                    </div>
                  </div>

                  {/* Score de duel & badge différentiel */}
                  <div className="flex flex-col items-end flex-shrink-0">
                    <div className="flex items-center gap-1.5 font-mono text-base font-black">
                      <span className="text-emerald-400">{kills}</span>
                      <span className="text-[var(--color-text-secondary)] font-normal text-xs">-</span>
                      <span className="text-[var(--color-val-red)]">{deaths}</span>
                    </div>
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                        diff > 0
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : diff < 0
                          ? "bg-[var(--color-val-red)]/20 text-[var(--color-val-red)] border border-[var(--color-val-red)]/30"
                          : "bg-white/10 text-gray-300 border border-white/10"
                      }`}
                    >
                      {diff > 0 ? `+${diff}` : diff === 0 ? "Égalité" : diff}
                    </span>
                  </div>
                </div>

                {/* Barre de ratio et statistiques détaillées */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-[10px] font-extrabold tracking-wide">
                    <span className="text-emerald-400">{kills} {kills > 1 ? "frags infligés" : "frag infligé"}</span>
                    <span className="text-[var(--color-text-secondary)] font-mono">{winRate}%</span>
                    <span className="text-[var(--color-val-red)]">{deaths} {deaths > 1 ? "morts subies" : "mort subie"}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--color-val-red)]/40 overflow-hidden shadow-inner flex">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                      style={{ width: `${winRate}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Economy Tracker Détaillé avec Grand Graphique Interactif Unique */}
      {tab === "economy" && (
        <MatchEconomyChart match={match} />
      )}

      {/* Killmap 2D Interactif */}
      {tab === "killmap" && (
        <KillmapView match={match} />
      )}
    </div>
  );
});

function MatchHistoryComponent({
  matches,
  searchPlayer,
  visibleCount,
  onLoadMore,
  currentPlayerRank,
  currentPlayerRankUrl,
  currentPlayerRankTier,
  highlightedMatchId,
  isLoading = false,
}: MatchHistoryProps) {
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(
    highlightedMatchId || null
  );

  // Auto-expansion et ouverture animée lorsqu'un match spécifique est ciblé
  useEffect(() => {
    if (highlightedMatchId) {
      setActiveHighlightId(highlightedMatchId);
      setExpandedMatchId(highlightedMatchId);

      // Arrêt de l'animation de surbrillance dès le premier clic de souris
      const stopHighlight = () => {
        setActiveHighlightId(null);
      };

      // Délai de 250ms pour ignorer le clic initial de la navigation
      const timer = setTimeout(() => {
        window.addEventListener("pointerdown", stopHighlight, { once: true });
        window.addEventListener("click", stopHighlight, { once: true });
      }, 250);

      const autoTimer = setTimeout(() => {
        setActiveHighlightId(null);
      }, 8000);

      return () => {
        clearTimeout(timer);
        clearTimeout(autoTimer);
        window.removeEventListener("pointerdown", stopHighlight);
        window.removeEventListener("click", stopHighlight);
      };
    }
  }, [highlightedMatchId]);

  if (!matches || matches.length === 0) {
    if (isLoading) {
      return (
        <div className="w-full space-y-3 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-full h-20 rounded-2xl glass-panel border border-[var(--color-border)]/60 p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl skeleton-shimmer shrink-0" />
                <div className="space-y-2">
                  <div className="h-4 w-28 rounded skeleton-shimmer" />
                  <div className="h-3 w-16 rounded skeleton-shimmer opacity-60" />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="h-6 w-16 rounded skeleton-shimmer" />
                <div className="h-4 w-20 rounded skeleton-shimmer opacity-70" />
                <div className="w-8 h-8 rounded-full skeleton-shimmer opacity-50" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="w-full glass-panel rounded-2xl p-10 text-center animate-in fade-in duration-500">
        <p className="text-sm text-[var(--color-text-secondary)] font-bold uppercase tracking-wider">
          Aucun match trouvé pour cette sélection
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 animate-in fade-in duration-500">
      {matches.slice(0, visibleCount).map((match: any, idx: number) => {
        const mId = match.matchId || match.id;
        const isTargeted =
          activeHighlightId === match.matchId ||
          (match.id && activeHighlightId === match.id);
        const isExpanded =
          expandedMatchId === match.matchId ||
          (match.id && expandedMatchId === match.id);
        const spi = calculateSingleMatchSPI(match, match.role);
        const modeInfo = resolveGameMode(match.mode);
        const isDeathmatch = modeInfo.id === "deathmatch";
        const matchRank = getPlayerRank(match, {
          name: currentPlayerRank,
          icon: currentPlayerRankUrl,
          tier: currentPlayerRankTier,
        });
        return (
          <React.Fragment key={mId}>
            <div
              id={`match-${mId}`}
              className={`w-full flex flex-col gap-2 rounded-2xl transition-all duration-500 ${
              isTargeted
                ? "ring-2 ring-[var(--color-val-red)] shadow-[0_0_25px_rgba(255,70,85,0.7)] p-1 bg-[var(--color-val-red)]/10 animate-pulse"
                : ""
            }`}
          >
            <div
              onMouseEnter={() => sounds.playHover()}
              onClick={() => {
                sounds.playClick();
                if (activeHighlightId) setActiveHighlightId(null);
                setExpandedMatchId(isExpanded ? null : mId);
              }}
              className={`w-full glass-panel-interactive rounded-2xl p-4 flex items-center gap-3 sm:gap-4 border-l-4 cursor-pointer select-none ${
                match.won
                  ? "border-l-emerald-500 hover:border-l-emerald-400"
                  : isDeathmatch
                  ? "border-l-amber-500/80 hover:border-l-amber-400"
                  : "border-l-[var(--color-val-red)] hover:border-l-[var(--color-val-red)]"
              } ${isExpanded ? "bg-[var(--color-surface-hover)] shadow-lg ring-1 ring-[var(--color-val-red)]/30" : ""}`}
            >
              {/* Mode Icon avec infobulle */}
              <div
                className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-white/5 border border-white/10 shadow-sm transition-transform hover:scale-110"
                title={`${modeInfo.displayName} (${modeInfo.scoreLabel || "Mode"})`}
              >
                <img
                  referrerPolicy="no-referrer"
                  src={modeInfo.icon || match.modeIcon}
                  alt={modeInfo.displayName}
                  className="w-5 h-5 object-contain opacity-90 drop-shadow-sm"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              <img
                referrerPolicy="no-referrer"
                src={match.agentIcon}
                alt={match.agent}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border border-[rgba(255,255,255,0.1)] shadow-md flex-shrink-0"
                loading="lazy"
                decoding="async"
              />

              {/* Rang de la personne */}
              <img
                referrerPolicy="no-referrer"
                src={matchRank.icon}
                alt={matchRank.name}
                title={matchRank.name}
                className="w-7 h-7 sm:w-8 sm:h-8 object-contain flex-shrink-0 drop-shadow-sm cursor-help"
                loading="lazy"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="font-bold text-[var(--color-text-on-surface)] text-sm">{match.agent}</span>
                  <span className="text-[10px] text-[var(--color-text-secondary)] uppercase">{match.map}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">
                    {modeInfo.displayName}
                  </span>
                  {match.season && (
                    <span className="text-[9px] text-[var(--color-val-red)] font-bold bg-[rgba(255,70,85,0.1)] px-1.5 py-0.5 rounded">
                      {match.season}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 sm:gap-4 mt-1">
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    <span className="text-emerald-400 font-bold">{match.kills}</span>/
                    <span className="text-[var(--color-val-red)] font-bold">{match.deaths}</span>/
                    <span className="text-gray-300 font-bold">{match.assists}</span>
                  </span>
                  <span className="text-xs text-[var(--color-text-secondary)]">ACS {match.acs}</span>
                </div>
              </div>

              {/* SPI Star with Letter (no contour, hover displays score) */}
              <div
                className="flex items-center justify-center flex-shrink-0 cursor-help transition-transform hover:scale-110"
                title={`Score SPI : ${spi.score} pts (Grade ${spi.grade})`}
              >
                <PerformanceStarBadge
                  grade={spi.grade}
                  score={spi.score}
                  gradeColor={spi.gradeColor}
                  gradeBg={spi.gradeBg}
                  gradeBorder={spi.gradeBorder}
                  gradeGlow={spi.gradeGlow}
                  size="xs"
                  layout="icon-only"
                />
              </div>

              <div className="flex flex-col items-end flex-shrink-0">
                <div className="flex items-baseline gap-1.5 sm:gap-2">
                  {match.score && <span className="text-base sm:text-lg font-black text-[var(--color-text-on-surface)]">{match.score}</span>}
                  <span
                    className={`text-xs font-black uppercase tracking-wider ${
                      match.won
                        ? "text-emerald-400"
                        : isDeathmatch
                        ? "text-amber-400"
                        : "text-[var(--color-val-red)]"
                    }`}
                  >
                    {isDeathmatch ? (match.won ? "Top 1" : "Terminé") : (match.won ? "Victoire" : "Défaite")}
                  </span>
                </div>
                <span className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">
                  {new Date(match.date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            {/* Smooth Animated Accordion Drawer */}
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isExpanded
                  ? "grid-rows-[1fr] opacity-100 mt-2"
                  : "grid-rows-[0fr] opacity-0 pointer-events-none"
              }`}
              style={{
                transition:
                  "grid-template-rows 320ms cubic-bezier(0.4, 0, 0.2, 1), opacity 280ms ease, margin 320ms ease",
              }}
            >
              <div className="overflow-hidden">
                <ExpandedMatch match={match} searchPlayer={searchPlayer} spi={spi} />
              </div>
            </div>
          </div>

          {/* Ad Banner after 5th match */}
          {idx === 4 && (
            <AdBanner format="horizontal" minHeight={95} className="my-3" />
          )}
        </React.Fragment>
      );
    })}

      {/* Discreet bottom Ad Banner if more than 3 matches */}
      {matches.length > 3 && (
        <AdBanner format="horizontal" minHeight={95} className="mt-4" />
      )}

      {/* Bouton Charger Plus */}
      {visibleCount < matches.length && (
        <div className="flex justify-center pt-4">
          <button
            onMouseEnter={() => sounds.playHover()}
            onClick={() => {
              sounds.playClick();
              onLoadMore();
            }}
            className="bg-[var(--color-surface-hover)] hover:bg-[var(--color-val-red)] text-[var(--color-text-primary)] hover:text-[var(--color-accent-contrast,#ffffff)] font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-full transition-all duration-300 border border-[var(--color-border)] shadow-md hover:shadow-accent-md cursor-pointer"
          >
            {tr("Charger plus (+10)")}
          </button>
        </div>
      )}
    </div>
  );
}

export default React.memo(MatchHistoryComponent);
