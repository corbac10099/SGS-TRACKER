"use client";

import React, { useState, useMemo } from "react";
import MiniOverlayWrapper from "./MiniOverlayWrapper";

interface WeaponSuggestion {
  name: string;
  cost: number;
  category: "Pistolet" | "SMG" | "Fusil" | "Sniper" | "Lourd";
  tier: "eco" | "force" | "full" | "bonus";
  description: string;
  fav?: boolean;
}

const WEAPONS_DATABASE: WeaponSuggestion[] = [
  // Pistolets
  { name: "Classic", cost: 0, category: "Pistolet", tier: "eco", description: "Gratuit, idéal pour économiser à fond" },
  { name: "Ghost", cost: 500, category: "Pistolet", tier: "eco", description: "Précis et silencieux, parfait en round 1", fav: true },
  { name: "Sheriff", cost: 800, category: "Pistolet", tier: "force", description: "One-tap tête à courte portée, gros impact" },

  // SMG / Éco
  { name: "Stinger", cost: 1100, category: "SMG", tier: "force", description: "Cadence folle pour rush ou embuscade" },
  { name: "Spectre", cost: 1600, category: "SMG", tier: "force", description: "Polyvalent, mobile et silencieux", fav: true },
  { name: "Marshal", cost: 950, category: "Sniper", tier: "force", description: "101 corps, one-shot tête, rentable" },

  // Fusils
  { name: "Guardian", cost: 2250, category: "Fusil", tier: "force", description: "One-shot tête toute distance, semi-auto" },
  { name: "Bulldog", cost: 2050, category: "Fusil", tier: "force", description: "Burst précis au viseur, économique" },
  { name: "Vandal", cost: 2900, category: "Fusil", tier: "full", description: "160 tête constante, l'arme reine des duels", fav: true },
  { name: "Phantom", cost: 2900, category: "Fusil", tier: "full", description: "Moins de recul, silencieux, idéal en fumigène" },
  { name: "Operator", cost: 4700, category: "Sniper", tier: "full", description: "One-shot corps, contrôle total de ligne" },
];

interface EcoAdvisorOverlayProps {
  isInteractive: boolean;
  onClose: () => void;
  accentColor?: string;
  round?: number;
  allyScore?: number;
  enemyScore?: number;
}

export default function EcoAdvisorOverlay({
  isInteractive,
  onClose,
  accentColor = "#f59e0b",
  round = 1,
  allyScore = 0,
  enemyScore = 0,
}: EcoAdvisorOverlayProps) {
  const [credits, setCredits] = useState<number>(() => {
    // Estimation de base selon le round
    if (round === 1 || round === 13) return 800;
    return 3400;
  });

  // Calcul du type d'achat recommandé
  const strategy = useMemo(() => {
    if (round === 1 || round === 13) {
      return {
        label: "ROUND PISTOL",
        color: "text-amber-400",
        badge: "bg-amber-500/15 border-amber-500/30",
        advice: "Achetez Ghost ou Classic + Bouclier léger + Sorts",
        shield: "Léger (400) ou Sorts",
      };
    }
    if (credits < 2000) {
      return {
        label: "ÉCO STRICTE",
        color: "text-rose-400",
        badge: "bg-rose-500/15 border-rose-500/30",
        advice: "Gardez vos crédits pour le prochain round (minimum 3900 au round suivant)",
        shield: "Aucun",
      };
    }
    if (credits >= 2000 && credits < 3900) {
      return {
        label: "SEMI-ÉCO / FORCE",
        color: "text-amber-300",
        badge: "bg-amber-500/15 border-amber-500/30",
        advice: "Achetez Spectre ou Bulldog + Bouclier léger si l'équipe force",
        shield: "Léger (400)",
      };
    }
    return {
      label: "FULL BUY",
      color: "text-emerald-400",
      badge: "bg-emerald-500/15 border-emerald-500/30",
      advice: "Vandal ou Phantom + Gros Bouclier + Tous les sorts",
      shield: "Lourd (1000)",
    };
  }, [credits, round]);

  // Suggestions filtrées
  const suggestions = useMemo(() => {
    if (round === 1 || round === 13) {
      return WEAPONS_DATABASE.filter((w) => w.cost <= 800);
    }
    if (credits < 2000) {
      return WEAPONS_DATABASE.filter((w) => w.cost <= 800);
    }
    if (credits < 3900) {
      return WEAPONS_DATABASE.filter((w) => w.cost >= 950 && w.cost <= 2250);
    }
    return WEAPONS_DATABASE.filter((w) => w.tier === "full" || w.fav);
  }, [credits, round]);

  return (
    <MiniOverlayWrapper
      id="eco"
      title="Conseiller Éco"
      isInteractive={isInteractive}
      onClose={onClose}
      accentColor="#f59e0b"
      defaultX={40}
      defaultY={220}
      minWidth={230}
    >
      <div className="flex flex-col gap-2">
        {/* Contrôle des crédits & Estimation */}
        <div className="flex items-center justify-between bg-black/40 p-1.5 rounded-lg border border-white/5">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold">
              Vos Crédits
            </span>
            <span className="text-sm font-black font-mono text-amber-400">
              {credits} ¤
            </span>
          </div>

          {/* Boutons d'ajustement rapide */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCredits((c) => Math.max(0, c - 500))}
              className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-xs font-mono font-bold text-white transition-colors"
              title="-500"
            >
              -
            </button>
            <button
              onClick={() => setCredits((c) => Math.min(9000, c + 500))}
              className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-xs font-mono font-bold text-white transition-colors"
              title="+500"
            >
              +
            </button>
          </div>
        </div>

        {/* Stratégie Recommandée */}
        <div className={`p-2 rounded-lg border text-left flex flex-col gap-1 ${strategy.badge}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-black uppercase tracking-wider ${strategy.color}`}>
              {strategy.label}
            </span>
            <span className="text-[9px] text-white/50 font-mono">
              Bouclier: <strong className="text-white">{strategy.shield}</strong>
            </span>
          </div>
          <p className="text-[10px] text-white/80 leading-snug">
            {strategy.advice}
          </p>
        </div>

        {/* Suggestions d'armes adaptées */}
        <div className="space-y-1">
          <div className="text-[9px] uppercase tracking-wider font-bold text-white/40 px-0.5">
            Armes suggérées pour votre budget :
          </div>
          {suggestions.slice(0, 3).map((w) => (
            <div
              key={w.name}
              className="flex items-center justify-between p-1.5 rounded-lg bg-black/30 border border-white/5 hover:border-white/15 transition-colors text-left"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                {w.fav && (
                  <span className="text-[10px] text-amber-400" title="Arme recommandée selon vos stats">
                    ★
                  </span>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white truncate">{w.name}</span>
                  <span className="text-[9px] text-white/40 truncate">{w.description}</span>
                </div>
              </div>

              <span className="text-[10px] font-mono font-black text-amber-300 ml-2 whitespace-nowrap">
                {w.cost} ¤
              </span>
            </div>
          ))}
        </div>
      </div>
    </MiniOverlayWrapper>
  );
}
