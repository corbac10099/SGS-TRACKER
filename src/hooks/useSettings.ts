"use client";

import { useState, useEffect, useCallback } from "react";

export interface SettingsState {
  smartRating: boolean;
  setSmartRating: (v: boolean) => void;
  theme: string;
  setTheme: (v: string) => void;
  bannerUrl: string;
  setBannerUrl: (v: string) => void;
  bannerOffsetY: number;
  setBannerOffsetY: (v: number) => void;
  isPublic: boolean;
  setIsPublic: (v: boolean) => void;
  videoLoop: boolean;
  setVideoLoop: (v: boolean) => void;
  videoLoopDelay: number;
  setVideoLoopDelay: (v: number) => void;
  hiddenStats: string[];
  setHiddenStats: (v: string[]) => void;
  enforcePublicStats: boolean;
  setEnforcePublicStats: (v: boolean) => void;
  streamerMode: boolean;
  setStreamerMode: (v: boolean) => void;
  showBadgeState: boolean;
  setShowBadgeState: (v: boolean) => void;
  hiddenBadges: string[];
  setHiddenBadges: (v: string[]) => void;
  ecoMode: boolean;
  setEcoMode: (v: boolean) => void;
  disableAnimations: boolean;
  setDisableAnimations: (v: boolean) => void;
  forceMyTheme: boolean;
  setForceMyTheme: (v: boolean) => void;
  activeThemeOverride: string | null;
  setActiveThemeOverride: (v: string | null) => void;
  settingsTab: string;
  setSettingsTab: (v: string) => void;
  toggleFullscreen: () => void;
  /** Initialise les settings depuis les données utilisateur de la session */
  syncFromSession: (user: any) => void;
  /** Initialise les settings depuis les données guest */
  syncFromGuest: (user: any) => void;
}

/**
 * Calcule la couleur de contraste optimale (#090d14 ou #ffffff) selon la luminance WCAG de la couleur passée.
 */
