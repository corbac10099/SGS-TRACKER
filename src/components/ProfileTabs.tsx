"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { sounds } from "@/lib/soundEffects";

export interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  gameMode: string;
  onGameModeChange: (mode: string) => void;
  selectedSeason: string;
  onSeasonChange: (season: string) => void;
  availableSeasons: string[];
  onResetVisibleMatches: () => void;

  // Profile tabs sliding underline
  profileTabsContainerRef: React.RefObject<HTMLDivElement | null>;
  profileTabRefs: React.MutableRefObject<
    Record<string, HTMLButtonElement | null>
  >;
  profileUnderlineStyle: { left: number; width: number; opacity: number };

  // Game mode pill
  gameModeContainerRef: React.RefObject<HTMLDivElement | null>;
  gameModeBtnRefs: React.MutableRefObject<
    Record<string, HTMLButtonElement | null>
  >;
  gameModePillStyle: { left: number; width: number; opacity: number };
}

const TABS = [
  { id: "performance", label: "Performances" },
  { id: "agents", label: "Agents" },
  { id: "maps", label: "Cartes" },
  { id: "matches", label: "Historique" },
];

// Modes toujours directement visibles dans la pilule principale
const PRIMARY_MODES = [
  { id: "all", label: "Tous" },
  { id: "competitive", label: "Compétitif" },
  { id: "unrated", label: "Non classé" },
  { id: "deathmatch", label: "Deathmatch" },
];

// Modes secondaires disponibles dans le menu déroulant "Voir plus"
const DEFAULT_SECONDARY_MODES = [
  { id: "swiftplay", label: "Swiftplay" },
  { id: "team_deathmatch", label: "Team Deathmatch" },
  { id: "gauntlet", label: "Gauntlet: Glitched" },
  { id: "spikerush", label: "Spike Rush" },
  { id: "escalation", label: "Course à l'armement" },
  { id: "replication", label: "Copie conforme" },
  { id: "snowball", label: "Bataille de boules" },
  { id: "premier", label: "Premier" },
  { id: "other", label: "Autres modes" },
];

