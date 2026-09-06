"use client";

import React from "react";
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
}: StatCardProps) {
  const hasWarning = !!(warning && smartRating);
  const ratingClass = hasWarning ? "border-[var(--color-val-red)]/40 bg-[var(--color-val-red)]/5" : "";

  return (
    <div
      className={`glass-panel-interactive p-2.5 xs:p-3 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col justify-between h-full min-w-0 ${
        colSpan ? `col-span-${colSpan}` : ""
      } ${ratingClass} ${className}`}
    >
      <div className="flex items-center justify-between text-[9px] xs:text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1 sm:mb-1.5 min-w-0">
        <div className="flex items-center gap-1 min-w-0">
          <span className="truncate whitespace-nowrap">{label}</span>
          {hasWarning && <Tooltip message={warning} />}
        </div>
      </div>
      <div className="flex items-baseline gap-1 min-w-0 overflow-hidden">
        <span
          className={`text-base xs:text-lg sm:text-xl md:text-2xl font-black tracking-tight truncate ${
            highlight
              ? "text-[var(--color-val-red)] drop-shadow-[0_0_12px_rgba(255,70,85,0.3)]"
              : "text-[var(--color-text-primary)]"
          }`}
        >
          {value}
        </span>
        {suffix && <span className="text-[9px] xs:text-[10px] sm:text-xs font-bold text-[var(--color-text-secondary)] shrink-0">{suffix}</span>}
      </div>
      {sub && <span className="text-[8px] xs:text-[9px] sm:text-[10px] text-[var(--color-text-secondary)] font-medium mt-0.5 truncate">{sub}</span>}
    </div>
  );
}

export default React.memo(StatCardComponent);
