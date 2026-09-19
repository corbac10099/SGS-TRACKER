"use client";

import React, { useState, useEffect } from "react";
import BannerCatalogModal from "./BannerCatalogModal";
import { loadLanguagesList, setLanguage, LanguageInfo, Locale } from "@/lib/i18n";
import { computeContrastColor } from "@/hooks/useSettings";
import {
  IconCrosshair,
  IconSkull,
  IconChart,
  IconHandshake,
  IconScale,
  IconFlame,
  IconCrown,
  IconShield,
  IconSword,
  IconTrophy,
  IconGamepad,
  IconEye,
  IconLock,
  IconVolume,
  IconBadgeVerified,
  IconKeyboard,
  IconCheck,
  IconFileText,
  IconInfo,
  IconBrain,
  IconUsers,
  IconBell,
  IconBellOff,
  IconPencil,
} from "./icons/SpyIcons";
import { BADGES_REGISTRY, parseBadges } from "./UserBadges";
import { BANNER_INTERIOR_EFFECTS, BANNER_BORDER_EFFECTS } from "./quests/types";
import { sounds } from "@/lib/soundEffects";
import { useFriends } from "@/hooks/useFriends";
import { requestPushPermission, sendLocalNotification } from "@/lib/pushNotifications";
import SgsAccountSettings from "./SgsAccountSettings";
import SgsLegalModal from "./SgsLegalModal";
import { useDesktopApp } from "@/hooks/useDesktopApp";

export const DEFAULT_SHORTCUTS: Record<string, string> = {
  search: "/",
  profile: "1",
  agents: "2",
  matches: "3",
  lobbies: "4",
  settings: "s",
  eco: "e",
  leaderboard: "l",
};

export const SHORTCUT_DEFINITIONS = [
  { id: "search", label: "Focaliser la barre de recherche", defaultKey: "/" },
  { id: "profile", label: "Onglet Mon Profil & Stats", defaultKey: "1" },
  { id: "agents", label: "Onglet Wiki & Guides d'Agents", defaultKey: "2" },
  { id: "matches", label: "Onglet Historique des Matchs", defaultKey: "3" },
  { id: "lobbies", label: "Recherche de Salons & Vocal (LFG)", defaultKey: "4" },
  { id: "settings", label: "Ouvrir ou fermer les Paramètres", defaultKey: "s" },
  { id: "eco", label: "Basculer le Mode Éco (Basse consommation)", defaultKey: "e" },
  { id: "leaderboard", label: "Afficher le Classement Régional", defaultKey: "l" },
];

export interface SettingsViewProps {
  onClose: () => void;
  smartRating: boolean;
  setSmartRating: (val: boolean) => void;
  theme: string;
  setTheme: (val: string) => void;
  bannerUrl: string;
  setBannerUrl: (val: string) => void;
  bannerOffsetY: number;
  setBannerOffsetY: (val: number) => void;
  isPublic: boolean;
  setIsPublic: (val: boolean) => void;
  videoLoop: boolean;
  setVideoLoop: (val: boolean) => void;
  videoLoopDelay: number;
  setVideoLoopDelay: (val: number) => void;
  hiddenStats: string[];
  setHiddenStats: (val: string[]) => void;
  enforcePublicStats: boolean;
  setEnforcePublicStats: (val: boolean) => void;
  hiddenBadges?: string[];
  setHiddenBadges?: (val: string[]) => void;
  showBadge?: boolean;
  setShowBadge?: (val: boolean) => void;
  p?: any;
  canEditProfile?: boolean;
  settingsTab: string;
  setSettingsTab: (tab: string) => void;
  pushUrl: (opts: any) => void;
  locale: Locale;
  streamerMode?: boolean;
  setStreamerMode?: (val: boolean) => void;
  disableAnimations?: boolean;
  setDisableAnimations?: (val: boolean) => void;
  forceMyTheme?: boolean;
  setForceMyTheme?: (val: boolean) => void;
  dndEnabled?: boolean;
  setDndEnabled?: (val: boolean) => void;
  dndBlockLobbyInvites?: boolean;
  setDndBlockLobbyInvites?: (val: boolean) => void;
  notificationPreferences?: Record<string, boolean>;
  setNotificationPreferences?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  equippedBannerAnimation?: string;
  setEquippedBannerAnimation?: (val: string) => void;
  equippedBannerBorder?: string | boolean;
  setEquippedBannerBorder?: (val: string) => void;
  trackerLevel?: number;
}

