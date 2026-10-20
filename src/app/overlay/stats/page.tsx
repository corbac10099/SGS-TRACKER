"use client";

import React, { useState, useEffect } from "react";
import {
  startDragWindow,
  setWindowVisible,
  getThemeBackgroundColor,
} from "@/lib/desktop";
import { IconCrosshair, IconSkull, IconFlame } from "@/components/icons/SpyIcons";

function extractThemeAccent(t: string | null | undefined): string {
  if (!t) return "#38bdf8";
  if (t === "midnight") return "#8c64ff";
  if (t === "ocean") return "#32c8b4";
  if (t === "emerald") return "#10b981";
  return "#38bdf8";
}

interface MatchStats {
  kills: number;
  deaths: number;
  assists: number;
  hsRate: number;
  acs: number;
  won: boolean;
  map: string;
  agent: string;
}

export default function StatsOverlayPage() {
  const [stats, setStats] = useState<MatchStats>({
    kills: 18,
    deaths: 12,
    assists: 6,
    hsRate: 29,
    acs: 245,
    won: true,
    map: "Ascent",
    agent: "Jett",
  });
  const [themeName, setThemeName] = useState("dark");
  const [playerName, setPlayerName] = useState("Vous");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = localStorage.getItem("spycam_theme") || "dark";
    setThemeName(t);

    const savedRiot = localStorage.getItem("spycam_my_riot_id");
    if (savedRiot) setPlayerName(savedRiot.split("#")[0]);

    try {
      const savedStats = localStorage.getItem("sgs_recent_player_stats");
      if (savedStats) {
        setStats((prev) => ({ ...prev, ...JSON.parse(savedStats) }));
      }
    } catch {}
  }, []);

  const accentColor = extractThemeAccent(themeName);
  const bgColor = getThemeBackgroundColor(themeName);
  const kdRatio = stats.deaths > 0 ? (stats.kills / stats.deaths).toFixed(2) : stats.kills.toFixed(2);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button")) return;
    startDragWindow();
  };

  const handleClose = async () => {
    await setWindowVisible("overlay-stats", false);
    try {
      const saved = JSON.parse(localStorage.getItem("sgs_active_mini_overlays") || "{}");
      saved.stats = false;
      localStorage.setItem("sgs_active_mini_overlays", JSON.stringify(saved));
      window.dispatchEvent(new Event("storage"));
    } catch {}
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-1 bg-transparent select-none overflow-hidden">
      <div
        onPointerDown={handlePointerDown}
        data-tauri-drag-region
        className="w-full max-w-[270px] p-2.5 rounded-[22px] border cursor-grab active:cursor-grabbing select-none transition-all duration-200 flex flex-col gap-1.5"
        style={{
          backgroundColor: `${bgColor}f2`,
          borderColor: "#38bdf880",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.85), 0 0 15px rgba(56, 189, 248, 0.25)",
        }}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-[9px] font-black tracking-widest uppercase text-sky-400 font-mono">
              STATS MATCH • {playerName}
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

        {/* Ligne principale K/D/A et Ratio */}
        <div className="flex items-center justify-between px-1">
          <div className="flex flex-col">
            <span className="text-[8px] font-bold uppercase tracking-wider text-white/40">K / D / A</span>
            <span className="font-mono font-black text-base text-white">
              {stats.kills} / <span className="text-rose-400">{stats.deaths}</span> / {stats.assists}
            </span>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[8px] font-bold uppercase tracking-wider text-white/40">Ratio K/D</span>
            <span
              className="font-mono font-black text-base"
              style={{ color: Number(kdRatio) >= 1.0 ? "#34d399" : "#f43f5e" }}
            >
              {kdRatio}
            </span>
          </div>
        </div>

        {/* Détails HS% et ACS */}
        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04]">
            <IconCrosshair size={12} className="text-white/40" />
            <div className="flex flex-col">
              <span className="text-[7px] uppercase font-bold text-white/40">Headshot</span>
              <span className="font-mono font-bold text-xs text-white">{stats.hsRate}%</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04]">
            <IconFlame size={12} className="text-amber-400/80" />
            <div className="flex flex-col">
              <span className="text-[7px] uppercase font-bold text-white/40">Score ACS</span>
              <span className="font-mono font-bold text-xs text-amber-300">{stats.acs}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
