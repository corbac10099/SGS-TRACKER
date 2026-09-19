"use client";

import React from "react";
import dynamic from "next/dynamic";
import ProfileSkeleton from "@/components/ProfileSkeleton";

// Skeletons élégants pour le lazy loading des vues secondaires
function ViewLoadingSkeleton({ message }: { message: string }) {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8 text-center animate-pulse">
      <div className="w-12 h-12 rounded-2xl bg-[var(--color-val-red)]/20 border border-[var(--color-val-red)]/40 flex items-center justify-center mb-4">
        <div className="w-5 h-5 border-2 border-[var(--color-val-red)] border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-sm font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">
        {message}
      </p>
    </div>
  );
}

// Imports dynamiques (Code Splitting) pour alléger le bundle initial (~450+ KB économisés)
const DynamicSettingsView = dynamic(() => import("@/components/SettingsView"), {
  ssr: false,
  loading: () => <ViewLoadingSkeleton message="Chargement des Paramètres..." />,
});

const DynamicLobbiesView = dynamic(() => import("@/components/LobbiesView"), {
  ssr: false,
  loading: () => <ViewLoadingSkeleton message="Connexion aux Salons..." />,
});

const DynamicLeaderboardView = dynamic(
  () => import("@/components/LeaderboardViewComponent"),
  {
    ssr: false,
    loading: () => <ViewLoadingSkeleton message="Chargement du Classement..." />,
  }
);

const DynamicAgentsWiki = dynamic(
  () => import("@/components/AgentsWikiComponent"),
  {
    ssr: false,
    loading: () => <ViewLoadingSkeleton message="Chargement du Wiki des Agents..." />,
  }
);

const DynamicNewsView = dynamic(
  () => import("@/components/NewsViewComponent"),
  {
    ssr: false,
    loading: () => <ViewLoadingSkeleton message="Chargement des Actualités..." />,
  }
);

export interface ViewRouterProps {
  nav: {
    settingsOpen: boolean;
    leaderboardView: boolean;
    lobbiesView: boolean;
    newsView: boolean;
    agentsView: boolean;
    targetNewsId?: string | null;
    setSettingsOpen: (v: boolean) => void;
    setLeaderboardView: (v: boolean) => void;
    setLobbiesView: (v: boolean) => void;
    pushUrl: (opts: any) => void;
  };
  settings: any;
  player: any;
  voice: any;
  lobbyInvites: any;
  canEdit: boolean;
  effectiveBadgesString: string;
  trackerLevel: number;
  locale: string;
  renderPlayerProfile: () => React.ReactNode;
}

export default function ViewRouter({
  nav,
  settings,
  player,
  voice,
  lobbyInvites,
  canEdit,
  effectiveBadgesString,
  trackerLevel,
  locale,
  renderPlayerProfile,
}: ViewRouterProps) {
  if (nav.settingsOpen) {
    return (
      <div key="settings" className="animate-page-in w-full">
        <DynamicSettingsView
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
          p={
            player.playerData?.player
              ? { ...player.playerData.player, badge: effectiveBadgesString }
              : { badge: effectiveBadgesString }
          }
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
          dndEnabled={settings.dndEnabled}
          setDndEnabled={settings.setDndEnabled}
          dndBlockLobbyInvites={settings.dndBlockLobbyInvites}
          setDndBlockLobbyInvites={settings.setDndBlockLobbyInvites}
          notificationPreferences={settings.notificationPreferences}
          setNotificationPreferences={settings.setNotificationPreferences}
          equippedBannerAnimation={settings.equippedBannerAnimation}
          setEquippedBannerAnimation={settings.setEquippedBannerAnimation}
          equippedBannerBorder={settings.equippedBannerBorder}
          setEquippedBannerBorder={settings.setEquippedBannerBorder}
          trackerLevel={trackerLevel}
        />
      </div>
    );
  }

  if (nav.leaderboardView) {
    return (
      <div key="leaderboard" className="animate-page-in w-full">
        <DynamicLeaderboardView
          onSelectPlayer={(id: string) => {
            nav.setLeaderboardView(false);
            player.searchPlayer(id);
          }}
        />
      </div>
    );
  }

  if (nav.lobbiesView) {
    return (
      <div
        key="lobbies"
        className="animate-page-in flex-1 flex flex-col items-center px-1 sm:px-3 md:px-6 z-10 w-full max-w-[1750px] mx-auto min-h-[calc(100vh-90px)]"
      >
        <DynamicLobbiesView
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
          onSelectPlayer={(id: string) => {
            nav.setLobbiesView(false);
            player.searchPlayer(id);
          }}
          lobbyInvites={lobbyInvites.invites}
          onAcceptLobbyInvite={lobbyInvites.acceptInvite}
          onDeclineLobbyInvite={lobbyInvites.declineInvite}
        />
      </div>
    );
  }

  if (nav.newsView && !nav.agentsView) {
    return (
      <div key="news" className="animate-page-in w-full">
        <DynamicNewsView
          newsItems={player.newsItems}
          setNewsItems={player.setNewsItems}
          targetNewsId={nav.targetNewsId}
        />
      </div>
    );
  }

  if (nav.agentsView && !nav.newsView) {
    return (
      <div key="agents" className="animate-page-in w-full">
        <DynamicAgentsWiki
          videoLoop={settings.videoLoop}
          videoLoopDelay={settings.videoLoopDelay}
          locale={locale}
          pushUrl={nav.pushUrl}
        />
      </div>
    );
  }

  // Vue par défaut : Profil Joueur / Accueil
  return (
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
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
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
          <h2 className="text-3xl font-bold mb-4">Bienvenue sur SGS-Tracker</h2>
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
  );
}
