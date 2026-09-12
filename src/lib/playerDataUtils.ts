/**
 * Normalise les données brutes du playerData API en un objet `p` unifié
 * avec tous les fallbacks nécessaires pour le rendu du profil.
 */
export function normalizePlayerData(playerData: any): any {
  return {
    ...playerData.player,
    ...playerData,
    gameName: playerData.player?.gameName || playerData.gameName || "Joueur",
    tagLine: playerData.player?.tagLine || playerData.tagLine || "EU1",
    stats: null, // sera overridé par effectiveStats
    agentStats: null, // sera overridé par filteredAgents
    matchHistory: null, // sera overridé par effectiveMatches
    weapons: playerData.weapons || playerData.player?.weapons || [],
    rank:
      playerData.rank ||
      playerData.player?.rank ||
      "Ascendant 3",
    rankUrl:
      playerData.rankUrl ||
      playerData.player?.rankUrl ||
      "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/24/largeicon.png",
    rankTier: playerData.rankTier ?? playerData.player?.rankTier ?? 24,
    level:
      playerData.level ??
      playerData.player?.level ??
      playerData.player?.accountLevel ??
      100,
    cardUrl:
      playerData.player?.cardUrl ||
      playerData.player?.cardSmall ||
      playerData.cardUrl ||
      "https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/smallart.png",
    cardWideUrl:
      playerData.player?.cardWideUrl ||
      playerData.player?.cardWide ||
      playerData.cardWideUrl ||
      "https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/wideart.png",
    mainAgent: playerData.mainAgent || playerData.player?.mainAgent,
    badge: playerData.badge || playerData.player?.badge || null,
    showBadge: playerData.showBadge ?? playerData.player?.showBadge ?? true,
    bannerUrl: playerData.player?.bannerUrl || playerData.bannerUrl || null,
    bannerOffsetY: playerData.player?.bannerOffsetY ?? playerData.bannerOffsetY ?? 50,
    customBannerUrl: playerData.player?.bannerUrl || playerData.bannerUrl || null,
    customBannerOffsetY: playerData.player?.bannerOffsetY ?? playerData.bannerOffsetY ?? 50,
    customTheme: playerData.player?.theme || playerData.theme || null,
    dashboardGrid: playerData.player?.dashboardGrid || playerData.dashboardGrid || null,
  };
}
