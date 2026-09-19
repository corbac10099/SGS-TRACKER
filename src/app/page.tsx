"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n";

// Hooks
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { useNavigation } from "@/hooks/useNavigation";
import { useFavorites } from "@/hooks/useFavorites";
import { usePlayerData } from "@/hooks/usePlayerData";
import { useFilters } from "@/hooks/useFilters";
import { useVoiceState } from "@/hooks/useVoiceState";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useLobbyInvites } from "@/hooks/useLobbyInvites";
import { useFriends } from "@/hooks/useFriends";
import { useQuests } from "@/hooks/useQuests";
import { useBadgeRules } from "@/hooks/useBadgeRules";
import { useThemeScope } from "@/hooks/useThemeScope";

// Utilities
import { getWarnings } from "@/lib/warnings";
import { normalizePlayerData } from "@/lib/playerDataUtils";
import { exportMatchesToCSV } from "@/lib/exportUtils";
import { sounds } from "@/lib/soundEffects";

// Layout & Direct Components (Restent en statique pour un chargement immédiat)
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import ProfileBanner from "@/components/ProfileBanner";
import ProfileTabs from "@/components/ProfileTabs";
import DashboardGrid from "@/components/DashboardGrid";
import PersonalGoalsWidget from "@/components/PersonalGoalsWidget";
import TiltAlertBanner from "@/components/TiltAlertBanner";
import AgentsStatsTab from "@/components/AgentsStatsTab";
import MapsStatsTab from "@/components/MapsStatsTab";
import ActivityCalendar from "@/components/ActivityCalendar";
import MatchHistory from "@/components/MatchHistory";
import FloatingVoiceBar from "@/components/FloatingVoiceBar";
import LandingPage from "@/components/landing/LandingPage";
import LoginModal from "@/components/LoginModal";
import { IconSword } from "@/components/icons/SpyIcons";

// Orchestrateurs modulaires (avec Code-Splitting next/dynamic intégré)
import ViewRouter from "@/components/ViewRouter";
import GlobalModals from "@/components/GlobalModals";

