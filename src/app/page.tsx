"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { useLanguage } from "@/lib/i18n";

// Hooks
import { useAuth } from "@/hooks/useAuth";
import { useSettings, computeContrastColor } from "@/hooks/useSettings";
import { useNavigation } from "@/hooks/useNavigation";
import { useFavorites } from "@/hooks/useFavorites";
import { usePlayerData } from "@/hooks/usePlayerData";
import { useFilters } from "@/hooks/useFilters";
import { useVoiceState } from "@/hooks/useVoiceState";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

// Utilities
import { getWarnings } from "@/lib/warnings";
import { normalizePlayerData } from "@/lib/playerDataUtils";

// Components
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import DashboardGrid from "@/components/DashboardGrid";
import MatchHistory from "@/components/MatchHistory";
import SettingsView from "@/components/SettingsView";
import NewsViewComponent from "@/components/NewsViewComponent";
import AgentsWikiComponent from "@/components/AgentsWikiComponent";
import LeaderboardViewComponent from "@/components/LeaderboardViewComponent";
import LeaderboardModal from "@/components/LeaderboardModal";
import LobbiesView from "@/components/LobbiesView";
import PlayerCardModal from "@/components/PlayerCardModal";
import MobileAppDrawer from "@/components/MobileAppDrawer";
import HotkeysHelpModal from "@/components/HotkeysHelpModal";
import FloatingVoiceBar from "@/components/FloatingVoiceBar";
import SgsLegalModal from "@/components/SgsLegalModal";
import LoginModal from "@/components/LoginModal";
import PerformanceScoreModal from "@/components/PerformanceScoreModal";
import AiCoachModal from "@/components/AiCoachModal";
import LocalDevStatsPanel from "@/components/LocalDevStatsPanel";
import ProfileSkeleton from "@/components/ProfileSkeleton";
import LandingPage from "@/components/landing/LandingPage";
import ProfileBanner from "@/components/ProfileBanner";
import ProfileTabs from "@/components/ProfileTabs";
import AgentsStatsTab from "@/components/AgentsStatsTab";
import ActivityCalendar from "@/components/ActivityCalendar";
import MapsStatsTab from "@/components/MapsStatsTab";
import TiltAlertBanner from "@/components/TiltAlertBanner";
import PersonalGoalsWidget from "@/components/PersonalGoalsWidget";
import PlayerCompareModal from "@/components/PlayerCompareModal";
import AchievementsModal from "@/components/AchievementsModal";
import FriendsModal from "@/components/FriendsModal";
import { useFriends } from "@/hooks/useFriends";
import { exportMatchesToCSV } from "@/lib/exportUtils";
import { IconSword } from "@/components/icons/SpyIcons";
import { sounds } from "@/lib/soundEffects";

function DebugPanel({ isOpen, onClose, onGenerate }: any) {
  return null;
}