export default function ProfileTabs({
  activeTab,
  onTabChange,
  gameMode,
  onGameModeChange,
  selectedSeason,
  onSeasonChange,
  availableSeasons,
  onResetVisibleMatches,
  profileTabsContainerRef,
  profileTabRefs,
  profileUnderlineStyle,
  gameModeContainerRef,
  gameModeBtnRefs,
  gameModePillStyle,
}: ProfileTabsProps) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [dynamicModes, setDynamicModes] = useState<{ id: string; label: string; icon?: string }[]>([]);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const moreBtnRef = useRef<HTMLButtonElement | null>(null);

  // Charger les modes additionnels configurés depuis AppControl
  useEffect(() => {
    let isMounted = true;
    fetch("/api/cms/gamemodes")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!isMounted || !Array.isArray(data)) return;
        const extra = data
          .filter((item: any) => item && item.id && !PRIMARY_MODES.some((pm) => pm.id === item.id))
          .map((item: any) => ({
            id: item.id,
            label: item.displayName || item.name || item.id,
            icon: item.iconUrl || item.icon,
          }));
        if (extra.length > 0) {
          setDynamicModes(extra);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Liste combinée des modes secondaires
  const secondaryModes = useMemo(() => {
    if (dynamicModes.length === 0) return DEFAULT_SECONDARY_MODES;
    const combined = [...dynamicModes];
    DEFAULT_SECONDARY_MODES.forEach((d) => {
      if (!combined.some((c) => c.id === d.id)) {
        combined.push(d);
      }
    });
    return combined;
  }, [dynamicModes]);

  // Vérifier si le mode actuel fait partie du menu déroulant
  const isDropdownActive = useMemo(() => {
    return !PRIMARY_MODES.some((pm) => pm.id === gameMode);
  }, [gameMode]);

  // Nom du mode actif dans le dropdown
  const activeDropdownLabel = useMemo(() => {
    const found = secondaryModes.find((m) => m.id === gameMode);
    return found ? found.label : "Autre";
  }, [gameMode, secondaryModes]);

  // Fermer le menu lors d'un clic extérieur
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
    }
    if (isMoreOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMoreOpen]);

  // Si le mode actif est dans le dropdown, associer la référence du bouton Plus pour la pilule rouge
  useEffect(() => {
    if (isDropdownActive && moreBtnRef.current) {
      gameModeBtnRefs.current[gameMode] = moreBtnRef.current;
    }
  }, [isDropdownActive, gameMode, gameModeBtnRefs]);

  return (
    <div className="w-full mt-4 sm:mt-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between border-b border-[var(--color-border)] mb-4 sm:mb-6 gap-3 pb-1">
        {/* Onglets principaux */}
        <div
          ref={profileTabsContainerRef}
          className="relative flex items-center gap-4 sm:gap-8 overflow-x-auto max-w-full custom-scrollbar"
        >
          {/* Sliding Red Underline Indicator */}
          <div
            className="absolute bottom-0 h-[2.5px] rounded-full bg-[var(--color-val-red)] shadow-accent-sm pointer-events-none z-10"
            style={{
              transform: `translateX(${profileUnderlineStyle.left}px)`,
              width: `${profileUnderlineStyle.width}px`,
              opacity: profileUnderlineStyle.opacity,
              transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />

          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  profileTabRefs.current[tab.id] = el;
                }}
                onMouseEnter={() => sounds.playHover()}
                onClick={() => {
                  sounds.playTabSwitch();
                  onTabChange(tab.id);
                }}
                className={`pb-3 text-xs sm:text-sm uppercase tracking-widest font-black transition-colors duration-300 relative cursor-pointer select-none active:scale-95 whitespace-nowrap ${
                  isActive
                    ? "text-[var(--color-val-red)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Filtres alignés : Saison & Modes de jeu */}
        <div className="flex items-center gap-2 sm:gap-3 pb-2.5 w-full lg:w-auto justify-between lg:justify-end flex-nowrap">
          {/* Sélecteur de saison */}
          <select
            value={selectedSeason}
            onChange={(e) => {
              onSeasonChange(e.target.value);
              onResetVisibleMatches();
            }}
            className="bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs font-bold rounded-xl px-2.5 sm:px-3 py-1.5 outline-none cursor-pointer hover:border-[var(--color-val-red)] transition-colors shrink-0 shadow-sm"
          >
            <option value="all">Toutes les saisons</option>
            {availableSeasons.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Capsule de modes avec pilule animée */}
          <div
            ref={gameModeContainerRef}
            className="relative flex items-center gap-0.5 p-1 rounded-2xl glass-pill shrink-0 max-w-full"
          >
            {/* Pilule rouge glissante */}
            <div
              className="absolute top-1 bottom-1 rounded-xl bg-[var(--color-val-red)] shadow-accent-md pointer-events-none z-0"
              style={{
                transform: `translateX(${gameModePillStyle.left}px)`,
                width: `${gameModePillStyle.width}px`,
                opacity: gameModePillStyle.opacity,
                transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />

            {/* Boutons principaux */}
            {PRIMARY_MODES.map((mode) => {
              const isActive = gameMode === mode.id;
              return (
                <button
                  key={mode.id}
                  ref={(el) => {
                    gameModeBtnRefs.current[mode.id] = el;
                  }}
                  onClick={() => {
                    sounds.playTabSwitch();
                    onGameModeChange(mode.id);
                    onResetVisibleMatches();
                    setIsMoreOpen(false);
                  }}
                  onMouseEnter={() => sounds.playHover()}
                  className={`relative z-10 px-2.5 sm:px-3 py-1 rounded-xl text-xs font-bold transition-colors duration-200 cursor-pointer select-none active:scale-95 whitespace-nowrap ${
                    isActive
                      ? "text-[var(--color-accent-contrast,#ffffff)] font-black"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  {mode.label}
                </button>
              );
            })}

            {/* Bouton "Voir plus" dépliable */}
            <div className="relative z-10" ref={dropdownRef}>
              <button
                ref={(el) => {
                  moreBtnRef.current = el;
                  if (isDropdownActive) {
                    gameModeBtnRefs.current[gameMode] = el;
                  }
                }}
                onClick={() => {
                  sounds.playClick();
                  setIsMoreOpen((prev) => !prev);
                }}
                onMouseEnter={() => sounds.playHover()}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none active:scale-95 whitespace-nowrap ${
                  isDropdownActive
                    ? "text-[var(--color-accent-contrast,#ffffff)] font-black"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
                title="Autres modes de jeu"
              >
                <span>{isDropdownActive ? activeDropdownLabel : "Plus"}</span>
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${
                    isMoreOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Menu déroulant animé */}
              {isMoreOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 sm:w-60 max-h-80 overflow-y-auto glass-panel rounded-2xl border border-[var(--color-border)] shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-1.5 z-50 animate-in fade-in zoom-in-95 duration-200 backdrop-blur-xl custom-scrollbar">
                  <div className="px-2.5 py-1.5 border-b border-[var(--color-border)]/50 mb-1">
                    <span className="text-[10px] uppercase tracking-widest font-black text-[var(--color-text-secondary)]">
                      Autres Modes de Jeu
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    {secondaryModes.map((mode) => {
                      const isActive = gameMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          onClick={() => {
                            sounds.playTabSwitch();
                            onGameModeChange(mode.id);
                            onResetVisibleMatches();
                            setIsMoreOpen(false);
                          }}
                          onMouseEnter={() => sounds.playHover()}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                            isActive
                              ? "bg-[var(--color-val-red)] text-white shadow-accent-sm"
                              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                          }`}
                        >
                          <span className="truncate">{mode.label}</span>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white ml-2 shrink-0 animate-pulse" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
