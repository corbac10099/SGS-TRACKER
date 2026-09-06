"use client";

import { sounds } from "@/lib/soundEffects";

export interface MobileNavProps {
  activeTab: string;
  newsView: boolean;
  agentsView: boolean;
  lobbiesView?: boolean;
  settingsOpen: boolean;
  onGoHome: () => void;
  onSelectTab: (tab: string) => void;
  onOpenNews: () => void;
  onOpenAgents: () => void;
  onOpenLobbies?: () => void;
  onToggleSettings: () => void;
  onOpenMenuDrawer?: () => void;
}

export default function MobileNav({
  activeTab,
  newsView,
  agentsView,
  lobbiesView = false,
  settingsOpen,
  onGoHome,
  onSelectTab,
  onOpenNews,
  onOpenAgents,
  onOpenLobbies,
  onToggleSettings,
  onOpenMenuDrawer,
}: MobileNavProps) {
  const isHomeActive = !newsView && !agentsView && !lobbiesView && !settingsOpen && activeTab === "performance";
  const isMatchesActive = !newsView && !agentsView && !lobbiesView && !settingsOpen && activeTab === "matches";
  const isAgentsStatsActive = !newsView && !agentsView && !settingsOpen && activeTab === "agents";

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface)]/95 backdrop-blur-lg border-t border-[var(--color-border)] px-2 py-1.5 flex items-center justify-around shadow-[0_-5px_25px_rgba(0,0,0,0.5)]">
      {/* Home / Perf */}
      <button
        onMouseEnter={() => sounds.playHover()}
        onClick={() => {
          sounds.playTabSwitch();
          onGoHome();
          onSelectTab("performance");
        }}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
          isHomeActive ? "text-[var(--color-val-red)] font-bold scale-105" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isHomeActive ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span className="text-[10px] tracking-tight">Accueil</span>
      </button>

      {/* Matchs */}
      <button
        onMouseEnter={() => sounds.playHover()}
        onClick={() => {
          sounds.playTabSwitch();
          onGoHome();
          onSelectTab("matches");
        }}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
          isMatchesActive ? "text-[var(--color-val-red)] font-bold scale-105" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isMatchesActive ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span className="text-[10px] tracking-tight">Matchs</span>
      </button>

      {/* Wiki Agents */}
      <button
        onMouseEnter={() => sounds.playHover()}
        onClick={() => {
          sounds.playTabSwitch();
          onOpenAgents();
        }}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
          agentsView ? "text-[var(--color-val-red)] font-bold scale-105" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={agentsView ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
        <span className="text-[10px] tracking-tight">Agents</span>
      </button>

      {/* Salons / LFG */}
      {onOpenLobbies && (
        <button
          onMouseEnter={() => sounds.playHover()}
          onClick={() => {
            sounds.playTabSwitch();
            onOpenLobbies();
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            lobbiesView ? "text-[var(--color-val-red)] font-bold scale-105" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={lobbiesView ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span className="text-[10px] tracking-tight">Salons</span>
        </button>
      )}

      {/* Actualités */}
      <button
        onMouseEnter={() => sounds.playHover()}
        onClick={() => {
          sounds.playTabSwitch();
          onOpenNews();
        }}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
          newsView ? "text-[var(--color-val-red)] font-bold scale-105" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={newsView ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
          <path d="M18 14h-8" />
          <path d="M15 18h-5" />
          <path d="M10 6h8v4h-8V6Z" />
        </svg>
        <span className="text-[10px] tracking-tight">Actus</span>
      </button>

      {/* 4 Carrés Grid Menu Drawer */}
      <button
        onMouseEnter={() => sounds.playHover()}
        onClick={() => {
          sounds.playClick();
          if (onOpenMenuDrawer) onOpenMenuDrawer();
          else onToggleSettings();
        }}
        className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer text-[var(--color-text-secondary)] hover:text-[var(--color-val-red)] active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="7" height="7" x="3" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="14" rx="1" />
          <rect width="7" height="7" x="3" y="14" rx="1" />
        </svg>
        <span className="text-[10px] tracking-tight">Menu</span>
      </button>
    </nav>
  );
}
