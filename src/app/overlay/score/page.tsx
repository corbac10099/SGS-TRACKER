"use client";

import React, { useState, useEffect } from "react";
import {
  startDragWindow,
  setWindowVisible,
  getThemeBackgroundColor,
} from "@/lib/desktop";

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
  map?: {
    name: string;
  };
  queue?: string;
  score?: {
    ally: number;
    enemy: number;
  };
}

export default function ScoreOverlayPage() {
  const [data, setData] = useState<LiveMatchData | null>(null);
  const [themeName, setThemeName] = useState("dark");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = localStorage.getItem("spycam_theme") || "dark";
    setThemeName(t);
  }, []);

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
        timer = setTimeout(poll, 2000);
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
  const round = data?.round ?? (data?.score ? allyScore + enemyScore + 1 : 1);
  const mapName = data?.map?.name || "Valorant";
  const queueName = data?.queue || "Match";

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button")) return;
    startDragWindow();
  };

  const handleClose = async () => {
    await setWindowVisible("overlay-score", false);
    try {
      const saved = JSON.parse(localStorage.getItem("sgs_active_mini_overlays") || "{}");
      saved.score = false;
      localStorage.setItem("sgs_active_mini_overlays", JSON.stringify(saved));
      window.dispatchEvent(new Event("storage"));
    } catch {}
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-1 bg-transparent select-none overflow-hidden">
      <div
        onPointerDown={handlePointerDown}
        data-tauri-drag-region
        className="w-full max-w-[240px] px-3 py-1.5 rounded-[22px] border cursor-grab active:cursor-grabbing select-none transition-all duration-200 flex flex-col gap-0.5"
        style={{
          backgroundColor: `${bgColor}f2`,
          borderColor: "#22c55e80",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.85), 0 0 15px rgba(34, 197, 94, 0.25)",
        }}
      >
        {/* En-tête sobre : Statut direct + bouton fermer */}
        <div className="flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLive ? "bg-emerald-400 animate-pulse" : "bg-white/40"
              }`}
            />
            <span className="text-[9px] font-black tracking-widest uppercase text-emerald-400 font-mono">
              {isLive ? "SCORE DIRECT" : "EN ATTENTE"}
            </span>
          </div>

          <button
            onClick={handleClose}
            className="pointer-events-auto w-4 h-4 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-colors cursor-pointer text-[10px]"
            title="Fermer ce mini-overlay"
          >
            ✕
          </button>
        </div>

        {/* Score Grand Format */}
        <div className="flex items-center justify-center gap-3 font-mono font-black text-2xl tracking-tight leading-none my-0.5">
          <span className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">
            {allyScore}
          </span>
          <span className="text-white/30 text-lg font-light">-</span>
          <span className="text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.4)]">
            {enemyScore}
          </span>
        </div>

        {/* Détails Round & Map */}
        <div className="flex items-center justify-center gap-1.5 text-[9px] text-white/60">
          <span className="px-1.5 py-0.2 rounded bg-white/10 font-mono font-bold text-white text-[8px]">
            R{round}
          </span>
          <span className="truncate max-w-[90px] font-medium">{mapName}</span>
          <span className="w-1 h-1 rounded-full bg-white/30" />
          <span className="text-white/40 truncate max-w-[65px]">{queueName}</span>
        </div>
      </div>
    </div>
  );
}
