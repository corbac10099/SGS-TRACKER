"use client";

import React from "react";
import dynamic from "next/dynamic";
import { signOut } from "next-auth/react";
import SgsLegalModal from "@/components/SgsLegalModal";
import LoginModal from "@/components/LoginModal";
import PerformanceScoreModal from "@/components/PerformanceScoreModal";
import HotkeysHelpModal from "@/components/HotkeysHelpModal";
import MobileAppDrawer from "@/components/MobileAppDrawer";

// Modales lourdes chargées à la demande avec dynamic()
const DynamicLeaderboardModal = dynamic(
  () => import("@/components/LeaderboardModal"),
  { ssr: false }
);

const DynamicPlayerCardModal = dynamic(
  () => import("@/components/PlayerCardModal"),
  { ssr: false }
);

const DynamicAiCoachModal = dynamic(
  () => import("@/components/AiCoachModal"),
  { ssr: false }
);

const DynamicPlayerCompareModal = dynamic(
  () => import("@/components/PlayerCompareModal"),
  { ssr: false }
);

const DynamicFriendsModal = dynamic(
  () => import("@/components/FriendsModal"),
  { ssr: false }
);
const DynamicLocalDevStatsPanel = dynamic(
  () => import("@/components/LocalDevStatsPanel"),
  { ssr: false }
);

export interface GlobalModalsProps {
  nav: any;
  auth: any;
  settings: any;
  player: any;
  filters: any;
  canEdit: boolean;
  effectiveBadgesString: string;
  showCompareModal: boolean;
  setShowCompareModal: (v: boolean) => void;
  showFriendsModal: boolean;
  setShowFriendsModal: (v: boolean) => void;
  trackerXp: number;
  trackerLevel: number;
  onAdminXpDelta: (delta: number) => void;
  onAdminStatDelta: (key: string, delta: number) => void;
  onSimulateMatch: (simMatch: any) => void;
}

export default function GlobalModals({
  nav,
  auth,
  settings,
  player,
  filters,
  canEdit,
  effectiveBadgesString,
  showCompareModal,
  setShowCompareModal,
  showFriendsModal,
  setShowFriendsModal,
  trackerXp,
  trackerLevel,
  onAdminXpDelta,
  onAdminStatDelta,
  onSimulateMatch,
}: GlobalModalsProps) {
  return (
    <>
      {/* Raccourcis clavier */}
      <HotkeysHelpModal
        isOpen={nav.showHotkeysModal}
        onClose={() => nav.setShowHotkeysModal(false)}
        ecoMode={settings.ecoMode}
        onToggleEcoMode={() => settings.setEcoMode(!settings.ecoMode)}
      />

      {/* Leaderboard Modal */}
      {nav.showLeaderboardModal && (
        <DynamicLeaderboardModal
          onClose={() => nav.setShowLeaderboardModal(false)}
        />
      )}

      {/* Player Card Modal */}
      {nav.showCardModal && (
        <DynamicPlayerCardModal
          playerData={
            player.playerData
              ? { ...player.playerData, badge: effectiveBadgesString }
              : null
          }
          onClose={() => nav.setShowCardModal(false)}
          performanceScoreResult={filters.performanceScoreResult}
          isPublicSPI={!settings.hiddenStats.includes("performanceScore")}
        />
      )}

      {/* Drawer mobile de navigation */}
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

      {/* Mentions légales & CGU */}
      <SgsLegalModal
        isOpen={nav.showLegalModal}
        onClose={() => nav.setShowLegalModal(false)}
        defaultTab={nav.legalModalTab}
      />

      {/* Authentification */}
      <LoginModal
        isOpen={auth.loginModalOpen}
        onClose={() => auth.setLoginModalOpen(false)}
      />

      {/* Performance Score (SPI) */}
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
                  (id: string) => id !== "performanceScore"
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

      {/* Coach IA */}
      {nav.showCoachModal && (
        <DynamicAiCoachModal
          isOpen={nav.showCoachModal}
          onClose={() => nav.setShowCoachModal(false)}
          matches={filters.filteredMatches}
          agentStats={player.playerData?.player?.agentStats}
          stats={player.playerData?.player?.stats}
          playerName={player.playerData?.player?.name}
        />
      )}

      {/* Comparateur de Joueurs */}
      {showCompareModal && (
        <DynamicPlayerCompareModal
          isOpen={showCompareModal}
          onClose={() => setShowCompareModal(false)}
          player1Data={player.playerData}
          onSelectPlayer={(selectedRiotId: string) => {
            setShowCompareModal(false);
            player.searchPlayer(selectedRiotId);
          }}
        />
      )}

      {/* Modal Amis SGS */}
      {showFriendsModal && (
        <DynamicFriendsModal
          isOpen={showFriendsModal}
          onClose={() => setShowFriendsModal(false)}
          onSelectPlayer={(selectedRiotId: string) => {
            setShowFriendsModal(false);
            player.searchPlayer(selectedRiotId);
          }}
        />
      )}

      {/* Local Dev Stats Panel (environnement de développement local uniquement - éliminé en production) */}
      {process.env.NODE_ENV === "development" && auth.isLocalhost && (
        <DynamicLocalDevStatsPanel
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
          trackerXp={trackerXp}
          trackerLevel={trackerLevel}
          onXpDelta={onAdminXpDelta}
          onStatDelta={onAdminStatDelta}
          onSimulateMatch={onSimulateMatch}
        />
      )}
    </>
  );
}
