"use client";

import { useEffect } from "react";
import { sounds } from "@/lib/soundEffects";
import { registerServiceWorker } from "@/lib/pushNotifications";
import type { NavigationState } from "./useNavigation";
import type { SettingsState } from "./useSettings";

/**
 * Enregistre tous les raccourcis clavier globaux :
 * - Typing sound sur les inputs
 * - Navigation par raccourcis (/, 1-4, S, E, L, ?, Escape)
 * - Debug shortcut Ctrl+Shift+D
 * - Service Worker registration
 */
export function useKeyboardShortcuts(
  nav: NavigationState,
  settings: SettingsState,
  riotId: string,
  myRiotId: string,
  pushUrl: NavigationState["pushUrl"],
  currentToggles: {
    settingsOpen: boolean;
    ecoMode: boolean;
    leaderboardView: boolean;
    debugOpen: boolean;
  }
): void {
  // Service Worker
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Global typing sound on ALL text inputs
  useEffect(() => {
    const handleGlobalTyping = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        if (
          e.key.length === 1 ||
          e.key === "Backspace" ||
          e.key === "Enter" ||
          e.key === "Delete"
        ) {
          sounds.playTyping();
        }
      }
    };
    window.addEventListener("keydown", handleGlobalTyping);
    return () =>
      window.removeEventListener("keydown", handleGlobalTyping);
  }, []);

  // Navigation keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).tagName === "INPUT" ||
        (e.target as HTMLElement).tagName === "TEXTAREA" ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      const shortcutsEnabled =
        typeof window !== "undefined"
          ? localStorage.getItem("spycam_shortcuts_enabled") !== "false"
          : true;
      if (!shortcutsEnabled) return;

      let shortcutsMap: Record<string, string> = {
        search: "/",
        profile: "1",
        agents: "2",
        matches: "3",
        lobbies: "4",
        settings: "s",
        eco: "e",
        leaderboard: "l",
      };

      try {
        const stored = localStorage.getItem("spycam_shortcuts_config");
        if (stored) {
          shortcutsMap = { ...shortcutsMap, ...JSON.parse(stored) };
        }
      } catch {}

      const key = e.key.toLowerCase();

      if (
        key === (shortcutsMap.profile || "1").toLowerCase()
      ) {
        sounds.playTabSwitch();
        nav.setAgentsView(false);
        nav.setNewsView(false);
        nav.setLobbiesView(false);
        nav.setLeaderboardView(false);
        nav.setActiveTab("performance");
        pushUrl({
          tab: "performance",
          playerId: myRiotId,
          isOwnProfile: true,
        });
      } else if (
        key === (shortcutsMap.agents || "2").toLowerCase()
      ) {
        sounds.playTabSwitch();
        nav.setNewsView(false);
        nav.setLobbiesView(false);
        nav.setLeaderboardView(false);
        nav.setAgentsView(true);
        pushUrl({
          view: "agents",
          playerId: riotId || myRiotId,
        });
      } else if (
        key === (shortcutsMap.matches || "3").toLowerCase()
      ) {
        sounds.playTabSwitch();
        nav.setAgentsView(false);
        nav.setNewsView(false);
        nav.setLobbiesView(false);
        nav.setLeaderboardView(false);
        nav.setActiveTab("matches");
      } else if (
        key === (shortcutsMap.lobbies || "4").toLowerCase()
      ) {
        sounds.playTabSwitch();
        nav.setAgentsView(false);
        nav.setNewsView(false);
        nav.setLeaderboardView(false);
        nav.setLobbiesView(true);
        pushUrl({
          view: "lobbies",
          playerId: riotId || myRiotId,
        });
      } else if (
        key === (shortcutsMap.search || "/").toLowerCase()
      ) {
        e.preventDefault();
        const searchInput = document.querySelector(
          'input[placeholder*="Rechercher"]'
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      } else if (
        key === (shortcutsMap.settings || "s").toLowerCase()
      ) {
        sounds.playClick();
        nav.setSettingsOpen(!currentToggles.settingsOpen);
      } else if (
        key === (shortcutsMap.eco || "e").toLowerCase()
      ) {
        sounds.playClick();
        settings.setEcoMode(!currentToggles.ecoMode);
      } else if (
        key === (shortcutsMap.leaderboard || "l").toLowerCase()
      ) {
        sounds.playTabSwitch();
        nav.setAgentsView(false);
        nav.setNewsView(false);
        nav.setLobbiesView(false);
        nav.setLeaderboardView(!currentToggles.leaderboardView);
        pushUrl({
          view: "leaderboard",
          playerId: riotId || myRiotId,
        });
      } else if (
        e.key === "?" ||
        (e.shiftKey && e.key === "/")
      ) {
        sounds.playClick();
        settings.setSettingsTab("shortcuts");
        nav.setSettingsOpen(true);
      } else if (e.key === "Escape") {
        nav.setSettingsOpen(false);
        nav.setShowHotkeysModal(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () =>
      window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debug shortcut Ctrl+Shift+D
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        nav.setDebugOpen(!currentToggles.debugOpen);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
