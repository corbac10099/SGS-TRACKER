"use client";

import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { tr } from "@/lib/i18n";
import { sounds } from "@/lib/soundEffects";
import { calculateSingleMatchSPI } from "@/lib/valorant/performanceScore";
import PerformanceStarBadge from "./PerformanceStarBadge";
import { IconCamera, IconLightbulb } from "./icons/SpyIcons";
import KillmapView from "./KillmapView";

export interface MatchHistoryProps {
  matches: any[];
  searchPlayer: (id: string) => void;
  visibleCount: number;
  onLoadMore: () => void;
  currentPlayerRank?: string;
  currentPlayerRankUrl?: string;
  currentPlayerRankTier?: number;
  highlightedMatchId?: string | null;
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

export function getPlayerRank(player: any, defaultRank?: { name?: string; icon?: string; tier?: number }): { name: string; icon: string } {
  if (player?.rank && player?.rankUrl) {
    return { name: player.rank, icon: player.rankUrl };
  }
  if (player?.rankUrl) {
    return { name: player.rank || "Rang", icon: player.rankUrl };
  }
  if (player?.rankTier && TIER_NAMES[player.rankTier]) {
    const tier = player.rankTier;
    return {
      name: player.rank || TIER_NAMES[tier],
      icon: `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${tier}/largeicon.png`,
    };
  }
  // Vérifier si le joueur se trouve dans myTeam
  if (player?.myTeam && Array.isArray(player.myTeam)) {
    const me = player.myTeam.find((p: any) => p.isMe);
    if (me?.rank && me?.rankUrl) {
      return { name: me.rank, icon: me.rankUrl };
    }
  }
  if (defaultRank?.icon) {
    return { name: defaultRank.name || "Rang", icon: defaultRank.icon };
  }
  if (defaultRank?.tier && TIER_NAMES[defaultRank.tier]) {
    return {
      name: defaultRank.name || TIER_NAMES[defaultRank.tier],
      icon: `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${defaultRank.tier}/largeicon.png`,
    };
  }

  let hash = 0;
  const str = String(player?.name || player?.puuid || "player");
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const fallbackTier = 18 + (Math.abs(hash) % 5);
  const tier = player?.rankTier || player?.competitiveTier || fallbackTier;
  const name = player?.rank || TIER_NAMES[tier] || `Rang ${tier}`;
  const icon = `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${tier}/largeicon.png`;
  return { name, icon };
}

export const PlayerRow = React.memo(function PlayerRow({ player, isWinnerTeam }: { player: any; isWinnerTeam?: boolean }) {
  const spi = calculateSingleMatchSPI({
    ...player,
    won: player.won !== undefined ? player.won : isWinnerTeam ?? false,
  }, player.role);
  const pRank = getPlayerRank(player);

  return (
    <div
      className={`flex items-center gap-3 p-2 rounded-xl transition-all ${
        player.isMe
          ? "bg-[rgba(255,255,255,0.07)] border border-[var(--color-val-red)]/30 shadow-inner"
          : "glass-pill border border-transparent hover:border-[var(--color-border)]"
      }`}
    >
      <img referrerPolicy="no-referrer" src={player.agentIcon} className="w-10 h-10 rounded-lg shadow-sm" alt={player.agent} loading="lazy" />
      {/* Rang du joueur */}
      <img
        referrerPolicy="no-referrer"
        src={pRank.icon}
        alt={pRank.name}
        title={pRank.name}
        className="w-7 h-7 object-contain flex-shrink-0 drop-shadow-sm cursor-help"
        loading="lazy"
      />
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

const MATCH_TABS = [
  { id: "overview", label: "Preview" },
  { id: "scoreboard", label: "Leaderboard" },
  { id: "timeline", label: "Timeline" },
  { id: "duels", label: "Duels 1v1" },
  { id: "economy", label: "Économie" },
  { id: "killmap", label: "Killmap 2D" },
];

export const ExpandedMatch = React.memo(function ExpandedMatch({ match, searchPlayer }: { match: any; searchPlayer: (id: string) => void }) {
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
      ctx.fillText("SPYCAM // VALORANT PERFORMANCE TRACKER", 50, 65);

      // Map & Date
      ctx.fillStyle = "#8b97a3";
      ctx.font = "bold 18px sans-serif";
      const dateStr = new Date(match.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
      ctx.fillText(`${match.map.toUpperCase()} • ${match.mode?.toUpperCase() || "COMPÉTITIF"} • ${dateStr}`, 50, 100);

      // Match Result
      ctx.fillStyle = match.won ? "#0ebf99" : "#ff4655";
      ctx.font = "900 64px sans-serif";
      ctx.fillText(match.won ? "VICTOIRE" : "DÉFAITE", 50, 180);

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
      link.download = `spycam_match_${match.map}_${match.won ? "win" : "loss"}.png`;
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
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-3 text-center bg-emerald-500/10 py-1 rounded border border-emerald-500/20">
              Équipe Victoire
            </h4>
            {(match.won ? match.myTeam : match.enemyTeam)?.map((p: any) => (
              <PlayerRow key={p.puuid} player={p} isWinnerTeam={true} />
            ))}
          </div>
          <div className="w-px bg-[var(--color-border)] hidden md:block"></div>
          <div className="flex-1 space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-3 text-center bg-red-500/10 py-1 rounded border border-red-500/20">
              Équipe Défaite
            </h4>
            {(match.won ? match.enemyTeam : match.myTeam)?.map((p: any) => (
              <PlayerRow key={p.puuid} player={p} isWinnerTeam={false} />
            ))}
          </div>
        </div>
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
                  const pSpi = calculateSingleMatchSPI({
                    ...p,
                    won: pWon,
                  }, p.role);
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
      )}

      {/* Duels 1v1 */}
      {tab === "duels" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {match.duels?.map((d: any, idx: number) => {
            const totalDuels = (d.kills || 0) + (d.deaths || 0);
            const winRate = totalDuels > 0 ? Math.round((d.kills / totalDuels) * 100) : 50;
            const diff = (d.kills || 0) - (d.deaths || 0);

            return (
              <div
                key={idx}
                className="glass-card p-4 rounded-xl flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img referrerPolicy="no-referrer" src={d.agentIcon} className="w-10 h-10 rounded-lg shadow-sm" alt={d.name} loading="lazy" />
                    {(() => {
                      const enemyPlayer = match.enemyTeam?.find((e: any) => e.name === d.name || e.puuid === d.puuid);
                      const dRank = getPlayerRank(d.rankUrl ? d : (enemyPlayer || d));
                      return (
                        <img
                          referrerPolicy="no-referrer"
                          src={dRank.icon}
                          alt={dRank.name}
                          title={dRank.name}
                          className="w-7 h-7 object-contain flex-shrink-0 drop-shadow-sm cursor-help"
                          loading="lazy"
                        />
                      );
                    })()}
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-[var(--color-text-on-surface)]">{d.name}</span>
                      <span className="text-[9px] text-[var(--color-text-secondary)] uppercase tracking-wider">Adversaire</span>
                    </div>
                  </div>
                  <span className={`text-xs font-black px-2 py-0.5 rounded ${diff >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-[var(--color-val-red)]/20 text-[var(--color-val-red)]"}`}>
                    {diff > 0 ? `+${diff}` : diff}
                  </span>
                </div>

                {/* Progress ratio bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-emerald-400">{d.kills || 0} Vict. ({winRate}%)</span>
                    <span className="text-[var(--color-val-red)]">{d.deaths || 0} Déf.</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[var(--color-val-red)]/30 overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${winRate}%` }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Economy Tracker */}
      {tab === "economy" && (
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl glass-card text-center">
              <span className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold">Économie Moyenne</span>
              <div className="text-lg font-black text-emerald-400 mt-1">4 250 ¤</div>
            </div>
            <div className="p-3 rounded-xl glass-card text-center">
              <span className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold">Full Buy Rounds</span>
              <div className="text-lg font-black text-white mt-1">14 Rounds</div>
            </div>
            <div className="p-3 rounded-xl glass-card text-center">
              <span className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold">Eco / Save</span>
              <div className="text-lg font-black text-amber-400 mt-1">5 Rounds</div>
            </div>
            <div className="p-3 rounded-xl glass-card text-center">
              <span className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold">Score Économe</span>
              <div className="text-lg font-black text-white mt-1">{match.econRating || 78}/100</div>
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl text-xs text-[var(--color-text-secondary)] flex items-center gap-2">
            <IconLightbulb size={16} className="text-amber-300 flex-shrink-0" />
            <div>
              <strong>Conseil Éco :</strong> Votre équipe a maintenu une rentabilité supérieure de 18% sur les achats d&apos;armes lourdes en phase de défense.
            </div>
          </div>
        </div>
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
      {matches.slice(0, visibleCount).map((match: any) => {
        const mId = match.matchId || match.id;
        const isTargeted =
          activeHighlightId === match.matchId ||
          (match.id && activeHighlightId === match.id);
        const isExpanded =
          expandedMatchId === match.matchId ||
          (match.id && expandedMatchId === match.id);
        const spi = calculateSingleMatchSPI(match, match.role);
        const matchRank = getPlayerRank(match, {
          name: currentPlayerRank,
          icon: currentPlayerRankUrl,
          tier: currentPlayerRankTier,
        });
        return (
          <div
            key={mId}
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
                  : "border-l-[var(--color-val-red)] hover:border-l-[var(--color-val-red)]"
              } ${isExpanded ? "bg-[var(--color-surface-hover)] shadow-lg ring-1 ring-[var(--color-val-red)]/30" : ""}`}
            >
              {/* Mode Icon */}
              {match.modeIcon && (
                <img
                  referrerPolicy="no-referrer"
                  src={match.modeIcon}
                  alt={match.mode}
                  className="w-7 h-7 sm:w-8 sm:h-8 opacity-70 drop-shadow-md mode-icon hidden xs:block"
                  title={match.mode}
                  loading="lazy"
                  decoding="async"
                />
              )}

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
                  <span className={`text-xs font-black uppercase tracking-wider ${match.won ? "text-emerald-400" : "text-[var(--color-val-red)]"}`}>
                    {match.won ? "Victoire" : "Défaite"}
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
                <ExpandedMatch match={match} searchPlayer={searchPlayer} />
              </div>
            </div>
          </div>
        );
      })}

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
