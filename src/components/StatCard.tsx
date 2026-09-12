"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import Tooltip from "./Tooltip";
import { IconChevronDown, IconUsers } from "@/components/icons/SpyIcons";
import { sounds } from "@/lib/soundEffects";
import { FriendComparisonStatItem } from "@/hooks/useFriends";

export interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
  warning?: string;
  suffix?: string;
  colSpan?: number;
  smartRating?: boolean;
  className?: string;
  sessionDelta?: { text: string; positive?: boolean; neutral?: boolean };
  metricKey?: string;
  friendsStats?: FriendComparisonStatItem[];
  onSelectPlayer?: (riotId: string) => void;
  onOpenFriendsModal?: () => void;
}

/**
 * Hook d'incrémentation fluide numérique (Count-Up).
 * Démarre à 0 au montage et s'incrémente de manière fluide jusqu'à la valeur finale.
 */
function useAnimatedNumber(targetValue: string | number) {
  const strVal = String(targetValue ?? "");
  const match = strVal.match(/^([-+]?\d+(?:\.\d+)?)(.*)$/);
  const num = match ? parseFloat(match[1]) : NaN;
  const suf = match ? match[2] || "" : "";
  const decimals = match && match[1].includes(".") ? match[1].split(".")[1].length : 0;

  const [displayVal, setDisplayVal] = useState<string>(() => {
    if (!isNaN(num)) {
      return `${(0).toFixed(decimals)}${suf}`;
    }
    return strVal;
  });

  const currentNumRef = useRef<number>(0);

  useEffect(() => {
    if (isNaN(num)) {
      setDisplayVal(strVal);
      return;
    }

    const start = currentNumRef.current;
    const target = num;
    const duration = 550;
    const startTime = performance.now();
    let animId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = start + (target - start) * ease;
      currentNumRef.current = current;
      setDisplayVal(`${current.toFixed(decimals)}${suf}`);

      if (progress < 1) {
        animId = requestAnimationFrame(tick);
      } else {
        currentNumRef.current = target;
        setDisplayVal(`${target.toFixed(decimals)}${suf}`);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [num, suf, decimals, strVal]);

  return displayVal;
}

function StatCardComponent({
  label,
  value,
  sub,
  highlight,
  warning,
  suffix,
  colSpan,
  smartRating,
  className = "",
  sessionDelta,
  metricKey,
  friendsStats,
  onSelectPlayer,
  onOpenFriendsModal,
}: StatCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasWarning = !!(warning && smartRating);
  const ratingClass = hasWarning ? "border-[var(--color-val-red)]/40 bg-[var(--color-val-red)]/5" : "";
  const animatedValue = useAnimatedNumber(value);

  const liveContourClass = sessionDelta ? "live-card-contour border-neutral-400/40" : "";

  // Calcul du classement et de la comparaison avec les amis SGS
  const myNum = useMemo(() => {
    if (typeof value === "number") return value;
    const cleaned = String(value).replace("%", "").trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }, [value]);

  const rankedFriends = useMemo(() => {
    if (!metricKey || !friendsStats || friendsStats.length === 0) return [];
    return friendsStats
      .filter((f) => f.canViewStats)
      .map((f) => {
        const val = f.stats?.[metricKey as keyof typeof f.stats] ?? 0;
        const diff = val - myNum;
        return {
          ...f,
          statVal: val,
          diff: parseFloat(diff.toFixed(2)),
        };
      })
      .sort((a, b) => {
        if (metricKey === "deaths") return a.statVal - b.statVal;
        return b.statVal - a.statVal;
      });
  }, [metricKey, friendsStats, myNum]);

  // Valeur maximale pour la barre de comparaison
  const maxComparisonVal = useMemo(() => {
    const allVals = [myNum, ...rankedFriends.map((f) => f.statVal)];
    return Math.max(...allVals, 1);
  }, [myNum, rankedFriends]);

  return (
    <div
      className={`glass-panel-interactive group relative p-2.5 xs:p-3 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col justify-between transition-all duration-300 ${
        colSpan ? `col-span-${colSpan}` : ""
      } ${ratingClass} ${liveContourClass} ${
        isExpanded ? "z-30 shadow-2xl border-[var(--color-val-red)]/50 ring-1 ring-[var(--color-val-red)]/30" : ""
      } ${className}`}
    >
      {/* Header : Label & Bouton de comparaison avec les amis */}
      <div className="flex items-center justify-between text-[9px] xs:text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1 sm:mb-1.5 min-w-0">
        <div className="flex items-center gap-1 min-w-0">
          <span className="truncate whitespace-nowrap">{label}</span>
          {hasWarning && <Tooltip message={warning} />}
        </div>

        {metricKey && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              sounds.playClick();
              setIsExpanded(!isExpanded);
            }}
            className={`p-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
              isExpanded
                ? "opacity-100 bg-[var(--color-val-red)] text-white shadow-accent-sm"
                : "opacity-0 group-hover:opacity-100 hover:bg-white/15 text-gray-400 hover:text-white"
            }`}
            title={isExpanded ? "Replier la comparaison" : "Comparer avec mes amis SGS"}
          >
            <IconChevronDown
              size={13}
              className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>

      {/* Valeur Principale */}
      <div className="flex items-baseline gap-1.5 min-w-0 overflow-hidden flex-wrap">
        <span
          className={`text-base xs:text-lg sm:text-xl md:text-2xl font-black tracking-tight truncate transition-colors duration-200 ${
            highlight
              ? "text-[var(--color-val-red)] drop-shadow-[0_0_10px_var(--accent-glow-md)]"
              : "text-[var(--color-text-primary)]"
          }`}
        >
          {animatedValue}
        </span>
        {suffix && <span className="text-[9px] xs:text-[10px] sm:text-xs font-bold text-[var(--color-text-secondary)] shrink-0">{suffix}</span>}
        {sessionDelta && (
          <span
            key={`${label}-${sessionDelta.text}`}
            className={`text-[9px] sm:text-[10px] font-black font-mono px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-sm select-none animate-in fade-in-0 zoom-in-90 duration-300 ${
              sessionDelta.positive
                ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                : sessionDelta.neutral
                ? "bg-white/10 text-neutral-300 border border-white/20 shadow-sm"
                : "bg-red-500/25 text-red-300 border border-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.3)]"
            }`}
            title="Variation enregistrée pendant la session en direct"
          >
            {sessionDelta.text}
          </span>
        )}
      </div>

      {sub && <span className="text-[8px] xs:text-[9px] sm:text-[10px] text-[var(--color-text-secondary)] font-medium mt-0.5 truncate">{sub}</span>}

      {/* TIROIR DÉPLIABLE : COMPARAISON AMIS SGS */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-[var(--color-border)] space-y-2.5 animate-in fade-in-0 zoom-in-95 duration-200">
          <div className="flex items-center justify-between text-[9px] uppercase tracking-wider font-black text-gray-400">
            <span className="flex items-center gap-1 text-[var(--color-val-red)]">
              <IconUsers size={12} />
              <span>Classement Amis SGS</span>
            </span>
            <span>{rankedFriends.length} ami{rankedFriends.length > 1 ? "s" : ""}</span>
          </div>

          {/* Ligne : Mon score */}
          <div className="p-2 rounded-xl bg-[var(--color-val-red)]/15 border border-[var(--color-val-red)]/35 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] font-black text-[var(--color-val-red)] px-1.5 py-0.5 rounded bg-[var(--color-val-red)]/20">
                MOI
              </span>
              <span className="text-[11px] font-black text-white truncate">Vous</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-16 h-1.5 bg-black/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-val-red)] rounded-full shadow-[0_0_8px_var(--color-val-red)]"
                  style={{ width: `${Math.min(100, (myNum / maxComparisonVal) * 100)}%` }}
                />
              </div>
              <span className="text-xs font-black text-white font-mono">
                {myNum} {suffix || ""}
              </span>
            </div>
          </div>

          {/* Liste des amis classés */}
          {rankedFriends.length === 0 ? (
            <div className="text-center py-3 space-y-2">
              <p className="text-[10px] text-gray-400">Aucun ami SGS ajouté pour le moment.</p>
              {onOpenFriendsModal && (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onOpenFriendsModal();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Ajouter un ami
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {rankedFriends.map((friend, idx) => {
                const isBetter = metricKey === "deaths" ? friend.diff < 0 : friend.diff > 0;
                const isTied = friend.diff === 0;

                return (
                  <div
                    key={friend.friendId || friend.riotId}
                    onClick={() => {
                      if (onSelectPlayer) {
                        sounds.playClick();
                        onSelectPlayer(friend.riotId);
                      }
                    }}
                    className="p-1.5 sm:p-2 rounded-xl bg-black/30 hover:bg-white/10 border border-white/5 hover:border-white/15 flex items-center justify-between gap-2 transition-all cursor-pointer group/row"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[9px] font-mono font-bold text-gray-500 w-4 text-center">
                        #{idx + 1}
                      </span>
                      {friend.avatarUrl ? (
                        <img src={friend.avatarUrl} alt={friend.name} className="w-5 h-5 rounded-md object-cover border border-white/10" />
                      ) : (
                        <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center text-[9px] font-black text-white">
                          {friend.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <span className="text-[10px] font-bold text-gray-200 group-hover/row:text-white truncate">
                        {friend.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-14 h-1.5 bg-black/40 rounded-full overflow-hidden hidden xs:block">
                        <div
                          className="h-full bg-white/40 rounded-full"
                          style={{ width: `${Math.min(100, (friend.statVal / maxComparisonVal) * 100)}%` }}
                        />
                      </div>

                      <span className="text-[10px] font-black text-white font-mono">
                        {friend.statVal} {suffix || ""}
                      </span>

                      <span
                        className={`text-[9px] font-black font-mono px-1 py-0.2 rounded ${
                          isTied
                            ? "text-gray-400 bg-white/5"
                            : isBetter
                            ? "text-emerald-400 bg-emerald-500/15"
                            : "text-red-400 bg-red-500/15"
                        }`}
                      >
                        {isTied ? "=" : (friend.diff > 0 ? `+${friend.diff}` : `${friend.diff}`)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default React.memo(StatCardComponent);
