"use client";

import React from "react";

export interface OverlayCatalogItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  badge?: string;
}

export const OVERLAY_CATALOG: OverlayCatalogItem[] = [
  {
    id: "hud_pill",
    name: "HUD Compact (Score + HS% + K/D)",
    description: "Pilule ultra compacte aux coins arrondis (Score direct, Headshot % et Ratio KD)",
    icon: "🔥",
    color: "#ff4655",
    badge: "Style Pro Tracker",
  },
  {
    id: "score",
    name: "Score Live Épuré",
    description: "Score des manches en direct (API Valorant locale, format sobre)",
    icon: "🏆",
    color: "#22c55e",
    badge: "Temps Réel",
  },
  {
    id: "stats",
    name: "Stats Joueur Détaillées",
    description: "K/D/A, Taux Headshot avec jauge et score ACS",
    icon: "🎯",
    color: "#38bdf8",
    badge: "SGS Cloud",
  },
  {
    id: "eco",
    name: "Conseiller Économie",
    description: "Recommandations d'achat d'armes et boucliers selon vos crédits",
    icon: "💰",
    color: "#f59e0b",
    badge: "Stratégie",
  },
];

interface OverlaySelectorProps {
  activeOverlays: Record<string, boolean>;
  onToggle: (id: string) => void;
  accentColor: string;
  isInteractive: boolean;
  onToggleInteractive?: () => void;
  shortcutKey?: string;
}

export default function OverlaySelector({
  activeOverlays,
  onToggle,
  accentColor,
  isInteractive,
  onToggleInteractive,
  shortcutKey = "F9",
}: OverlaySelectorProps) {
  return (
    <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
      {/* Bannière explicative F9 & Mini-Overlays indépendants */}
      <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isInteractive ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
              }`}
            />
            <span className="text-xs font-black uppercase tracking-wider text-white">
              {isInteractive ? "Mode Déplacement des Fenêtres (F9)" : "Mode Jeu Actif (Clics Traversants)"}
            </span>
          </div>
          <p className="text-[11px] text-white/50 max-w-md">
            Les mini-overlays activés restent affichés sur votre écran même lorsque le grand panneau est masqué.
            Ils sont <strong className="text-white">traversables par vos tirs</strong> en pleine partie.
          </p>
        </div>

        {onToggleInteractive && (
          <button
            onClick={onToggleInteractive}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border shrink-0 cursor-pointer ${
              isInteractive
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                : "bg-white/10 text-white hover:bg-white/15 border-white/10"
            }`}
          >
            {isInteractive ? "Verrouiller (F9)" : "Déplacer (F9)"}
          </button>
        )}
      </div>

      {/* Liste des mini-overlays disponibles */}
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-widest font-black text-white/40 px-1">
          Mini-Overlays Flottants Disponibles :
        </div>

        {OVERLAY_CATALOG.map((item) => {
          const isActive = Boolean(activeOverlays[item.id]);

          return (
            <div
              key={item.id}
              onClick={() => onToggle(item.id)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isActive
                  ? "bg-white/[0.04] shadow-lg"
                  : "bg-black/20 hover:bg-white/[0.02] border-white/5 opacity-70"
              }`}
              style={{
                borderColor: isActive ? `${item.color}70` : undefined,
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg border shrink-0"
                  style={{
                    backgroundColor: `${item.color}15`,
                    borderColor: `${item.color}35`,
                  }}
                >
                  {item.icon}
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wide text-white">
                      {item.name}
                    </span>
                    {item.badge && (
                      <span
                        className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase font-mono"
                        style={{
                          backgroundColor: `${item.color}20`,
                          color: item.color,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-white/50 mt-0.5 truncate">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Bouton switch élégant */}
              <div
                className={`w-11 h-6 rounded-full transition-colors p-0.5 relative flex items-center shrink-0 ${
                  isActive ? "justify-end" : "justify-start bg-white/10"
                }`}
                style={{
                  backgroundColor: isActive ? item.color : undefined,
                }}
              >
                <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
