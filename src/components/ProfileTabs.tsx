"use client";

import React from "react";
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

const GAME_MODES = [
  { id: "all", label: "All" },
  { id: "competitive", label: "Competitive" },
  { id: "unrated", label: "Unrated" },
  { id: "other", label: "Others" },
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
  return (
    <div className="w-full mt-4 sm:mt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[var(--color-border)] mb-4 sm:mb-6 gap-3">
        <div
          ref={profileTabsContainerRef}
          className="relative flex items-center gap-4 sm:gap-8"
        >
          {/* Sliding Red Underline Indicator */}
          <div
            className="absolute bottom-0 h-[2.5px] rounded-full bg-[var(--color-val-red)] shadow-[0_0_12px_rgba(255,70,85,0.9)] pointer-events-none z-10"
            style={{
              transform: `translateX(${profileUnderlineStyle.left}px)`,
              width: `${profileUnderlineStyle.width}px`,
              opacity: profileUnderlineStyle.opacity,
              transition:
                "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
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
                className={`pb-3 text-xs sm:text-sm uppercase tracking-widest font-black transition-colors duration-300 relative cursor-pointer select-none active:scale-95 ${
                  isActive
                    ? "text-[var(--color-val-red)] drop-shadow-[0_0_8px_rgba(255,70,85,0.4)]"
                    : "text-[var(--color-text-secondary)] hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Filtres mode de jeu & saison */}
        <div className="flex items-center gap-2 sm:gap-3 pb-3 flex-wrap">
          <select
            value={selectedSeason}
            onChange={(e) => {
              onSeasonChange(e.target.value);
              onResetVisibleMatches();
            }}
            className="bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs font-bold rounded-lg px-2.5 sm:px-3 py-1.5 outline-none cursor-pointer hover:border-[var(--color-val-red)] transition-colors"
          >
            <option value="all">Toutes les saisons</option>
            {availableSeasons.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Mode Filter Capsule with Sliding Pill */}
          <div
            ref={gameModeContainerRef}
            className="relative flex items-center gap-0.5 p-1 rounded-2xl glass-pill"
          >
            <div
              className="absolute top-1 bottom-1 rounded-xl bg-[var(--color-val-red)] shadow-[0_0_18px_rgba(255,70,85,0.6)] pointer-events-none z-0"
              style={{
                transform: `translateX(${gameModePillStyle.left}px)`,
                width: `${gameModePillStyle.width}px`,
                opacity: gameModePillStyle.opacity,
                transition:
                  "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />

            {GAME_MODES.map((mode) => {
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
                  }}
                  onMouseEnter={() => sounds.playHover()}
                  className={`relative z-10 px-3 py-1 rounded-xl text-xs font-bold transition-colors duration-200 cursor-pointer select-none active:scale-95 whitespace-nowrap ${
                    isActive
                      ? "text-white"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
