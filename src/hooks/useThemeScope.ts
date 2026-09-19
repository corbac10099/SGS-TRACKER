"use client";

import { useMemo, useEffect } from "react";
import { computeContrastColor } from "@/hooks/useSettings";

interface UseThemeScopeProps {
  canEdit: boolean;
  playerData: any;
  forceMyTheme: boolean;
  setActiveThemeOverride: (theme: string | null) => void;
}

export function useThemeScope({
  canEdit,
  playerData,
  forceMyTheme,
  setActiveThemeOverride,
}: UseThemeScopeProps) {
  const isVisitingOther = !canEdit && Boolean(playerData?.player?.theme || playerData?.theme);
  const visitedProfileTheme = playerData?.player?.theme || playerData?.theme || null;

  useEffect(() => {
    if (isVisitingOther && !forceMyTheme && visitedProfileTheme) {
      setActiveThemeOverride(visitedProfileTheme);
    } else {
      setActiveThemeOverride(null);
    }
  }, [isVisitingOther, forceMyTheme, visitedProfileTheme, setActiveThemeOverride]);

  const profileScopedThemeClass = useMemo(() => {
    if (!isVisitingOther || !visitedProfileTheme || forceMyTheme) return "";
    if (visitedProfileTheme === "dark") return "";
    if (visitedProfileTheme.startsWith("custom:")) return "theme-custom";
    return `theme-${visitedProfileTheme}`;
  }, [isVisitingOther, visitedProfileTheme, forceMyTheme]);

  const profileScopedThemeStyles: React.CSSProperties = useMemo(() => {
    if (!isVisitingOther || !visitedProfileTheme || forceMyTheme) return {};

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
  }, [isVisitingOther, visitedProfileTheme, forceMyTheme]);

  return {
    isVisitingOther,
    visitedProfileTheme,
    profileScopedThemeClass,
    profileScopedThemeStyles,
  };
}