export function computeContrastColor(color: string): string {
  if (!color) return "#ffffff";
  let hex = color.trim().replace("#", "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  if (hex.length !== 6) return "#ffffff";
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  // Luminance relative perçue (WCAG)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#090d14" : "#ffffff";
}

export function useSettings(): SettingsState {
  const [smartRating, setSmartRating] = useState(true);
  const [theme, setTheme] = useState("dark");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerOffsetY, setBannerOffsetY] = useState(50);
  const [isPublic, setIsPublic] = useState(true);
  const [videoLoop, setVideoLoop] = useState(true);
  const [videoLoopDelay, setVideoLoopDelay] = useState(500);
  const [hiddenStats, setHiddenStats] = useState<string[]>([]);
  const [enforcePublicStats, setEnforcePublicStats] = useState(false);
  const [settingsTab, setSettingsTab] = useState("features");

  const [streamerMode, setStreamerMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("spycam_streamer_mode") === "true";
      } catch (_) {}
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("spycam_streamer_mode", String(streamerMode));
      } catch (_) {}
    }
  }, [streamerMode]);

  const [showBadgeState, setShowBadgeState] = useState<boolean>(true);
  const [hiddenBadges, setHiddenBadges] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("spycam_hidden_badges");
        if (stored) return JSON.parse(stored);
      } catch (_) {}
    }
    return [];
  });

  const [ecoMode, setEcoMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("spycam_eco_mode") === "true";
    }
    return false;
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (ecoMode) {
        document.documentElement.classList.add("mode-eco");
      } else {
        document.documentElement.classList.remove("mode-eco");
      }
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("spycam_eco_mode", ecoMode ? "true" : "false");
    }
  }, [ecoMode]);

  const [disableAnimations, setDisableAnimations] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("spycam_disable_animations") === "true";
      } catch (_) {}
    }
    return false;
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (disableAnimations) {
        document.documentElement.classList.add("disable-animations");
      } else {
        document.documentElement.classList.remove("disable-animations");
      }
    }
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("spycam_disable_animations", String(disableAnimations));
      } catch (_) {}
    }
  }, [disableAnimations]);

  const [forceMyTheme, setForceMyTheme] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("spycam_force_my_theme") === "true";
      } catch (_) {}
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("spycam_force_my_theme", String(forceMyTheme));
      } catch (_) {}
    }
  }, [forceMyTheme]);

  const [activeThemeOverride, setActiveThemeOverride] = useState<string | null>(null);

  // Applique le thème sur le body
  useEffect(() => {
    // Le fond et la structure de la page restent TOUJOURS sur le thème choisi par l'utilisateur
    document.body.classList.remove(
      "theme-light",
      "theme-midnight",
      "theme-crimson",
      "theme-ocean",
      "theme-custom"
    );
    document.documentElement.style.removeProperty("--custom-bg");

    if (theme !== "dark" && !theme?.startsWith("custom:")) {
      document.body.classList.add(`theme-${theme}`);
    } else if (theme?.startsWith("custom:")) {
      document.body.classList.add("theme-custom");
      const matchBg = theme.match(/bg=([^,]+)/);
      if (matchBg) {
        document.documentElement.style.setProperty("--custom-bg", matchBg[1]);
      }
    }

    // Détermination de la couleur d'accent de l'utilisateur
    const extractAccent = (t: string | null | undefined): string => {
      if (!t) return "#ff4655";
      if (t === "midnight") return "#8c64ff";
      if (t === "ocean") return "#32c8b4";
      if (t === "crimson" || t === "light") return "#ff4655";
      if (t.startsWith("custom:")) {
        const match = t.match(/accent=([^,]+)/);
        if (match) return match[1];
      }
      return "#ff4655";
    };

    const userAccent = extractAccent(theme);

    // Applique l'accent de l'utilisateur connecté sur :root et body pour l'interface globale (Header, navigation, etc.)
    document.documentElement.style.setProperty("--color-val-red", userAccent);
    document.documentElement.style.setProperty("--custom-accent", userAccent);
    document.documentElement.style.setProperty(
      "--color-accent-contrast",
      computeContrastColor(userAccent)
    );

    document.body.style.removeProperty("--color-val-red");
    document.body.style.removeProperty("--custom-accent");
    document.body.style.removeProperty("--color-accent-contrast");
  }, [theme]);

  const toggleFullscreen = useCallback(() => {
    if (typeof document !== "undefined") {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, []);

  const syncFromSession = useCallback((user: any) => {
    if (user.theme) setTheme(user.theme);
    if (user.smartRating !== undefined) setSmartRating(user.smartRating);
    if (user.bannerUrl !== undefined) setBannerUrl(user.bannerUrl || "");
    if (user.bannerOffsetY !== undefined)
      setBannerOffsetY(user.bannerOffsetY ?? 50);
    if (user.isPublic !== undefined) setIsPublic(user.isPublic);
    if (user.videoLoop !== undefined) setVideoLoop(user.videoLoop);
    if (user.videoLoopDelay !== undefined)
      setVideoLoopDelay(user.videoLoopDelay);
    if (user.hiddenStats !== undefined) {
      try {
        setHiddenStats(JSON.parse(user.hiddenStats));
      } catch {}
    }
    if (user.enforcePublicStats !== undefined)
      setEnforcePublicStats(user.enforcePublicStats);
  }, []);

  const syncFromGuest = useCallback((user: any) => {
    if (user.theme) setTheme(user.theme);
    if (user.bannerUrl !== undefined) setBannerUrl(user.bannerUrl || "");
    if (user.bannerOffsetY !== undefined)
      setBannerOffsetY(user.bannerOffsetY ?? 50);
    if (user.isPublic !== undefined) setIsPublic(user.isPublic);
    if (user.videoLoop !== undefined) setVideoLoop(user.videoLoop);
    if (user.videoLoopDelay !== undefined)
      setVideoLoopDelay(user.videoLoopDelay);
  }, []);

  return {
    smartRating,
    setSmartRating,
    theme,
    setTheme,
    bannerUrl,
    setBannerUrl,
    bannerOffsetY,
    setBannerOffsetY,
    isPublic,
    setIsPublic,
    videoLoop,
    setVideoLoop,
    videoLoopDelay,
    setVideoLoopDelay,
    hiddenStats,
    setHiddenStats,
    enforcePublicStats,
    setEnforcePublicStats,
    streamerMode,
    setStreamerMode,
    showBadgeState,
    setShowBadgeState,
    hiddenBadges,
    setHiddenBadges,
    ecoMode,
    setEcoMode,
    disableAnimations,
    setDisableAnimations,
    forceMyTheme,
    setForceMyTheme,
    activeThemeOverride,
    setActiveThemeOverride,
    settingsTab,
    setSettingsTab,
    toggleFullscreen,
    syncFromSession,
    syncFromGuest,
  };
}
