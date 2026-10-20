"use client";

import React, { useState, useEffect } from "react";
import {
  startDragWindow,
  setWindowVisible,
  getThemeBackgroundColor,
} from "@/lib/desktop";

const WEAPON_RECOMMENDATIONS = {
  pistol: [
    { name: "Ghost", cost: 500, type: "Pistolet", note: "Précis à distance" },
    { name: "Classic + Bouclier léger", cost: 400, type: "Éco", note: "Survie rapprochée" },
  ],
  eco: [
    { name: "Spectre", cost: 1600, type: "SMG", note: "Polyvalent & mobile" },
    { name: "Marshal", cost: 950, type: "Sniper", note: "One-shot tête (101 corps)" },
    { name: "Sheriff", cost: 800, type: "Pistolet", note: "One-shot tête <30m" },
  ],
  force: [
    { name: "Spectre + Bouclier lourd", cost: 2600, type: "Force", note: "Meilleur ratio qualité/prix" },
    { name: "Guardian", cost: 2250, type: "Fusil", note: "One-shot tête toute distance" },
    { name: "Outlaw", cost: 2400, type: "Sniper", note: "140 dégâts corps" },
  ],
  full: [
    { name: "Vandal + Bouclier lourd", cost: 3900, type: "Full Buy", note: "160 tête (one-shot absolu)" },
    { name: "Phantom + Bouclier lourd", cost: 3900, type: "Full Buy", note: "Spray stable, silencieux" },
    { name: "Operator + Bouclier", cost: 5700, type: "Sniper", note: "One-shot corps garanti" },
  ],
};

export default function EcoOverlayPage() {
  const [credits, setCredits] = useState(3200);
  const [round, setRound] = useState(3);
  const [themeName, setThemeName] = useState("dark");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = localStorage.getItem("spycam_theme") || "dark";
    setThemeName(t);
  }, []);

  const bgColor = getThemeBackgroundColor(themeName);

  const isPistol = round === 1 || round === 13;
  const recommendations = isPistol
    ? WEAPON_RECOMMENDATIONS.pistol
    : credits < 2200
    ? WEAPON_RECOMMENDATIONS.eco
    : credits < 3900
    ? WEAPON_RECOMMENDATIONS.force
    : WEAPON_RECOMMENDATIONS.full;

  const buyAdvice = isPistol
    ? "Round Pistolet : Priorisez compétences et arme secondaire"
    : credits < 2200
    ? "Éco recommandée : Gardez pour acheter au prochain round"
    : credits < 3900
    ? "Achat forcé : Coordonnez avec les crédits de votre équipe"
    : "Full Buy : Vandal / Phantom + Bouclier lourd";

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button, input")) return;
    startDragWindow();
  };

  const handleClose = async () => {
    await setWindowVisible("overlay-eco", false);
    try {
      const saved = JSON.parse(localStorage.getItem("sgs_active_mini_overlays") || "{}");
      saved.eco = false;
      localStorage.setItem("sgs_active_mini_overlays", JSON.stringify(saved));
      window.dispatchEvent(new Event("storage"));
    } catch {}
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-1 bg-transparent select-none overflow-hidden">
      <div
        onPointerDown={handlePointerDown}
        data-tauri-drag-region
        className="w-full max-w-[280px] p-2.5 rounded-[22px] border cursor-grab active:cursor-grabbing select-none transition-all duration-200 flex flex-col gap-1.5"
        style={{
          backgroundColor: `${bgColor}f2`,
          borderColor: "#f59e0b80",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.85), 0 0 15px rgba(245, 158, 11, 0.25)",
        }}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[9px] font-black tracking-widest uppercase text-amber-400 font-mono">
              CONSEILLER ÉCO • R{round}
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

        {/* Crédits + Sélecteur de crédits */}
        <div className="flex items-center justify-between p-1.5 rounded-xl bg-white/[0.04]">
          <div className="flex flex-col">
            <span className="text-[7px] uppercase font-bold text-white/40">Vos Crédits</span>
            <span className="font-mono font-black text-sm text-amber-300">¤ {credits}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCredits((c) => Math.max(0, c - 500))}
              className="w-5 h-5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
            >
              -
            </button>
            <button
              onClick={() => setCredits((c) => Math.min(9000, c + 500))}
              className="w-5 h-5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        {/* Conseil tactique */}
        <div className="text-[9px] text-white/60 bg-white/[0.02] p-1.5 rounded-lg border border-white/5">
          {buyAdvice}
        </div>

        {/* Liste des achats recommandés */}
        <div className="flex flex-col gap-1">
          {recommendations.slice(0, 2).map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-1.5 rounded-xl bg-white/[0.03] border border-white/5"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-white truncate">{item.name}</span>
                <span className="text-[8px] text-white/40">{item.note}</span>
              </div>
              <span className="font-mono font-bold text-[10px] text-amber-400/90 shrink-0 ml-1">
                ¤ {item.cost}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
