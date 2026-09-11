"use client";

import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { signOut } from "next-auth/react";
import NotificationsDropdown from "./NotificationsDropdown";
import LiveClock from "./LiveClock";

import { sounds } from "@/lib/soundEffects";
import {
  IconTrophy,
  IconSettings,
  IconHome,
  IconNews,
  IconAgents,
  IconUsers,
  IconKeyboard,
  IconLogOut,
  IconClock,
  IconStar,
  IconSword,
} from "./icons/SpyIcons";

export interface HeaderProps {
  session: any;
  riotId: string;
  setRiotId: (id: string) => void;
  myRiotId: string;
  onSearch: (e: React.FormEvent) => void;
  newsView: boolean;
  agentsView: boolean;
  lobbiesView?: boolean;
  settingsOpen: boolean;
  onGoHome: () => void;
  onOpenNews: (newsId?: string) => void;
  onOpenAgents: () => void;
  onOpenLobbies?: () => void;
  onOpenHotkeys?: () => void;
  onToggleSettings: () => void;
  onOpenLeaderboard?: () => void;
  leaderboardOpen?: boolean;
  onOpenCompare?: () => void;
  onOpenAchievements?: () => void;
  favorites: Array<{ riotId: string; gameName: string; tagLine: string; cardUrl: string; rank?: string }>;
  onSelectFavorite: (riotId: string) => void;
  onRemoveFavorite?: (player: any) => void;
  activeGameName?: string;
  playerStats?: any;
}

type NavId = "profile" | "news" | "agents" | "lobbies" | "leaderboard";

