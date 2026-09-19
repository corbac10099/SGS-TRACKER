"use client";

import { useMemo, useEffect } from "react";
import { parseBadges } from "@/components/UserBadges";

interface UseBadgeRulesProps {
  trackerLevel: number;
  playerData: any;
  hiddenBadges: string[];
  setHiddenBadges: (badges: string[]) => void;
  canEdit: boolean;
  equippedBannerAnimation?: string;
  equippedBannerBorder?: string;
}

export function useBadgeRules({
  trackerLevel,
  playerData,
  hiddenBadges,
  setHiddenBadges,
  canEdit,
  equippedBannerAnimation,
  equippedBannerBorder,
}: UseBadgeRulesProps) {
  // Badges de niveau Tracker synchronisés en direct
  const effectiveBadgesString = useMemo(() => {
    const levelBadges: string[] = [];
    if (trackerLevel >= 1) levelBadges.push("recrue");
    if (trackerLevel >= 4) levelBadges.push("veteran");
    if (trackerLevel >= 15) levelBadges.push("radiant");

    const rawBadgeData = playerData?.badge || playerData?.player?.badge || null;
    const baseBadges = parseBadges(rawBadgeData).filter((b) => {
      const bl = b.toLowerCase();
      if ((bl === "recrue" || bl === "badge_recruit") && trackerLevel < 1) return false;
      if ((bl === "veteran" || bl === "badge_veteran") && trackerLevel < 4) return false;
      if ((bl === "radiant" || bl === "badge_radiant") && trackerLevel < 15) return false;
      return true;
    });

    return Array.from(new Set([...baseBadges, ...levelBadges])).join(", ");
  }, [trackerLevel, playerData?.badge, playerData?.player?.badge]);

  // Règle des 3 badges max : Si plus de 3 badges sont actifs, on masque les nouveaux
  useEffect(() => {
    const allBadges = parseBadges(effectiveBadgesString);
    const active = allBadges.filter(
      (b) => !hiddenBadges.some((hb) => hb.toLowerCase().trim() === b.toLowerCase().trim())
    );
    if (active.length > 3) {
      const overflow = active.slice(3).map((b) => b.toLowerCase().trim());
      const nextHidden = Array.from(new Set([...hiddenBadges, ...overflow]));
      setHiddenBadges(nextHidden);
    }
  }, [effectiveBadgesString, hiddenBadges, setHiddenBadges]);

  // Cosmétiques de bannière conditionnés au niveau Tracker actuel
  const activeBannerAnim = useMemo(() => {
    let anim = canEdit
      ? (equippedBannerAnimation || playerData?.equippedBannerAnimation || "")
      : (playerData?.equippedBannerAnimation || "");
    if (anim === "cyber_glow" && trackerLevel < 2) anim = "";
    if (anim === "scanlines" && trackerLevel < 3) anim = "";
    if (anim === "matrix" && trackerLevel < 5) anim = "";
    if (anim === "stardust" && trackerLevel < 7) anim = "";
    return anim;
  }, [canEdit, equippedBannerAnimation, playerData?.equippedBannerAnimation, trackerLevel]);

  const activeBannerBorder = useMemo(() => {
    let border: string = canEdit
      ? (equippedBannerBorder || (playerData?.equippedBannerBorder ? "rgb_conic" : ""))
      : (typeof playerData?.equippedBannerBorder === "string" ? playerData.equippedBannerBorder : playerData?.equippedBannerBorder ? "rgb_conic" : "");
    if ((border === "rgb_conic" || border === "animated") && trackerLevel < 10) border = "";
    if (border === "neon_pulse" && trackerLevel < 12) border = "";
    return border;
  }, [canEdit, equippedBannerBorder, playerData?.equippedBannerBorder, trackerLevel]);

  return {
    effectiveBadgesString,
    activeBannerAnim,
    activeBannerBorder,
  };
}