function DebugPanel() {
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

  // ─── Hooks Fondamentaux ────────────────────────────────────
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
  const friendsManager = useFriends();

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

  // ─── Hooks Spécialisés Extraits ───────────────────────────
  const quests = useQuests({
    auth,
    setPlayerData: player.setPlayerData,
  });

  const canEdit = auth.canEditProfile(player.playerData);

  const { effectiveBadgesString, activeBannerAnim, activeBannerBorder } =
    useBadgeRules({
      trackerLevel: quests.trackerLevel,
      playerData: player.playerData,
      hiddenBadges: settings.hiddenBadges,
      setHiddenBadges: settings.setHiddenBadges,
      canEdit,
      equippedBannerAnimation: settings.equippedBannerAnimation,
      equippedBannerBorder: settings.equippedBannerBorder,
    });

  const { profileScopedThemeClass, profileScopedThemeStyles } = useThemeScope({
    canEdit,
    playerData: player.playerData,
    forceMyTheme: settings.forceMyTheme,
    setActiveThemeOverride: settings.setActiveThemeOverride,
  });

  // ─── États Locaux Légers ──────────────────────────────────
  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);
  const [showFriendsModal, setShowFriendsModal] = useState<boolean>(false);
  const [isDirectComparing, setIsDirectComparing] = useState<boolean>(false);
  const [highlightedMatchId, setHighlightedMatchId] = useState<string | null>(
    null
  );

  const lobbyInvites = useLobbyInvites((_lobbyId, lobby) => {
    nav.setSettingsOpen(false);
    nav.setNewsView(false);
    nav.setAgentsView(false);
    nav.setLeaderboardView(false);
    nav.setLobbiesView(true);
    if (lobby) {
      voice.setActiveVoiceLobby(lobby);
    }
  });

  // ─── URL search params handling ───────────────────────────
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
            window.history.replaceState(
              {},
              "",
              url.pathname + (url.search || "")
            );
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

  // ─── Navigation Helpers ───────────────────────────────────
  const isOwn =
    player.myRiotId &&
    player.riotId.toLowerCase() === player.myRiotId.toLowerCase();

  const navigateToView = (
    view: "news" | "agents" | "lobbies" | "leaderboard",
    newsId?: string
  ) => {
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
      newsId,
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

    const matchIdx = (filters.filteredMatches || []).findIndex(
      (m: any) => (m.matchId || m.id) === matchId
    );
    if (matchIdx >= 0 && matchIdx >= filters.visibleMatchesCount) {
      filters.setVisibleMatchesCount(matchIdx + 10);
    }

    setTimeout(() => {
      const el = document.getElementById(`match-${matchId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 200);
  };

  // ─── Early returns (Auth & Loading) ───────────────────────
  if (auth.status === "loading") {
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
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0a0e13]">
        <div className="w-16 h-16 rounded-2xl mb-6 overflow-hidden shadow-[0_0_30px_rgba(255,70,85,0.4)] animate-pulse">
          <img
            src="/sgs-icon.jpg"
            alt="SGS"
            className="w-full h-full object-cover"
          />
        </div>
        <p className="text-[var(--color-val-red)] font-black tracking-widest uppercase text-sm animate-pulse">
          Chargement de SGS-Tracker...
        </p>
      </div>
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

  // ─── Rendu du Profil Joueur ───────────────────────────────
  const renderPlayerProfile = () => {
    if (!player.playerData) return null;

    const p = {
      ...normalizePlayerData(player.playerData),
      badge: effectiveBadgesString,
      stats: filters.effectiveStats,
      agentStats: filters.filteredAgents,
      matchHistory: filters.effectiveMatches,
    };
    const s = p.stats;
    const w = getWarnings(s);

    const isFriendAllowed = Boolean(
      player.playerData?.player?.isFriendAllowed ||
      player.playerData?.isFriendAllowed ||
      player.playerData?.player?.canViewStats
    );

    let appliedHiddenStats: string[] = [];
    if (!canEdit && !isFriendAllowed && player.playerData?.player?.hiddenStats) {
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
      ? auth.session?.user?.email || (auth.isGuestMode ? "guest" : p.puuid || "default")
      : p.puuid || `${p.gameName}#${p.tagLine}` || "default";

    return (
      <div
        className={`w-full flex flex-col min-w-0 transition-colors duration-300 ${profileScopedThemeClass}`}
        style={profileScopedThemeStyles}
      >
        <ProfileBanner
          player={p}
          canEditProfile={canEdit}
          streamerMode={settings.streamerMode}
          bannerUrl={canEdit ? settings.bannerUrl : p.bannerUrl || p.customBannerUrl || ""}
          bannerOffsetY={canEdit ? settings.bannerOffsetY : (p.bannerOffsetY ?? p.customBannerOffsetY ?? 50)}
          hiddenStats={canEdit || isFriendAllowed ? [] : appliedHiddenStats}
          showBadgeState={canEdit ? settings.showBadgeState : player.playerData?.player?.showBadge !== false}
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
          isComparing={isDirectComparing}
          onToggleCompare={() => setIsDirectComparing(!isDirectComparing)}
          bannerAnimation={activeBannerAnim}
          bannerBorder={activeBannerBorder}
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

        {/* Onglet Performance */}
        {nav.activeTab === "performance" && s && (
          <div key="tab-performance" className="w-full animate-tab-in">
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
              initialGridData={
                player.playerData?.player?.dashboardGrid ||
                player.playerData?.dashboardGrid
              }
              performanceScoreResult={filters.performanceScoreResult}
              onOpenPerformanceModal={() => nav.setShowPerformanceModal(true)}
              onOpenCoachModal={() => nav.setShowCoachModal(true)}
              agentStats={player.playerData?.player?.agentStats}
              playerName={player.playerData?.player?.name}
              friendsStats={friendsManager.friendsStats}
              isFriendAllowed={isFriendAllowed}
              onSelectPlayer={(id) => player.searchPlayer(id)}
              onOpenFriendsModal={() => setShowFriendsModal(true)}
              myStats={
                player.myPlayerData?.player?.stats || player.myPlayerData?.stats
              }
              myMatchHistory={
                player.myPlayerData?.player?.matches ||
                player.myPlayerData?.matches
              }
              myPlayerName={player.myRiotId || "Moi"}
              isComparing={isDirectComparing}
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

            <div className="mt-8">
              <PersonalGoalsWidget
                currentStats={s}
                matchesCount={filters.filteredMatches?.length}
              />
            </div>
          </div>
        )}

        {/* Onglet Agents */}
        {nav.activeTab === "agents" && (
          <div key="tab-agents" className="w-full animate-tab-in">
            <AgentsStatsTab
              agentStats={p.agentStats}
              matches={filters.filteredMatches}
              onSelectMatch={handleSelectMatch}
            />
          </div>
        )}

        {/* Onglet Cartes */}
        {nav.activeTab === "maps" && (
          <div key="tab-maps" className="w-full animate-tab-in">
            <MapsStatsTab
              matches={filters.filteredMatches}
              onSelectMatch={handleSelectMatch}
            />
          </div>
        )}

        {/* Onglet Matchs */}
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

  // ─── Rendu Principal Épuré ────────────────────────────────
  return (
    <>
      {/* Bannière Bêta Démo */}
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
        <DebugPanel />

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
          dailyQuests={quests.dailyQuests}
          trackerXp={quests.trackerXp}
          trackerLevel={quests.trackerLevel}
          onClaimQuest={quests.handleClaimQuest}
          onOpenFriends={() => setShowFriendsModal(true)}
          pendingFriendsCount={friendsManager.pendingIncomingCount}
          lobbyInvites={lobbyInvites.invites}
          onAcceptLobbyInvite={lobbyInvites.acceptInvite}
          onDeclineLobbyInvite={lobbyInvites.declineInvite}
          lobbyActionLoading={lobbyInvites.actionLoading}
        />

        {/* Floating Real-time Incoming Lobby Invite Banner */}
        {lobbyInvites.activeBannerInvite && (
          <div className="fixed top-20 right-4 sm:right-6 z-[100] max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-4 rounded-2xl glass-panel border border-[var(--color-val-red)]/60 bg-[#0d1117]/95 shadow-[0_10px_35px_rgba(255,70,85,0.3)] backdrop-blur-xl flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-xl bg-[var(--color-surface)] border border-white/20 overflow-hidden">
                      {lobbyInvites.activeBannerInvite.senderAvatar ? (
                        <img
                          src={lobbyInvites.activeBannerInvite.senderAvatar}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-black text-white bg-[var(--color-val-red)]">
                          {lobbyInvites.activeBannerInvite.senderName[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0d1117] flex items-center justify-center text-[8px] text-black font-bold">
                      ✓
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-white truncate">
                        {lobbyInvites.activeBannerInvite.senderName}#{lobbyInvites.activeBannerInvite.senderTag}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-[var(--color-val-red)]/20 text-[var(--color-val-red)] text-[9px] font-black uppercase flex-shrink-0">
                        Salon
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 line-clamp-1">
                      Vous invite à rejoindre son escouade{" "}
                      <strong className="text-white font-bold">
                        ({lobbyInvites.activeBannerInvite.lobby?.mode || "Compétitif"})
                      </strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => lobbyInvites.declineInvite(lobbyInvites.activeBannerInvite!.id)}
                  className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center text-xs cursor-pointer flex-shrink-0"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={lobbyInvites.actionLoading}
                  onClick={() => lobbyInvites.acceptInvite(lobbyInvites.activeBannerInvite!.id)}
                  className="flex-1 py-2 px-3 rounded-xl bg-[var(--color-val-red)] hover:brightness-110 text-white text-xs font-black uppercase tracking-wider transition-all shadow-accent-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>Rejoindre le salon</span>
                  <span>➔</span>
                </button>
                <button
                  type="button"
                  disabled={lobbyInvites.actionLoading}
                  onClick={() => lobbyInvites.declineInvite(lobbyInvites.activeBannerInvite!.id)}
                  className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--color-text-secondary)] hover:text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border border-white/10"
                >
                  Refuser
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Routeur de Vues Dynamiques (Lazy Loaded avec ViewRouter) */}
        <ViewRouter
          nav={nav}
          settings={settings}
          player={player}
          voice={voice}
          lobbyInvites={lobbyInvites}
          canEdit={canEdit}
          effectiveBadgesString={effectiveBadgesString}
          trackerLevel={quests.trackerLevel}
          locale={locale}
          renderPlayerProfile={renderPlayerProfile}
        />

        {/* Barre de navigation mobile */}
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

        {/* Barre vocale flottante persistante */}
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

      {/* Footer Légal SGS & Riot Games */}
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

      {/* Modales Globales (Modales secondaires en Lazy Loading) */}
      <GlobalModals
        nav={nav}
        auth={auth}
        settings={settings}
        player={player}
        filters={filters}
        canEdit={canEdit}
        effectiveBadgesString={effectiveBadgesString}
        showCompareModal={showCompareModal}
        setShowCompareModal={setShowCompareModal}
        showFriendsModal={showFriendsModal}
        setShowFriendsModal={setShowFriendsModal}
        trackerXp={quests.trackerXp}
        trackerLevel={quests.trackerLevel}
        onAdminXpDelta={quests.handleAdminXpDelta}
        onAdminStatDelta={quests.handleAdminStatDelta}
        onSimulateMatch={quests.handleSimulateMatch}
      />
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
