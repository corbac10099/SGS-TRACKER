"use client";

import React from "react";
import { sounds } from "@/lib/soundEffects";
import { IconKeyboard } from "./icons/SpyIcons";

export interface HotkeysHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  ecoMode: boolean;
  onToggleEcoMode: () => void;
}

export default function HotkeysHelpModal({
  isOpen,
  onClose,
  ecoMode,
  onToggleEcoMode,
}: HotkeysHelpModalProps) {
  if (!isOpen) return null;

  const hotkeysList = [
    { key: "1", desc: "Aller à l'onglet Performance / Accueil", category: "Navigation" },
    { key: "2", desc: "Aller au Wiki & Guides d'Agents", category: "Navigation" },
    { key: "3", desc: "Consulter l'Historique des Matchs", category: "Navigation" },
    { key: "4", desc: "Rechercher un Groupe (LFG / Lobbies)", category: "Navigation" },
    { key: "/", desc: "Focaliser la barre de recherche", category: "Actions" },
    { key: "S", desc: "Ouvrir ou fermer les Paramètres", category: "Actions" },
    { key: "E", desc: "Basculer le Mode Éco (Basse consommation)", category: "Performances" },
    { key: "Z", desc: "Zoom / Loupe réticule (sur le lecteur vidéo)", category: "Médias" },
    { key: "?", desc: "Afficher ce panneau des raccourcis", category: "Aide" },
    { key: "Esc", desc: "Fermer les modales et tiroirs ouverts", category: "Aide" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-[var(--color-val-red)]/40 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative flex flex-col gap-6"
      >
        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[var(--color-surface)] hover:bg-[var(--color-val-red)] border border-white/20 text-white flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--color-val-red)]/15 border border-[var(--color-val-red)]/40 flex items-center justify-center text-[var(--color-val-red)] font-black text-base shadow-sm">
            <IconKeyboard size={20} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-[var(--color-text-primary)]">
              Raccourcis Clavier
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Naviguez ultra rapidement dans SGS-TRACKER
            </p>
          </div>
        </div>

        {/* Hotkeys Grid */}
        <div className="grid grid-cols-1 gap-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
          {hotkeysList.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--color-background)]/60 border border-[var(--color-border)] hover:border-[var(--color-val-red)]/30 transition-all"
            >
              <span className="text-xs font-bold text-[var(--color-text-primary)]">{item.desc}</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-[var(--color-surface)] border border-white/20 text-white font-mono text-xs font-black shadow-inner min-w-[28px] text-center">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer: Eco mode quick toggle */}
        <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--color-text-secondary)]">Mode Éco Actif :</span>
            <span className={`text-xs font-black uppercase ${ecoMode ? "text-emerald-400" : "text-gray-500"}`}>
              {ecoMode ? "Activé" : "Désactivé"}
            </span>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onToggleEcoMode();
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-text-primary)] transition-all cursor-pointer"
          >
            Basculer (E)
          </button>
        </div>
      </div>
    </div>
  );
}
