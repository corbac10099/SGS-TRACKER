"use client";

import React from "react";
import { sounds } from "@/lib/soundEffects";
import PerformanceScoreCard from "./PerformanceScoreCard";
import { UserBadges } from "./UserBadges";
import { IconBrain, IconShare, IconTrophy, IconDownload } from "./icons/SpyIcons";

export interface ProfileBannerProps {
  player: any;
  canEditProfile: boolean;
  streamerMode: boolean;
  bannerUrl: string;
  bannerOffsetY: number;
  hiddenStats: string[];
  showBadgeState: boolean;
  hiddenBadges: string[];
  performanceScoreResult: any;
  isFavorited: (gameName: string, tagLine: string) => boolean;
  toggleFavorite: (player: any) => void;
  onOpenPerformanceModal: () => void;
  onOpenCoachModal: () => void;
  onOpenCardModal: () => void;
  onExportCSV?: () => void;
  onOpenAchievements?: () => void;
}

export default function ProfileBanner({
  player: p,
  canEditProfile,
  streamerMode,
  bannerUrl,
  bannerOffsetY,
  hiddenStats,
  showBadgeState,
  hiddenBadges,
  performanceScoreResult,
  isFavorited,
  toggleFavorite,
  onOpenPerformanceModal,
  onOpenCoachModal,
  onOpenCardModal,
  onExportCSV,
  onOpenAchievements,
}: ProfileBannerProps) {
  const profileBannerUrl = canEditProfile
    ? bannerUrl || p.customBannerUrl || p.cardWideUrl
    : p.customBannerUrl || p.cardWideUrl;

  const profileBannerOffsetY = canEditProfile
    ? (bannerOffsetY ?? p.customBannerOffsetY ?? 50)
    : (p.customBannerOffsetY ?? 50);

  const profileThemeClass =
    !canEditProfile && p.customTheme && p.customTheme !== "dark"
      ? `theme-${p.customTheme}`
      : "";

  const displayName = streamerMode
    ? p.mainAgent?.name || "Joueur Masqué"
    : p.gameName;
  const displayTag = streamerMode ? "" : `#${p.tagLine}`;

  return (
    <div
      className={`w-full flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-700 ${profileThemeClass}`}
    >
      {/* Bannière Profil Responsive avec Contour Thème */}
      <div className="w-full relative rounded-2xl overflow-hidden border border-[var(--color-val-red)]/50 shadow-accent-md bg-[#0a0e13] min-h-[135px] sm:min-h-[140px] aspect-[2.3/1] sm:aspect-[3.6/1] md:aspect-[3.8/1] transition-all duration-300">
        <img
          referrerPolicy="no-referrer"
          src={profileBannerUrl}
          alt="Banner"
          style={{ objectPosition: `center ${profileBannerOffsetY}%` }}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        />
        <div className="absolute inset-0 bg-black/40"></div>

        {/* SPI en haut à gauche & Export Carte / Favori en haut à droite */}
        <div className="absolute top-2.5 sm:top-3.5 left-3 sm:left-6 right-3 sm:right-6 flex items-center justify-between pointer-events-none z-20">
          <div className="pointer-events-auto">
            {performanceScoreResult && (
              <PerformanceScoreCard
                result={performanceScoreResult}
                onClickDetail={onOpenPerformanceModal}
                compact={true}
                isOwner={canEditProfile}
                isPublic={!hiddenStats.includes("performanceScore")}
              />
            )}
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            {canEditProfile && (
              <button
                type="button"
                onMouseEnter={() => sounds.playHover()}
                onClick={() => {
                  sounds.playClick();
                  onOpenCoachModal();
                }}
                title="Ouvrir le Coach Tactique Spycam"
                className="px-2.5 sm:px-3 py-1.5 rounded-xl glass-pill hover:bg-emerald-600/30 border-white/20 hover:border-emerald-400 text-white transition-all flex items-center gap-1.5 text-xs font-bold shadow-lg cursor-pointer group"
              >
                <IconBrain
                  size={14}
                  className="text-emerald-400 group-hover:scale-110 transition-transform"
                />
                <span className="hidden sm:inline">Coach Tactique</span>
              </button>
            )}
            {onOpenAchievements && (
              <button
                type="button"
                onMouseEnter={() => sounds.playHover()}
                onClick={() => {
                  sounds.playClick();
                  onOpenAchievements();
                }}
                title="Succès & Badges Débloquables"
                className="px-2.5 sm:px-3 py-1.5 rounded-xl glass-pill hover:bg-amber-500/30 border-white/20 hover:border-amber-400 text-white transition-all flex items-center gap-1.5 text-xs font-bold shadow-lg cursor-pointer group"
              >
                <IconTrophy
                  size={14}
                  className="text-amber-400 group-hover:scale-110 transition-transform"
                />
                <span className="hidden sm:inline">Succès</span>
              </button>
            )}
            {onExportCSV && (
              <button
                type="button"
                onMouseEnter={() => sounds.playHover()}
                onClick={() => {
                  sounds.playClick();
                  onExportCSV();
                }}
                title="Exporter l'historique en CSV"
                className="px-2.5 sm:px-3 py-1.5 rounded-xl glass-pill hover:bg-cyan-500/30 border-white/20 hover:border-cyan-400 text-white transition-all flex items-center gap-1.5 text-xs font-bold shadow-lg cursor-pointer group"
              >
                <IconDownload
                  size={14}
                  className="text-cyan-400 group-hover:scale-110 transition-transform"
                />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            )}
            {canEditProfile ? (
              <button
                type="button"
                onMouseEnter={() => sounds.playHover()}
                onClick={() => {
                  sounds.playClick();
                  onOpenCardModal();
                }}
                title="Exporter ma Carte Joueur (PNG)"
                className="px-2.5 sm:px-3 py-1.5 rounded-xl glass-pill hover:bg-[var(--color-val-red)]/30 border-white/20 hover:border-[var(--color-val-red)] text-white transition-all flex items-center gap-1.5 text-xs font-bold shadow-lg cursor-pointer group"
              >
                <IconShare
                  size={14}
                  className="group-hover:scale-110 transition-transform"
                />
                <span className="hidden sm:inline">Exporter Carte</span>
              </button>
            ) : (
              <button
                type="button"
                onMouseEnter={() => sounds.playHover()}
                onClick={() => {
                  sounds.playClick();
                  toggleFavorite(p);
                }}
                title={
                  isFavorited(p.gameName, p.tagLine)
                    ? "Retirer des favoris"
                    : "Ajouter aux favoris"
                }
                className={`w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-300 glass-pill cursor-pointer ${
                  isFavorited(p.gameName, p.tagLine)
                    ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                    : "text-white/60 hover:text-yellow-400 hover:border-yellow-500/40"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill={
                    isFavorited(p.gameName, p.tagLine)
                      ? "currentColor"
                      : "none"
                  }
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="relative z-10 px-3 sm:px-6 md:px-8 pt-9 sm:pt-6 pb-2.5 sm:pb-4 flex items-center justify-between h-full w-full gap-2">
          {/* Gauche : Avatar + Pseudo + Tag + Badge */}
          <div className="flex items-center gap-2.5 sm:gap-4 md:gap-5 flex-1 min-w-0 md:max-w-[45%] z-10">
            <div className="relative flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-13 h-13 xs:w-15 xs:h-15 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 border-[rgba(255,255,255,0.15)] shadow-[0_4px_15px_rgba(0,0,0,0.6)] bg-black/60">
                <img
                  referrerPolicy="no-referrer"
                  src={p.cardUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              {p.mainAgent && (
                <div className="hidden sm:flex items-center gap-1.5 bg-[rgba(0,0,0,0.5)] rounded-full px-2 py-0.5 border border-[rgba(255,255,255,0.1)]">
                  <img
                    referrerPolicy="no-referrer"
                    src={p.mainAgent.icon}
                    alt={p.mainAgent.name}
                    className="w-3.5 h-3.5 rounded-full shadow-md"
                  />
                  <span className="text-[9px] font-bold text-white uppercase tracking-wider">
                    {p.mainAgent.name}
                  </span>
                </div>
              )}
            </div>

            <div
              className="flex flex-col min-w-0"
              style={{ textShadow: "0px 2px 10px rgba(0,0,0,0.8)" }}
            >
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-sm xs:text-base sm:text-xl md:text-2xl font-black tracking-tight text-white truncate max-w-[140px] xs:max-w-[180px] sm:max-w-none">
                  {displayName}
                </span>
                {displayTag && (
                  <span className="text-[10px] sm:text-xs md:text-sm text-[var(--color-text-secondary)] font-medium">
                    {displayTag}
                  </span>
                )}
                <span className="md:hidden text-[9px] font-black text-[var(--color-val-light)] bg-white/10 border border-white/15 px-1.5 py-0.5 rounded-md">
                  Nv. {p.level}
                </span>
                {p.isAdminBypass && (
                  <span className="text-[9px] font-black text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    🔒 Profil Privé (Bypass Admin)
                  </span>
                )}
                {!streamerMode && (
                  <UserBadges
                    badges={p.badge}
                    showBadge={
                      canEditProfile ? showBadgeState : p.showBadge
                    }
                    size={16}
                    hiddenBadges={canEditProfile ? hiddenBadges : []}
                  />
                )}
              </div>
              {p.mainAgent && (
                <span className="text-[9px] sm:text-[9px] md:text-[10px] text-[var(--color-text-secondary)] uppercase tracking-[0.1em] sm:tracking-[0.2em] mt-0.5 font-bold truncate">
                  Main • {p.mainAgent.role}
                </span>
              )}
            </div>
          </div>

          {/* Centre : Niveau en losange (Desktop uniquement) */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex-col items-center pointer-events-none z-10">
            <span
              className="text-[9px] md:text-[10px] text-[var(--color-text-secondary)] uppercase tracking-[0.15em] mb-1 font-bold"
              style={{
                textShadow: "0px 2px 8px rgba(0,0,0,0.8)",
              }}
            >
              Niveau
            </span>
            <div className="relative flex items-center justify-center sm:w-12 sm:h-12 md:w-16 md:h-16">
              <div className="absolute inset-0 border-2 border-[var(--color-val-light)] opacity-50 transform rotate-45 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.5)]"></div>
              <span className="sm:text-xl md:text-3xl font-black text-[var(--color-val-light)] drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] z-10">
                {p.level}
              </span>
            </div>
          </div>

          {/* Droite : Rang */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-auto z-10">
            <div
              className="flex flex-col items-end hidden sm:flex"
              style={{
                textShadow: "0px 2px 10px rgba(0,0,0,0.8)",
              }}
            >
              <span className="text-[9px] sm:text-[10px] text-[var(--color-text-secondary)] uppercase tracking-[0.2em] font-bold">
                Rang
              </span>
              <span className="text-xs sm:text-lg font-black text-white uppercase tracking-wider">
                {p.rank}
              </span>
            </div>
            <img
              referrerPolicy="no-referrer"
              src={p.rankUrl}
              alt={p.rank}
              className="w-11 h-11 xs:w-13 xs:h-13 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
