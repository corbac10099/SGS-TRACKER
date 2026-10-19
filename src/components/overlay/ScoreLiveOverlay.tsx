"use client";

import React from "react";
import MiniOverlayWrapper from "./MiniOverlayWrapper";

interface ScoreLiveOverlayProps {
  allyScore: number;
  enemyScore: number;
  round?: number;
  mapName?: string;
  queueName?: string;
  isLive: boolean;
  isInteractive: boolean;
  onClose: () => void;
  accentColor?: string;
}

export default function ScoreLiveOverlay({
  allyScore,
  enemyScore,
  round,
  mapName = "Valorant",
  queueName = "Match",
  isLive,
  isInteractive,
  onClose,
  accentColor = "#ff4655",
}: ScoreLiveOverlayProps) {
  return (
    <MiniOverlayWrapper
      id="score"
      title="Score Live"
      isInteractive={isInteractive}
      onClose={onClose}
      accentColor="#22c55e"
      defaultX={40}
      defaultY={40}
      minWidth={170}
    >
      <div className="flex flex-col items-center justify-center gap-1">
        {/* Score Grand Format */}
        <div className="flex items-center gap-3 font-mono font-black text-2xl tracking-tight leading-none my-1">
          <span className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">
            {allyScore}
          </span>
          <span className="text-white/30 text-lg font-light">-</span>
          <span className="text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.4)]">
            {enemyScore}
          </span>
        </div>

        {/* Détails Round & Map */}
        <div className="flex items-center gap-2 text-[10px] text-white/60">
          {round !== undefined && round > 0 && (
            <span className="px-1.5 py-0.2 rounded bg-white/10 font-mono font-bold text-white text-[9px]">
              R{round}
            </span>
          )}
          <span className="truncate max-w-[90px] font-medium">{mapName}</span>
          <span className="w-1 h-1 rounded-full bg-white/30" />
          <span className="text-white/40 truncate max-w-[60px]">{queueName}</span>
        </div>

        {/* Statut Live */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isLive ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
            }`}
          />
          <span className="text-[9px] font-black uppercase tracking-widest text-white/40">
            {isLive ? "En Direct" : "En Attente"}
          </span>
        </div>
      </div>
    </MiniOverlayWrapper>
  );
}
