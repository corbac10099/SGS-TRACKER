"use client";

import React, { useState, useEffect } from "react";
import MiniOverlayWrapper from "./MiniOverlayWrapper";

interface HudPillOverlayProps {
  // Score actuel ou session
  allyScore?: number;
  enemyScore?: number;
  sessionWins?: number;
  sessionLosses?: number;
  // Stats
  hsRate?: number;
  kdRatio?: number;
  // Contrôle
  isInteractive: boolean;
  onClose: () => void;
  accentColor?: string;
  themeBg?: string;
  isLive?: boolean;
}

export default function HudPillOverlay({
  allyScore = 0,
  enemyScore = 0,
  sessionWins,
  sessionLosses,
  hsRate = 32,
  kdRatio = 1.45,
  isInteractive,
  onClose,
  accentColor = "#ff4655",
  themeBg = "#0c1015",
  isLive = true,
}: HudPillOverlayProps) {
  // Mode d'affichage du premier bloc : Score en direct (5 - 3) ou Session (0V - 1D)
  const [showSessionWins, setShowSessionWins] = useState(false);

  // Valeurs calculées
  const displayHs = Math.round(hsRate);
  const displayKd = kdRatio.toFixed(2);

  // Bascule au clic sur le score entre manche actuelle et bilan de session
  const toggleScoreMode = (e: React.MouseEvent) => {
    if (!isInteractive) return;
    e.stopPropagation();
    setShowSessionWins(!showSessionWins);
  };

  return (
    <MiniOverlayWrapper
      id="hud_pill"
      title="HUD Compact"
      isInteractive={isInteractive}
      onClose={onClose}
      accentColor={accentColor}
      defaultX={60}
      defaultY={25}
      minWidth={250}
      noFrame={true}
    >
      <div
        className="relative px-3.5 py-1.5 rounded-[22px] border shadow-2xl flex flex-col gap-0.5 select-none transition-all duration-200"
        style={{
          backgroundColor: `${themeBg}f2`,
          borderColor: `${accentColor}90`,
          boxShadow: `0 10px 35px rgba(0, 0, 0, 0.85), 0 0 16px ${accentColor}30`,
        }}
      >
        {/* En-tête : Point pulsant + SESSION ou MATCH */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: accentColor }}
            />
            <span
              className="text-[9px] font-black tracking-widest uppercase"
              style={{ color: accentColor }}
            >
              {showSessionWins ? "SESSION" : isLive ? "LIVE MATCH" : "MATCH"}
            </span>
          </div>

          {isInteractive && (
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] text-white/35 uppercase tracking-wider font-mono">
                F9 déplace
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/15 transition-colors cursor-pointer text-[9px]"
                title="Fermer ce mini-overlay"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* 3 Blocs Horizontaux alignés (comme sur l'image) */}
        <div className="flex items-center justify-between gap-1 pt-0.5">
          {/* BLOC 1 : Score (ex: 5 - 3) ou Session (ex: 0V - 1D) */}
          <div
            onClick={toggleScoreMode}
            className={`flex items-baseline gap-1 font-mono font-black text-xl tracking-tight leading-none px-1 py-0.5 rounded-lg transition-colors ${
              isInteractive ? "hover:bg-white/5 cursor-pointer" : ""
            }`}
            title={isInteractive ? "Cliquer pour basculer Score / Bilan Session" : undefined}
          >
            {showSessionWins && sessionWins !== undefined ? (
              <>
                <span className="text-[#22c55e]">{sessionWins}V</span>
                <span className="text-white/30 text-sm font-light">-</span>
                <span className="text-[#ff4655]">{sessionLosses ?? 0}D</span>
              </>
            ) : (
              <>
                <span className="text-[#22c55e]">{allyScore}</span>
                <span className="text-white/30 text-sm font-light">-</span>
                <span className="text-[#ff4655]">{enemyScore}</span>
              </>
            )}
          </div>

          {/* Séparateur Vertical */}
          <div className="w-[1px] h-7 bg-white/15" />

          {/* BLOC 2 : HEADSHOT % */}
          <div className="flex flex-col items-center justify-center px-2">
            <div className="font-mono font-black text-lg leading-none text-white flex items-baseline">
              <span>{displayHs}</span>
              <span className="text-xs text-white/50 ml-0.5 font-normal">%</span>
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-white/45 mt-0.5">
              HS
            </span>
          </div>

          {/* Séparateur Vertical */}
          <div className="w-[1px] h-7 bg-white/15" />

          {/* BLOC 3 : RATIO K/D */}
          <div className="flex flex-col items-center justify-center px-2">
            <div className="font-mono font-black text-lg leading-none text-white">
              {displayKd}
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-white/45 mt-0.5">
              K/D
            </span>
          </div>
        </div>
      </div>
    </MiniOverlayWrapper>
  );
}