export default function SettingsView({
  onClose,
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
  hiddenBadges = [],
  setHiddenBadges,
  showBadge = true,
  setShowBadge,
  p,
  canEditProfile = true,
  settingsTab,
  setSettingsTab,
  pushUrl,
  locale,
  streamerMode = false,
  setStreamerMode,
  disableAnimations = false,
  setDisableAnimations,
  forceMyTheme = false,
  setForceMyTheme,
  dndEnabled = false,
  setDndEnabled,
  dndBlockLobbyInvites = false,
  setDndBlockLobbyInvites,
  notificationPreferences = { webPush: true, lobbyInvites: true, friendRequests: true, chatMessages: true, soundEffects: true },
  setNotificationPreferences,
  equippedBannerAnimation = "",
  setEquippedBannerAnimation,
  equippedBannerBorder = "",
  setEquippedBannerBorder,
  trackerLevel = 1,
}: SettingsViewProps) {
  const { friends: sgsFriends, updatePermission: updateFriendPermission } = useFriends();
  const desktop = useDesktopApp();
  const statOptions = [
    { id: "performanceScore", label: "Score de Performance (SPI)", icon: <IconTrophy size={16} />, desc: "Score intelligent sur 1000 points (Grades C à SSS)" },
    { id: "coach", label: "Coach Tactique SGS", icon: <IconBrain size={16} />, desc: "Débriefing et diagnostic télémétrique (Privé par défaut)" },
    { id: "chart", label: "Graphique de Progression", icon: <IconChart size={16} />, desc: "Courbe d'évolution" },
    { id: "weapons", label: "Top Armes & Précision", icon: <IconCrosshair size={16} />, desc: "Top 3 armes et zones de tir" },
    { id: "kills", label: "Éliminations", icon: <IconCrosshair size={16} />, desc: "Total des kills" },
    { id: "deaths", label: "Morts", icon: <IconSkull size={16} />, desc: "Total des morts" },
    { id: "assists", label: "Passes décisives", icon: <IconHandshake size={16} />, desc: "Total des assists" },
    { id: "kd", label: "Ratio K/D", icon: <IconScale size={16} />, desc: "Ratio K/D" },
    { id: "headshot", label: "% Tirs à la Tête", icon: <IconCrosshair size={16} />, desc: "% Headshots" },
    { id: "adr", label: "Dégâts / Round (ADR)", icon: <IconFlame size={16} />, desc: "Average Damage" },
    { id: "firstbloods", label: "Premiers Sangs", icon: <IconSword size={16} />, desc: "First bloods" },
    { id: "clutches", label: "Clutches Gagnés", icon: <IconCrown size={16} />, desc: "1vX réussis" },
    { id: "flawless", label: "Rounds Parfaits", icon: <IconShield size={16} />, desc: "Flawless rounds" },
    { id: "aces", label: "Aces Réalisés", icon: <IconSkull size={16} />, desc: "5 kills en un round" },
    { id: "mvp", label: "Titres MVP", icon: <IconTrophy size={16} />, desc: "Match/Team MVP" },
    { id: "matches", label: "Parties Jouées", icon: <IconGamepad size={16} />, desc: "Total matchs" },
    { id: "winrate", label: "% Victoires", icon: <IconTrophy size={16} />, desc: "Winrate global" },
  ];
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [languages, setLanguages] = useState<LanguageInfo[]>([]);
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const [languageSearchQuery, setLanguageSearchQuery] = useState("");

  useEffect(() => {
    loadLanguagesList().then((list) => {
      if (list && list.length > 0) setLanguages(list);
    });
  }, []);

  // Draft State
  const [draftSmartRating, setDraftSmartRating] = useState(smartRating);
  const [draftVideoLoop, setDraftVideoLoop] = useState(videoLoop ?? true);
  const [draftVideoLoopDelay, setDraftVideoLoopDelay] = useState(videoLoopDelay ?? 500);
  const [draftShowBadge, setDraftShowBadge] = useState<boolean>(() => {
    if (showBadge !== undefined) return showBadge;
    if (p?.showBadge !== undefined) return p.showBadge;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("spycam_show_badge");
      if (stored !== null) return stored === "true";
    }
    return true;
  });
  const [draftHiddenBadges, setDraftHiddenBadges] = useState<string[]>(() => {
    if (hiddenBadges && hiddenBadges.length > 0) return hiddenBadges;
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("spycam_hidden_badges");
        if (stored) return JSON.parse(stored);
      } catch (_) {}
    }
    return [];
  });
  const [draftStreamerMode, setDraftStreamerMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("spycam_streamer_mode");
      if (stored !== null) return stored === "true";
    }
    return streamerMode;
  });
  const [draftSoundEnabled, setDraftSoundEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("spycam_sound_enabled") !== "false";
    }
    return true;
  });
  const [draftSoundVolume, setDraftSoundVolume] = useState<number>(() => {
    if (typeof window !== "undefined") {
      return sounds.getVolume();
    }
    return 0.08;
  });

  // Customizable Keyboard Shortcuts State
  const [draftShortcutsEnabled, setDraftShortcutsEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("spycam_shortcuts_enabled");
      if (stored !== null) return stored === "true";
    }
    return true;
  });
  const [draftShortcuts, setDraftShortcuts] = useState<Record<string, string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("spycam_shortcuts_config");
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return { ...DEFAULT_SHORTCUTS };
  });
  const [recordingShortcutId, setRecordingShortcutId] = useState<string | null>(null);

  const [draftHiddenStats, setDraftHiddenStats] = useState<string[]>(hiddenStats || []);
  const [privacyStatsExpanded, setPrivacyStatsExpanded] = useState<boolean>(false);
  const [badgesExpanded, setBadgesExpanded] = useState<boolean>(true);
  const [badgeSlotWarning, setBadgeSlotWarning] = useState<string | null>(null);
  const [showAllBannersAndFx, setShowAllBannersAndFx] = useState<boolean>(false);
  const [draftEnforcePublicStats, setDraftEnforcePublicStats] = useState(enforcePublicStats || false);
  const [draftTheme, setDraftTheme] = useState(theme?.startsWith("custom:") ? "custom" : theme);
  const [draftCustomBg, setDraftCustomBg] = useState(() => {
    if (theme?.startsWith("custom:")) {
      const match = theme.match(/bg=([^,]+)/);
      return match ? match[1] : "#0a0e13";
    }
    return "#0a0e13";
  });
  const [draftCustomAccent, setDraftCustomAccent] = useState(() => {
    if (theme?.startsWith("custom:")) {
      const match = theme.match(/accent=([^,]+)/);
      return match ? match[1] : "#ff4655";
    }
    return "#ff4655";
  });
  const [draftSpiDynamicColors, setDraftSpiDynamicColors] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("spycam_spi_dynamic_chart_color") !== "false";
    }
    return true;
  });
  const [draftSpiThemeAdapt, setDraftSpiThemeAdapt] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("spycam_spi_theme_adapt") === "true";
    }
    return false;
  });
  const [draftBannerUrl, setDraftBannerUrl] = useState(bannerUrl);
  const [draftBannerOffsetY, setDraftBannerOffsetY] = useState(bannerOffsetY);
  const [draftIsPublic, setDraftIsPublic] = useState(isPublic ?? true);
  const [draftLocale, setDraftLocale] = useState<string>(locale || "french");
  const [draftDisableAnimations, setDraftDisableAnimations] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("spycam_disable_animations");
      if (stored !== null) return stored === "true";
    }
    return disableAnimations;
  });
  const [draftForceMyTheme, setDraftForceMyTheme] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("spycam_force_my_theme");
      if (stored !== null) return stored === "true";
    }
    return forceMyTheme;
  });
  const [draftDndEnabled, setDraftDndEnabled] = useState<boolean>(dndEnabled);
  const [draftDndBlockLobbyInvites, setDraftDndBlockLobbyInvites] = useState<boolean>(dndBlockLobbyInvites);
  const [draftNotificationPreferences, setDraftNotificationPreferences] = useState<Record<string, boolean>>(notificationPreferences);
  const [pushPermissionStatus, setPushPermissionStatus] = useState<string>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "default";
  });
  const [legalModalOpen, setLegalModalOpen] = useState<boolean>(false);
  const [legalModalTab, setLegalModalTab] = useState<"cgu" | "mentions" | "privacy" | "riot">("cgu");
  const [draftBannerAnimation, setDraftBannerAnimation] = useState<string>(() => {
    return equippedBannerAnimation || p?.equippedBannerAnimation || "";
  });
  const [draftBannerBorder, setDraftBannerBorder] = useState<string>(() => {
    const raw = equippedBannerBorder ?? p?.equippedBannerBorder;
    if (typeof raw === "string") return raw;
    if (raw === true) return "rgb_conic";
    return "";
  });
  const [draftCosmeticAccent, setDraftCosmeticAccent] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("spycam_cosmetic_accent") === "true";
    }
    return false;
  });
  const [editingCosmeticType, setEditingCosmeticType] = useState<"none" | "banner" | "border">("none");
  const [interiorEffectsList, setInteriorEffectsList] = useState(BANNER_INTERIOR_EFFECTS);
  const [borderEffectsList, setBorderEffectsList] = useState(BANNER_BORDER_EFFECTS);
  const [customBadgesList, setCustomBadgesList] = useState<any[]>([]);

  // Synchronisation dynamique du mode d'accent pour la prévisualisation immédiate
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.setAttribute("data-cosmetic-accent", String(draftCosmeticAccent));
    }
  }, [draftCosmeticAccent]);

  // Chargement dynamique des cosmétiques et badges depuis Neon / R2
  useEffect(() => {
    fetch("/api/cms/cosmetics")
      .then((res) => res.json())
      .then((data) => {
        if (data.interiors && Array.isArray(data.interiors)) {
          setInteriorEffectsList(data.interiors);
        }
        if (data.borders && Array.isArray(data.borders)) {
          setBorderEffectsList(data.borders);
        }
        if (data.all && Array.isArray(data.all)) {
          const cssRules = data.all
            .map((item: any) => item.cssRules)
            .filter(Boolean)
            .join("\n");
          if (cssRules) {
            let styleTag = document.getElementById("spycam-dynamic-cosmetics");
            if (!styleTag) {
              styleTag = document.createElement("style");
              styleTag.id = "spycam-dynamic-cosmetics";
              document.head.appendChild(styleTag);
            }
            styleTag.textContent = cssRules;
          }
        }
      })
      .catch(() => {});

    fetch("/api/cms/badges")
      .then((res) => res.json())
      .then((data) => {
        if (data.badges && Array.isArray(data.badges)) {
          setCustomBadgesList(data.badges);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (locale) setDraftLocale(locale);
  }, [locale]);

  // Key recording listener
  useEffect(() => {
    if (!recordingShortcutId) return;

    const handleKeyRecord = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") {
        setRecordingShortcutId(null);
        return;
      }
      const pressed = e.key.toLowerCase();
      sounds.playLockIn();
      setDraftShortcuts((prev) => ({
        ...prev,
        [recordingShortcutId]: pressed,
      }));
      setRecordingShortcutId(null);
    };

    window.addEventListener("keydown", handleKeyRecord, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyRecord, { capture: true });
  }, [recordingShortcutId]);

  // Preview theme live avec calcul dynamique du contraste et de l'accent
  useEffect(() => {
    document.body.classList.remove("theme-light", "theme-midnight", "theme-crimson", "theme-ocean", "theme-custom");
    if (draftTheme !== "dark" && draftTheme !== "custom") document.body.classList.add(`theme-${draftTheme}`);
    
    let previewAccent = "#ff4655";
    if (draftTheme === "midnight") previewAccent = "#8c64ff";
    else if (draftTheme === "ocean") previewAccent = "#32c8b4";
    else if (draftTheme === "custom") {
      document.body.classList.add("theme-custom");
      document.documentElement.style.setProperty("--custom-bg", draftCustomBg);
      document.documentElement.style.setProperty("--custom-accent", draftCustomAccent);
      previewAccent = draftCustomAccent || "#ff4655";
    }

    document.documentElement.style.setProperty("--color-val-red", previewAccent);
    document.documentElement.style.setProperty(
      "--color-accent-contrast",
      computeContrastColor(previewAccent)
    );

    // Cleanup on unmount (restore original theme if not saved)
    return () => {
      document.body.classList.remove("theme-light", "theme-midnight", "theme-crimson", "theme-ocean", "theme-custom");
      document.documentElement.style.removeProperty("--custom-bg");
      document.documentElement.style.removeProperty("--custom-accent");
      
      let origAccent = "#ff4655";
      if (theme !== "dark" && !theme?.startsWith("custom:")) {
        document.body.classList.add(`theme-${theme}`);
        if (theme === "midnight") origAccent = "#8c64ff";
        else if (theme === "ocean") origAccent = "#32c8b4";
      }
      if (theme?.startsWith("custom:")) {
        document.body.classList.add("theme-custom");
        const matchBg = theme.match(/bg=([^,]+)/);
        const matchAccent = theme.match(/accent=([^,]+)/);
        if (matchBg) document.documentElement.style.setProperty("--custom-bg", matchBg[1]);
        if (matchAccent) {
          document.documentElement.style.setProperty("--custom-accent", matchAccent[1]);
          origAccent = matchAccent[1];
        }
      }
      document.documentElement.style.setProperty("--color-val-red", origAccent);
      document.documentElement.style.setProperty(
        "--color-accent-contrast",
        computeContrastColor(origAccent)
      );
    };
  }, [draftTheme, draftCustomBg, draftCustomAccent, theme]);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("spycam_streamer_mode", String(draftStreamerMode));
        localStorage.setItem("spycam_sound_enabled", String(draftSoundEnabled));
        localStorage.setItem("spycam_sound_volume", String(draftSoundVolume));
        localStorage.setItem("spycam_shortcuts_enabled", String(draftShortcutsEnabled));
        localStorage.setItem("spycam_shortcuts_config", JSON.stringify(draftShortcuts));
        localStorage.setItem("spycam_spi_dynamic_chart_color", String(draftSpiDynamicColors));
        localStorage.setItem("spycam_spi_theme_adapt", String(draftSpiThemeAdapt));
        localStorage.setItem("spycam_disable_animations", String(draftDisableAnimations));
        localStorage.setItem("spycam_force_my_theme", String(draftForceMyTheme));
        sounds.setEnabled(draftSoundEnabled);
        sounds.setVolume(draftSoundVolume);
        if (setStreamerMode) setStreamerMode(draftStreamerMode);
        if (setDisableAnimations) setDisableAnimations(draftDisableAnimations);
        if (setForceMyTheme) setForceMyTheme(draftForceMyTheme);
        window.dispatchEvent(new CustomEvent("spycam_settings_updated", {
          detail: { spiDynamicColors: draftSpiDynamicColors, spiThemeAdapt: draftSpiThemeAdapt }
        }));
      }

      const guestId = typeof window !== "undefined" ? sessionStorage.getItem("spycam_guest_id") : null;
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(guestId ? { "x-guest-id": guestId } : {}),
        },
        body: JSON.stringify({
          guestId: guestId || undefined,
          smartRating: draftSmartRating,
          theme: draftTheme === "custom" ? `custom:bg=${draftCustomBg},accent=${draftCustomAccent}` : draftTheme,
          bannerUrl: draftBannerUrl,
          bannerOffsetY: draftBannerOffsetY,
          isPublic: draftIsPublic,
          videoLoop: draftVideoLoop,
          videoLoopDelay: draftVideoLoopDelay,
          hiddenStats: JSON.stringify(draftHiddenStats),
          enforcePublicStats: draftEnforcePublicStats,
          language: draftLocale,
          showBadge: draftShowBadge,
          dndEnabled: draftDndEnabled,
          dndBlockLobbyInvites: draftDndBlockLobbyInvites,
          notificationPreferences: draftNotificationPreferences,
          equippedBannerAnimation: draftBannerAnimation || null,
          equippedBannerBorder: draftBannerBorder || null,
        }),
      });
      if (res.ok) {
        sounds.playLockIn();
        if (typeof window !== "undefined") {
          localStorage.setItem("spycam_show_badge", String(draftShowBadge));
          localStorage.setItem("spycam_hidden_badges", JSON.stringify(draftHiddenBadges));
          localStorage.setItem("spycam_banner_border", draftBannerBorder);
          localStorage.setItem("spycam_cosmetic_accent", String(draftCosmeticAccent));
        }
        if (setShowBadge) setShowBadge(draftShowBadge);
        if (setHiddenBadges) setHiddenBadges(draftHiddenBadges);
        if (setDndEnabled) setDndEnabled(draftDndEnabled);
        if (setDndBlockLobbyInvites) setDndBlockLobbyInvites(draftDndBlockLobbyInvites);
        if (setNotificationPreferences) setNotificationPreferences(draftNotificationPreferences);
        if (setEquippedBannerAnimation) setEquippedBannerAnimation(draftBannerAnimation);
        if (setEquippedBannerBorder) setEquippedBannerBorder(draftBannerBorder);
        setSmartRating(draftSmartRating);
        setTheme(draftTheme === "custom" ? `custom:bg=${draftCustomBg},accent=${draftCustomAccent}` : draftTheme);
        setBannerUrl(draftBannerUrl);
        setBannerOffsetY(draftBannerOffsetY);
        if (setIsPublic) setIsPublic(draftIsPublic);
        if (setVideoLoop) setVideoLoop(draftVideoLoop);
        if (setVideoLoopDelay) setVideoLoopDelay(draftVideoLoopDelay);
        setHiddenStats(draftHiddenStats);
        setEnforcePublicStats(draftEnforcePublicStats);
        await setLanguage(draftLocale);
        onClose();
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    sounds.playCancel();
    onClose();
  };

  // Default banners
  const banners = [
    { name: "Par défaut", url: p?.cardWideUrl || "" },
    { name: "Ascent", url: "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png" },
    { name: "Bind", url: "https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/splash.png" },
    { name: "Haven", url: "https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6047/splash.png" },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-8 animate-in fade-in duration-300 pb-12">
      <div className="flex items-center justify-between mb-4 sm:mb-8 gap-3">
        <h2 className="text-xl sm:text-3xl font-black uppercase tracking-widest text-[var(--color-text-primary)]">Paramètres</h2>
        <button
          onClick={() => {
            sounds.playCancel();
            onClose();
          }}
          onMouseEnter={() => sounds.playHover()}
          className="px-3.5 sm:px-6 py-2 sm:py-2.5 bg-[var(--color-val-red)] hover:brightness-110 text-[var(--color-accent-contrast,#ffffff)] text-xs sm:text-sm font-bold rounded-xl transition-all shadow-accent-md hover:shadow-accent-lg cursor-pointer flex items-center gap-1.5 flex-shrink-0"
        >
          <span className="text-sm sm:text-base">←</span>
          <span>Retour au profil</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 sm:gap-8">
        {/* Sidebar / Top Tabs Bar on mobile */}
        <div className="w-full md:w-64 flex flex-row md:flex-col gap-1.5 sm:gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar flex-shrink-0">
          {[
            { id: "account", label: "Compte SGS & Connexions" },
            { id: "features", label: "Fonctionnalités" },
            { id: "notifications", label: "Notifications & DND" },
            { id: "shortcuts", label: "Raccourcis Clavier" },
            { id: "privacy", label: "Confidentialité" },
            { id: "appearance", label: "Apparence & Bannière" },
            { id: "language", label: "Langue & Traductions" },
            { id: "legal", label: "Mentions Légales & CGU" },
            { id: "about", label: "À propos" },
          ].map((tab) => (
            <button
              key={tab.id}
              onMouseEnter={() => sounds.playHover()}
              onClick={() => {
                sounds.playTabSwitch();
                setSettingsTab(tab.id);
                pushUrl({ view: "settings", settingsTab: tab.id });
              }}
              className={`text-left px-3.5 sm:px-5 py-2.5 sm:py-4 rounded-xl font-bold uppercase tracking-wider text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer flex-shrink-0 ${
                settingsTab === tab.id
                  ? "bg-[var(--color-surface-hover)] border-b-2 md:border-b-0 md:border-l-4 border-[var(--color-val-red)] text-[var(--color-text-primary)] shadow-md"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div key={settingsTab} className="flex-1 min-w-0 animate-tab-in">
          {settingsTab === "account" && (
            <SgsAccountSettings />
          )}

          {settingsTab === "features" && (
            <div className="glass-panel rounded-2xl p-3.5 sm:p-6 md:p-8">
              <div className="flex flex-col gap-4 sm:gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm sm:text-lg text-[var(--color-text-primary)]">Indicateurs visuels (Smart Rating)</h3>
                    <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5 sm:mt-1">
                      Active les repères visuels colorés sur les performances clés (K/D, ADR, Winrate, etc.)
                    </p>
                  </div>
                  <button
                    onClick={() => setDraftSmartRating(!draftSmartRating)}
                    className={`relative inline-flex h-6 w-11 sm:h-7 sm:w-13 items-center rounded-full transition-colors duration-300 flex-shrink-0 ml-2 sm:ml-4 cursor-pointer ${
                      draftSmartRating ? "bg-[var(--color-val-red)] shadow-accent-sm" : "bg-gray-400 dark:bg-[rgba(255,255,255,0.1)]"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full ${
                        draftSmartRating ? "bg-[var(--color-accent-contrast,#ffffff)]" : "bg-white"
                      } shadow-md transition-all duration-300 ${
                        draftSmartRating ? "translate-x-6 sm:translate-x-7" : "translate-x-1"
                      }`}
                    ></span>
                  </button>
                </div>

                {/* Streamer Mode Toggle */}
                <div className="flex items-center justify-between pt-4 sm:pt-6 border-t border-[var(--color-border)]">
                  <div>
                    <h3 className="font-bold text-sm sm:text-lg text-[var(--color-text-primary)]">Mode Streamer</h3>
                    <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5 sm:mt-1">
                      Masque votre pseudo et tag public pour vos diffusions Twitch/YouTube et captures vidéo
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setDraftStreamerMode(!draftStreamerMode);
                    }}
                    className={`relative inline-flex h-6 w-11 sm:h-7 sm:w-13 items-center rounded-full transition-colors duration-300 flex-shrink-0 ml-2 sm:ml-4 cursor-pointer ${
                      draftStreamerMode ? "bg-[var(--color-val-red)] shadow-accent-sm" : "bg-gray-400 dark:bg-[rgba(255,255,255,0.1)]"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full ${
                        draftStreamerMode ? "bg-[var(--color-accent-contrast,#ffffff)]" : "bg-white"
                      } shadow-md transition-all duration-300 ${
                        draftStreamerMode ? "translate-x-6 sm:translate-x-7" : "translate-x-1"
                      }`}
                    ></span>
                  </button>
                </div>

                {/* SPI Dynamic Chart Color Toggle */}
                <div className="flex items-center justify-between pt-4 sm:pt-6 border-t border-[var(--color-border)]">
                  <div>
                    <h3 className="font-bold text-sm sm:text-lg text-[var(--color-text-primary)]">Courbe dynamique SPI (Couleurs par match)</h3>
                    <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5 sm:mt-1">
                      Adapte la couleur de la courbe selon le score SPI de chaque match (Or/Ambre pour SSS/SS/S, Émeraude pour A, Ciel pour B). Si désactivé, la courbe devient rouge Valorant unie.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setDraftSpiDynamicColors(!draftSpiDynamicColors);
                    }}
                    className={`relative inline-flex h-6 w-11 sm:h-7 sm:w-13 items-center rounded-full transition-colors duration-300 flex-shrink-0 ml-2 sm:ml-4 cursor-pointer ${
                      draftSpiDynamicColors ? "bg-[var(--color-val-red)] shadow-accent-sm" : "bg-gray-400 dark:bg-[rgba(255,255,255,0.1)]"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full ${
                        draftSpiDynamicColors ? "bg-[var(--color-accent-contrast,#ffffff)]" : "bg-white"
                      } shadow-md transition-all duration-300 ${
                        draftSpiDynamicColors ? "translate-x-6 sm:translate-x-7" : "translate-x-1"
                      }`}
                    ></span>
                  </button>
                </div>

                {/* Sound Effects Toggle & Volume Slider */}
                <div className="flex flex-col gap-3 pt-4 sm:pt-6 border-t border-[var(--color-border)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm sm:text-lg text-[var(--color-text-primary)]">Effets sonores d&apos;interface</h3>
                      <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5 sm:mt-1">
                        Joue des retours sonores légers et interactifs lors de la navigation et des sauvegardes
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        sounds.playClick();
                        const next = !draftSoundEnabled;
                        setDraftSoundEnabled(next);
                        sounds.setEnabled(next);
                      }}
                      className={`relative inline-flex h-6 w-11 sm:h-7 sm:w-13 items-center rounded-full transition-colors duration-300 flex-shrink-0 ml-2 sm:ml-4 cursor-pointer ${
                        draftSoundEnabled ? "bg-[var(--color-val-red)] shadow-accent-sm" : "bg-gray-400 dark:bg-[rgba(255,255,255,0.1)]"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full ${
                          draftSoundEnabled ? "bg-[var(--color-accent-contrast,#ffffff)]" : "bg-white"
                        } shadow-md transition-all duration-300 ${
                          draftSoundEnabled ? "translate-x-6 sm:translate-x-7" : "translate-x-1"
                        }`}
                      ></span>
                    </button>
                  </div>

                  {draftSoundEnabled && (
                    <div className="flex items-center gap-4 bg-[var(--color-background)]/50 p-3 rounded-xl border border-[var(--color-border)]">
                      <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-secondary)]">
                        <IconVolume size={16} />
                        <span>Volume :</span>
                      </div>
                      <input
                        type="range"
                        min="0.01"
                        max="0.3"
                        step="0.01"
                        value={draftSoundVolume}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setDraftSoundVolume(v);
                          sounds.setVolume(v);
                        }}
                        onMouseUp={() => sounds.playClick()}
                        className="flex-1 accent-[var(--color-val-red)] cursor-pointer"
                      />
                      <span className="text-xs font-mono font-bold text-[var(--color-text-primary)] w-10 text-right">
                        {Math.round((draftSoundVolume / 0.3) * 100)}%
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-[var(--color-border)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm sm:text-lg text-[var(--color-text-primary)]">Lecture en boucle des vidéos d&apos;agents</h3>
                      <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5 sm:mt-1">
                        Rejoue automatiquement les aperçus vidéo des compétences d&apos;agents
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        sounds.playClick();
                        setDraftVideoLoop(!draftVideoLoop);
                      }}
                      className={`relative inline-flex h-6 w-11 sm:h-7 sm:w-13 items-center rounded-full transition-colors duration-300 flex-shrink-0 ml-2 sm:ml-4 cursor-pointer ${
                        draftVideoLoop ? "bg-[var(--color-val-red)] shadow-accent-sm" : "bg-gray-400 dark:bg-[rgba(255,255,255,0.1)]"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full ${
                          draftVideoLoop ? "bg-[var(--color-accent-contrast,#ffffff)]" : "bg-white"
                        } shadow-md transition-all duration-300 ${
                          draftVideoLoop ? "translate-x-6 sm:translate-x-7" : "translate-x-1"
                        }`}
                      ></span>
                    </button>
                  </div>

                  {draftVideoLoop && (
                    <div className="flex flex-col gap-2 sm:gap-3 animate-in fade-in slide-in-from-top-2 duration-300 pl-1 sm:pl-2">
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm font-bold text-[var(--color-text-secondary)]">Délai avant relecture</span>
                        <span className="text-xs sm:text-sm font-bold text-[var(--color-val-red)]">{draftVideoLoopDelay} ms</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="3000"
                        step="100"
                        value={draftVideoLoopDelay}
                        onChange={(e) => setDraftVideoLoopDelay(Number(e.target.value))}
                        className="w-full accent-[var(--color-val-red)] cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Notifications Push Web */}
                <div className="flex flex-col gap-3 pt-4 sm:pt-6 border-t border-[var(--color-border)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm sm:text-lg text-[var(--color-text-primary)]">Notifications Push Navigateur</h3>
                      <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5 sm:mt-1">
                        Recevez des alertes sur le statut de vos matchs, nouveaux salons LFG et actualités
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        sounds.playClick();
                        const perm = await requestPushPermission();
                        if (perm === "granted") {
                          sendLocalNotification("SPYCAM Activé !", "Les notifications push sont bien configurées sur cet appareil.");
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[var(--color-val-red)] hover:bg-[#ff5e6c] text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md flex-shrink-0"
                    >
                      Activer / Tester
                    </button>
                  </div>
                </div>

                {/* Disable All Animations Toggle */}
                <div className="flex items-center justify-between pt-4 sm:pt-6 border-t border-[var(--color-border)]">
                  <div>
                    <h3 className="font-bold text-sm sm:text-lg text-[var(--color-text-primary)]">Désactiver toutes les animations</h3>
                    <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5 sm:mt-1">
                      Supprime l&apos;ensemble des transitions, effets de fondu et animations d&apos;interface pour une réactivité instantanée maximale
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setDraftDisableAnimations(!draftDisableAnimations);
                    }}
                    className={`relative inline-flex h-6 w-11 sm:h-7 sm:w-13 items-center rounded-full transition-colors duration-300 flex-shrink-0 ml-2 sm:ml-4 cursor-pointer ${
                      draftDisableAnimations ? "bg-[var(--color-val-red)] shadow-accent-sm" : "bg-gray-400 dark:bg-[rgba(255,255,255,0.1)]"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full ${
                        draftDisableAnimations ? "bg-[var(--color-accent-contrast,#ffffff)]" : "bg-white"
                      } shadow-md transition-all duration-300 ${
                        draftDisableAnimations ? "translate-x-6 sm:translate-x-7" : "translate-x-1"
                      }`}
                    ></span>
                  </button>
                </div>

                {/* Force Personal Theme on Visited Profiles Toggle */}
                <div className="flex items-center justify-between pt-4 sm:pt-6 border-t border-[var(--color-border)]">
                  <div>
                    <h3 className="font-bold text-sm sm:text-lg text-[var(--color-text-primary)]">Forcer mon thème sur les profils visités</h3>
                    <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5 sm:mt-1">
                      Conserve votre thème personnalisé même lors de la consultation du profil d&apos;un autre joueur (désactivé par défaut : vous visualisez le thème du propriétaire)
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setDraftForceMyTheme(!draftForceMyTheme);
                    }}
                    className={`relative inline-flex h-6 w-11 sm:h-7 sm:w-13 items-center rounded-full transition-colors duration-300 flex-shrink-0 ml-2 sm:ml-4 cursor-pointer ${
                      draftForceMyTheme ? "bg-[var(--color-val-red)] shadow-accent-sm" : "bg-gray-400 dark:bg-[rgba(255,255,255,0.1)]"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full ${
                        draftForceMyTheme ? "bg-[var(--color-accent-contrast,#ffffff)]" : "bg-white"
                      } shadow-md transition-all duration-300 ${
                        draftForceMyTheme ? "translate-x-6 sm:translate-x-7" : "translate-x-1"
                      }`}
                    ></span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB : NOTIFICATIONS & NE PAS DÉRANGER ==================== */}
          {settingsTab === "notifications" && (
            <div className="glass-panel rounded-2xl p-3.5 sm:p-6 md:p-8 space-y-6">
              {/* SECTION 1 : MODE NE PAS DÉRANGER */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[var(--color-val-red)]/15 border border-[var(--color-val-red)]/40 flex items-center justify-center text-[var(--color-val-red)] flex-shrink-0">
                      <IconBellOff size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-lg text-[var(--color-text-primary)]">
                        Mode &ldquo;Ne pas déranger&rdquo; (DND)
                      </h3>
                      <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5">
                        Gardez le contrôle total sur les sollicitations sociales et les interruptions en jeu.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Master DND Switch */}
                <div className="p-4 rounded-xl bg-[var(--color-surface)]/60 border border-[var(--color-border)] flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-sm text-white">Activer le mode Ne pas déranger</h4>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                      Bloque automatiquement toutes les demandes d&apos;ami entrantes. Vous pouvez toujours envoyer des demandes d&apos;ami à d&apos;autres joueurs.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setDraftDndEnabled(!draftDndEnabled);
                    }}
                    className={`relative inline-flex h-6 w-11 sm:h-7 sm:w-13 items-center rounded-full transition-colors duration-300 flex-shrink-0 cursor-pointer ${
                      draftDndEnabled ? "bg-[var(--color-val-red)] shadow-accent-sm" : "bg-gray-400 dark:bg-[rgba(255,255,255,0.1)]"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full ${
                        draftDndEnabled ? "bg-[var(--color-accent-contrast,#ffffff)]" : "bg-white"
                      } shadow-md transition-all duration-300 ${
                        draftDndEnabled ? "translate-x-6 sm:translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Sub DND Switch : Bloquer les invitations de salon */}
                <div className="p-4 rounded-xl bg-[var(--color-surface)]/40 border border-[var(--color-border)] flex items-center justify-between gap-4 ml-2 sm:ml-6 border-l-4 border-l-amber-500/60">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white">Bloquer également les invitations de salon</h4>
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        Sous-paramètre
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                      Refuse automatiquement toutes les invitations entrantes pour rejoindre des salons Valorant (LFG). Vous conservez la possibilité d&apos;inviter vos amis.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setDraftDndBlockLobbyInvites(!draftDndBlockLobbyInvites);
                    }}
                    className={`relative inline-flex h-6 w-11 sm:h-7 sm:w-13 items-center rounded-full transition-colors duration-300 flex-shrink-0 cursor-pointer ${
                      draftDndBlockLobbyInvites ? "bg-amber-500 shadow-sm" : "bg-gray-400 dark:bg-[rgba(255,255,255,0.1)]"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full bg-white shadow-md transition-all duration-300 ${
                        draftDndBlockLobbyInvites ? "translate-x-6 sm:translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* SECTION 2 : NOTIFICATIONS WEB PUSH NAVIGATEUR */}
              <div className="space-y-4 pt-5 border-t border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/40 flex items-center justify-center text-sky-400 flex-shrink-0">
                    <IconBell size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-lg text-[var(--color-text-primary)]">
                      Notifications Navigateur (Web Push)
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5">
                      Recevez des alertes natives sur votre bureau lors de la réception d&apos;une invitation de salon ou d&apos;une demande d&apos;ami.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--color-surface)]/60 border border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">Statut du navigateur :</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            pushPermissionStatus === "granted"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : pushPermissionStatus === "denied"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {pushPermissionStatus === "granted"
                            ? "Autorisé ✓"
                            : pushPermissionStatus === "denied"
                            ? "Bloqué par le navigateur"
                            : "Non configuré"}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        {pushPermissionStatus === "granted"
                          ? "Vous recevrez des notifications natives dès qu'un ami vous invite dans un salon."
                          : "Cliquez ci-contre pour autoriser l'affichage des alertes sur votre écran."}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      sounds.playClick();
                      const perm = await requestPushPermission();
                      setPushPermissionStatus(perm);
                      if (perm === "granted") {
                        sendLocalNotification(
                          "SGS Salons Valorant",
                          "Les notifications Web sont parfaitement configurées sur votre navigateur !"
                        );
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-[var(--color-val-red)] hover:brightness-110 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 flex-shrink-0"
                  >
                    <IconBell size={14} />
                    <span>{pushPermissionStatus === "granted" ? "Tester une alerte" : "Activer les notifications"}</span>
                  </button>
                </div>
              </div>

              {/* SECTION 3 : PRÉFÉRENCES GRANULAIRES D'ALERTES */}
              <div className="space-y-3 pt-5 border-t border-[var(--color-border)]">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[var(--color-text-primary)]">
                    Préférences détaillées des alertes
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    Sélectionnez les événements spécifiques qui déclenchent des notifications.
                  </p>
                </div>

                <div className="space-y-2">
                  {[
                    { id: "lobbyInvites", label: "Invitations de salon Valorant", desc: "Notification lors de la réception d'une invitation à rejoindre une escouade" },
                    { id: "friendRequests", label: "Demandes d'amis SGS", desc: "Alerte lors de la réception d'une nouvelle demande d'ami d'un joueur" },
                    { id: "chatMessages", label: "Nouveaux messages du chat de salon", desc: "Alerte sonore et visuelle lorsqu'un membre poste dans le salon actif" },
                    { id: "soundEffects", label: "Effets sonores dans l'application", desc: "Retour audio lors des clics, actions et transitions d'interface" },
                  ].map((item) => {
                    const isChecked = (draftNotificationPreferences as any)[item.id] !== false;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          sounds.playClick();
                          setDraftNotificationPreferences((prev) => ({
                            ...prev,
                            [item.id]: !isChecked,
                          }));
                        }}
                        className="p-3.5 rounded-xl bg-[var(--color-surface)]/60 hover:bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-between gap-3 cursor-pointer transition-all"
                      >
                        <div>
                          <div className="text-xs font-bold text-white">{item.label}</div>
                          <div className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">{item.desc}</div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs font-black border transition-all ${
                            isChecked
                              ? "bg-[var(--color-val-red)] border-[var(--color-val-red)] text-white shadow-sm"
                              : "bg-black/30 border-white/20 text-transparent"
                          }`}
                        >
                          ✓
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 2 : RACCOURCIS CLAVIER (PERSONNALISABLES & DÉSACTIVABLES) ==================== */}
          {settingsTab === "shortcuts" && (
            <div className="glass-panel rounded-2xl p-3.5 sm:p-6 md:p-8 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[var(--color-val-red)]/15 border border-[var(--color-val-red)]/40 flex items-center justify-center text-[var(--color-val-red)] flex-shrink-0">
                    <IconKeyboard size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-lg text-[var(--color-text-primary)]">
                      Raccourcis Clavier Personnalisables
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5">
                      Contrôlez et naviguez dans Spycam à la vitesse de l&apos;éclair. Vos touches sont enregistrées sur votre compte Neon.
                    </p>
                  </div>
                </div>

                {/* Master Toggle */}
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <span className="text-xs font-bold text-[var(--color-text-secondary)] hidden sm:inline">
                    {draftShortcutsEnabled ? "Activés" : "Désactivés"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setDraftShortcutsEnabled(!draftShortcutsEnabled);
                    }}
                    title={draftShortcutsEnabled ? "Désactiver les raccourcis" : "Activer les raccourcis"}
                    className={`relative inline-flex h-6 w-11 sm:h-7 sm:w-13 items-center rounded-full transition-colors duration-300 cursor-pointer ${
                      draftShortcutsEnabled ? "bg-[var(--color-val-red)] shadow-accent-sm" : "bg-gray-400 dark:bg-[rgba(255,255,255,0.1)]"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full ${
                        draftShortcutsEnabled ? "bg-[var(--color-accent-contrast,#ffffff)]" : "bg-white"
                      } shadow-md transition-all duration-300 ${
                        draftShortcutsEnabled ? "translate-x-6 sm:translate-x-7" : "translate-x-1"
                      }`}
                    ></span>
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              {!draftShortcutsEnabled ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
                  <IconLock size={18} className="flex-shrink-0" />
                  <span>
                    Les raccourcis clavier globaux sont actuellement <strong>désactivés</strong>. Activez le bouton ci-dessus pour utiliser les touches rapides.
                  </span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                      Touches Assignées (Cliquez sur une touche pour la modifier) :
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playCancel();
                        setDraftShortcuts({ ...DEFAULT_SHORTCUTS });
                        setRecordingShortcutId(null);
                      }}
                      className="text-xs font-bold text-[var(--color-val-red)] hover:underline cursor-pointer"
                    >
                      Réinitialiser par défaut
                    </button>
                  </div>

                  {/* Hotkeys Interactive List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SHORTCUT_DEFINITIONS.map((def) => {
                      const currentKey = (draftShortcuts[def.id] || def.defaultKey).toUpperCase();
                      const isRecording = recordingShortcutId === def.id;

                      return (
                        <div
                          key={def.id}
                          className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            isRecording
                              ? "bg-red-500/15 border-[var(--color-val-red)] ring-2 ring-[var(--color-val-red)] shadow-[0_0_20px_rgba(255,70,85,0.4)] animate-pulse"
                              : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-white/20 hover:bg-[var(--color-surface-hover)]"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)] truncate">
                              {def.label}
                            </h4>
                            <span className="text-[10px] text-[var(--color-text-secondary)]">
                              Touche par défaut : {def.defaultKey.toUpperCase()}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              setRecordingShortcutId(isRecording ? null : def.id);
                            }}
                            title="Cliquez pour changer cette touche"
                            className={`px-3 py-1.5 rounded-xl font-mono text-xs font-black transition-all cursor-pointer flex items-center justify-center min-w-[48px] ${
                              isRecording
                                ? "bg-[var(--color-val-red)] text-white shadow-lg shadow-[rgba(255,70,85,0.5)]"
                                : "bg-black/40 border border-white/20 text-white hover:border-[var(--color-val-red)] hover:text-[var(--color-val-red)]"
                            }`}
                          >
                            {isRecording ? "Appuyez..." : currentKey}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {recordingShortcutId && (
                    <p className="text-center text-xs text-amber-400 animate-bounce pt-2 flex items-center justify-center gap-1.5">
                      <IconKeyboard size={13} />
                      <span>Appuyez sur la touche désirée sur votre clavier (ou <strong>Échap</strong> pour annuler).</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {settingsTab === "privacy" && (
            <div className="glass-panel rounded-2xl p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
              <div>
                <h3 className="font-bold text-sm sm:text-lg text-[var(--color-text-primary)]">Confidentialité du profil</h3>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5 sm:mt-1">
                  Gérez qui peut consulter vos statistiques et historiques de parties
                </p>
              </div>

              <div className="bg-[var(--color-background)] p-3.5 sm:p-6 rounded-xl sm:rounded-2xl border border-[var(--color-border)] flex items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div
                    className={`w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-base sm:text-xl flex-shrink-0 ${
                      draftIsPublic ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {draftIsPublic ? (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                        <path d="M2 12h20" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-base text-[var(--color-text-primary)]">
                      {draftIsPublic ? "Profil Public" : "Profil Privé"}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-[var(--color-text-secondary)] mt-0.5 max-w-md">
                      {draftIsPublic
                        ? "Tout le monde peut consulter votre profil et vos statistiques."
                        : "Votre profil est masqué pour les autres utilisateurs."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDraftIsPublic(!draftIsPublic)}
                  className={`relative inline-flex h-6 w-11 sm:h-7 sm:w-13 items-center rounded-full transition-colors duration-300 flex-shrink-0 ml-2 sm:ml-4 cursor-pointer ${
                    draftIsPublic ? "bg-green-500" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                      draftIsPublic ? "translate-x-6 sm:translate-x-7" : "translate-x-1"
                    }`}
                  ></span>
                </button>
              </div>

              {/* Accordéon : Ce que voient les autres visiteurs */}
              <div className="pt-4 sm:pt-6 border-t border-[var(--color-border)]">
                <div
                  onClick={() => {
                    sounds.playClick();
                    setPrivacyStatsExpanded(!privacyStatsExpanded);
                  }}
                  className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-[var(--color-surface)]/60 hover:bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-val-red)]/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-[var(--color-val-red)]/10 border border-[var(--color-val-red)]/30 flex items-center justify-center flex-shrink-0">
                      <IconEye size={18} className="text-[var(--color-val-red)]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h4 className="font-bold text-xs sm:text-base text-[var(--color-text-primary)] flex items-center gap-2">
                        <span>Ce que voient les autres visiteurs</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-[var(--color-val-red)]/20 text-[var(--color-val-red)] text-[10px] font-black">
                          {statOptions.length - draftHiddenStats.length}/{statOptions.length}
                        </span>
                      </h4>
                      <p className="text-[11px] sm:text-xs text-[var(--color-text-secondary)] truncate">
                        {privacyStatsExpanded
                          ? "Cliquez pour replier les options de visibilité"
                          : "Cliquez pour déplier et choisir les statistiques visibles ou masquées"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] hidden xs:inline">
                      {draftHiddenStats.length === 0 ? "Tout visible" : `${draftHiddenStats.length} masquée(s)`}
                    </span>
                    <span
                      className={`text-sm sm:text-base font-black transition-transform duration-300 text-[var(--color-text-secondary)] group-hover:text-[var(--color-val-red)] ${
                        privacyStatsExpanded ? "rotate-90 text-[var(--color-val-red)]" : "rotate-0"
                      }`}
                    >
                      →
                    </span>
                  </div>
                </div>

                {privacyStatsExpanded && (
                  <div className="space-y-4 mt-3 pt-3 border-t border-[var(--color-border)]/50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-[11px] sm:text-xs text-[var(--color-text-secondary)]">
                        Choisissez précisément les statistiques et graphiques accessibles aux personnes qui consultent votre profil.
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onMouseEnter={() => sounds.playHover()}
                          onClick={() => {
                            sounds.playBreeze();
                            setDraftHiddenStats([]);
                          }}
                          className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-emerald-400 border border-[var(--color-border)] cursor-pointer"
                        >
                          Tout rendre visible
                        </button>
                        <button
                          type="button"
                          onMouseEnter={() => sounds.playHover()}
                          onClick={() => {
                            sounds.playBreeze();
                            setDraftHiddenStats(statOptions.map((s) => s.id));
                          }}
                          className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-red-400 border border-[var(--color-border)] cursor-pointer"
                        >
                          Tout masquer
                        </button>
                      </div>
                    </div>

                    {/* Explicative Banner */}
                    <div className="p-3 bg-[var(--color-surface)]/60 rounded-xl border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] flex items-center gap-2">
                      <IconShield size={16} className="text-sky-400 flex-shrink-0" />
                      <span>
                        Les éléments marqués comme <strong>Masqués</strong> seront invisibles pour les visiteurs externes, mais restent toujours affichés sur votre propre compte.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 mb-4">
                      {statOptions.map((stat) => {
                        const isVisibleToOthers = !draftHiddenStats.includes(stat.id);
                        return (
                          <div
                            key={stat.id}
                            onMouseEnter={() => sounds.playHover()}
                            onClick={() => {
                              sounds.playBreeze();
                              if (isVisibleToOthers) {
                                setDraftHiddenStats([...draftHiddenStats, stat.id]);
                              } else {
                                setDraftHiddenStats(draftHiddenStats.filter((id) => id !== stat.id));
                              }
                            }}
                            className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isVisibleToOthers
                                ? "bg-emerald-500/5 border-emerald-500/40 hover:border-emerald-500 shadow-sm"
                                : "bg-red-500/5 border-red-500/25 opacity-70 hover:opacity-100 hover:border-red-500/50"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-[var(--color-text-secondary)] flex-shrink-0">{stat.icon}</span>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs sm:text-sm font-bold truncate text-[var(--color-text-primary)]">
                                  {stat.label}
                                </span>
                                <span className="text-[10px] font-semibold text-[var(--color-text-secondary)]">
                                  {isVisibleToOthers ? (
                                    <span className="text-emerald-400">Visible aux visiteurs</span>
                                  ) : (
                                    <span className="text-red-400">Masqué aux autres</span>
                                  )}
                                </span>
                              </div>
                            </div>

                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black transition-colors ${
                                isVisibleToOthers ? "bg-emerald-600 text-white shadow-md" : "bg-red-900/60 text-red-300 border border-red-500/30"
                              }`}
                            >
                              {isVisibleToOthers ? <IconEye size={12} /> : <IconLock size={12} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Section : Autorisations Spécifiques pour vos Amis */}
              <div className="pt-4 sm:pt-6 border-t border-[var(--color-border)] space-y-3">
                <div>
                  <h4 className="font-bold text-xs sm:text-base text-[var(--color-text-primary)] flex items-center gap-2">
                    <IconUsers size={18} className="text-sky-400" />
                    <span>Autorisations Spécifiques pour vos Amis</span>
                  </h4>
                  <p className="text-[11px] sm:text-xs text-[var(--color-text-secondary)] mt-0.5">
                    Réglez pour chaque ami l&apos;autorisation d&apos;accéder à vos statistiques lorsque votre profil est en mode Privé.
                  </p>
                </div>

                {sgsFriends.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-gray-400 text-center">
                    Vous n&apos;avez pas encore d&apos;amis ajoutés sur votre compte.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sgsFriends.map((f) => (
                      <div
                        key={f.friendshipId}
                        className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {f.avatarUrl ? (
                            <img src={f.avatarUrl} alt={f.name} className="w-8 h-8 rounded-lg object-cover border border-white/10" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white border border-white/10">
                              {f.name.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">{f.name}</div>
                            <div className="text-[10px] text-gray-400 font-mono">{f.riotId}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`text-[11px] font-bold ${f.canViewStats ? "text-emerald-400" : "text-red-400"}`}>
                            {f.canViewStats ? "Accès autorisé" : "Accès bloqué"}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              if (f.friendId) {
                                updateFriendPermission(f.friendId, !f.canViewStats);
                              }
                            }}
                            className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors duration-300 flex-shrink-0 cursor-pointer ${
                              f.canViewStats ? "bg-emerald-500" : "bg-gray-600"
                            }`}
                            title="Basculer l'autorisation pour cet ami"
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 sm:h-4 sm:w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                                f.canViewStats ? "translate-x-4 sm:translate-x-5" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {settingsTab === "appearance" && (
            <div className="glass-panel rounded-2xl p-3.5 sm:p-6 md:p-8 space-y-6 sm:space-y-10">
              {/* Sélecteur de Thème */}
              <div>
                <h3 className="font-bold text-sm sm:text-lg text-[var(--color-text-primary)] mb-1 sm:mb-2">Thème de l&apos;interface</h3>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-3 sm:mb-5">Choisissez l&apos;ambiance visuelle globale</p>
                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
                  {[
                    { id: "dark", name: "Sombre", bg: "#0a0e13", surface: "#0f1923", accent: "#8b97a3" },
                    { id: "light", name: "Clair", bg: "#f0f1f5", surface: "#ffffff", accent: "#525f6e" },
                    { id: "midnight", name: "Midnight", bg: "#0d0b1a", surface: "#140f28", accent: "#8c64ff" },
                    { id: "crimson", name: "Crimson", bg: "#120808", surface: "#1e0a0a", accent: "#ff4655" },
                    { id: "ocean", name: "Océan", bg: "#071014", surface: "#0a1923", accent: "#32c8b4" },
                    { id: "custom", name: "Personnalisé", bg: draftCustomBg, surface: draftCustomBg, accent: draftCustomAccent },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onMouseEnter={() => sounds.playHover()}
                      onClick={() => {
                        sounds.playClick();
                        setDraftTheme(t.id);
                      }}
                      className={`relative rounded-xl p-2 sm:p-3 flex flex-col items-center gap-1.5 sm:gap-2 border-2 transition-all duration-300 cursor-pointer ${
                        draftTheme === t.id
                          ? "border-[var(--color-val-red)] shadow-accent-md scale-105"
                          : "border-[var(--color-border)] hover:border-[var(--color-text-secondary)]"
                      }`}
                    >
                      <div className="w-full aspect-[4/3] rounded-lg overflow-hidden flex flex-col" style={{ backgroundColor: t.bg }}>
                        <div className="flex-1"></div>
                        <div className="h-[40%] rounded-t-md mx-1" style={{ backgroundColor: t.surface, border: `1px solid ${t.accent}20` }}></div>
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[var(--color-text-primary)] truncate">{t.name}</span>
                      {draftTheme === t.id && (
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[var(--color-val-red)] rounded-full flex items-center justify-center text-[var(--color-accent-contrast)] shadow-accent-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <hr className="border-[var(--color-border)]" />

              {/* Option Couleur Custom */}
              {draftTheme === "custom" && (
                <div className="bg-[var(--color-background)] p-3.5 sm:p-6 rounded-xl sm:rounded-2xl border border-[var(--color-border)] animate-in fade-in duration-300">
                  <h4 className="font-bold text-xs sm:text-base text-[var(--color-text-primary)] mb-3 sm:mb-4">Personnalisation des couleurs</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-[var(--color-text-secondary)] font-medium">Couleur d&apos;accentuation</span>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <input
                          type="color"
                          value={draftCustomAccent}
                          onChange={(e) => setDraftCustomAccent(e.target.value)}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg cursor-pointer bg-transparent border-0"
                        />
                        <span className="font-mono text-xs text-[var(--color-text-primary)]">{draftCustomAccent}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-[var(--color-text-secondary)] font-medium">Couleur de fond</span>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <input
                          type="color"
                          value={draftCustomBg}
                          onChange={(e) => setDraftCustomBg(e.target.value)}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg cursor-pointer bg-transparent border-0"
                        />
                        <span className="font-mono text-xs text-[var(--color-text-primary)]">{draftCustomBg}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Option Case SPI selon le Thème */}
              <div className="bg-[var(--color-background)] p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-[var(--color-border)] flex items-center justify-between gap-3 sm:gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs sm:text-sm text-[var(--color-text-primary)]">
                      Adapter la case SPI au thème d&apos;apparence
                    </h4>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Optionnel
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-[var(--color-text-secondary)] max-w-xl">
                    Applique la couleur d&apos;accentuation de votre thème actif à votre carte et badge SPI de profil. <strong className="text-amber-400">Garantie d&apos;authenticité :</strong> Les visiteurs extérieurs verront toujours les couleurs officielles de votre score SPI.
                  </p>
                </div>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setDraftSpiThemeAdapt(!draftSpiThemeAdapt);
                  }}
                  className={`relative inline-flex h-6 w-11 sm:h-7 sm:w-13 items-center rounded-full transition-colors duration-300 flex-shrink-0 ml-2 sm:ml-4 cursor-pointer ${
                    draftSpiThemeAdapt ? "bg-[var(--color-val-red)]" : "bg-gray-400 dark:bg-[rgba(255,255,255,0.1)]"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                      draftSpiThemeAdapt ? "translate-x-6 sm:translate-x-7" : "translate-x-1"
                    }`}
                  ></span>
                </button>
              </div>

              {/* Gestion de la Bannière */}
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h3 className="font-bold text-sm sm:text-lg text-[var(--color-text-primary)]">Bannière de profil</h3>
                    <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5 sm:mt-1">
                      Personnalisez l&apos;image d&apos;en-tête de votre profil
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setCatalogOpen(true);
                    }}
                    onMouseEnter={() => sounds.playHover()}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-[var(--color-text-primary)]"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                    <span>Catalogue</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                  {banners.map((b, idx) => (
                    <button
                      key={idx}
                      onMouseEnter={() => sounds.playHover()}
                      onClick={() => {
                        sounds.playClick();
                        setDraftBannerUrl(b.url);
                      }}
                      className={`relative aspect-[3/1] rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-[#0a0e13] ${
                        draftBannerUrl === b.url
                          ? "border-[var(--color-val-red)] shadow-[0_0_15px_rgba(255,70,85,0.3)] scale-[1.02]"
                          : "border-[var(--color-border)] hover:border-[var(--color-text-secondary)]"
                      }`}
                    >
                      {b.url ? (
                        <img referrerPolicy="no-referrer" src={b.url} alt={b.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[var(--color-surface)] text-[9px] sm:text-[10px] font-bold text-[var(--color-text-secondary)]">
                          Par défaut
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-end p-1.5 sm:p-2">
                        <span className="text-[9px] sm:text-[10px] font-bold text-white uppercase">{b.name}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Ajustement Vertical de la Bannière (Y Offset) */}
                <div className="bg-[var(--color-background)] p-3.5 sm:p-6 rounded-xl sm:rounded-2xl border border-[var(--color-border)] space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)]">Cadrage vertical (Hauteur)</span>
                    <span className="text-xs font-mono font-bold text-[var(--color-val-red)]">{draftBannerOffsetY}%</span>
                  </div>

                  {/* Visual Preview Box */}
                  <div className="relative w-full aspect-[3.8/1] max-h-[120px] sm:max-h-[140px] rounded-xl overflow-hidden border border-[var(--color-border)] bg-[#0a0e13] shadow-md">
                    <img
                      referrerPolicy="no-referrer"
                      src={draftBannerUrl || p?.cardWideUrl || "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png"}
                      alt="Aperçu"
                      style={{ objectPosition: `center ${draftBannerOffsetY}%` }}
                      className="absolute inset-0 w-full h-full object-cover transition-all duration-75"
                    />
                    <div className="absolute inset-0 bg-black/40"></div>
                    <div className="relative z-10 p-2 sm:p-3 flex items-center justify-between h-full">
                      <div className="flex items-center gap-2">
                        {p?.cardUrl ? (
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg overflow-hidden border border-white/20">
                            <img referrerPolicy="no-referrer" src={p.cardUrl} alt="Avatar" className="w-full h-full object-cover" />
                          </div>
                        ) : null}
                        <span className="text-[11px] sm:text-xs font-black text-white drop-shadow-md">{p?.gameName || "Mon Profil"}</span>
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-black text-[var(--color-val-light)] border border-[var(--color-val-light)]/40 px-1.5 sm:px-2 py-0.5 rounded backdrop-blur-sm">
                        Aperçu
                      </span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={draftBannerOffsetY}
                    onChange={(e) => setDraftBannerOffsetY(Number(e.target.value))}
                    className="w-full h-1.5 sm:h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[var(--color-val-red)]"
                  />
                  <p className="text-[10px] sm:text-[11px] text-[var(--color-text-secondary)]">
                    Glissez le curseur pour ajuster l&apos;image en temps réel dans le cadre ci-dessus.
                  </p>
                </div>

                <BannerCatalogModal isOpen={catalogOpen} onClose={() => setCatalogOpen(false)} onSelect={(url) => setDraftBannerUrl(url)} />
              </div>

              <hr className="border-[var(--color-border)]" />

              {/* ==================== BADGES DE PROFIL (MAX 3 SUR LA BANNIÈRE) ==================== */}
              {(() => {
                const currentLvl = trackerLevel ?? 1;
                const levelBadgeIds: string[] = [];
                if (currentLvl >= 1) levelBadgeIds.push("recrue");
                if (currentLvl >= 4) levelBadgeIds.push("veteran");
                if (currentLvl >= 15) levelBadgeIds.push("radiant");

                const rawBadges = [
                  ...levelBadgeIds,
                  ...(p?.badge ? parseBadges(p.badge).map((b: string) => b.toLowerCase().trim()) : []),
                ];

                const canonicalKeys = Array.from(
                  new Set(
                    rawBadges.map((b) => {
                      if (b === "badge_recruit") return "recrue";
                      if (b === "badge_veteran") return "veteran";
                      if (b === "badge_radiant") return "radiant";
                      return b;
                    })
                  )
                );

                const combinedRegistry: Record<string, any> = { ...BADGES_REGISTRY };
                if (Array.isArray(customBadgesList)) {
                  for (const cb of customBadgesList) {
                    if (cb.id) {
                      combinedRegistry[cb.id.toLowerCase().trim()] = cb;
                    }
                  }
                }

                const ownedBadges = canonicalKeys
                  .map((id) => combinedRegistry[id])
                  .filter(Boolean);

                // Badges actuellement actifs (non masqués) - strictement plafonnés à 3
                const nonHiddenBadges = ownedBadges.filter(
                  (b) => !draftHiddenBadges.some((hb) => hb.toLowerCase().trim() === b.id)
                );
                const activeBadges = nonHiddenBadges.slice(0, 3);
                const activeCount = draftShowBadge ? activeBadges.length : 0;

                // Badges de niveau encore verrouillés pour ce niveau Tracker
                const lockedLevelBadges = [
                  { id: "recrue", minLvl: 1, label: "Recrue Tracker" },
                  { id: "veteran", minLvl: 4, label: "Vétéran Spycam" },
                  { id: "radiant", minLvl: 15, label: "Radiant Master" },
                ].filter((lb) => currentLvl < lb.minLvl);

                return (
                  <div className="flex flex-col space-y-4">
                    <div
                      onClick={() => {
                        sounds.playClick();
                        setBadgesExpanded(!badgesExpanded);
                      }}
                      className="flex items-center justify-between p-3.5 sm:p-5 rounded-2xl bg-[var(--color-surface)]/60 hover:bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-val-red)]/40 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center flex-shrink-0">
                          <IconBadgeVerified size={20} className="text-sky-400" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <h3 className="font-bold text-sm sm:text-base text-[var(--color-text-primary)] flex items-center gap-2 flex-wrap">
                            <span>Badges &amp; Distinctions de Profil</span>
                            <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-black border border-sky-500/30">
                              {draftShowBadge ? `${activeCount}/3 affichés` : "Masqués"}
                            </span>
                          </h3>
                          <p className="text-[11px] sm:text-xs text-[var(--color-text-secondary)] truncate">
                            Sélectionnez jusqu&apos;à 3 badges maximum à afficher sur votre bannière de profil
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            sounds.playClick();
                            setDraftShowBadge(!draftShowBadge);
                          }}
                          title={draftShowBadge ? "Afficher les badges" : "Masquer les badges"}
                          className={`relative inline-flex h-6 w-11 sm:h-7 sm:w-13 items-center rounded-full transition-colors duration-300 flex-shrink-0 cursor-pointer ${
                            draftShowBadge ? "bg-[var(--color-val-red)] shadow-accent-sm" : "bg-gray-400 dark:bg-[rgba(255,255,255,0.1)]"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full ${
                              draftShowBadge ? "bg-[var(--color-accent-contrast,#ffffff)]" : "bg-white"
                            } shadow-md transition-all duration-300 ${
                              draftShowBadge ? "translate-x-6 sm:translate-x-7" : "translate-x-1"
                            }`}
                          ></span>
                        </button>

                        <span
                          className={`text-sm sm:text-base font-black transition-transform duration-300 text-[var(--color-text-secondary)] group-hover:text-[var(--color-val-red)] ${
                            badgesExpanded ? "rotate-90 text-[var(--color-val-red)]" : "rotate-0"
                          }`}
                        >
                          →
                        </span>
                      </div>
                    </div>

                    {/* Corps de gestion des badges */}
                    {badgesExpanded && (
                      <div className="space-y-3 pt-1 animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* Alerte si tentative d'équiper > 3 badges */}
                        {badgeSlotWarning && (
                          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                            <span className="text-base flex-shrink-0">⚠️</span>
                            <span>{badgeSlotWarning}</span>
                          </div>
                        )}

                        {/* Aperçu des 3 emplacements de la bannière */}
                        <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-secondary)]">
                              Emplacements sur la bannière (3 max)
                            </span>
                            <span className="text-[10px] font-mono font-bold text-sky-400">
                              {draftShowBadge ? `${activeCount} / 3 slots occupés` : "Désactivé"}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {[0, 1, 2].map((slotIdx) => {
                              const badge = activeBadges[slotIdx];
                              if (badge && draftShowBadge) {
                                const isImage = badge.iconType === "image" || Boolean(badge.imageUrl);
                                const IconComp = badge.icon || IconBadgeVerified;
                                return (
                                  <div
                                    key={slotIdx}
                                    className={`p-2.5 rounded-lg border flex items-center gap-2.5 ${badge.bgClass} ${badge.borderClass} ${badge.glowClass}`}
                                  >
                                    {isImage && badge.imageUrl ? (
                                      <img
                                        src={badge.imageUrl.startsWith("r2://") ? `/api/media/stream?key=${encodeURIComponent(badge.imageUrl.replace("r2://", ""))}` : badge.imageUrl}
                                        alt={badge.label}
                                        className="w-4 h-4 rounded-full object-cover"
                                      />
                                    ) : (
                                      <IconComp size={16} className={badge.colorClass} />
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <div className="text-[9px] font-black uppercase tracking-wider text-white/60">
                                        Slot {slotIdx + 1}
                                      </div>
                                      <div className="text-xs font-bold text-white truncate">
                                        {badge.label}
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              return (
                                <div
                                  key={slotIdx}
                                  className="p-2.5 rounded-lg border border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center gap-1.5 text-[11px] text-[var(--color-text-secondary)]/50 font-bold"
                                >
                                  <span>Slot {slotIdx + 1}</span>
                                  <span className="text-[9px] uppercase tracking-wider">(Vide)</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Liste de tous les badges possédés */}
                        <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] pt-1">
                          Cliquez sur un badge pour l&apos;activer ou le désactiver :
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {ownedBadges.map((badgeDef) => {
                            const isSlotActive = activeBadges.some((b) => b.id === badgeDef.id) && draftShowBadge;
                            const slotNumber = activeBadges.findIndex((b) => b.id === badgeDef.id);
                            const isImage = badgeDef.iconType === "image" || Boolean(badgeDef.imageUrl);
                            const IconComp = badgeDef.icon || IconBadgeVerified;

                            return (
                              <div
                                key={badgeDef.id}
                                onMouseEnter={() => sounds.playHover()}
                                onClick={() => {
                                  if (isSlotActive) {
                                    // Désactiver / Masquer
                                    sounds.playClick();
                                    setDraftHiddenBadges((prev) => [
                                      ...prev.filter((id) => id.toLowerCase().trim() !== badgeDef.id),
                                      badgeDef.id,
                                    ]);
                                    setBadgeSlotWarning(null);
                                  } else {
                                    // Activer (si slot disponible parmi les 3)
                                    if (activeBadges.length >= 3) {
                                      sounds.playClick();
                                      setBadgeSlotWarning(
                                        "3 badges maximum peuvent être affichés simultanément sur la bannière. Désactivez un badge pour en sélectionner un autre !"
                                      );
                                      setTimeout(() => setBadgeSlotWarning(null), 4000);
                                      return;
                                    }
                                    sounds.playClick();
                                    setDraftHiddenBadges((prev) =>
                                      prev.filter((id) => id.toLowerCase().trim() !== badgeDef.id)
                                    );
                                    setBadgeSlotWarning(null);
                                  }
                                }}
                                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                  isSlotActive
                                    ? "bg-[var(--color-surface)] border-sky-400/40 shadow-[0_0_12px_rgba(56,189,248,0.15)]"
                                    : "bg-white/[0.02] border-white/10 opacity-60 hover:opacity-100"
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className={`p-1.5 rounded-lg border flex items-center justify-center ${badgeDef.bgClass} ${badgeDef.borderClass}`}
                                  >
                                    {isImage && badgeDef.imageUrl ? (
                                      <img
                                        src={badgeDef.imageUrl.startsWith("r2://") ? `/api/media/stream?key=${encodeURIComponent(badgeDef.imageUrl.replace("r2://", ""))}` : badgeDef.imageUrl}
                                        alt={badgeDef.label}
                                        className="w-4 h-4 rounded-full object-cover"
                                      />
                                    ) : (
                                      <IconComp size={16} className={badgeDef.colorClass} />
                                    )}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)] truncate">
                                        {badgeDef.label}
                                      </span>
                                      {isSlotActive && slotNumber >= 0 && slotNumber < 3 && (
                                        <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                          Slot {slotNumber + 1}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-[var(--color-text-secondary)] line-clamp-1">
                                      {badgeDef.description}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span
                                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                      isSlotActive
                                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                        : "bg-white/5 text-gray-400 border border-white/10"
                                    }`}
                                  >
                                    {isSlotActive ? "Affiché" : "Masqué"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Badges de niveau encore verrouillés */}
                        {lockedLevelBadges.length > 0 && (
                          <div className="space-y-2 pt-2">
                            <div className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-secondary)]/70 flex items-center gap-1.5">
                              <IconLock size={12} />
                              <span>Badges à débloquer via la progression Tracker :</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {lockedLevelBadges.map((lb) => {
                                const def = BADGES_REGISTRY[lb.id];
                                const IconComp = def?.icon || IconLock;
                                return (
                                  <div
                                    key={lb.id}
                                    className="p-2.5 rounded-xl border border-white/5 bg-white/[0.01] opacity-50 flex items-center justify-between gap-2"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-500">
                                        <IconComp size={14} />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="text-xs font-bold text-gray-400 truncate">
                                          {lb.label}
                                        </div>
                                        <div className="text-[10px] text-gray-500">
                                          Requis : Niveau Tracker {lb.minLvl}
                                        </div>
                                      </div>
                                    </div>
                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10">
                                      Niv. {lb.minLvl}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              <hr className="border-[var(--color-border)]" />

              {/* ==================== COSMÉTIQUES DE BANNIÈRE (EFFET INTÉRIEUR & BORDURE) ==================== */}
              <div className="space-y-5">
                <div>
                  <h3 className="font-bold text-sm sm:text-lg text-[var(--color-text-primary)]">
                    Cosmétiques de Bannière &amp; Bordure
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5 sm:mt-1">
                    Personnalisez séparément les effets intérieurs animés et la bordure lumineuse extérieure de votre bannière.
                  </p>
                </div>

                {/* Sélecteur de teinte : Couleur d'origine vs Accent personnalisé du joueur */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-white/[0.03] border border-[var(--color-border)]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-val-red)]/15 border border-[var(--color-val-red)]/30 flex items-center justify-center text-[var(--color-val-red)] flex-shrink-0 text-base">
                      🎨
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                        <span>Teinte des Effets Cosmétiques</span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-[var(--color-val-red)]/20 text-[var(--color-val-red)] border border-[var(--color-val-red)]/30">
                          Option
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                        Laissez les couleurs d&apos;origine signatures ou harmonisez tous les effets avec votre accent Tracker.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10 w-full sm:w-auto self-stretch sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setDraftCosmeticAccent(false);
                      }}
                      className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        !draftCosmeticAccent
                          ? "bg-[var(--color-surface-hover)] text-white shadow-sm border border-white/10"
                          : "text-[var(--color-text-secondary)] hover:text-white"
                      }`}
                    >
                      🌈 D&apos;origine
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setDraftCosmeticAccent(true);
                      }}
                      className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        draftCosmeticAccent
                          ? "bg-[var(--color-val-red)] text-white shadow-accent-sm"
                          : "text-[var(--color-text-secondary)] hover:text-white"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                      <span>Mon Accent</span>
                    </button>
                  </div>
                </div>

                {/* Deux cartes interactives : Effet de Bannière et Effet de Bordure */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* CARTE 1 : EFFET DE BANNIÈRE (INTÉRIEUR) */}
                  {(() => {
                    const currentEffect =
                      interiorEffectsList.find((e) => e.id === draftBannerAnimation) ||
                      interiorEffectsList[0] ||
                      BANNER_INTERIOR_EFFECTS[0];
                    const isSelected = editingCosmeticType === "banner";

                    return (
                      <div
                        onClick={() => {
                          sounds.playClick();
                          setEditingCosmeticType(isSelected ? "none" : "banner");
                        }}
                        onMouseEnter={() => sounds.playHover()}
                        className={`group relative rounded-2xl p-4 sm:p-5 border-2 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden ${
                          isSelected
                            ? "border-[var(--color-val-red)] bg-[var(--color-surface)] shadow-accent-md scale-[1.01]"
                            : "border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-val-red)]/50 hover:bg-[var(--color-surface)]/40"
                        }`}
                      >
                        {/* Indicateur de survol / Bouton modifier avec stylo */}
                        <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--color-val-red)] text-white text-[10px] font-black uppercase tracking-wider shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0">
                          <IconPencil size={12} />
                          <span>Modifier</span>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between gap-2 pr-20">
                            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-secondary)]">
                              Effet de Bannière (Intérieur)
                            </span>
                          </div>
                          <h4 className="font-bold text-sm sm:text-base text-[var(--color-text-primary)] flex items-center gap-2">
                            <span>{currentEffect.name}</span>
                            {draftBannerAnimation ? (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Actif
                              </span>
                            ) : (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10">
                                Aucun
                              </span>
                            )}
                          </h4>
                          <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-2">
                            {currentEffect.desc}
                          </p>
                        </div>

                        {/* Aperçu visuel miniature de la bannière avec effet intérieur */}
                        <div className="relative w-full aspect-[3.5/1] rounded-xl overflow-hidden border border-white/10 bg-[#0a0e13]">
                          <img
                            referrerPolicy="no-referrer"
                            src={draftBannerUrl || p?.cardWideUrl || "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png"}
                            alt="Aperçu Bannière"
                            style={{ objectPosition: `center ${draftBannerOffsetY}%` }}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          {draftBannerAnimation && (
                            <div className={`banner-effect-layer banner-effect-${draftBannerAnimation} banner-interior-${draftBannerAnimation}`} style={{ borderRadius: "0.75rem" }} />
                          )}
                          <div className="absolute inset-0 bg-black/30 pointer-events-none flex items-center justify-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/80 bg-black/60 px-2.5 py-1 rounded-full border border-white/15 backdrop-blur-sm">
                              {draftBannerAnimation ? currentEffect.name : "Sans effet intérieur"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-[var(--color-border)]/50 flex items-center justify-between text-[11px]">
                          <span className="text-[var(--color-text-secondary)]">Cliquez pour explorer la collection</span>
                          <span className="font-bold text-[var(--color-val-red)] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            <span>{isSelected ? "Fermer la liste" : "Changer l'effet"}</span>
                            <span>→</span>
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* CARTE 2 : EFFET DE BORDURE (CONTOUR) */}
                  {(() => {
                    const currentBorder =
                      borderEffectsList.find((b) => b.id === draftBannerBorder) ||
                      borderEffectsList[0] ||
                      BANNER_BORDER_EFFECTS[0];
                    const isSelected = editingCosmeticType === "border";

                    return (
                      <div
                        onClick={() => {
                          sounds.playClick();
                          setEditingCosmeticType(isSelected ? "none" : "border");
                        }}
                        onMouseEnter={() => sounds.playHover()}
                        className={`group relative rounded-2xl p-4 sm:p-5 border-2 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden ${
                          isSelected
                            ? "border-[var(--color-val-red)] bg-[var(--color-surface)] shadow-accent-md scale-[1.01]"
                            : "border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-val-red)]/50 hover:bg-[var(--color-surface)]/40"
                        }`}
                      >
                        {/* Indicateur de survol / Bouton modifier avec stylo */}
                        <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--color-val-red)] text-white text-[10px] font-black uppercase tracking-wider shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0">
                          <IconPencil size={12} />
                          <span>Modifier</span>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between gap-2 pr-20">
                            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-secondary)]">
                              Effet de Bordure (Contour)
                            </span>
                          </div>
                          <h4 className="font-bold text-sm sm:text-base text-[var(--color-text-primary)] flex items-center gap-2">
                            <span>{currentBorder.name}</span>
                            {draftBannerBorder ? (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Active
                              </span>
                            ) : (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10">
                                Classique
                              </span>
                            )}
                          </h4>
                          <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-2">
                            {currentBorder.desc}
                          </p>
                        </div>

                        {/* Aperçu visuel avec contour dynamique superposé en calque propre */}
                        <div className="p-1">
                          <div className="relative w-full aspect-[3.5/1] rounded-xl overflow-hidden bg-[#0a0e13] border border-white/10">
                            <img
                              referrerPolicy="no-referrer"
                              src={draftBannerUrl || p?.cardWideUrl || "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png"}
                              alt="Aperçu Bordure"
                              style={{ objectPosition: `center ${draftBannerOffsetY}%` }}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            {draftBannerBorder && (
                              <div className={`banner-border-layer banner-border-${draftBannerBorder} ${draftBannerBorder === "rgb_conic" ? "banner-border-animated" : ""}`} />
                            )}
                            <div className="absolute inset-0 bg-black/40 pointer-events-none flex items-center justify-center">
                              <span className="text-[10px] font-black uppercase tracking-widest text-white/80 bg-black/60 px-2.5 py-1 rounded-full border border-white/15 backdrop-blur-sm">
                                {draftBannerBorder ? currentBorder.name : "Contour classique"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-[var(--color-border)]/50 flex items-center justify-between text-[11px]">
                          <span className="text-[var(--color-text-secondary)]">Cliquez pour explorer la collection</span>
                          <span className="font-bold text-[var(--color-val-red)] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            <span>{isSelected ? "Fermer la liste" : "Changer la bordure"}</span>
                            <span>→</span>
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* ==================== PANNEAU DÉTAILLÉ DE SÉLECTION D'EFFETS ==================== */}
                {editingCosmeticType === "banner" && (
                  <div className="p-4 sm:p-6 rounded-2xl bg-[var(--color-background)] border border-[var(--color-val-red)]/40 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-val-red)]"></span>
                          <h4 className="font-bold text-sm sm:text-base text-[var(--color-text-primary)]">
                            Sélection des Effets de Bannière (Intérieur)
                          </h4>
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                          Ces animations habillent l&apos;intérieur de votre image sans altérer le contour du profil.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingCosmeticType("none")}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-[var(--color-text-secondary)] hover:text-white transition-colors cursor-pointer"
                      >
                        Fermer ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {interiorEffectsList.map((fx) => {
                        const isUnlocked = (trackerLevel ?? 1) >= fx.minLevel;
                        const isEquipped = draftBannerAnimation === fx.id;

                        return (
                          <div
                            key={fx.id || "none"}
                            onClick={() => {
                              if (!isUnlocked) return;
                              sounds.playClick();
                              setDraftBannerAnimation(fx.id);
                            }}
                            onMouseEnter={() => isUnlocked && sounds.playHover()}
                            className={`relative rounded-xl p-3 border-2 transition-all duration-200 flex flex-col justify-between gap-3 ${
                              !isUnlocked
                                ? "opacity-40 border-white/5 bg-white/[0.01] cursor-not-allowed"
                                : isEquipped
                                ? "border-[var(--color-val-red)] bg-[var(--color-surface)] shadow-accent-sm cursor-pointer"
                                : "border-[var(--color-border)] hover:border-[var(--color-text-secondary)] bg-[var(--color-surface)]/50 cursor-pointer"
                            }`}
                          >
                            <div className="relative w-full aspect-[3/1] rounded-lg overflow-hidden bg-[#0a0e13]">
                              <img
                                referrerPolicy="no-referrer"
                                src={draftBannerUrl || p?.cardWideUrl || "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png"}
                                alt=""
                                style={{ objectPosition: `center ${draftBannerOffsetY}%` }}
                                className="absolute inset-0 w-full h-full object-cover opacity-80"
                              />
                              {fx.id && isUnlocked && (
                                <div className={`banner-effect-layer banner-effect-${fx.id} banner-interior-${fx.id}`} style={{ borderRadius: "0.5rem" }} />
                              )}
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                {!isUnlocked && (
                                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/80 text-amber-300 text-[10px] font-bold border border-amber-400/30">
                                    <IconLock size={12} />
                                    <span>Niveau {fx.minLevel}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[var(--color-text-primary)]">
                                  {fx.name}
                                </span>
                                {isUnlocked ? (
                                  <span className="text-[9px] font-black uppercase text-emerald-400">
                                    Débloqué
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-black uppercase text-gray-500">
                                    Niv. {fx.minLevel}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[var(--color-text-secondary)] line-clamp-1">
                                {fx.desc}
                              </p>
                            </div>

                            <button
                              type="button"
                              disabled={!isUnlocked}
                              className={`w-full py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                                !isUnlocked
                                  ? "bg-white/5 text-gray-500 cursor-not-allowed"
                                  : isEquipped
                                  ? "bg-[var(--color-val-red)] text-white shadow-accent-sm"
                                  : "bg-white/10 hover:bg-white/20 text-white"
                              }`}
                            >
                              {isEquipped ? "✓ Équipé" : isUnlocked ? "Sélectionner" : `Requis : Niv. ${fx.minLevel}`}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {editingCosmeticType === "border" && (
                  <div className="p-4 sm:p-6 rounded-2xl bg-[var(--color-background)] border border-[var(--color-val-red)]/40 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-val-red)]"></span>
                          <h4 className="font-bold text-sm sm:text-base text-[var(--color-text-primary)]">
                            Sélection des Effets de Bordure (Contour)
                          </h4>
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                          Ces effets lumineux animent le cadre et le contour extérieur sans toucher à l&apos;image.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingCosmeticType("none")}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-[var(--color-text-secondary)] hover:text-white transition-colors cursor-pointer"
                      >
                        Fermer ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {borderEffectsList.map((borderDef) => {
                        const isUnlocked = (trackerLevel ?? 1) >= borderDef.minLevel;
                        const isEquipped = draftBannerBorder === borderDef.id;

                        return (
                          <div
                            key={borderDef.id || "none"}
                            onClick={() => {
                              if (!isUnlocked) return;
                              sounds.playClick();
                              setDraftBannerBorder(borderDef.id);
                            }}
                            onMouseEnter={() => isUnlocked && sounds.playHover()}
                            className={`relative rounded-xl p-3 border-2 transition-all duration-200 flex flex-col justify-between gap-3 ${
                              !isUnlocked
                                ? "opacity-40 border-white/5 bg-white/[0.01] cursor-not-allowed"
                                : isEquipped
                                ? "border-[var(--color-val-red)] bg-[var(--color-surface)] shadow-accent-sm cursor-pointer"
                                : "border-[var(--color-border)] hover:border-[var(--color-text-secondary)] bg-[var(--color-surface)]/50 cursor-pointer"
                            }`}
                          >
                            <div className="p-0.5">
                              <div className="relative w-full aspect-[3/1] rounded-lg overflow-hidden bg-[#0a0e13] border border-white/10">
                                <img
                                  referrerPolicy="no-referrer"
                                  src={draftBannerUrl || p?.cardWideUrl || "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png"}
                                  alt=""
                                  style={{ objectPosition: `center ${draftBannerOffsetY}%` }}
                                  className="absolute inset-0 w-full h-full object-cover opacity-80"
                                />
                                {isUnlocked && borderDef.id && (
                                  <div className={`banner-border-layer banner-border-${borderDef.id} ${borderDef.id === "rgb_conic" ? "banner-border-animated" : ""}`} />
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  {!isUnlocked && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/80 text-amber-300 text-[10px] font-bold border border-amber-400/30">
                                      <IconLock size={12} />
                                      <span>Niveau {borderDef.minLevel}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[var(--color-text-primary)]">
                                  {borderDef.name}
                                </span>
                                {isUnlocked ? (
                                  <span className="text-[9px] font-black uppercase text-emerald-400">
                                    Débloqué
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-black uppercase text-gray-500">
                                    Niv. {borderDef.minLevel}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[var(--color-text-secondary)] line-clamp-1">
                                {borderDef.desc}
                              </p>
                            </div>

                            <button
                              type="button"
                              disabled={!isUnlocked}
                              className={`w-full py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                                !isUnlocked
                                  ? "bg-white/5 text-gray-500 cursor-not-allowed"
                                  : isEquipped
                                  ? "bg-[var(--color-val-red)] text-white shadow-accent-sm"
                                  : "bg-white/10 hover:bg-white/20 text-white"
                              }`}
                            >
                              {isEquipped ? "✓ Équipée" : isUnlocked ? "Sélectionner" : `Requis : Niv. ${borderDef.minLevel}`}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {settingsTab === "language" && (
            <div className="glass-panel rounded-2xl p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
              <div>
                <h3 className="font-bold text-sm sm:text-lg text-[var(--color-text-primary)]">Langue de l&apos;interface</h3>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5 sm:mt-1">Sélectionnez votre langue d&apos;affichage préférée.</p>
              </div>

              {/* Language Search Bar */}
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  value={languageSearchQuery}
                  onChange={(e) => setLanguageSearchQuery(e.target.value)}
                  placeholder="Rechercher une langue..."
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3.5 py-2 sm:py-2.5 pl-9 sm:pl-10 text-xs sm:text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)]/50 focus:border-[var(--color-val-red)] focus:outline-none transition-colors"
                />
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {languageSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setLanguageSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Languages List with Background Cover Image + Dark Gradient to Right */}
              {(() => {
                const filtered = languages.filter((l) => {
                  if (!languageSearchQuery.trim()) return true;
                  const q = languageSearchQuery.toLowerCase();
                  return (l.label || "").toLowerCase().includes(q) || (l.id || "").toLowerCase().includes(q);
                });
                const displayed = languageSearchQuery.trim() || showAllLanguages ? filtered : filtered.slice(0, 5);

                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4 pt-2 border-t border-[var(--color-border)]">
                      {displayed.map((l) => {
                        const isSelected = (draftLocale || "french") === l.id;
                        const isImageFlag = l.flag && (l.flag.startsWith("/") || l.flag.startsWith("http") || l.flag.includes("."));

                        return (
                          <button
                            key={l.id}
                            type="button"
                            onMouseEnter={() => sounds.playHover()}
                            onClick={() => {
                              sounds.playClick();
                              setDraftLocale(l.id);
                            }}
                            className={`relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-5 border-2 transition-all duration-300 flex items-center justify-between text-left group min-h-[64px] sm:min-h-[90px] cursor-pointer ${
                              isSelected
                                ? "border-[var(--color-val-red)] shadow-[0_0_20px_rgba(255,70,85,0.4)] scale-[1.02] bg-[var(--color-val-red)]/10"
                                : "border-[var(--color-border)] hover:border-[var(--color-text-secondary)] hover:scale-[1.01] bg-[#0a0e13]"
                            }`}
                          >
                            {/* Image background with dark gradient to the right with transparency */}
                            {isImageFlag ? (
                              <>
                                <img
                                  src={l.flag}
                                  alt=""
                                  className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30 pointer-events-none"></div>
                              </>
                            ) : (
                              <div className="absolute inset-0 bg-[var(--color-surface)] pointer-events-none"></div>
                            )}

                            {/* Content with high contrast text */}
                            <div className="relative z-10 flex items-center gap-2.5 sm:gap-3.5">
                              {!isImageFlag && <span className="text-2xl sm:text-3xl filter drop-shadow-md select-none">{l.flag || "🌐"}</span>}
                              <div className="flex flex-col">
                                <span className="font-black text-xs sm:text-base text-white tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                                  {l.label}
                                </span>
                                <span className="text-[10px] sm:text-[11px] font-semibold text-gray-300 uppercase tracking-wider drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                                  {l.id}
                                </span>
                              </div>
                            </div>

                            {/* Check badge when selected */}
                            {isSelected && (
                              <div className="relative z-10 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[var(--color-val-red)] flex items-center justify-center shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Toggle "Afficher plus" / "Afficher moins" */}
                    {!languageSearchQuery.trim() && filtered.length > 5 && (
                      <div className="flex justify-center pt-2">
                        <button
                          type="button"
                          onMouseEnter={() => sounds.playHover()}
                          onClick={() => {
                            sounds.playClick();
                            setShowAllLanguages(!showAllLanguages);
                          }}
                          className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                        >
                          <span>{showAllLanguages ? "Afficher moins" : `Afficher plus (+${filtered.length - 5})`}</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`transition-transform duration-200 ${showAllLanguages ? "rotate-180" : ""}`}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {settingsTab === "legal" && (
            <div className="glass-panel rounded-2xl p-4 sm:p-6 md:p-8 space-y-6">
              <div>
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[var(--color-val-red)] text-white">SGS Conformité</span>
                <h3 className="font-bold text-sm sm:text-lg text-[var(--color-text-primary)] mt-1">Mentions Légales & Conditions Générales</h3>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                  Consultez l&apos;ensemble des conditions d&apos;utilisation, informations d&apos;hébergement et clauses officielles de conformité Riot Games.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { sounds.playClick(); setLegalModalTab("cgu"); setLegalModalOpen(true); }}
                  className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 text-white font-bold text-xs uppercase mb-1">
                    <IconFileText size={16} className="text-[var(--color-val-red)]" />
                    <span>Conditions d&apos;Utilisation (CGU)</span>
                  </div>
                  <p className="text-[11px] text-gray-400">Règles d&apos;utilisation, modération des salons et engagements.</p>
                </button>

                <button
                  type="button"
                  onClick={() => { sounds.playClick(); setLegalModalTab("mentions"); setLegalModalOpen(true); }}
                  className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 text-white font-bold text-xs uppercase mb-1">
                    <IconInfo size={16} className="text-[var(--color-val-red)]" />
                    <span>Mentions Légales & Hébergeurs</span>
                  </div>
                  <p className="text-[11px] text-gray-400">Informations légales, Vercel, Neon DB et Cloudflare.</p>
                </button>

                <button
                  type="button"
                  onClick={() => { sounds.playClick(); setLegalModalTab("privacy"); setLegalModalOpen(true); }}
                  className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 text-white font-bold text-xs uppercase mb-1">
                    <IconLock size={16} className="text-[var(--color-val-red)]" />
                    <span>Confidentialité (RGPD)</span>
                  </div>
                  <p className="text-[11px] text-gray-400">Collecte des données, droits d&apos;accès et suppression.</p>
                </button>

                <button
                  type="button"
                  onClick={() => { sounds.playClick(); setLegalModalTab("riot"); setLegalModalOpen(true); }}
                  className="p-4 rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-500/30 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 text-red-300 font-bold text-xs uppercase mb-1">
                    <IconSword size={14} className="text-red-400" />
                    <span>Règles Riot Games</span>
                  </div>
                  <p className="text-[11px] text-gray-400">Politique officielle &ldquo;Legal Jibber-Jabber&rdquo;.</p>
                </button>
              </div>
            </div>
          )}

          {settingsTab === "about" && (
            <div className="glass-panel rounded-2xl p-4 sm:p-6 md:p-8 space-y-6">
              <div>
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[var(--color-val-red)] text-white">
                  SGS Écosystème
                </span>
                <h3 className="font-bold text-sm sm:text-xl text-[var(--color-text-primary)] mt-2">
                  SGS-Tracker — Valorant Performance Tracker
                </h3>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                  Suivez vos performances Valorant, vos statistiques d&apos;agents, historiques de parties et analyses détaillées avec coaching intelligent.
                </p>
              </div>

              {/* Carte Statut & Version de l'application */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${desktop.isDesktop ? "bg-emerald-400 animate-pulse" : "bg-blue-400"}`}></span>
                      <span className="font-bold text-sm text-[var(--color-text-primary)]">
                        {desktop.isDesktop ? "Application Bureau Windows" : "Version Web / PWA"}
                      </span>
                      <span className="px-2 py-0.2 rounded-md bg-white/10 text-[10px] font-mono font-bold text-gray-300">
                        v{desktop.currentVersion}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                      {desktop.isDesktop
                        ? "Exécution native avec le moteur WebView2 optimisé (~30 Mo RAM)."
                        : "Exécution dans votre navigateur web avec synchronisation cloud."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      desktop.checkForUpdates();
                    }}
                    disabled={desktop.updateStatus === "checking"}
                    className="px-4 py-2 rounded-xl bg-[var(--color-val-red)] hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-accent-sm disabled:opacity-50 flex-shrink-0"
                  >
                    {desktop.updateStatus === "checking" ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Vérification...</span>
                      </>
                    ) : (
                      <>
                        <span>🔄</span>
                        <span>Vérifier les mises à jour</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Résultat du contrôle de mise à jour */}
                {desktop.statusMessage && (
                  <div
                    className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 border ${
                      desktop.updateStatus === "up-to-date"
                        ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                        : desktop.updateStatus === "update-available"
                        ? "bg-amber-950/20 border-amber-500/30 text-amber-300"
                        : desktop.updateStatus === "error"
                        ? "bg-red-950/20 border-red-500/30 text-red-300"
                        : "bg-white/5 border-white/10 text-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>
                        {desktop.updateStatus === "up-to-date" ? "✓" : desktop.updateStatus === "update-available" ? "★" : "ℹ"}
                      </span>
                      <span>{desktop.statusMessage}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playLevelUp();
                        desktop.reloadComponents();
                      }}
                      className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer flex-shrink-0"
                    >
                      Synchroniser
                    </button>
                  </div>
                )}
              </div>

              {/* Spécificités Desktop vs Web */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Serveur en ligne</span>
                  <p className="text-xs font-mono text-gray-300 truncate">
                    {"https://spycam-tan.vercel.app"}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Les composants et les correctifs sont automatiquement récupérés depuis ce serveur.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mises à jour à chaud</span>
                  <p className="text-xs font-bold text-white">Sans réinstallation</p>
                  <p className="text-[11px] text-gray-500">
                    Dès qu&apos;une modification est publiée sur le web, l&apos;application charge directement les nouveaux composants.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-[var(--color-border)]">
            <button
              onClick={handleCancel}
              onMouseEnter={() => sounds.playHover()}
              disabled={loading}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] text-xs sm:text-sm font-bold rounded-xl transition-all border border-[var(--color-border)] disabled:opacity-50 cursor-pointer text-center"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              onMouseEnter={() => sounds.playHover()}
              disabled={loading}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-[var(--color-val-red)] hover:brightness-110 text-[var(--color-accent-contrast,#ffffff)] text-xs sm:text-sm font-bold rounded-xl transition-all shadow-accent-md hover:shadow-accent-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-center"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Enregistrement...</span>
                </>
              ) : (
                "Enregistrer les modifications"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* SGS Centralized Legal Modal */}
      <SgsLegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        defaultTab={legalModalTab}
      />
    </div>
  );
}
