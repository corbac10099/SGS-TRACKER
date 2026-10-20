"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  startDragWindow,
  setWindowVisible,
  getThemeBackgroundColor,
} from "@/lib/desktop";
import { IconCrosshair, IconSkull } from "@/components/icons/SpyIcons";

function extractThemeAccent(t: string | null | undefined): string {
  if (!t) return "#ff4655";
  if (t === "midnight") return "#8c64ff";
  if (t === "ocean") return "#32c8b4";
  if (t === "emerald") return "#10b981";
  if (t === "sunset") return "#f97316";
  if (t === "royal") return "#3b82f6";
  if (t === "cyberpunk") return "#f43f5e";
  return "#ff4655";
}

interface LiveMatchData {
  active: boolean;
  status: "OFFLINE" | "MENUS" | "PREGAME" | "INGAME" | "ERROR";
  round?: number;
  score?: {
    ally: number;
    enemy: number;
  };
}

export default function HudOverlayPage() {
  const [data, setData] = useState<LiveMatchData | null>(null);
  const [themeName, setThemeName] = useState("dark");
  const [showSessionWins, setShowSessionWins] = useState(false);
  const [sessionWins, setSessionWins] = useState(0);
  const [sessionLosses, setSessionLosses] = useState(0);

  // Stats du joueur pour le HUD (synchronisées avec les stats récentes)
  const [hsRate, setHsRate] = useState(28);
  const [kdRatio, setKdRatio] = useState(1.45);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = localStorage.getItem("spycam_theme") || "dark";
    setThemeName(t);

    try {
      const savedStats = localStorage.getItem("sgs_recent_player_stats");
      if (savedStats) {
        const parsed = JSON.parse(savedStats);
        if (parsed.hsRate) setHsRate(parsed.hsRate);
        if (parsed.kdRatio) setKdRatio(parsed.kdRatio);
      }
    } catch {}
  }, []);

  // Polling du match en direct
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    let isCancelled = false;

    const poll = async () => {
      try {
        const res = await fetch("/api/valorant/live-match", { cache: "no-store" });
        if (res.ok && !isCancelled) {
          const json: LiveMatchData = await res.json();
          setData(json);
        }
      } catch {}

      if (!isCancelled) {
        timer = setTimeout(poll, 2500);
      }
    };

    poll();

    return () => {
      isCancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const accentColor = extractThemeAccent(themeName);
  const bgColor = getThemeBackgroundColor(themeName);
  const isLive = data?.status === "INGAME";
  const allyScore = data?.score?.ally ?? 0;
  const enemyScore = data?.score?.enemy ?? 0;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button")) return;
    startDragWindow();
  };

  const handleClose = async () => {
    await setWindowVisible("overlay-hud", false);
    try {
      const saved = JSON.parse(localStorage.getItem("sgs_active_mini_overlays") || "{}");
      saved.hud_pill = false;
      localStorage.setItem("sgs_active_mini_overlays", JSON.stringify(saved));
      window.dispatchEvent(new Event("storage"));
    } catch {}
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center p-1 bg-transparent select-none overflow-hidden">
      <div
        onPointerDown={handlePointerDown}
        data-tauri-drag-region
        className="w-full max-w-[330px] px-3.5 py-1.5 rounded-[22px] border cursor-grab active:cursor-grabbing select-none transition-all duration-200 flex flex-col gap-0.5"
        style={{
          backgroundColor: `${bgColor}f2`,
          borderColor: `${accentColor}90`,
          boxShadow: `0 10px 30px rgba(0, 0, 0, 0.85), 0 0 15px ${accentColor}30`,
        }}
      >
        {/* En-tête : Badge Live/Session + F9 déplace + Croix de fermeture */}
        <div className="flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: accentColor }}
            />
            <span
              className="text-[9px] font-black tracking-widest uppercase font-mono"
              style={{ color: accentColor }}
            >
              {showSessionWins ? "SESSION" : isLive ? "LIVE MATCH" : "SGS TRACKER"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            <span className="text-[8px] text-white/35 uppercase tracking-wider font-mono">
              F9 déplace
            </span>
            <button
              onClick={handleClose}
              className="w-4 h-4 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-colors cursor-pointer text-[10px]"
              title="Fermer ce mini-overlay"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ─── 3 Blocs Centraux : Score | HS% | K/D ─── */}
        <div className="grid grid-cols-3 gap-1.5 pt-0.5 items-center">
          {/* Bloc 1 : Score (ou Session) */}
          <button
            onClick={() => setShowSessionWins(!showSessionWins)}
            className="flex flex-col items-center justify-center py-0.5 px-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="Cliquer pour basculer entre Score du match et Bilan de session"
          >
            <span className="text-[8px] font-bold uppercase tracking-wider text-white/45">
              {showSessionWins ? "Session" : "Score"}
            </span>
            <div className="flex items-center gap-1 font-mono font-black text-sm leading-tight mt-0.5">
              {showSessionWins ? (
                <>
                  <span className="text-emerald-400">{sessionWins}V</span>
                  <span className="text-white/30 text-[10px]">-</span>
                  <span className="text-rose-400">{sessionLosses}D</span>
                </>
              ) : (
                <>
                  <span className="text-emerald-400 font-bold">{allyScore}</span>
                  <span className="text-white/30 text-[10px] font-light">-</span>
                  <span className="text-rose-400 font-bold">{enemyScore}</span>
                </>
              )}
            </div>
          </button>

          {/* Bloc 2 : Taux de Headshots */}
          <div className="flex flex-col items-center justify-center py-0.5 px-1 rounded-xl bg-white/[0.04]">
            <div className="flex items-center gap-1 text-white/45">
              <IconCrosshair size={9} />
              <span className="text-[8px] font-bold uppercase tracking-wider">HS%</span>
            </div>
            <div className="flex items-baseline gap-0.5 mt-0.5">
              <span
                className="font-mono font-black text-sm leading-tight"
                style={{ color: hsRate >= 25 ? "#34d399" : "#e2e8f0" }}
              >
                {Math.round(hsRate)}
              </span>
              <span className="text-[9px] text-white/40 font-mono">%</span>
            </div>
          </div>

          {/* Bloc 3 : Ratio K/D */}
          <div className="flex flex-col items-center justify-center py-0.5 px-1 rounded-xl bg-white/[0.04]">
            <div className="flex items-center gap-1 text-white/45">
              <IconSkull size={9} />
              <span className="text-[8px] font-bold uppercase tracking-wider">K / D</span>
            </div>
            <div className="flex items-baseline gap-0.5 mt-0.5">
              <span
                className="font-mono font-black text-sm leading-tight"
                style={{
                  color: kdRatio >= 1.2 ? "#34d399" : kdRatio >= 1.0 ? "#e2e8f0" : "#f43f5e",
                }}
              >
                {kdRatio.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
