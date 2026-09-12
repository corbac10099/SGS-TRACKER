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

  // Applique le thème sur le body
  useEffect(() => {
    document.body.classList.remove(
      "theme-light",
      "theme-midnight",
      "theme-crimson",
      "theme-ocean",
      "theme-custom"
    );
    document.documentElement.style.removeProperty("--custom-bg");
    document.documentElement.style.removeProperty("--custom-accent");

    let activeAccent = "#ff4655";

    if (theme !== "dark" && !theme?.startsWith("custom:")) {
      document.body.classList.add(`theme-${theme}`);
      if (theme === "midnight") activeAccent = "#8c64ff";
      else if (theme === "ocean") activeAccent = "#32c8b4";
      else if (theme === "crimson" || theme === "light") activeAccent = "#ff4655";
    } else if (theme?.startsWith("custom:")) {
      document.body.classList.add("theme-custom");
      const matchBg = theme.match(/bg=([^,]+)/);
      const matchAccent = theme.match(/accent=([^,]+)/);
      if (matchBg)
        document.documentElement.style.setProperty("--custom-bg", matchBg[1]);
      if (matchAccent) {
        activeAccent = matchAccent[1];
        document.documentElement.style.setProperty(
          "--custom-accent",
          matchAccent[1]
        );
      }
    }

    // Définit la couleur d'accent et de contraste sur :root (documentElement)
    document.documentElement.style.setProperty("--color-val-red", activeAccent);
    document.documentElement.style.setProperty(
      "--color-accent-contrast",
      computeContrastColor(activeAccent)
    );
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
    settingsTab,
    setSettingsTab,
    toggleFullscreen,
    syncFromSession,
    syncFromGuest,
  };
}