export function HomeContent({
  initialLobbiesView = false,
  initialLeaderboardView = false,
}: {
  initialLobbiesView?: boolean;
  initialLeaderboardView?: boolean;
} = {}) {
  const searchParams = useSearchParams();
  const { lang: locale, setLanguage: setAppLanguage } = useLanguage();

  // ─── Hooks ───────────────────────────────────────────────
  const auth = useAuth(searchParams);
  const settings = useSettings();
  const nav = useNavigation(initialLobbiesView, initialLeaderboardView);
  const favorites = useFavorites(auth.session);
  const player = usePlayerData(auth, nav, settings, setAppLanguage);
  const filters = useFilters(
    player.playerData,
    player.rawMatches,
    player.rawAgentStats,
    player.rawStats,
    player.devOverrides,
    player.riotId,
    player.myRiotId
  );
  const voice = useVoiceState();
  useKeyboardShortcuts(
    nav,
    settings,
    player.riotId,
    player.myRiotId,
    nav.pushUrl,
    {
      settingsOpen: nav.settingsOpen,
      ecoMode: settings.ecoMode,
      leaderboardView: nav.leaderboardView,
      debugOpen: nav.debugOpen,
    }
  );

  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState<boolean>(false);
  const [showFriendsModal, setShowFriendsModal] = useState<boolean>(false);
  const friendsManager = useFriends();
  const [highlightedMatchId, setHighlightedMatchId] = useState<string | null>(null);

  // ─── Derived values ──────────────────────────────────────
  const canEdit = auth.canEditProfile(player.playerData);

  // Synchronisation du thème du profil visité (si l'utilisateur n'a pas forcé son propre thème)
  const isVisitingOther = !canEdit && Boolean(player.playerData?.player?.theme || player.playerData?.theme);
  const visitedProfileTheme = player.playerData?.player?.theme || player.playerData?.theme || null;

  useEffect(() => {
    if (isVisitingOther && !settings.forceMyTheme && visitedProfileTheme) {
      settings.setActiveThemeOverride(visitedProfileTheme);
    } else {
      settings.setActiveThemeOverride(null);
    }
  }, [isVisitingOther, settings.forceMyTheme, visitedProfileTheme, settings.setActiveThemeOverride]);

  // Détermination du thème scopé exclusivement au profil visité (cases de stats, cases d'historique, tabs, bannière)
  // SANS affecter le fond général de la page ni les boutons de navigation Header ("profile, actualité, agent, parametre", etc.)
  const profileScopedThemeClass = useMemo(() => {
    if (!isVisitingOther || !visitedProfileTheme || settings.forceMyTheme) return "";
    if (visitedProfileTheme === "dark") return "";
    if (visitedProfileTheme.startsWith("custom:")) return "theme-custom";
    return `theme-${visitedProfileTheme}`;
  }, [isVisitingOther, visitedProfileTheme, settings.forceMyTheme]);

  const profileScopedThemeStyles: React.CSSProperties = useMemo(() => {
    if (!isVisitingOther || !visitedProfileTheme || settings.forceMyTheme) return {};

    if (visitedProfileTheme === "midnight") {
      const accent = "#8c64ff";
      return {
        "--color-val-red": accent,
        "--custom-accent": accent,
        "--color-accent-contrast": "#ffffff",
        "--color-surface": "rgba(20, 15, 40, 0.7)",
        "--color-surface-hover": "rgba(35, 25, 60, 0.8)",
        "--color-border": "rgba(140, 100, 255, 0.15)",
        "--accent-glow-subtle": "color-mix(in srgb, #8c64ff 15%, transparent)",
        "--accent-glow-md": "color-mix(in srgb, #8c64ff 35%, transparent)",
        "--accent-glow-strong": "color-mix(in srgb, #8c64ff 65%, transparent)",
        "--accent-bg-subtle": "color-mix(in srgb, #8c64ff 12%, transparent)",
        "--accent-border-subtle": "color-mix(in srgb, #8c64ff 30%, transparent)",
      } as React.CSSProperties;
    }

    if (visitedProfileTheme === "ocean") {
      const accent = "#32c8b4";
      return {
        "--color-val-red": accent,
        "--custom-accent": accent,
        "--color-accent-contrast": "#000000",
        "--color-surface": "rgba(10, 25, 35, 0.7)",
        "--color-surface-hover": "rgba(15, 40, 55, 0.8)",
        "--color-border": "rgba(50, 200, 180, 0.15)",
        "--accent-glow-subtle": "color-mix(in srgb, #32c8b4 15%, transparent)",
        "--accent-glow-md": "color-mix(in srgb, #32c8b4 35%, transparent)",
        "--accent-glow-strong": "color-mix(in srgb, #32c8b4 65%, transparent)",
        "--accent-bg-subtle": "color-mix(in srgb, #32c8b4 12%, transparent)",
        "--accent-border-subtle": "color-mix(in srgb, #32c8b4 30%, transparent)",
      } as React.CSSProperties;
    }

    if (visitedProfileTheme === "crimson") {
      const accent = "#ff4655";
      return {
        "--color-val-red": accent,
        "--custom-accent": accent,
        "--color-accent-contrast": "#ffffff",
        "--color-surface": "rgba(30, 10, 10, 0.7)",
        "--color-surface-hover": "rgba(50, 15, 15, 0.8)",
        "--color-border": "rgba(255, 70, 85, 0.15)",
        "--accent-glow-subtle": "color-mix(in srgb, #ff4655 15%, transparent)",
        "--accent-glow-md": "color-mix(in srgb, #ff4655 35%, transparent)",
        "--accent-glow-strong": "color-mix(in srgb, #ff4655 65%, transparent)",
        "--accent-bg-subtle": "color-mix(in srgb, #ff4655 12%, transparent)",
        "--accent-border-subtle": "color-mix(in srgb, #ff4655 30%, transparent)",
      } as React.CSSProperties;
    }

    if (visitedProfileTheme === "light") {
      const accent = "#ff4655";
      return {
        "--color-val-red": accent,
        "--custom-accent": accent,
        "--color-accent-contrast": "#ffffff",
        "--color-surface": "rgba(255, 255, 255, 0.85)",
        "--color-surface-hover": "#ffffff",
        "--color-border": "rgba(0, 0, 0, 0.12)",
        "--color-text-primary": "#0f172a",
        "--color-text-secondary": "#64748b",
      } as React.CSSProperties;
    }

    if (visitedProfileTheme.startsWith("custom:")) {
      const matchBg = visitedProfileTheme.match(/bg=([^,]+)/);
      const matchAccent = visitedProfileTheme.match(/accent=([^,]+)/);
      const customAccent = matchAccent ? matchAccent[1] : "#ff4655";
      const customBg = matchBg ? matchBg[1] : "#1a1a1a";
      return {
        "--custom-bg": customBg,
        "--custom-accent": customAccent,
        "--color-val-red": customAccent,
        "--color-accent-contrast": computeContrastColor(customAccent),
        "--color-surface": `color-mix(in srgb, ${customBg} 60%, black 40%)`,
        "--color-surface-hover": `color-mix(in srgb, ${customBg} 40%, black 60%)`,
        "--color-border": `color-mix(in srgb, ${customAccent} 20%, transparent)`,
        "--accent-glow-subtle": `color-mix(in srgb, ${customAccent} 15%, transparent)`,
        "--accent-glow-md": `color-mix(in srgb, ${customAccent} 35%, transparent)`,
        "--accent-glow-strong": `color-mix(in srgb, ${customAccent} 65%, transparent)`,
        "--accent-bg-subtle": `color-mix(in srgb, ${customAccent} 12%, transparent)`,
        "--accent-border-subtle": `color-mix(in srgb, ${customAccent} 30%, transparent)`,
      } as React.CSSProperties;
    }

    return {};
  }, [isVisitingOther, visitedProfileTheme, settings.forceMyTheme]);

  // URL search params handling
  useEffect(() => {
    const ep = searchParams?.get("error");
    if (ep)
      player.setError(
        ep === "missing_credentials"
          ? "Client ID RSO manquant."
          : ep === "token_exchange_failed"
          ? "Échec token Riot."
          : "Erreur connexion."
      );
    if (searchParams?.get("loggedIn") === "true") {
      // Fetch user data on login redirect
      fetch("/api/auth/me")
        .then((r) => r.json())
        .then((d) => {
          if (d.error) player.setError(d.error);
          else player.setPlayerData(d);
        })
        .catch(() => player.setError("Session invalide."))
        .finally(() => {
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.delete("loggedIn");
            window.history.replaceState({}, "", url.pathname + (url.search || ""));
          }
        });
    }

    const viewParam = searchParams?.get("view");
    if (viewParam === "lobbies") {
      nav.setLobbiesView(true);
      nav.setNewsView(false);
      nav.setAgentsView(false);
    } else if (viewParam === "agents") {
      nav.setAgentsView(true);
      nav.setNewsView(false);
      nav.setLobbiesView(false);
    } else if (viewParam === "news") {
      nav.setNewsView(true);
      nav.setAgentsView(false);
      nav.setLobbiesView(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ─── Early returns ───────────────────────────────────────
  if (auth.status === "loading") {
    // Si la modale de connexion est ouverte, conserver l'interface pour éviter tout saut/scintillement visuel
    if (auth.loginModalOpen) {
      return (
        <>
          <LandingPage
            onEnterBeta={auth.handleEnterBeta}
            onOpenLogin={() => auth.setLoginModalOpen(true)}
          />
          <LoginModal
            isOpen={auth.loginModalOpen}
            onClose={() => auth.setLoginModalOpen(false)}
          />
        </>
      );
    }

    return (
      <main className="flex-1 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-5">
          <img
            src="/sgs-icon.jpg"
            alt="SGS Logo"
            className="w-16 h-16 object-cover rounded-2xl animate-pulse drop-shadow-[0_0_30px_rgba(255,70,85,0.7)]"
          />
          <p className="text-[var(--color-text-secondary)] uppercase tracking-widest text-xs font-black">
            Chargement...
          </p>
        </div>
      </main>
    );
  }

  if (auth.status === "unauthenticated" && !auth.isDemo) {
    return (
      <>
        <LandingPage
          onEnterBeta={auth.handleEnterBeta}
          onOpenLogin={() => auth.setLoginModalOpen(true)}
        />
        <LoginModal
          isOpen={auth.loginModalOpen}
          onClose={() => auth.setLoginModalOpen(false)}
        />
      </>
    );
  }

  // ─── Navigation helpers (avoiding repetitive setState chains) ──
  const isOwn =
    player.myRiotId &&
    player.riotId.toLowerCase() === player.myRiotId.toLowerCase();

  const navigateToView = (view: "news" | "agents" | "lobbies" | "leaderboard", newsId?: string) => {
    nav.resetToProfile();
    if (view === "news") {
      nav.setNewsView(true);
      if (newsId) nav.setTargetNewsId(newsId);
      else nav.setTargetNewsId(null);
    }
    if (view === "agents") nav.setAgentsView(true);
    if (view === "lobbies") nav.setLobbiesView(true);
    if (view === "leaderboard") nav.setLeaderboardView(true);
    nav.pushUrl({
      view,
      playerId: player.riotId || player.myRiotId,
      isOwnProfile: !!isOwn,
    });
  };

  const handleSelectMatch = (matchId: string) => {
    sounds.playClick();
    nav.setActiveTab("matches");
    nav.pushUrl({
      tab: "matches",
      playerId: player.riotId || player.myRiotId,
      isOwnProfile: !!isOwn,
    });
    setHighlightedMatchId(matchId);

    // Si le match se trouve au-delà du nombre actuellement affiché, on augmente le seuil
    const matchIdx = (filters.filteredMatches || []).findIndex(
      (m: any) => (m.matchId || m.id) === matchId
    );
    if (matchIdx >= 0 && matchIdx >= filters.visibleMatchesCount) {
      filters.setVisibleMatchesCount(matchIdx + 10);
    }

    // Défilement fluide vers l'élément dans le DOM
    setTimeout(() => {
      const el = document.getElementById(`match-${matchId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 200);
  };

  // ─── Player data rendering helpers ───────────────────────
  const renderPlayerProfile = () => {
    if (!player.playerData) return null;

    const p = {
      ...normalizePlayerData(player.playerData),
      stats: filters.effectiveStats,
      agentStats: filters.filteredAgents,
      matchHistory: filters.effectiveMatches,
    };
    const s = p.stats;
    const w = getWarnings(s);

    // Hidden stats for privacy
    let appliedHiddenStats: string[] = [];
    if (!canEdit && player.playerData?.player?.hiddenStats) {
      try {
        appliedHiddenStats =
          typeof player.playerData.player.hiddenStats === "string"
            ? JSON.parse(player.playerData.player.hiddenStats)
            : player.playerData.player.hiddenStats || [];
      } catch {
        appliedHiddenStats = [];
      }
    }

    const userKey = canEdit
      ? (auth.session?.user?.email || (auth.isGuestMode ? "guest" : p.puuid || "default"))
      : (p.puuid || `${p.gameName}#${p.tagLine}` || "default");

    return (
      <div
        className={`w-full flex flex-col min-w-0 transition-colors duration-300 ${profileScopedThemeClass}`}
        style={profileScopedThemeStyles}
      >
        <ProfileBanner
          player={p}
          canEditProfile={canEdit}
          streamerMode={settings.streamerMode}
          bannerUrl={canEdit ? settings.bannerUrl : (p.bannerUrl || p.customBannerUrl || "")}
          bannerOffsetY={canEdit ? settings.bannerOffsetY : (p.bannerOffsetY ?? p.customBannerOffsetY ?? 50)}
          hiddenStats={canEdit ? settings.hiddenStats : appliedHiddenStats}
          showBadgeState={canEdit ? settings.showBadgeState : (player.playerData?.player?.showBadge !== false)}
          hiddenBadges={canEdit ? settings.hiddenBadges : []}
          performanceScoreResult={filters.performanceScoreResult}
          isFavorited={favorites.isFavorited}
          toggleFavorite={favorites.toggleFavorite}
          onOpenPerformanceModal={() => nav.setShowPerformanceModal(true)}
          onOpenCoachModal={() => nav.setShowCoachModal(true)}
          onOpenCardModal={() => nav.setShowCardModal(true)}
          onExportCSV={() =>
            exportMatchesToCSV(
              filters.filteredMatches,
              player.playerData?.player?.name || player.riotId || "Joueur"
            )
          }
          onOpenAchievements={() => setShowAchievementsModal(true)}
        />

        <ProfileTabs
          activeTab={nav.activeTab}
          onTabChange={(tab) => {
            nav.setActiveTab(tab);
            nav.pushUrl({
              tab,
              playerId: player.riotId || player.myRiotId,
              isOwnProfile: !!isOwn,
            });
          }}
          gameMode={filters.gameMode}
          onGameModeChange={filters.setGameMode}
          selectedSeason={filters.selectedSeason}
          onSeasonChange={filters.setSelectedSeason}
          availableSeasons={filters.availableSeasons}
          onResetVisibleMatches={() => filters.setVisibleMatchesCount(10)}
          profileTabsContainerRef={nav.profileTabsContainerRef}
          profileTabRefs={nav.profileTabRefs}
          profileUnderlineStyle={nav.profileUnderlineStyle}
          gameModeContainerRef={filters.gameModeContainerRef}
          gameModeBtnRefs={filters.gameModeBtnRefs}
          gameModePillStyle={filters.gameModePillStyle}
        />

        {/* Performance Tab */}
        {nav.activeTab === "performance" && s && (
          <div key="tab-performance" className="w-full animate-tab-in">
            {/* Détection de Tilt / Mauvaise série */}
            <TiltAlertBanner
              matches={filters.filteredMatches}
              overallKd={s?.kdRatio}
              overallAcs={s?.acs}
            />

            <DashboardGrid
              stats={s}
              warnings={w}
              smartRating={settings.smartRating}
              matchHistory={filters.filteredMatches}
              canEdit={canEdit}
              hiddenStatsByPrivacy={appliedHiddenStats}
              userStorageKey={userKey}
              initialGridData={player.playerData?.player?.dashboardGrid || player.playerData?.dashboardGrid}
              performanceScoreResult={filters.performanceScoreResult}
              onOpenPerformanceModal={() => nav.setShowPerformanceModal(true)}
              onOpenCoachModal={() => nav.setShowCoachModal(true)}
              agentStats={player.playerData?.player?.agentStats}
              playerName={player.playerData?.player?.name}
              friendsStats={friendsManager.friendsStats}
              onSelectPlayer={(id) => player.searchPlayer(id)}
              onOpenFriendsModal={() => setShowFriendsModal(true)}
              onSaveGridData={(gridJson) => {
                player.setPlayerData((prev: any) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    player: {
                      ...(prev.player || {}),
                      dashboardGrid: gridJson,
                    },
                    dashboardGrid: gridJson,
                  };
                });
              }}
            />

            {/* Objectifs Personnels */}
            <div className="mt-8">
              <PersonalGoalsWidget
                currentStats={s}
                matchesCount={filters.filteredMatches?.length}
              />
            </div>
          </div>
        )}

        {/* Agents Tab */}
        {nav.activeTab === "agents" && (
          <div key="tab-agents" className="w-full animate-tab-in">
            <AgentsStatsTab
              agentStats={p.agentStats}
              matches={filters.filteredMatches}
              onSelectMatch={handleSelectMatch}
            />
          </div>
        )}

        {/* Maps / Cartes Tab */}
        {nav.activeTab === "maps" && (
          <div key="tab-maps" className="w-full animate-tab-in">
            <MapsStatsTab
              matches={filters.filteredMatches}
              onSelectMatch={handleSelectMatch}
            />
          </div>
        )}

        {/* Matches Tab */}
        {nav.activeTab === "matches" && filters.filteredMatches && (
          <div key="tab-matches" className="w-full space-y-6 animate-tab-in">
            <ActivityCalendar matches={filters.filteredMatches} />
            <MatchHistory
              matches={filters.filteredMatches}
              searchPlayer={player.searchPlayer}
              visibleCount={filters.visibleMatchesCount}
              onLoadMore={() =>
                filters.setVisibleMatchesCount((prev) => prev + 10)
              }
              currentPlayerRank={p?.rank}
              currentPlayerRankUrl={p?.rankUrl}
              currentPlayerRankTier={p?.rankTier}
              highlightedMatchId={highlightedMatchId}
            />
          </div>
        )}
      </div>
    );
  };

  // ─── Main Render ─────────────────────────────────────────
  return (
    <>
      {/* Guest / Beta Demo Top Banner */}
      {auth.isGuestMode && (
        <div className="bg-gradient-to-r from-[var(--color-val-red)]/20 via-black/80 to-[var(--color-val-red)]/20 border-b border-[var(--color-val-red)]/40 px-4 py-2 flex items-center justify-between text-xs backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-val-red)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-val-red)]"></span>
            </span>
            <span className="font-black uppercase tracking-wider text-white">
              Mode Bêta Démo Actif
            </span>
            <span className="hidden sm:inline text-white/60 text-[11px]">
              — Session temporaire avec profil de démonstration
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => auth.setLoginModalOpen(true)}
              className="px-3 py-1 rounded-full bg-[var(--color-val-red)] hover:bg-[#ff5865] text-white font-bold text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
            >
              Créer un compte / Se connecter
            </button>
            <button
              onClick={auth.handleExitBeta}
              className="text-white/60 hover:text-white text-[11px] font-bold uppercase transition-colors cursor-pointer"
            >
              Quitter la démo ✕
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col relative overflow-hidden min-h-screen pb-28 md:pb-16">
        <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--color-val-red)] opacity-10 blur-[120px] rounded-full pointer-events-none"></div>
        <DebugPanel
          isOpen={nav.debugOpen}
          onClose={() => nav.setDebugOpen(false)}
          onGenerate={player.handleDebugGenerate}
        />

        {/* Top Header */}
        <Header
          session={auth.session}
          riotId={player.riotId}
          setRiotId={player.setRiotId}
          myRiotId={player.myRiotId}
          onSearch={player.handleSearch}
          newsView={nav.newsView}
          agentsView={nav.agentsView}
          lobbiesView={nav.lobbiesView}
          settingsOpen={nav.settingsOpen}
          onOpenLeaderboard={() => navigateToView("leaderboard")}
          leaderboardOpen={nav.leaderboardView}
          onGoHome={() => {
            nav.resetToProfile();
            player.goHome();
            nav.pushUrl({
              tab: "performance",
              playerId: player.myRiotId,
              isOwnProfile: true,
            });
          }}
          onOpenNews={(newsId) => navigateToView("news", newsId)}
          onOpenAgents={() => navigateToView("agents")}
          onOpenLobbies={() => navigateToView("lobbies")}
          onOpenHotkeys={() => nav.setShowHotkeysModal(true)}
          onToggleSettings={() => {
            const newVal = !nav.settingsOpen;
            nav.setSettingsOpen(newVal);
            if (newVal) {
              nav.pushUrl({ view: "settings" });
            } else {
              nav.pushUrl({
                tab: nav.activeTab,
                playerId: player.riotId || player.myRiotId,
                isOwnProfile: !!isOwn,
              });
            }
          }}
          favorites={favorites.favorites}
          onSelectFavorite={player.searchPlayer}
          onRemoveFavorite={favorites.toggleFavorite}
          activeGameName={player.playerData?.player?.gameName}
          playerStats={player.playerData?.player?.stats}
          onOpenCompare={() => setShowCompareModal(true)}
          onOpenAchievements={() => setShowAchievementsModal(true)}
          onOpenFriends={() => setShowFriendsModal(true)}
          pendingFriendsCount={friendsManager.pendingIncomingCount}
        />

        {/* Dynamic Views */}
        {nav.settingsOpen ? (
          <div key="settings" className="animate-page-in w-full">
            <SettingsView
              onClose={() => nav.setSettingsOpen(false)}
              smartRating={settings.smartRating}
              setSmartRating={settings.setSmartRating}
              theme={settings.theme}
              setTheme={settings.setTheme}
              bannerUrl={settings.bannerUrl}
              setBannerUrl={settings.setBannerUrl}
              bannerOffsetY={settings.bannerOffsetY}
              setBannerOffsetY={settings.setBannerOffsetY}
              isPublic={settings.isPublic}
              setIsPublic={settings.setIsPublic}
              videoLoop={settings.videoLoop}
              setVideoLoop={settings.setVideoLoop}
              videoLoopDelay={settings.videoLoopDelay}
              setVideoLoopDelay={settings.setVideoLoopDelay}
              hiddenStats={settings.hiddenStats}
              setHiddenStats={settings.setHiddenStats}
              enforcePublicStats={settings.enforcePublicStats}
              setEnforcePublicStats={settings.setEnforcePublicStats}
              hiddenBadges={settings.hiddenBadges}
              setHiddenBadges={settings.setHiddenBadges}
              showBadge={settings.showBadgeState}
              setShowBadge={settings.setShowBadgeState}
              p={player.playerData?.player}
              canEditProfile={canEdit}
              settingsTab={settings.settingsTab}
              setSettingsTab={settings.setSettingsTab}
              pushUrl={nav.pushUrl}
              locale={locale}
              streamerMode={settings.streamerMode}
              setStreamerMode={settings.setStreamerMode}
              disableAnimations={settings.disableAnimations}
              setDisableAnimations={settings.setDisableAnimations}
              forceMyTheme={settings.forceMyTheme}
              setForceMyTheme={settings.setForceMyTheme}
            />
          </div>
        ) : nav.leaderboardView ? (
          <div key="leaderboard" className="animate-page-in w-full">
            <LeaderboardViewComponent
              onSelectPlayer={(id) => {
                nav.setLeaderboardView(false);
                player.searchPlayer(id);
              }}
            />
          </div>
        ) : nav.lobbiesView ? (
          <div
            key="lobbies"
            className="animate-page-in flex-1 flex flex-col items-center px-1 sm:px-3 md:px-6 z-10 w-full max-w-[1750px] mx-auto min-h-[calc(100vh-90px)]"
          >
            <LobbiesView
              playerData={player.playerData?.player || player.playerData}
              isPublic={settings.isPublic}
              onUpdateIsPublic={settings.setIsPublic}
              activeLobby={voice.activeVoiceLobby}
              setActiveLobby={voice.setActiveVoiceLobby}
              isInVoice={voice.isInVoiceGlobal}
              setIsInVoice={voice.setIsInVoiceGlobal}
              isMicMuted={voice.isMicMutedGlobal}
              setIsMicMuted={voice.setIsMicMutedGlobal}
              isMyVoiceSpeaking={voice.isMyVoiceSpeakingGlobal}
              setIsMyVoiceSpeaking={voice.setIsMyVoiceSpeakingGlobal}
              voiceVolumeLevel={voice.voiceVolumeLevelGlobal}
              setVoiceVolumeLevel={voice.setVoiceVolumeLevelGlobal}
              voiceManagerRef={voice.globalVoiceManagerRef}
              onSelectPlayer={(id) => {
                nav.setLobbiesView(false);
                player.searchPlayer(id);
              }}
            />
          </div>
        ) : nav.newsView && !nav.agentsView ? (
          <div key="news" className="animate-page-in w-full">
            <NewsViewComponent
              newsItems={player.newsItems}
              setNewsItems={player.setNewsItems}
              targetNewsId={nav.targetNewsId}
            />
          </div>
        ) : nav.agentsView && !nav.newsView ? (
          <div key="agents" className="animate-page-in w-full">
            <AgentsWikiComponent
              videoLoop={settings.videoLoop}
              videoLoopDelay={settings.videoLoopDelay}
              locale={locale}
              pushUrl={nav.pushUrl}
            />
          </div>
        ) : (
          <div className="animate-page-in flex-1 flex flex-col items-center px-4 sm:px-8 z-10 w-full max-w-6xl mx-auto">
            {player.error &&
              (player.error.includes("privé") ? (
                <div className="glass-panel rounded-2xl p-10 flex flex-col items-center text-center max-w-lg mb-6 animate-in fade-in duration-500">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#ff4655"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect
                        width="18"
                        height="11"
                        x="3"
                        y="11"
                        rx="2"
                        ry="2"
                      />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-widest text-[var(--color-text-primary)] mb-2">
                    Profil Privé
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {player.error}
                  </p>
                </div>
              ) : (
                <div className="bg-red-500/20 border border-red-500 text-red-200 px-6 py-3 rounded-lg mb-6 text-center max-w-lg">
                  {player.error}
                </div>
              ))}

            {player.loading && <ProfileSkeleton />}

            {!player.playerData && !player.loading && (
              <div className="flex flex-col items-center justify-center mt-20 text-center animate-in fade-in duration-700">
                <div className="w-24 h-24 rounded-3xl mb-8 overflow-hidden shadow-[0_0_40px_rgba(255,70,85,0.3)] ring-2 ring-[var(--color-val-red)]/40">
                  <img
                    src="/sgs-icon.jpg"
                    alt="SGS Logo"
                    className="w-full h-full object-cover scale-[1.15]"
                  />
                </div>
                <h2 className="text-3xl font-bold mb-4">
                  Bienvenue sur SGS-Tracker
                </h2>
                <p className="text-[var(--color-text-secondary)] mb-8 max-w-md">
                  Recherchez un joueur ou connectez-vous via RSO.
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-6 opacity-50">
                  Debug : Double-cliquez sur le logo ou Ctrl+Shift+D
                </p>
              </div>
            )}

            {player.playerData && renderPlayerProfile()}
          </div>
        )}

        {/* Bottom Mobile Navigation */}
        <MobileNav
          activeTab={nav.activeTab}
          newsView={nav.newsView}
          agentsView={nav.agentsView}
          lobbiesView={nav.lobbiesView}
          settingsOpen={nav.settingsOpen}
          onGoHome={() => {
            nav.resetToProfile();
            player.goHome();
          }}
          onSelectTab={(tab) => {
            nav.setLobbiesView(false);
            nav.setActiveTab(tab);
            nav.pushUrl({
              tab,
              playerId: player.riotId || player.myRiotId,
              isOwnProfile: !!isOwn,
            });
          }}
          onOpenNews={() => navigateToView("news")}
          onOpenAgents={() => navigateToView("agents")}
          onOpenLobbies={() => {
            nav.resetToProfile();
            nav.setLobbiesView(true);
          }}
          onToggleSettings={() => {
            const newVal = !nav.settingsOpen;
            nav.setSettingsOpen(newVal);
            if (newVal) {
              nav.pushUrl({ view: "settings" });
            } else {
              nav.pushUrl({
                tab: nav.activeTab,
                playerId: player.riotId || player.myRiotId,
                isOwnProfile: !!isOwn,
              });
            }
          }}
          onOpenMenuDrawer={() => nav.setShowMobileDrawer(true)}
        />

        {/* Modals */}
        <HotkeysHelpModal
          isOpen={nav.showHotkeysModal}
          onClose={() => nav.setShowHotkeysModal(false)}
          ecoMode={settings.ecoMode}
          onToggleEcoMode={() => settings.setEcoMode(!settings.ecoMode)}
        />

        {nav.showLeaderboardModal && (
          <LeaderboardModal
            onClose={() => nav.setShowLeaderboardModal(false)}
          />
        )}

        {nav.showCardModal && (
          <PlayerCardModal
            playerData={player.playerData}
            onClose={() => nav.setShowCardModal(false)}
            performanceScoreResult={filters.performanceScoreResult}
            isPublicSPI={!settings.hiddenStats.includes("performanceScore")}
          />
        )}

        <MobileAppDrawer
          isOpen={nav.showMobileDrawer}
          onClose={() => nav.setShowMobileDrawer(false)}
          onOpenSettings={() => {
            nav.setSettingsOpen(true);
            nav.pushUrl({ view: "settings" });
          }}
          onOpenLeaderboard={() => nav.setShowLeaderboardModal(true)}
          onToggleFullscreen={settings.toggleFullscreen}
          onSignOut={() => signOut({ callbackUrl: "/" })}
        />

        {/* Persistent Floating Voice Bar */}
        {!nav.lobbiesView &&
          voice.isInVoiceGlobal &&
          voice.activeVoiceLobby && (
            <FloatingVoiceBar
              activeLobby={voice.activeVoiceLobby}
              isInVoice={voice.isInVoiceGlobal}
              isMicMuted={voice.isMicMutedGlobal}
              isSpeaking={voice.isMyVoiceSpeakingGlobal}
              voiceVolumeLevel={voice.voiceVolumeLevelGlobal}
              onToggleMute={() => {
                const nextMute = !voice.isMicMutedGlobal;
                voice.setIsMicMutedGlobal(nextMute);
                voice.globalVoiceManagerRef.current?.setMute(nextMute);
              }}
              onOpenSalon={() => {
                nav.resetToProfile();
                nav.setLobbiesView(true);
              }}
              onLeaveVoice={async () => {
                if (voice.globalVoiceManagerRef.current) {
                  voice.globalVoiceManagerRef.current.stop();
                  voice.globalVoiceManagerRef.current = null;
                }
                voice.setIsInVoiceGlobal(false);
                voice.setIsMyVoiceSpeakingGlobal(false);
                if (voice.activeVoiceLobby) {
                  try {
                    const myName =
                      player.playerData?.gameName ||
                      player.playerData?.player?.gameName ||
                      "Joueur";
                    const myTag =
                      player.playerData?.tagLine ||
                      player.playerData?.player?.tagLine ||
                      "EUW";
                    await fetch(
                      `/api/lobbies/${voice.activeVoiceLobby.id}`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          action: "voice-leave",
                          gameName: myName,
                          tagLine: myTag,
                        }),
                      }
                    );
                  } catch {}
                }
              }}
            />
          )}
      </main>

      {/* SGS & Riot Games Legal Footer */}
      <footer className="w-full border-t border-white/10 bg-[#070a0e]/95 backdrop-blur-md px-4 py-8 text-[11px] text-[var(--color-text-secondary)] leading-relaxed mb-12 md:mb-0">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold">
            <button
              onClick={() => {
                sounds.playClick();
                nav.setLegalModalTab("cgu");
                nav.setShowLegalModal(true);
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Conditions d&apos;Utilisation (CGU)
            </button>
            <span className="text-white/20">•</span>
            <button
              onClick={() => {
                sounds.playClick();
                nav.setLegalModalTab("mentions");
                nav.setShowLegalModal(true);
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Mentions Légales &amp; Hébergeur
            </button>
            <span className="text-white/20">•</span>
            <button
              onClick={() => {
                sounds.playClick();
                nav.setLegalModalTab("privacy");
                nav.setShowLegalModal(true);
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Confidentialité &amp; RGPD
            </button>
            <span className="text-white/20">•</span>
            <button
              onClick={() => {
                sounds.playClick();
                nav.setLegalModalTab("riot");
                nav.setShowLegalModal(true);
              }}
              className="text-red-400 hover:text-red-300 transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <IconSword size={12} className="text-red-400" />
              <span>Règles Riot Games</span>
            </button>
          </div>

          <p className="text-[10px] text-center max-w-3xl mx-auto text-gray-500 leading-relaxed">
            « SGS Tracker et tout l&apos;écosystème SGS » est un projet
            indépendant qui n&apos;est pas approuvé par Riot Games et ne
            reflète pas les opinions ou les avis de Riot Games ou de toute
            personne officiellement impliquée dans la production ou la
            gestion des propriétés de Riot Games. Riot Games et toutes les
            propriétés associées sont des marques ou des marques déposées de
            Riot Games, Inc.
          </p>
        </div>
      </footer>

      {/* Global Modals */}
      <SgsLegalModal
        isOpen={nav.showLegalModal}
        onClose={() => nav.setShowLegalModal(false)}
        defaultTab={nav.legalModalTab}
      />

      <LoginModal
        isOpen={auth.loginModalOpen}
        onClose={() => auth.setLoginModalOpen(false)}
      />

      {filters.performanceScoreResult && (
        <PerformanceScoreModal
          isOpen={nav.showPerformanceModal}
          onClose={() => nav.setShowPerformanceModal(false)}
          result={filters.performanceScoreResult}
          isOwner={canEdit}
          isPublic={!settings.hiddenStats.includes("performanceScore")}
          onTogglePrivacy={() => {
            const isCurrentlyHidden = settings.hiddenStats.includes(
              "performanceScore"
            );
            const newHidden = isCurrentlyHidden
              ? settings.hiddenStats.filter(
                  (id) => id !== "performanceScore"
                )
              : [...settings.hiddenStats, "performanceScore"];
            settings.setHiddenStats(newHidden);
            fetch("/api/user/settings", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                hiddenStats: JSON.stringify(newHidden),
              }),
            }).catch(() => {});
          }}
        />
      )}

      {nav.showCoachModal && (
        <AiCoachModal
          isOpen={nav.showCoachModal}
          onClose={() => nav.setShowCoachModal(false)}
          matches={filters.filteredMatches}
          agentStats={player.playerData?.player?.agentStats}
          stats={player.playerData?.player?.stats}
          playerName={player.playerData?.player?.name}
        />
      )}

      {/* Comparateur de Joueurs */}
      <PlayerCompareModal
        isOpen={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        player1Data={player.playerData}
        onSelectPlayer={(selectedRiotId) => {
          setShowCompareModal(false);
          player.searchPlayer(selectedRiotId);
        }}
      />

      {/* Modal Badges & Succès Débloquables */}
      <AchievementsModal
        isOpen={showAchievementsModal}
        onClose={() => setShowAchievementsModal(false)}
        stats={player.playerData?.player?.stats || player.playerData?.stats}
        matches={filters.filteredMatches}
        playerName={
          player.playerData?.player?.name ||
          player.playerData?.player?.gameName ||
          player.riotId ||
          "Joueur"
        }
      />

      {/* Modal Amis SGS */}
      <FriendsModal
        isOpen={showFriendsModal}
        onClose={() => setShowFriendsModal(false)}
        onSelectPlayer={(selectedRiotId) => {
          setShowFriendsModal(false);
          player.searchPlayer(selectedRiotId);
        }}
      />

      {/* Local Dev Stats Panel (localhost only) */}
      {auth.isLocalhost && (
        <LocalDevStatsPanel
          currentRole={filters.dominantRole}
          onOverridesChange={player.setDevOverrides}
          currentRiotId={
            player.playerData?.player
              ? `${player.playerData.player.gameName}#${player.playerData.player.tagLine}`
              : player.riotId || player.myRiotId || "Gr4phØ#0001"
          }
          onRiotKeyChange={player.handleRiotKeyChange}
          isLiveRiotData={player.playerData?.isMock === false}
          playerStats={
            player.playerData?.player?.stats || player.playerData?.stats
          }
        />
      )}
    </>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-[var(--color-text-secondary)] font-bold tracking-widest uppercase animate-pulse">
          Chargement...
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
