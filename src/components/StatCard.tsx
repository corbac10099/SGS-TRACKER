"use client";

import React, { useEffect, useState, useRef } from "react";
import Tooltip from "./Tooltip";

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
}

/**
 * Hook personnalisé d'animation de compteur numérique (Count-Up)
 * anime de 0 vers la valeur cible avec courbe ease-out en ~450ms.
 */
function useAnimatedNumber(targetValue: string | number) {
  const strVal = String(targetValue ?? "");
  const [displayVal, setDisplayVal] = useState<string>(strVal);
  const prevNumRef = useRef<number | null>(null);

  useEffect(() => {
    // Extrait les nombres et d'éventuels suffixes (ex: "1.42", "58%", "+15")
    const match = strVal.match(/^([-+]?\d+(?:\.\d+)?)(.*)$/);
    if (!match) {
      setDisplayVal(strVal);
      return;
    }

    const num = parseFloat(match[1]);
    const suf = match[2] || "";
    const decimals = match[1].includes(".") ? match[1].split(".")[1].length : 0;

    if (isNaN(num)) {
      setDisplayVal(strVal);
      return;
    }

    const start = prevNumRef.current !== null ? prevNumRef.current : 0;
    prevNumRef.current = num;

    if (start === num) {
      setDisplayVal(`${num.toFixed(decimals)}${suf}`);
      return;
    }

    const duration = 450;
    const startTime = performance.now();
    let animId: number;

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      // Easing out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = start + (num - start) * ease;
      setDisplayVal(`${current.toFixed(decimals)}${suf}`);

      if (progress < 1) {
        animId = requestAnimationFrame(tick);
      } else {
        setDisplayVal(`${num.toFixed(decimals)}${suf}`);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [strVal]);

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
}: StatCardProps) {
  const hasWarning = !!(warning && smartRating);
  const ratingClass = hasWarning ? "border-[var(--color-val-red)]/40 bg-[var(--color-val-red)]/5" : "";
  const animatedValue = useAnimatedNumber(value);

  return (
    <div
      className={`glass-panel-interactive p-2.5 xs:p-3 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col justify-between h-full min-w-0 transition-all duration-300 ${
        colSpan ? `col-span-${colSpan}` : ""
      } ${ratingClass} ${className}`}
    >
      <div className="flex items-center justify-between text-[9px] xs:text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1 sm:mb-1.5 min-w-0">
        <div className="flex items-center gap-1 min-w-0">
          <span className="truncate whitespace-nowrap">{label}</span>
          {hasWarning && <Tooltip message={warning} />}
        </div>
      </div>
      <div className="flex items-baseline gap-1.5 min-w-0 overflow-hidden flex-wrap">
        <span
          className={`text-base xs:text-lg sm:text-xl md:text-2xl font-black tracking-tight truncate transition-colors duration-200 ${
            highlight
              ? "text-[var(--color-val-red)] drop-shadow-[0_0_12px_rgba(255,70,85,0.3)]"
              : "text-[var(--color-text-primary)]"
          }`}
        >
          {animatedValue}
        </span>
        {suffix && <span className="text-[9px] xs:text-[10px] sm:text-xs font-bold text-[var(--color-text-secondary)] shrink-0">{suffix}</span>}
        {sessionDelta && (
          <span
            key={`${label}-${sessionDelta.text}`}
            className={`text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-sm select-none animate-in fade-in-0 zoom-in-75 duration-300 ${
              sessionDelta.positive
                ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                : sessionDelta.neutral
                ? "bg-emerald-500/15 text-emerald-300/90 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)] ring-1 ring-emerald-500/20 animate-pulse"
                : "bg-red-500/25 text-red-300 border border-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.3)]"
            }`}
            title="Variation enregistrée pendant la session en direct"
          >
            {sessionDelta.neutral && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            )}
            {sessionDelta.text}
          </span>
        )}
      </div>
      {sub && <span className="text-[8px] xs:text-[9px] sm:text-[10px] text-[var(--color-text-secondary)] font-medium mt-0.5 truncate">{sub}</span>}
    </div>
  );
}

export default React.memo(StatCardComponent);