export default function Header({
  session,
  riotId,
  setRiotId,
  myRiotId,
  onSearch,
  newsView,
  agentsView,
  lobbiesView = false,
  settingsOpen,
  onGoHome,
  onOpenNews,
  onOpenAgents,
  onOpenLobbies,
  onOpenHotkeys,
  onToggleSettings,
  onOpenLeaderboard,
  leaderboardOpen = false,
  onOpenCompare,
  onOpenAchievements,
  favorites,
  onSelectFavorite,
  onRemoveFavorite,
  activeGameName,
  playerStats,
}: HeaderProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Sliding Pill State ─────────────────────────────────────────────
  const navContainerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<NavId, HTMLButtonElement | null>>({
    profile: null,
    news: null,
    agents: null,
    lobbies: null,
    leaderboard: null,
  });
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });

  // Derive active nav id from props
  const activeNavId: NavId | null = settingsOpen
    ? null
    : leaderboardOpen
      ? "leaderboard"
      : lobbiesView
        ? "lobbies"
        : agentsView
          ? "agents"
          : newsView
            ? "news"
            : myRiotId
              ? "profile"
              : null;

  // Measure active button and position the sliding pill
  useLayoutEffect(() => {
    if (!activeNavId || !navContainerRef.current) {
      setPillStyle((prev) => ({ ...prev, opacity: 0 }));
      return;
    }
    const btn = btnRefs.current[activeNavId];
    const container = navContainerRef.current;
    if (!btn || !container) {
      setPillStyle((prev) => ({ ...prev, opacity: 0 }));
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setPillStyle({
      left: btnRect.left - containerRect.left,
      width: btnRect.width,
      opacity: 1,
    });
  }, [activeNavId, myRiotId, leaderboardOpen]);

  // ─── Recent Searches ───────────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem("spycam_recent_searches");
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    const clean = query.trim();
    const updated = [clean, ...recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
    setRecentSearches(updated);
    try {
      localStorage.setItem("spycam_recent_searches", JSON.stringify(updated));
    } catch {}
  };

  const removeRecentSearch = (query: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== query);
    setRecentSearches(updated);
    try {
      localStorage.setItem("spycam_recent_searches", JSON.stringify(updated));
    } catch {}
  };

  const clearAllRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem("spycam_recent_searches");
    } catch {}
  };

  const handleSubmit = (e: React.FormEvent) => {
    saveRecentSearch(riotId);
    setIsFocused(false);
    onSearch(e);
  };

  // Keyboard shortcut: Ctrl + K / Cmd + K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsFocused(true);
      } else if (e.key === "Escape") {
        setIsFocused(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close search suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── Nav Items Config ──────────────────────────────────────────────
  const navItems: { id: NavId; label: string; icon: React.ReactNode; onClick: () => void; show: boolean }[] = [
    {
      id: "profile",
      label: "Profil",
      icon: <IconHome size={15} />,
      onClick: onGoHome,
      show: !!myRiotId,
    },
    {
      id: "news",
      label: "Actualités",
      icon: <IconNews size={15} />,
      onClick: () => onOpenNews(),
      show: true,
    },
    {
      id: "agents",
      label: "Agents",
      icon: <IconAgents size={15} />,
      onClick: onOpenAgents,
      show: true,
    },
    {
      id: "lobbies",
      label: "Salons",
      icon: <IconUsers size={15} />,
      onClick: () => onOpenLobbies?.(),
      show: !!onOpenLobbies,
    },
    {
      id: "leaderboard",
      label: "Classement",
      icon: <IconTrophy size={15} />,
      onClick: () => onOpenLeaderboard?.(),
      show: !!onOpenLeaderboard,
    },
  ];

  return (
    <header className="w-full z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-2xl sticky top-0 mb-6 sm:mb-8 flex flex-col shadow-lg shadow-black/20">
      {/* Top Navbar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3.5 w-full gap-2 lg:gap-4">

        {/* ═══ LEFT GROUP: Logo on far left + Nav Pill centered between Logo & Search ═══ */}
        <div className="flex items-center flex-none md:flex-1 min-w-0">
          {/* Logo */}
          <div
            onClick={onGoHome}
            className="flex items-center gap-2.5 cursor-pointer select-none transition-all hover:scale-105 active:scale-95 group flex-shrink-0 mr-2 lg:mr-4"
            title="SGS-Tracker Accueil"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden ring-1 ring-[var(--color-val-red)]/30 group-hover:ring-[var(--color-val-red)]/60 shadow-[0_0_12px_rgba(255,70,85,0.3)] group-hover:shadow-[0_0_20px_rgba(255,70,85,0.6)] transition-all bg-black">
              <img
                src="/sgs-icon.jpg"
                alt="SGS Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-black text-base sm:text-lg text-[var(--color-text-primary)] tracking-widest hidden xl:inline-block">
              TRACKER
            </span>
          </div>

          {/* Centered Nav Pill Container in space between Logo and Search Bar */}
          <div className="hidden md:flex flex-1 items-center justify-center min-w-0 px-1">
            <div
              ref={navContainerRef}
              className="relative flex items-center gap-0.5 p-1 rounded-2xl glass-pill"
            >
              {/* Animated Sliding Red Pill Background */}
              <div
                className="absolute top-1 bottom-1 rounded-xl bg-[var(--color-val-red)] shadow-[0_0_18px_rgba(255,70,85,0.6)] pointer-events-none z-0"
                style={{
                  transform: `translateX(${pillStyle.left}px)`,
                  width: `${pillStyle.width}px`,
                  opacity: pillStyle.opacity,
                  transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />

              {/* Nav Buttons */}
              {navItems
                .filter((item) => item.show)
                .map((item) => {
                  const isActive = activeNavId === item.id;
                  return (
                    <button
                      key={item.id}
                      ref={(el) => { btnRefs.current[item.id] = el; }}
                      onClick={() => {
                        sounds.playTabSwitch();
                        item.onClick();
                      }}
                      onMouseEnter={() => sounds.playHover()}
                      className={`relative z-10 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer select-none transition-colors duration-200 active:scale-95 whitespace-nowrap ${
                        isActive
                          ? "text-white"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      {item.icon}
                      <span className="hidden xl:inline">{item.label}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>

        {/* ═══ CENTER: Search Bar (proportional — shrinks to fit between logo & bell) ═══ */}
        <div className="flex-1 min-w-0 max-w-xs sm:max-w-sm mx-1 lg:mx-2">
          <div ref={searchContainerRef} className="relative w-full">
            <form onSubmit={handleSubmit} className="relative w-full">
              <input
                ref={inputRef}
                type="text"
                placeholder="Rechercher (Pseudo#Tag)"
                value={riotId}
                onChange={(e) => setRiotId(e.target.value)}
                onFocus={() => setIsFocused(true)}
                className={`w-full bg-[var(--color-text-primary)] text-[var(--color-background)] font-medium px-3.5 sm:px-6 py-2 rounded-full text-xs sm:text-sm outline-none transition-all duration-300 pr-3 sm:pr-16 ${
                  isFocused ? "shadow-[0_0_25px_rgba(255,255,255,0.3)] ring-2 ring-[var(--color-val-red)]" : ""
                }`}
                required
              />

              {/* Shortcut Badge */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none select-none">
                <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white bg-[#0f1923] border border-white/20 rounded-md shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                  Ctrl K
                </kbd>
              </div>
            </form>

            {/* Smart Search Suggestions Dropdown with Spring Pop-In */}
            {isFocused && (
              <div className="absolute left-0 right-0 top-full mt-2 glass-modal rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50 overflow-hidden animate-search-dropdown p-2">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="mb-1">
                    <div className="flex items-center justify-between px-2 py-1">
                      <span className="text-[10px] font-black uppercase text-[var(--color-text-secondary)] tracking-wider">Recherches récentes</span>
                      <button
                        type="button"
                        onClick={clearAllRecent}
                        className="text-[9px] text-[var(--color-text-secondary)] hover:text-[var(--color-val-red)] cursor-pointer"
                      >
                        Tout effacer
                      </button>
                    </div>
                    <div className="space-y-0.5">
                      {recentSearches.map((search) => (
                        <button
                          key={search}
                          type="button"
                          onClick={() => {
                            setRiotId(search);
                            setIsFocused(false);
                            setTimeout(() => {
                              const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                              saveRecentSearch(search);
                              onSearch(fakeEvent);
                            }, 50);
                          }}
                          className="flex items-center justify-between w-full p-2 rounded-xl hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer text-left group"
                        >
                          <div className="flex items-center gap-2">
                            <IconClock size={12} className="text-[var(--color-text-secondary)]" />
                            <span className="text-xs font-medium text-[var(--color-text-primary)]">{search}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => removeRecentSearch(search, e)}
                            className="w-5 h-5 rounded-full hover:bg-red-500/20 flex items-center justify-center text-[10px] text-[var(--color-text-secondary)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            ✕
                          </button>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Favorites in Search */}
                {favorites.length > 0 && (
                  <div className="border-t border-[var(--color-border)]/50 pt-1 mt-1">
                    <span className="text-[10px] font-black uppercase text-[var(--color-text-secondary)] tracking-wider px-2 py-1 flex items-center gap-1">
                      <IconStar size={11} className="text-yellow-400" />
                      <span>Favoris</span>
                    </span>
                    <div className="space-y-0.5">
                      {favorites.map((fav) => (
                        <button
                          key={fav.riotId}
                          type="button"
                          onClick={() => {
                            setIsFocused(false);
                            sounds.playClick();
                            onSelectFavorite(fav.riotId);
                          }}
                          className="flex items-center gap-2 p-2 rounded-xl hover:bg-[var(--color-surface-hover)] cursor-pointer text-left transition-colors border border-transparent hover:border-[var(--color-border)] w-full"
                        >
                          {fav.cardUrl ? (
                            <img referrerPolicy="no-referrer" src={fav.cardUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-[var(--color-val-red)]/20 text-[var(--color-val-red)] flex items-center justify-center text-[10px] font-bold">
                              {fav.gameName[0]}
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-[var(--color-text-primary)] truncate">{fav.gameName}</span>
                            <span className="text-[9px] text-[var(--color-text-secondary)]">#{fav.tagLine}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {recentSearches.length === 0 && favorites.length === 0 && (
                  <div className="p-4 text-center text-xs text-[var(--color-text-secondary)] animate-search-dropdown">
                    Tapez un <strong className="text-[var(--color-text-primary)]">Pseudo#Tag</strong> et appuyez sur Entrée
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ═══ RIGHT: Clean Glass Capsules ═══ */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-none md:flex-1 justify-end">

          {/* ── Capsule Outils : Comparateur & Succès ── */}
          <div className="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-black/30 border border-white/10 backdrop-blur-md">
            {onOpenCompare && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onOpenCompare();
                }}
                onMouseEnter={() => sounds.playHover()}
                title="Comparer avec un autre joueur"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer select-none"
              >
                <IconSword size={14} className="text-[var(--color-val-red)]" />
                <span className="hidden xl:inline">Comparer</span>
              </button>
            )}

            {onOpenAchievements && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onOpenAchievements();
                }}
                onMouseEnter={() => sounds.playHover()}
                title="Succès & Hauts Faits Débloquables"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer select-none"
              >
                <IconTrophy size={14} className="text-amber-400" />
                <span className="hidden xl:inline">Succès</span>
              </button>
            )}
          </div>

          {/* ── Capsule 1: LiveClock + Notifications ── */}
          <div className="hidden md:flex items-center gap-0.5 p-1 rounded-2xl bg-black/30 border border-white/10 backdrop-blur-md">
            <LiveClock />
            <div className="w-px h-4 bg-white/10" />
            <NotificationsDropdown
              compact={true}
              onNavigateToNews={onOpenNews}
              onNavigateToAgents={onOpenAgents}
              playerStats={playerStats}
            />
          </div>

          {/* ── Capsule 2: Paramètres ── */}
          <div className="hidden md:flex items-center p-1 rounded-2xl bg-black/30 border border-white/10 backdrop-blur-md">
            <button
              onClick={() => {
                sounds.playTabSwitch();
                onToggleSettings();
              }}
              onMouseEnter={() => sounds.playHover()}
              title="Paramètres & Raccourcis"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer select-none transition-all duration-200 active:scale-95 whitespace-nowrap ${
                settingsOpen
                  ? "bg-[var(--color-val-red)] text-white shadow-[0_0_15px_rgba(255,70,85,0.5)]"
                  : "text-neutral-400 hover:text-white hover:bg-white/[0.07]"
              }`}
            >
              <IconSettings size={15} className={settingsOpen ? "animate-spin-slow" : ""} />
              <span>Paramètres</span>
            </button>
          </div>

          {/* ── Capsule 3: Quitter / Déconnexion ── */}
          <div className="hidden md:flex items-center p-1 rounded-2xl bg-black/30 border border-white/10 backdrop-blur-md">
            <button
              onClick={() => {
                sounds.playClick();
                signOut({ callbackUrl: "/" });
              }}
              onMouseEnter={() => sounds.playHover()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-neutral-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer select-none transition-all duration-200 active:scale-95 whitespace-nowrap"
              title="Déconnexion"
            >
              <IconLogOut size={14} />
              <span className="hidden lg:inline">Quitter</span>
            </button>
          </div>

          {/* ── Mobile fallback: notification bell only (settings via Menu drawer) ── */}
          <div className="flex md:hidden items-center flex-shrink-0">
            <NotificationsDropdown
              onNavigateToNews={onOpenNews}
              onNavigateToAgents={onOpenAgents}
              playerStats={playerStats}
            />
          </div>
        </div>
      </div>

      {/* Enhanced Favorites Bar */}
      {favorites.length > 0 && !settingsOpen && (
        <div className="w-full px-4 sm:px-6 py-2 flex items-center gap-2 border-t border-[var(--color-border)]/50 bg-[var(--color-background)]/50 overflow-visible relative">
          <span className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-widest font-bold mr-1 flex-shrink-0 flex items-center gap-1.5">
            <IconStar size={11} className="text-yellow-400" />
            <span>Favoris</span>
          </span>

          {/* Desktop: horizontal scroll as before */}
          <div className="hidden md:flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
            {favorites.map((fav) => (
              <FavChip key={fav.riotId} fav={fav} isActive={activeGameName === fav.gameName} onSelect={onSelectFavorite} onRemove={onRemoveFavorite} />
            ))}
          </div>

          {/* Mobile: first fav + "Voir plus" dropdown */}
          <div className="flex md:hidden items-center gap-1.5 flex-1 min-w-0 relative">
            <FavChip fav={favorites[0]} isActive={activeGameName === favorites[0].gameName} onSelect={onSelectFavorite} onRemove={onRemoveFavorite} />
            {favorites.length > 1 && (
              <MobileFavsMore
                favorites={favorites.slice(1)}
                activeGameName={activeGameName}
                onSelectFavorite={onSelectFavorite}
                onRemoveFavorite={onRemoveFavorite}
              />
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function FavChip({
  fav,
  isActive,
  onSelect,
  onRemove,
}: {
  fav: { riotId: string; gameName: string; tagLine: string; cardUrl?: string };
  isActive: boolean;
  onSelect: (riotId: string) => void;
  onRemove?: (player: any) => void;
}) {
  return (
    <div
      onMouseEnter={() => sounds.playHover()}
      onClick={() => {
        sounds.playClick();
        onSelect(fav.riotId);
      }}
      className={`group flex items-center gap-1.5 px-3 py-1 rounded-full transition-all duration-200 text-xs font-bold border flex-shrink-0 cursor-pointer ${
        isActive
          ? "bg-[var(--color-val-red)]/15 border-[var(--color-val-red)]/50 text-[var(--color-val-red)] shadow-[0_0_12px_rgba(255,70,85,0.25)]"
          : "bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
      }`}
    >
      {fav.cardUrl && (
        <img referrerPolicy="no-referrer" src={fav.cardUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
      )}
      <span className="truncate max-w-[100px] sm:max-w-none">{fav.gameName}</span>
      <span className="text-[var(--color-text-secondary)] opacity-50 text-[10px]">#{fav.tagLine}</span>

      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove({ gameName: fav.gameName, tagLine: fav.tagLine });
          }}
          className="w-3.5 h-3.5 rounded-full hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-1 text-[9px] cursor-pointer"
          title="Retirer des favoris"
        >
          ✕
        </button>
      )}
    </div>
  );
}

function MobileFavsMore({
  favorites,
  activeGameName,
  onSelectFavorite,
  onRemoveFavorite,
}: {
  favorites: Array<{ riotId: string; gameName: string; tagLine: string; cardUrl: string; rank?: string }>;
  activeGameName?: string;
  onSelectFavorite: (riotId: string) => void;
  onRemoveFavorite?: (player: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const animateClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setOpen(false);
    }, 200);
  }, []);

  useEffect(() => {
    if (!open || isClosing) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        animateClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, isClosing, animateClose]);

  return (
    <div ref={containerRef} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => {
          sounds.playClick();
          if (open && !isClosing) {
            animateClose();
          } else if (!open) {
            setOpen(true);
          }
        }}
        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-val-red)]/50 text-[var(--color-text-secondary)] hover:text-white transition-all cursor-pointer whitespace-nowrap"
      >
        <span>+{favorites.length}</span>
        <span className="text-[10px] opacity-75">voir plus</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className={`absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-32px)] p-2 rounded-2xl glass-modal shadow-[0_15px_35px_rgba(0,0,0,0.7)] z-50 flex flex-col gap-1 border border-white/10 ${isClosing ? "animate-dropdown-out" : "animate-search-dropdown"}`}>
          <div className="text-[9px] uppercase tracking-wider font-bold text-[var(--color-text-secondary)] px-2 py-1">
            Autres favoris ({favorites.length})
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
            {favorites.map((fav) => (
              <div
                key={fav.riotId}
                onClick={() => {
                  animateClose();
                  sounds.playClick();
                  onSelectFavorite(fav.riotId);
                }}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  activeGameName === fav.gameName
                    ? "bg-[var(--color-val-red)]/20 text-[var(--color-val-red)]"
                    : "hover:bg-white/5 text-[var(--color-text-primary)]"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {fav.cardUrl ? (
                    <img referrerPolicy="no-referrer" src={fav.cardUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">
                      {fav.gameName[0]}
                    </div>
                  )}
                  <div className="truncate">
                    <span>{fav.gameName}</span>
                    <span className="text-[10px] text-[var(--color-text-secondary)] ml-1">#{fav.tagLine}</span>
                  </div>
                </div>

                {onRemoveFavorite && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFavorite({ gameName: fav.gameName, tagLine: fav.tagLine });
                    }}
                    className="p-1 text-[10px] text-neutral-400 hover:text-red-400 cursor-pointer"
                    title="Retirer"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
