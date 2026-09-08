"use client";

import { Suspense, useState, useEffect, useMemo, useCallback, useRef, useLayoutEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useLanguage, tr, trFormat } from "@/lib/i18n";
import StatCard from "@/components/StatCard";
import SettingsView from "@/components/SettingsView";
import NewsViewComponent from "@/components/NewsViewComponent";
import AgentsWikiComponent from "@/components/AgentsWikiComponent";
import MatchHistory from "@/components/MatchHistory";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import PerformanceCharts from "@/components/PerformanceCharts";
import DashboardGrid from "@/components/DashboardGrid";
import PlayerCardModal from "@/components/PlayerCardModal";
import LeaderboardModal from "@/components/LeaderboardModal";
import MobileAppDrawer from "@/components/MobileAppDrawer";
import { trackPageView } from "@/lib/analytics";
import LandingPage from "@/components/landing/LandingPage";
import { sounds } from "@/lib/soundEffects";
import { IconShare, IconBrain, IconSword } from "@/components/icons/SpyIcons";
import { UserBadges } from "@/components/UserBadges";
import LobbiesView from "@/components/LobbiesView";
import LeaderboardViewComponent from "@/components/LeaderboardViewComponent";
import HotkeysHelpModal from "@/components/HotkeysHelpModal";
import { registerServiceWorker } from "@/lib/pushNotifications";
import FloatingVoiceBar from "@/components/FloatingVoiceBar";
import { VoiceManager } from "@/lib/voiceManager";
import SgsLegalModal from "@/components/SgsLegalModal";
import LoginModal from "@/components/LoginModal";
import PerformanceScoreModal from "@/components/PerformanceScoreModal";
import PerformanceScoreCard from "@/components/PerformanceScoreCard";
import AiCoachModal from "@/components/AiCoachModal";
import { calculatePerformanceScore, detectDominantRole } from "@/lib/valorant/performanceScore";
import type { LobbyItem } from "@/app/api/lobbies/route";
import LocalDevStatsPanel, { type DevStatOverrides } from "@/components/LocalDevStatsPanel";
import ProfileSkeleton from "@/components/ProfileSkeleton";

function DebugPanel({ isOpen, onClose, onGenerate }: any) {
  return null;
}

export function HomeContent({
  initialLobbiesView = false,
  initialLeaderboardView = false,
}: {
  initialLobbiesView?: boolean;
  initialLeaderboardView?: boolean;
} = {}) {
  const { data: realSession, status: realStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSimulatedNewUser = searchParams?.get("simulate") === "true";

  // Guest / Beta Demo Mode — connected to Neon DB temporary user
  const [isGuestMode, setIsGuestMode] = useState<boolean>(false);
  const [guestUser, setGuestUser] = useState<any>(null);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [devOverrides, setDevOverrides] = useState<DevStatOverrides | null>(null);
  const [isLocalhost, setIsLocalhost] = useState<boolean>(false);

  const initGuestSession = useCallback(async (redirectToOnboarding = false) => {
    try {
      const res = await fetch("/api/auth/guest-session", { method: "POST" });
      const data = await res.json();
      if (data.success && data.user) {
        sessionStorage.setItem("spycam_guest_mode", "true");
        sessionStorage.setItem("spycam_guest_id", data.guestId);
        setGuestUser(data.user);
        setIsGuestMode(true);
        if (data.user.theme) setTheme(data.user.theme);
        if (data.user.bannerUrl !== undefined) setBannerUrl(data.user.bannerUrl || "");
        if (data.user.bannerOffsetY !== undefined) setBannerOffsetY(data.user.bannerOffsetY ?? 50);
        if (data.user.isPublic !== undefined) setIsPublic(data.user.isPublic);
        if (data.user.videoLoop !== undefined) setVideoLoop(data.user.videoLoop);
        if (data.user.videoLoopDelay !== undefined) setVideoLoopDelay(data.user.videoLoopDelay);

        if (redirectToOnboarding || !data.user.onboardingDone) {
          router.push("/onboarding");
        }
      }
    } catch (e) {
      console.error("Erreur init guest session:", e);
    }
  }, [router]);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("spycam_guest_mode") === "true") {
      initGuestSession(false);
    }
  }, [initGuestSession]);

  const handleEnterBeta = useCallback(() => {
    initGuestSession(true);
  }, [initGuestSession]);

  const handleExitBeta = useCallback(async () => {
    const guestId = typeof window !== "undefined" ? sessionStorage.getItem("spycam_guest_id") : null;
    if (guestId) {
      try {
        await fetch(`/api/auth/guest-session?guestId=${guestId}`, { method: "DELETE" });
      } catch {}
    }
    sessionStorage.removeItem("spycam_guest_mode");
    sessionStorage.removeItem("spycam_guest_id");
    setIsGuestMode(false);
    setGuestUser(null);
  }, []);

  // Nettoyage automatique du compte Neon quand tous les onglets/pages sont fermés
  useEffect(() => {
    if (!isGuestMode) return;

    const tabKey = "spycam_demo_active_tabs";
    const currentTabs = parseInt(localStorage.getItem(tabKey) || "0", 10) + 1;
    localStorage.setItem(tabKey, currentTabs.toString());

    const handleBeforeUnload = () => {
      const tabs = Math.max(0, parseInt(localStorage.getItem(tabKey) || "1", 10) - 1);
      localStorage.setItem(tabKey, tabs.toString());

      if (tabs === 0) {
        const guestId = sessionStorage.getItem("spycam_guest_id");
        if (guestId) {
          navigator.sendBeacon(`/api/auth/guest-session?guestId=${guestId}`);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isGuestMode]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsLocalhost(
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname.endsWith(".local")
      );
    }
  }, []);

  const simulatedSession = useMemo(
    () => ({
      user: {
        name: "test",
        email: "test@spycam.com",
        onboardingDone: true,
        riotId: null,
        riotPuuid: null,
      },
    }),
    []
  );

  const guestSession = useMemo(
    () => ({
      user: guestUser || {
        id: "temp-guest-id",
        name: "Shadow",
        email: "guest@temp.spycam.gg",
        onboardingDone: true,
        riotId: "Shadow#BETA",
        riotPuuid: "debug-beta-guest-puuid",
        theme: "dark",
        language: "fr",
        firstName: "Invité",
      },
    }),
    [guestUser]
  );

  const isDemo = isSimulatedNewUser || isGuestMode;
  const session = isSimulatedNewUser ? simulatedSession : isGuestMode ? guestSession : realSession;
  const status = isDemo ? ("authenticated" as const) : realStatus;

  const [riotId, setRiotId] = useState("");
  const [myRiotId, setMyRiotId] = useState("");
  const [loading, setLoading] = useState(false);
  const [playerData, setPlayerData] = useState<any>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("performance");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState("features");
  const [debugOpen, setDebugOpen] = useState(false);
  const [newsView, setNewsView] = useState(false);
  const [targetNewsId, setTargetNewsId] = useState<string | null>(null);
  const [agentsView, setAgentsView] = useState(false);
  const [lobbiesView, setLobbiesView] = useState(initialLobbiesView);
  const [leaderboardView, setLeaderboardView] = useState(initialLeaderboardView);
  const [showHotkeysModal, setShowHotkeysModal] = useState(false);
  
  // Profile Tabs Sliding Red Underline State
  const profileTabsContainerRef = useRef<HTMLDivElement>(null);
  const profileTabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [profileUnderlineStyle, setProfileUnderlineStyle] = useState({ left: 0, width: 0, opacity: 0 });

  const updateProfileUnderline = useCallback(() => {
    if (!profileTabsContainerRef.current) return;
    const btn = profileTabRefs.current[activeTab];
    const container = profileTabsContainerRef.current;
    if (!btn || !container) {
      setProfileUnderlineStyle((prev) => ({ ...prev, opacity: 0 }));
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    if (btnRect.width > 0) {
      setProfileUnderlineStyle({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
        opacity: 1,
      });
    }
  }, [activeTab]);

  useLayoutEffect(() => {
    updateProfileUnderline();
    const t = setTimeout(updateProfileUnderline, 50);
    return () => clearTimeout(t);
  }, [activeTab, playerData, updateProfileUnderline]);
  
  // Persistent Global Voice & Lobby State across all page views
  const [activeVoiceLobby, setActiveVoiceLobby] = useState<LobbyItem | null>(null);
  const [isInVoiceGlobal, setIsInVoiceGlobal] = useState<boolean>(false);
  const [isMicMutedGlobal, setIsMicMutedGlobal] = useState<boolean>(false);
  const [isMyVoiceSpeakingGlobal, setIsMyVoiceSpeakingGlobal] = useState<boolean>(false);
  const [voiceVolumeLevelGlobal, setVoiceVolumeLevelGlobal] = useState<number>(0);
  const globalVoiceManagerRef = useRef<VoiceManager | null>(null);

  const [ecoMode, setEcoMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("spycam_eco_mode") === "true";
    }
    return false;
  });
  const { lang: locale, setLanguage: setAppLanguage } = useLanguage();

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

  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Global typing sound on ALL text inputs and textareas across the entire app
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
    return () => window.removeEventListener("keydown", handleGlobalTyping);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).tagName === "INPUT" ||
        (e.target as HTMLElement).tagName === "TEXTAREA" ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // Check if user disabled keyboard shortcuts in settings
      const shortcutsEnabled = typeof window !== "undefined" ? localStorage.getItem("spycam_shortcuts_enabled") !== "false" : true;
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

      if (key === (shortcutsMap.profile || "1").toLowerCase()) {
        sounds.playTabSwitch();
        setAgentsView(false);
        setNewsView(false);
        setLobbiesView(false);
        setLeaderboardView(false);
        setActiveTab("performance");
        pushUrl({ tab: "performance", playerId: myRiotId, isOwnProfile: true });
      } else if (key === (shortcutsMap.agents || "2").toLowerCase()) {
        sounds.playTabSwitch();
        setNewsView(false);
        setLobbiesView(false);
        setLeaderboardView(false);
        setAgentsView(true);
        pushUrl({ view: "agents", playerId: riotId || myRiotId });
      } else if (key === (shortcutsMap.matches || "3").toLowerCase()) {
        sounds.playTabSwitch();
        setAgentsView(false);
        setNewsView(false);
        setLobbiesView(false);
        setLeaderboardView(false);
        setActiveTab("matches");
      } else if (key === (shortcutsMap.lobbies || "4").toLowerCase()) {
        sounds.playTabSwitch();
        setAgentsView(false);
        setNewsView(false);
        setLeaderboardView(false);
        setLobbiesView(true);
        pushUrl({ view: "lobbies", playerId: riotId || myRiotId });
      } else if (key === (shortcutsMap.search || "/").toLowerCase()) {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Rechercher"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      } else if (key === (shortcutsMap.settings || "s").toLowerCase()) {
        sounds.playClick();
        setSettingsOpen((prev) => !prev);
      } else if (key === (shortcutsMap.eco || "e").toLowerCase()) {
        sounds.playClick();
        setEcoMode((prev) => !prev);
      } else if (key === (shortcutsMap.leaderboard || "l").toLowerCase()) {
        sounds.playTabSwitch();
        setAgentsView(false);
        setNewsView(false);
        setLobbiesView(false);
        setLeaderboardView((prev) => !prev);
        pushUrl({ view: "leaderboard", playerId: riotId || myRiotId });
      } else if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        sounds.playClick();
        setSettingsTab("shortcuts");
        setSettingsOpen(true);
      } else if (e.key === "Escape") {
        setSettingsOpen(false);
        setShowHotkeysModal(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // URL Routing Mappings
  const TAB_TO_SLUG: Record<string, string> = useMemo(
    () => ({
      performance: "home",
      agents: "agents-stats",
      matches: "historique",
    }),
    []
  );
  const SLUG_TO_TAB: Record<string, string> = useMemo(
    () => ({
      home: "performance",
      "agents-stats": "agents",
      historique: "matches",
    }),
    []
  );
  const VALID_SLUGS = useMemo(() => ["home", "performance", "historique", "agents", "agents-stats", "actualites", "parametres"], []);

  const riotIdToSlug = useCallback((id: string) => {
    const hashIndex = id.lastIndexOf("#");
    if (hashIndex === -1) return encodeURIComponent(id);
    return encodeURIComponent(id.substring(0, hashIndex) + "-" + id.substring(hashIndex + 1));
  }, []);

  const slugToRiotId = useCallback((slug: string) => {
    const decoded = decodeURIComponent(slug);
    const lastDash = decoded.lastIndexOf("-");
    if (lastDash === -1) return decoded;
    return decoded.substring(0, lastDash) + "#" + decoded.substring(lastDash + 1);
  }, []);

  const pushUrl = useCallback(
    (opts?: {
      tab?: string;
      playerId?: string | null;
      isOwnProfile?: boolean;
      view?: "news" | "agents" | "settings" | "lobbies" | "leaderboard" | null;
      agentSlug?: string | null;
      settingsTab?: string | null;
    }) => {
      const tab = opts?.tab;
      const playerId = opts?.playerId;
      const isOwn = opts?.isOwnProfile ?? false;
      const view = opts?.view;
      const agentSlug = opts?.agentSlug;
      const sTab = opts?.settingsTab;

      let path = "/";

      if (view === "leaderboard") {
        path = "/leaderboard";
      } else if (view === "lobbies") {
        path = "/salons";
      } else if (view === "news") {
        path = isOwn || !playerId ? "/actualites" : `/${riotIdToSlug(playerId)}/actualites`;
      } else if (view === "agents") {
        if (agentSlug) {
          path = isOwn || !playerId ? `/agents/${agentSlug}` : `/${riotIdToSlug(playerId)}/agents/${agentSlug}`;
        } else {
          path = isOwn || !playerId ? "/agents" : `/${riotIdToSlug(playerId)}/agents`;
        }
      } else if (view === "settings") {
        path = sTab ? `/parametres/${sTab}` : "/parametres";
      } else if (tab) {
        const slug = TAB_TO_SLUG[tab] || tab;
        if (isOwn || !playerId) {
          path = slug === "home" && !isOwn && !playerId ? "/home" : `/home/${slug}`;
          if (slug === "home" && isOwn) path = "/home";
        } else {
          path = `/${riotIdToSlug(playerId)}/home/${slug}`;
          if (slug === "home") path = `/${riotIdToSlug(playerId)}/home`;
        }
      } else {
        if (isOwn || !playerId) {
          path = "/home";
        } else {
          path = `/${riotIdToSlug(playerId)}/home`;
        }
      }

      if (window.location.pathname !== path) {
        window.history.pushState(null, "", path);
      }

      const pageTitle = view === "leaderboard" ? "Classement Valorant"
        : view === "lobbies" ? "Salons LFG & Vocal"
        : view === "news" ? "Actualités & Patchs"
        : view === "agents" ? "Agents & Guides"
        : view === "settings" ? "Profil & Paramètres"
        : tab === "maps" ? "Cartes & Lineups"
        : "Accueil / Live Tracker";
      trackPageView(pageTitle, path);
    },
    [riotIdToSlug, TAB_TO_SLUG]
  );

  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [gameMode, setGameMode] = useState("all");
  const [selectedSeason, setSelectedSeason] = useState("all");
  const [visibleMatchesCount, setVisibleMatchesCount] = useState(10);

  // Game Mode Tabs Sliding Red Capsule State (All, Competitive, Unrated, Others)
  const gameModeContainerRef = useRef<HTMLDivElement>(null);
  const gameModeBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [gameModePillStyle, setGameModePillStyle] = useState({ left: 0, width: 0, opacity: 0 });

  const updateGameModePill = useCallback(() => {
    if (!gameModeContainerRef.current) return;
    const btn = gameModeBtnRefs.current[gameMode];
    const container = gameModeContainerRef.current;
    if (!btn || !container) {
      setGameModePillStyle((prev) => ({ ...prev, opacity: 0 }));
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    if (btnRect.width > 0) {
      setGameModePillStyle({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
        opacity: 1,
      });
    }
  }, [gameMode]);

  useLayoutEffect(() => {
    updateGameModePill();
    const t1 = setTimeout(updateGameModePill, 40);
    const t2 = setTimeout(updateGameModePill, 120);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [gameMode, playerData, updateGameModePill]);

  const availableSeasons = useMemo(() => {
    if (!playerData?.player?.matchHistory) return [];
    const seasons = new Set<string>();
    playerData.player.matchHistory.forEach((m: any) => {
      if (m.season) seasons.add(m.season);
    });
    return Array.from(seasons).sort((a: any, b: any) => b.localeCompare(a));
  }, [playerData]);

  // Settings State
  const [smartRating, setSmartRating] = useState(true);
  const [theme, setTheme] = useState("dark");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerOffsetY, setBannerOffsetY] = useState(50);
  const [isPublic, setIsPublic] = useState(true);
  const [videoLoop, setVideoLoop] = useState(true);
  const [videoLoopDelay, setVideoLoopDelay] = useState(500);
  const [hiddenStats, setHiddenStats] = useState<string[]>([]);
  const [enforcePublicStats, setEnforcePublicStats] = useState(false);

  // New Features State
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
  const [showLeaderboardModal, setShowLeaderboardModal] = useState<boolean>(false);
  const [showCardModal, setShowCardModal] = useState<boolean>(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState<boolean>(false);
  const [showLegalModal, setShowLegalModal] = useState<boolean>(false);
  const [legalModalTab, setLegalModalTab] = useState<"cgu" | "mentions" | "privacy" | "riot">("cgu");
  const [showPerformanceModal, setShowPerformanceModal] = useState<boolean>(false);
  const [showCoachModal, setShowCoachModal] = useState<boolean>(false);

  const toggleFullscreen = () => {
    if (typeof document !== "undefined") {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Favorites State
  const [favorites, setFavorites] = useState<Array<{ riotId: string; gameName: string; tagLine: string; cardUrl: string }>>([]);

  const favoritesKey = session?.user?.email ? `spycam-favorites-${session.user.email}` : "spycam-favorites";

  useEffect(() => {
    try {
      const stored = localStorage.getItem(favoritesKey);
      if (stored) {
        setFavorites(JSON.parse(stored));
      } else {
        setFavorites([]);
      }
    } catch {}
  }, [favoritesKey]);

  const saveFavorites = (newFavs: typeof favorites) => {
    setFavorites(newFavs);
    try {
      localStorage.setItem(favoritesKey, JSON.stringify(newFavs));
    } catch {}
  };

  const toggleFavorite = (player: any) => {
    const id = `${player.gameName}#${player.tagLine}`;
    const exists = favorites.some((f) => f.riotId === id);
    if (exists) {
      saveFavorites(favorites.filter((f) => f.riotId !== id));
    } else {
      saveFavorites([
        ...favorites,
        {
          riotId: id,
          gameName: player.gameName,
          tagLine: player.tagLine,
          cardUrl: player.cardUrl || "",
        },
      ]);
    }
  };

  const isFavorited = (gameName: string, tagLine: string) => {
    return favorites.some((f) => f.riotId === `${gameName}#${tagLine}`);
  };

  const getDevKeyHeader = useCallback((): Record<string, string> => {
    if (typeof window !== "undefined") {
      const k = localStorage.getItem("spycam_riot_dev_key");
      if (k) return { "x-riot-dev-key": k };
    }
    return {};
  }, []);

  const handleRiotKeyChange = useCallback((newKey: string | null) => {
    const targetId = riotId || myRiotId || "Corbac#EU1";
    setLoading(true);
    setError("");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (newKey) headers["x-riot-dev-key"] = newKey;
    fetch("/api/valorant/player", {
      method: "POST",
      headers,
      body: JSON.stringify({ riotId: targetId }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setPlayerData(d);
      })
      .catch(() => setError("Serveur inaccessible."))
      .finally(() => setLoading(false));
  }, [riotId, myRiotId]);

  const goHome = () => {
    if (myRiotId) {
      setRiotId(myRiotId);
      setLoading(true);
      setError("");
      setPlayerData(null);
      pushUrl({ tab: activeTab, playerId: myRiotId, isOwnProfile: true });
      fetch("/api/valorant/player", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getDevKeyHeader() },
        body: JSON.stringify({ riotId: myRiotId }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.error) setError(d.error);
          else setPlayerData(d);
        })
        .catch(() => setError("Serveur inaccessible."))
        .finally(() => setLoading(false));
    }
  };

  const searchPlayer = (searchId: string) => {
    const isOwn = myRiotId && searchId.toLowerCase() === myRiotId.toLowerCase();
    setRiotId(searchId);
    setLoading(true);
    setError("");
    setPlayerData(null);
    pushUrl({ tab: activeTab, playerId: searchId, isOwnProfile: !!isOwn });
    fetch("/api/valorant/player", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getDevKeyHeader() },
      body: JSON.stringify({ riotId: searchId }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setPlayerData(d);
      })
      .catch(() => setError("Serveur inaccessible."))
      .finally(() => setLoading(false));
  };

  const canEditProfile =
    isGuestMode ||
    (!isSimulatedNewUser &&
      (playerData?.player?.puuid?.startsWith("debug-") ||
        (session?.user?.email === "laffont.romain64@gmail.com" && playerData?.player?.gameName === "Gr4phØ") ||
        (session?.user?.email === "spycam_riot_temp@gmail.com" && playerData?.player?.gameName?.toLowerCase() === "riot_test") ||
        (session?.user?.email === "romain.lft64@gmail.com" && playerData?.player?.gameName?.toLowerCase() === "biflette64") ||
        ((session?.user as any)?.riotPuuid && (session?.user as any)?.riotPuuid === playerData?.player?.puuid)));

  // Auth redirect & Initial fetch
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated" && !isDemo) {
      // Unauthenticated visitors see the Landing Page on /
      return;
    } else if (status === "authenticated" && session?.user) {
      const user = session.user as any;
      if (!user.onboardingDone && !isDemo) {
        router.replace("/onboarding");
      } else {
        if (user.theme) setTheme(user.theme);
        if (user.smartRating !== undefined) setSmartRating(user.smartRating);
        if (user.bannerUrl !== undefined) setBannerUrl(user.bannerUrl || "");
        if (user.bannerOffsetY !== undefined) setBannerOffsetY(user.bannerOffsetY ?? 50);
        if (user.isPublic !== undefined) setIsPublic(user.isPublic);
        if (user.videoLoop !== undefined) setVideoLoop(user.videoLoop);
        if (user.videoLoopDelay !== undefined) setVideoLoopDelay(user.videoLoopDelay);
        if (user.hiddenStats !== undefined) {
          try {
            setHiddenStats(JSON.parse(user.hiddenStats));
          } catch {}
        }
        if (user.enforcePublicStats !== undefined) setEnforcePublicStats(user.enforcePublicStats);
        if (user.language) {
          setAppLanguage(user.language);
        }

        if (!playerData && !loading) {
          let initialRiotId = user.riotId;

          if (!isDemo && user.email === "laffont.romain64@gmail.com") {
            initialRiotId = "Gr4phØ#0001";
          } else if (!isDemo && user.email === "spycam_riot_temp@gmail.com") {
            initialRiotId = "riot_test#TEST";
          } else if (!isDemo && user.email === "romain.lft64@gmail.com") {
            initialRiotId = "biflette64#1294";
          } else if (isGuestMode) {
            initialRiotId = "Shadow#BETA";
          }

          if (initialRiotId) setMyRiotId(initialRiotId);
          if (isSimulatedNewUser) initialRiotId = null;

          const pathname = window.location.pathname;
          const segments = pathname.split("/").filter(Boolean);
          let urlRiotId: string | null = null;
          let urlTab: string | null = null;
          let urlView: "news" | "agents" | "settings" | "lobbies" | "leaderboard" | null = null;
          let uAgentSlug: string | null = null;
          let uSettingsTab: string | null = null;

          if (segments.length > 0) {
            if (segments[0] === "salons") {
              urlView = "lobbies";
            } else if (segments[0] === "leaderboard") {
              urlView = "leaderboard";
            } else if (segments[0] === "actualites") {
              urlView = "news";
            } else if (segments[0] === "agents") {
              urlView = "agents";
              if (segments[1]) uAgentSlug = segments[1];
            } else if (segments[0] === "parametres") {
              urlView = "settings";
              if (segments[1]) uSettingsTab = segments[1];
            } else if (segments[0] === "home") {
              if (segments[1] && SLUG_TO_TAB[segments[1]]) {
                urlTab = SLUG_TO_TAB[segments[1]];
              } else {
                urlTab = "performance";
              }
            } else {
              urlRiotId = slugToRiotId(segments[0]);
              if (segments[1] === "salons") {
                urlView = "lobbies";
              } else if (segments[1] === "leaderboard") {
                urlView = "leaderboard";
              } else if (segments[1] === "actualites") {
                urlView = "news";
              } else if (segments[1] === "agents") {
                urlView = "agents";
                if (segments[2]) uAgentSlug = segments[2];
              } else if (segments[1] === "parametres") {
                urlView = "settings";
                if (segments[2]) uSettingsTab = segments[2];
              } else if (segments[1] === "home") {
                if (segments[2] && SLUG_TO_TAB[segments[2]]) {
                  urlTab = SLUG_TO_TAB[segments[2]];
                } else {
                  urlTab = "performance";
                }
              }
            }
          }

          if (urlView === "lobbies") setLobbiesView(true);
          else if (urlView === "leaderboard") setLeaderboardView(true);
          else if (urlView === "news") setNewsView(true);
          else if (urlView === "agents") setAgentsView(true);
          else if (urlView === "settings") {
            setSettingsOpen(true);
            if (uSettingsTab) setSettingsTab(uSettingsTab);
          }
          if (urlTab) setActiveTab(urlTab);

          const targetRiotId = urlRiotId || initialRiotId;

          if (targetRiotId) {
            setRiotId(targetRiotId);
            setLoading(true);
            setError("");
            setPlayerData(null);
            const isOwn = initialRiotId && targetRiotId.toLowerCase() === initialRiotId.toLowerCase();
            if (pathname === "/" || pathname === "") {
              pushUrl({ tab: urlTab || "performance", playerId: targetRiotId, isOwnProfile: !!isOwn });
            }
            fetch("/api/valorant/player", {
              method: "POST",
              headers: { "Content-Type": "application/json", ...getDevKeyHeader() },
              body: JSON.stringify({ riotId: targetRiotId }),
            })
              .then((r) => r.json())
              .then((d) => {
                if (d.error) setError(d.error);
                else setPlayerData(d);
              })
              .catch(() => setError("Serveur inaccessible."))
              .finally(() => setLoading(false));
          }
        }
      }
    }
  }, [status, isSimulatedNewUser]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname;
      const segments = pathname.split("/").filter(Boolean);

      setNewsView(false);
      setAgentsView(false);
      setSettingsOpen(false);
      setLobbiesView(false);
      setLeaderboardView(false);

      if (segments.length === 0) {
        if (myRiotId) searchPlayer(myRiotId);
        setActiveTab("performance");
        return;
      }

      let urlRiotId: string | null = null;
      let urlTab: string | null = null;

      if (segments[0] === "salons") {
        setLobbiesView(true);
      } else if (segments[0] === "leaderboard") {
        setLeaderboardView(true);
      } else if (segments[0] === "actualites") {
        setNewsView(true);
      } else if (segments[0] === "agents") {
        setAgentsView(true);
      } else if (segments[0] === "parametres") {
        setSettingsOpen(true);
        if (segments[1]) setSettingsTab(segments[1]);
      } else if (segments[0] === "home") {
        if (segments[1] && SLUG_TO_TAB[segments[1]]) {
          urlTab = SLUG_TO_TAB[segments[1]];
        } else {
          urlTab = "performance";
        }
      } else {
        urlRiotId = slugToRiotId(segments[0]);
        if (segments[1] === "salons") {
          setLobbiesView(true);
        } else if (segments[1] === "leaderboard") {
          setLeaderboardView(true);
        } else if (segments[1] === "actualites") {
          setNewsView(true);
        } else if (segments[1] === "agents") {
          setAgentsView(true);
        } else if (segments[1] === "parametres") {
          setSettingsOpen(true);
        } else if (segments[1] === "home") {
          if (segments[2] && SLUG_TO_TAB[segments[2]]) {
            urlTab = SLUG_TO_TAB[segments[2]];
          } else {
            urlTab = "performance";
          }
        }
      }

      if (urlTab) setActiveTab(urlTab);

      if (urlRiotId && urlRiotId !== riotId) {
        setRiotId(urlRiotId);
        setLoading(true);
        setError("");
        setPlayerData(null);
        fetch("/api/valorant/player", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getDevKeyHeader() },
          body: JSON.stringify({ riotId: urlRiotId }),
        })
          .then((r) => r.json())
          .then((d) => {
            if (d.error) setError(d.error);
            else setPlayerData(d);
          })
          .catch(() => setError("Serveur inaccessible."))
          .finally(() => setLoading(false));
      } else if (!urlRiotId && myRiotId && riotId !== myRiotId) {
        searchPlayer(myRiotId);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [myRiotId, riotId, VALID_SLUGS, SLUG_TO_TAB, slugToRiotId, locale]);

  const rawMatches = useMemo(() => {
    return (playerData?.matchHistory || playerData?.player?.matchHistory || []) as any[];
  }, [playerData]);

  const rawAgentStats = useMemo(() => {
    return (playerData?.agentStats || playerData?.player?.agentStats || []) as any[];
  }, [playerData]);

  const rawStats = useMemo(() => {
    return (playerData?.stats || playerData?.player?.stats || null) as any;
  }, [playerData]);

  const filteredMatches = useMemo(() => {
    if (!rawMatches || rawMatches.length === 0) return [];
    return rawMatches.filter((m: any) => {
      const modeMatch =
        gameMode === "all" ||
        (gameMode === "competitive" && m.mode === "competitive") ||
        (gameMode === "unrated" && m.mode === "unrated") ||
        (gameMode === "other" && m.mode !== "competitive" && m.mode !== "unrated");

      const seasonMatch = selectedSeason === "all" || m.season === selectedSeason;
      return modeMatch && seasonMatch;
    });
  }, [rawMatches, gameMode, selectedSeason]);

  const filteredAgents = useMemo(() => {
    if (!rawAgentStats || rawAgentStats.length === 0) return [];
    if (gameMode === "all" && selectedSeason === "all") return rawAgentStats;

    const counts: Record<string, any> = {};
    filteredMatches.forEach((m: any) => {
      if (!counts[m.agent]) counts[m.agent] = { games: 0, wins: 0, kills: 0, deaths: 0, hoursPlayed: 0, icon: m.agentIcon };
      counts[m.agent].games++;
      if (m.won) counts[m.agent].wins++;
      counts[m.agent].kills += m.kills;
      counts[m.agent].deaths += m.deaths;
      counts[m.agent].hoursPlayed += (m.duration || 0) / 3600;
    });

    return Object.keys(counts)
      .map((name) => {
        const data = counts[name];
        const orig = rawAgentStats.find((a: any) => a.name === name);
        return {
          name,
          role: orig?.role || "Agent",
          icon: data.icon,
          games: data.games,
          winRate: Math.round((data.wins / data.games) * 100),
          kd: parseFloat((data.kills / Math.max(data.deaths, 1)).toFixed(2)),
          hoursPlayed: parseFloat(data.hoursPlayed.toFixed(1)),
        };
      })
      .sort((a: any, b: any) => b.games - a.games);
  }, [rawAgentStats, gameMode, selectedSeason, filteredMatches]);

  const filteredStats = useMemo(() => {
    if (!rawStats) return null;
    if (gameMode === "all" && selectedSeason === "all") return rawStats;

    const matches = filteredMatches;
    if (matches.length === 0)
      return {
        ...rawStats,
        kills: 0,
        deaths: 0,
        assists: 0,
        kdRatio: 0,
        winRate: 0,
        matchesPlayed: 0,
        acs: 0,
        headshotPct: 0,
        aceCount: 0,
      };

    const totalKills = matches.reduce((sum: number, m: any) => sum + m.kills, 0);
    const totalDeaths = matches.reduce((sum: number, m: any) => sum + m.deaths, 0);
    const totalAssists = matches.reduce((sum: number, m: any) => sum + m.assists, 0);
    const wins = matches.filter((m: any) => m.won).length;
    const totalHS = matches.reduce((sum: number, m: any) => sum + (m.headshots || 0), 0);
    const totalShots = matches.reduce((sum: number, m: any) => sum + (m.headshots || 0) + (m.bodyshots || 0) + (m.legshots || 0), 0);
    const totalAces = matches.reduce((sum: number, m: any) => sum + (m.aces || 0), 0);

    return {
      ...rawStats,
      kills: totalKills,
      deaths: totalDeaths,
      assists: totalAssists,
      kdRatio: parseFloat((totalKills / Math.max(totalDeaths, 1)).toFixed(2)),
      winRate: Math.round((wins / matches.length) * 100),
      matchesPlayed: matches.length,
      acs: Math.round(matches.reduce((sum: number, m: any) => sum + m.acs, 0) / matches.length),
      headshotPct: totalShots > 0 ? parseFloat(((totalHS / totalShots) * 100).toFixed(1)) : rawStats.headshotPct,
      aceCount: totalAces,
    };
  }, [rawStats, gameMode, selectedSeason, filteredMatches]);

  const isSearchingOther = Boolean(riotId && myRiotId && riotId.toLowerCase() !== myRiotId.toLowerCase());
  const activeDevOverrides = isSearchingOther ? null : devOverrides;

  const dominantRole = useMemo(() => {
    if (activeDevOverrides && activeDevOverrides.enabled && activeDevOverrides.role !== "Auto") {
      return activeDevOverrides.role;
    }
    return detectDominantRole(filteredAgents);
  }, [filteredAgents, activeDevOverrides]);

  const effectiveStats = useMemo(() => {
    const s = filteredStats || rawStats;
    if (activeDevOverrides && activeDevOverrides.enabled) {
      const deaths = s?.deaths || 100;
      return {
        ...(s || {}),
        kdRatio: activeDevOverrides.kd,
        kills: Math.round(activeDevOverrides.kd * deaths),
        deaths,
        assists: s?.assists || 40,
        acs: activeDevOverrides.acs,
        headshotPct: activeDevOverrides.hs,
        winRate: activeDevOverrides.winRate,
        kast: activeDevOverrides.kast,
        adr: activeDevOverrides.adr,
        ddDelta: activeDevOverrides.dd,
        matchesPlayed: activeDevOverrides.matchesCount,
      };
    }
    return s;
  }, [filteredStats, rawStats, activeDevOverrides]);

  const effectiveMatches = useMemo(() => {
    if (activeDevOverrides && activeDevOverrides.enabled) {
      return Array.from({ length: activeDevOverrides.matchesCount }).map((_, i) => ({
        firstBloods: activeDevOverrides.firstBloods,
        clutches: i < activeDevOverrides.clutches ? 1 : 0,
        won: i < (activeDevOverrides.matchesCount * (activeDevOverrides.winRate / 100)),
        kills: Math.round(activeDevOverrides.kd * 15),
        deaths: 15,
        acs: activeDevOverrides.acs,
      }));
    }
    return filteredMatches;
  }, [filteredMatches, activeDevOverrides]);

  const performanceScoreResult = useMemo(() => {
    const s = effectiveStats;
    if (!s) return null;
    const playerTier = playerData?.rankTier ?? playerData?.player?.rankTier ?? (activeDevOverrides?.enabled ? 21 : 0);
    const rankName = playerData?.rank || playerData?.player?.rank || "Non classé";
    const accountLevel = playerData?.level ?? playerData?.player?.level ?? playerData?.player?.accountLevel ?? 1;
    return calculatePerformanceScore(s, effectiveMatches, dominantRole, playerTier, { rankName, accountLevel });
  }, [effectiveStats, effectiveMatches, dominantRole, playerData, activeDevOverrides]);

  // Apply logged-in user's theme to body
  useEffect(() => {
    document.body.classList.remove("theme-light", "theme-midnight", "theme-crimson", "theme-ocean", "theme-custom");
    document.documentElement.style.removeProperty("--custom-bg");
    document.documentElement.style.removeProperty("--custom-accent");

    if (theme !== "dark" && !theme?.startsWith("custom:")) {
      document.body.classList.add(`theme-${theme}`);
    } else if (theme?.startsWith("custom:")) {
      document.body.classList.add("theme-custom");
      const matchBg = theme.match(/bg=([^,]+)/);
      const matchAccent = theme.match(/accent=([^,]+)/);
      if (matchBg) document.documentElement.style.setProperty("--custom-bg", matchBg[1]);
      if (matchAccent) document.documentElement.style.setProperty("--custom-accent", matchAccent[1]);
    }
  }, [theme]);

  useEffect(() => {
    const ep = searchParams?.get("error");
    if (ep) setError(ep === "missing_credentials" ? "Client ID RSO manquant." : ep === "token_exchange_failed" ? "Échec token Riot." : "Erreur connexion.");
    if (searchParams?.get("loggedIn") === "true") fetchMyData();

    // Support direct URL navigation: ?view=lobbies, ?view=agents, ?view=news
    const viewParam = searchParams?.get("view");
    if (viewParam === "lobbies") {
      setLobbiesView(true);
      setNewsView(false);
      setAgentsView(false);
    } else if (viewParam === "agents") {
      setAgentsView(true);
      setNewsView(false);
      setLobbiesView(false);
    } else if (viewParam === "news") {
      setNewsView(true);
      setAgentsView(false);
      setLobbiesView(false);
    }
  }, [searchParams]);

  const fetchMyData = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/auth/me");
      const d = await r.json();
      if (!r.ok) setError(d.error);
      else setPlayerData(d);
    } catch {
      setError("Session invalide.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setPlayerData(null);
    const isOwn = myRiotId && riotId.toLowerCase() === myRiotId.toLowerCase();

    setNewsView(false);
    setAgentsView(false);
    setSettingsOpen(false);
    pushUrl({ tab: "performance", playerId: riotId, isOwnProfile: !!isOwn });
    try {
      const r = await fetch("/api/valorant/player", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getDevKeyHeader() },
        body: JSON.stringify({ riotId }),
      });
      const d = await r.json();
      if (!r.ok) setError(d.error);
      else setPlayerData(d);
    } catch {
      setError("Serveur inaccessible.");
    } finally {
      setLoading(false);
    }
  };

  const handleDebugGenerate = async () => {
    setLoading(true);
    setError("");
    setPlayerData(null);
    try {
      const r = await fetch("/api/valorant/player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ debug: true }),
      });
      const d = await r.json();
      if (!r.ok) setError(d.error);
      else setPlayerData(d);
    } catch {
      setError("Erreur debug.");
    } finally {
      setLoading(false);
    }
  };

  const getWarnings = (s: any) => {
    if (!s) return {};
    const w: Record<string, string> = {};
    if (s.kdRatio < 1) w.kd = trFormat("K/D de {kd} — en dessous de 1.0. Vous mourez plus que vous ne tuez. Travaillez le positionnement.", { kd: s.kdRatio });
    if (s.headshotPct < 20) w.hs = trFormat("Headshot à {hs}% — sous la moyenne de 20%. Travaillez le crosshair placement.", { hs: s.headshotPct });
    if (s.winRate < 50) w.wr = trFormat("Win rate de {wr}% — sous 50%. Adaptez vos stratégies et communiquez.", { wr: s.winRate });
    if (s.acs < 200) w.acs = trFormat("ACS de {acs} — sous 200. Participez davantage aux rounds.", { acs: s.acs });
    if (s.kast < 65) w.kast = trFormat("KAST de {kast}% — sous 65%. Impliquez-vous plus (Kill/Assist/Survived/Trade).", { kast: s.kast });
    if (s.ddDelta < 0) w.dd = trFormat("DDΔ négatif ({dd}) — vous subissez plus de dégâts que vous n'en infligez.", { dd: s.ddDelta });
    return w;
  };

  // Keyboard shortcut for debug
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        setDebugOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (status === "loading") {
    return (
      <main className="flex-1 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-5">
          <img
            src="/sgs-icon.jpg"
            alt="SGS Logo"
            className="w-16 h-16 object-cover rounded-2xl animate-pulse drop-shadow-[0_0_30px_rgba(255,70,85,0.7)]"
          />
          <p className="text-[var(--color-text-secondary)] uppercase tracking-widest text-xs font-black">
            Chargement...
          </p>
        </div>
      </main>
    );
  }

  // Unauthenticated visitors without demo mode see the Landing Page
  if (status === "unauthenticated" && !isDemo) {
    return (
      <>
        <LandingPage onEnterBeta={handleEnterBeta} onOpenLogin={() => setLoginModalOpen(true)} />
        <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
      </>
    );
  }

  return (
    <>
      {/* Guest / Beta Demo Top Banner */}
      {isGuestMode && (
        <div className="bg-gradient-to-r from-[var(--color-val-red)]/20 via-black/80 to-[var(--color-val-red)]/20 border-b border-[var(--color-val-red)]/40 px-4 py-2 flex items-center justify-between text-xs backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-val-red)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-val-red)]"></span>
            </span>
            <span className="font-black uppercase tracking-wider text-white">Mode Bêta Démo Actif</span>
            <span className="hidden sm:inline text-white/60 text-[11px]">— Session temporaire avec profil de démonstration</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLoginModalOpen(true)}
              className="px-3 py-1 rounded-full bg-[var(--color-val-red)] hover:bg-[#ff5865] text-white font-bold text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
            >
              Créer un compte / Se connecter
            </button>
            <button
              onClick={handleExitBeta}
              className="text-white/60 hover:text-white text-[11px] font-bold uppercase transition-colors cursor-pointer"
            >
              Quitter la démo ✕
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col relative overflow-hidden min-h-screen pb-28 md:pb-16">
        <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--color-val-red)] opacity-10 blur-[120px] rounded-full pointer-events-none"></div>
        <DebugPanel isOpen={debugOpen} onClose={() => setDebugOpen(false)} onGenerate={handleDebugGenerate} />

        {/* Top Header */}
        <Header
          session={session}
          riotId={riotId}
          setRiotId={setRiotId}
          myRiotId={myRiotId}
          onSearch={handleSearch}
          newsView={newsView}
          agentsView={agentsView}
          lobbiesView={lobbiesView}
          settingsOpen={settingsOpen}
          onOpenLeaderboard={() => {
            setLeaderboardView(true);
            setLobbiesView(false);
            setNewsView(false);
            setAgentsView(false);
            setSettingsOpen(false);
            const isOwn = myRiotId && riotId.toLowerCase() === myRiotId.toLowerCase();
            pushUrl({ view: "leaderboard", playerId: riotId || myRiotId, isOwnProfile: !!isOwn });
          }}
          leaderboardOpen={leaderboardView}
          onGoHome={() => {
            setNewsView(false);
            setAgentsView(false);
            setLobbiesView(false);
            setLeaderboardView(false);
            setSettingsOpen(false);
            goHome();
            pushUrl({ tab: "performance", playerId: myRiotId, isOwnProfile: true });
          }}
          onOpenNews={(newsId) => {
            setNewsView(true);
            setAgentsView(false);
            setLobbiesView(false);
            setLeaderboardView(false);
            setSettingsOpen(false);
            if (newsId) setTargetNewsId(newsId);
            else setTargetNewsId(null);
            const isOwn = myRiotId && riotId.toLowerCase() === myRiotId.toLowerCase();
            pushUrl({ view: "news", playerId: riotId || myRiotId, isOwnProfile: !!isOwn });
          }}
          onOpenAgents={() => {
            setAgentsView(true);
            setNewsView(false);
            setLobbiesView(false);
            setLeaderboardView(false);
            setSettingsOpen(false);
            const isOwn = myRiotId && riotId.toLowerCase() === myRiotId.toLowerCase();
            pushUrl({ view: "agents", playerId: riotId || myRiotId, isOwnProfile: !!isOwn });
          }}
          onOpenLobbies={() => {
            setLobbiesView(true);
            setNewsView(false);
            setAgentsView(false);
            setLeaderboardView(false);
            setSettingsOpen(false);
            const isOwn = myRiotId && riotId.toLowerCase() === myRiotId.toLowerCase();
            pushUrl({ view: "lobbies", playerId: riotId || myRiotId, isOwnProfile: !!isOwn });
          }}
          onOpenHotkeys={() => setShowHotkeysModal(true)}
          onToggleSettings={() => {
            const newVal = !settingsOpen;
            setSettingsOpen(newVal);
            if (newVal) {
              pushUrl({ view: "settings" });
            } else {
              const isOwn = myRiotId && riotId.toLowerCase() === myRiotId.toLowerCase();
              pushUrl({ tab: activeTab, playerId: riotId || myRiotId, isOwnProfile: !!isOwn });
            }
          }}
          favorites={favorites}
          onSelectFavorite={searchPlayer}
          onRemoveFavorite={toggleFavorite}
          activeGameName={playerData?.player?.gameName}
          playerStats={playerData?.player?.stats}
        />

        {/* Dynamic Views */}
        {settingsOpen ? (
          <div key="settings" className="animate-page-in w-full">
          <SettingsView
            onClose={() => setSettingsOpen(false)}
            smartRating={smartRating}
            setSmartRating={setSmartRating}
            theme={theme}
            setTheme={setTheme}
            bannerUrl={bannerUrl}
            setBannerUrl={setBannerUrl}
            bannerOffsetY={bannerOffsetY}
            setBannerOffsetY={setBannerOffsetY}
            isPublic={isPublic}
            setIsPublic={setIsPublic}
            videoLoop={videoLoop}
            setVideoLoop={setVideoLoop}
            videoLoopDelay={videoLoopDelay}
            setVideoLoopDelay={setVideoLoopDelay}
            hiddenStats={hiddenStats}
            setHiddenStats={setHiddenStats}
            enforcePublicStats={enforcePublicStats}
            setEnforcePublicStats={setEnforcePublicStats}
            hiddenBadges={hiddenBadges}
            setHiddenBadges={setHiddenBadges}
            showBadge={showBadgeState}
            setShowBadge={setShowBadgeState}
            p={playerData?.player}
            canEditProfile={canEditProfile}
            settingsTab={settingsTab}
            setSettingsTab={setSettingsTab}
            pushUrl={pushUrl}
            locale={locale}
            streamerMode={streamerMode}
            setStreamerMode={setStreamerMode}
          />
          </div>
        ) : leaderboardView ? (
          <div key="leaderboard" className="animate-page-in w-full">
          <LeaderboardViewComponent
            onSelectPlayer={(id) => {
              setLeaderboardView(false);
              searchPlayer(id);
            }}
          />
          </div>
        ) : lobbiesView ? (
          <div key="lobbies" className="animate-page-in flex-1 flex flex-col items-center px-1 sm:px-3 md:px-6 z-10 w-full max-w-[1750px] mx-auto min-h-[calc(100vh-90px)]">
            <LobbiesView
              playerData={playerData?.player || playerData}
              isPublic={isPublic}
              onUpdateIsPublic={setIsPublic}
              activeLobby={activeVoiceLobby}
              setActiveLobby={setActiveVoiceLobby}
              isInVoice={isInVoiceGlobal}
              setIsInVoice={setIsInVoiceGlobal}
              isMicMuted={isMicMutedGlobal}
              setIsMicMuted={setIsMicMutedGlobal}
              isMyVoiceSpeaking={isMyVoiceSpeakingGlobal}
              setIsMyVoiceSpeaking={setIsMyVoiceSpeakingGlobal}
              voiceVolumeLevel={voiceVolumeLevelGlobal}
              setVoiceVolumeLevel={setVoiceVolumeLevelGlobal}
              voiceManagerRef={globalVoiceManagerRef}
              onSelectPlayer={(id) => {
                setLobbiesView(false);
                searchPlayer(id);
              }}
            />
          </div>
        ) : newsView && !agentsView ? (
          <div key="news" className="animate-page-in w-full">
            <NewsViewComponent newsItems={newsItems} setNewsItems={setNewsItems} targetNewsId={targetNewsId} />
          </div>
        ) : agentsView && !newsView ? (
          <div key="agents" className="animate-page-in w-full">
            <AgentsWikiComponent videoLoop={videoLoop} videoLoopDelay={videoLoopDelay} locale={locale} pushUrl={pushUrl} />
          </div>
        ) : (
          <div className="animate-page-in flex-1 flex flex-col items-center px-4 sm:px-8 z-10 w-full max-w-6xl mx-auto">
            {error &&
              (error.includes("privé") ? (
                <div className="glass-panel rounded-2xl p-10 flex flex-col items-center text-center max-w-lg mb-6 animate-in fade-in duration-500">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff4655" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-widest text-[var(--color-text-primary)] mb-2">Profil Privé</h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{error}</p>
                </div>
              ) : (
                <div className="bg-red-500/20 border border-red-500 text-red-200 px-6 py-3 rounded-lg mb-6 text-center max-w-lg">{error}</div>
              ))}

            {loading && (
              <ProfileSkeleton />
            )}

            {!playerData && !loading && (
              <div className="flex flex-col items-center justify-center mt-20 text-center animate-in fade-in duration-700">
                <div className="w-24 h-24 rounded-3xl mb-8 overflow-hidden shadow-[0_0_40px_rgba(255,70,85,0.3)] ring-2 ring-[var(--color-val-red)]/40">
                  <img src="/sgs-icon.jpg" alt="SGS Logo" className="w-full h-full object-cover scale-[1.15]" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Bienvenue sur SGS-Tracker</h2>
                <p className="text-[var(--color-text-secondary)] mb-8 max-w-md">Recherchez un joueur ou connectez-vous via RSO.</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-6 opacity-50">Debug : Double-cliquez sur le logo ou Ctrl+Shift+D</p>
              </div>
            )}

            {playerData &&
              (() => {
                const p = {
                  ...playerData.player,
                  ...playerData,
                  gameName: playerData.player?.gameName || playerData.gameName || "Joueur",
                  tagLine: playerData.player?.tagLine || playerData.tagLine || "EU1",
                  stats: effectiveStats,
                  agentStats: filteredAgents,
                  matchHistory: effectiveMatches,
                  weapons: playerData.weapons || playerData.player?.weapons || [],
                  rank: playerData.rank || playerData.player?.rank || "Ascendant 3",
                  rankUrl: playerData.rankUrl || playerData.player?.rankUrl || "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/24/largeicon.png",
                  rankTier: playerData.rankTier ?? playerData.player?.rankTier ?? 24,
                  level: playerData.level ?? playerData.player?.level ?? playerData.player?.accountLevel ?? 100,
                  cardUrl: playerData.player?.cardUrl || playerData.player?.cardSmall || playerData.cardUrl || "https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/smallart.png",
                  cardWideUrl: playerData.player?.cardWideUrl || playerData.player?.cardWide || playerData.cardWideUrl || "https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/wideart.png",
                  mainAgent: playerData.mainAgent || playerData.player?.mainAgent,
                  badge: playerData.badge || playerData.player?.badge || null,
                  showBadge: playerData.showBadge ?? playerData.player?.showBadge ?? true,
                };
                const s = p.stats;
                const w = getWarnings(s);

                const profileBannerUrl = canEditProfile
                  ? bannerUrl || p.customBannerUrl || p.cardWideUrl
                  : p.customBannerUrl || p.cardWideUrl;

                const profileBannerOffsetY = canEditProfile
                  ? (bannerOffsetY ?? p.customBannerOffsetY ?? 50)
                  : (p.customBannerOffsetY ?? 50);

                const profileThemeClass =
                  !canEditProfile && p.customTheme && p.customTheme !== "dark" ? `theme-${p.customTheme}` : "";

                const displayName = streamerMode ? (p.mainAgent?.name || "Joueur Masqué") : p.gameName;
                const displayTag = streamerMode ? "" : `#${p.tagLine}`;

                return (
                  <div className={`w-full flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-700 ${profileThemeClass}`}>
                    {/* Bannière Profil Responsive */}
                    <div className="w-full relative rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-[0_8px_30px_var(--color-glass-shadow)] bg-[#0a0e13] min-h-[135px] sm:min-h-[140px] aspect-[2.3/1] sm:aspect-[3.6/1] md:aspect-[3.8/1]">
                      <img
                        referrerPolicy="no-referrer"
                        src={profileBannerUrl}
                        alt="Banner"
                        style={{ objectPosition: `center ${profileBannerOffsetY}%` }}
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                      />
                      <div className="absolute inset-0 bg-black/40"></div>

                      {/* Éléments du haut de la bannière : SPI en haut à gauche & Export Carte / Favori en haut à droite */}
                      <div className="absolute top-2.5 sm:top-3.5 left-3 sm:left-6 right-3 sm:right-6 flex items-center justify-between pointer-events-none z-20">
                        {/* SPI en haut à gauche */}
                        <div className="pointer-events-auto">
                          {performanceScoreResult && (
                            <PerformanceScoreCard
                              result={performanceScoreResult}
                              onClickDetail={() => setShowPerformanceModal(true)}
                              compact={true}
                              isOwner={canEditProfile}
                              isPublic={!hiddenStats.includes("performanceScore")}
                            />
                          )}
                        </div>

                        {/* Bouton Coach Tactique (Privé par défaut / Propriétaire uniquement) & Export Carte ou Favori */}
                        <div className="pointer-events-auto flex items-center gap-2">
                          {canEditProfile && (
                            <button
                              type="button"
                              onMouseEnter={() => sounds.playHover()}
                              onClick={() => {
                                sounds.playClick();
                                setShowCoachModal(true);
                              }}
                              title="Ouvrir le Coach Tactique Spycam"
                              className="px-2.5 sm:px-3 py-1.5 rounded-xl glass-pill hover:bg-emerald-600/30 border-white/20 hover:border-emerald-400 text-white transition-all flex items-center gap-1.5 text-xs font-bold shadow-lg cursor-pointer group"
                            >
                              <IconBrain size={14} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                              <span className="hidden sm:inline">Coach Tactique</span>
                            </button>
                          )}
                          {canEditProfile ? (
                            <button
                              type="button"
                              onMouseEnter={() => sounds.playHover()}
                              onClick={() => {
                                sounds.playClick();
                                setShowCardModal(true);
                              }}
                              title="Exporter ma Carte Joueur (PNG)"
                              className="px-2.5 sm:px-3 py-1.5 rounded-xl glass-pill hover:bg-[var(--color-val-red)]/30 border-white/20 hover:border-[var(--color-val-red)] text-white transition-all flex items-center gap-1.5 text-xs font-bold shadow-lg cursor-pointer group"
                            >
                              <IconShare size={14} className="group-hover:scale-110 transition-transform" />
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
                              title={isFavorited(p.gameName, p.tagLine) ? "Retirer des favoris" : "Ajouter aux favoris"}
                              className={`w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-300 glass-pill cursor-pointer ${
                                isFavorited(p.gameName, p.tagLine)
                                  ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                                  : "text-white/60 hover:text-yellow-400 hover:border-yellow-500/40"
                              }`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill={isFavorited(p.gameName, p.tagLine) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                              <img referrerPolicy="no-referrer" src={p.cardUrl} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            {p.mainAgent && (
                              <div className="hidden sm:flex items-center gap-1.5 bg-[rgba(0,0,0,0.5)] rounded-full px-2 py-0.5 border border-[rgba(255,255,255,0.1)]">
                                <img referrerPolicy="no-referrer" src={p.mainAgent.icon} alt={p.mainAgent.name} className="w-3.5 h-3.5 rounded-full shadow-md" />
                                <span className="text-[9px] font-bold text-white uppercase tracking-wider">{p.mainAgent.name}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col min-w-0" style={{ textShadow: "0px 2px 10px rgba(0,0,0,0.8)" }}>
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                              <span className="text-sm xs:text-base sm:text-xl md:text-2xl font-black tracking-tight text-white truncate max-w-[140px] xs:max-w-[180px] sm:max-w-none">
                                {displayName}
                              </span>
                              {displayTag && (
                                <span className="text-[10px] sm:text-xs md:text-sm text-[var(--color-text-secondary)] font-medium">{displayTag}</span>
                              )}
                              <span className="md:hidden text-[9px] font-black text-[var(--color-val-light)] bg-white/10 border border-white/15 px-1.5 py-0.5 rounded-md">
                                Nv. {p.level}
                              </span>
                              {!streamerMode && (
                                <UserBadges
                                  badges={p.badge}
                                  showBadge={canEditProfile ? showBadgeState : p.showBadge}
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

                        {/* Centre Absolu : Niveau en losange au milieu UNIQUEMENT sur Desktop (md+) */}
                        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex-col items-center pointer-events-none z-10">
                          <span className="text-[9px] md:text-[10px] text-[var(--color-text-secondary)] uppercase tracking-[0.15em] mb-1 font-bold" style={{ textShadow: "0px 2px 8px rgba(0,0,0,0.8)" }}>
                            Niveau
                          </span>
                          <div className="relative flex items-center justify-center sm:w-12 sm:h-12 md:w-16 md:h-16">
                            <div className="absolute inset-0 border-2 border-[var(--color-val-light)] opacity-50 transform rotate-45 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.5)]"></div>
                            <span className="sm:text-xl md:text-3xl font-black text-[var(--color-val-light)] drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] z-10">
                              {p.level}
                            </span>
                          </div>
                        </div>

                        {/* Droite : Rang tout à droite */}
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-auto z-10">
                          <div className="flex flex-col items-end hidden sm:flex" style={{ textShadow: "0px 2px 10px rgba(0,0,0,0.8)" }}>
                            <span className="text-[9px] sm:text-[10px] text-[var(--color-text-secondary)] uppercase tracking-[0.2em] font-bold">Rang</span>
                            <span className="text-xs sm:text-lg font-black text-white uppercase tracking-wider">{p.rank}</span>
                          </div>
                          <img referrerPolicy="no-referrer" src={p.rankUrl} alt={p.rank} className="w-11 h-11 xs:w-13 xs:h-13 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]" />
                        </div>
                      </div>
                    </div>

                    {/* Tabs + Mode Filter */}
                    <div className="w-full mt-4 sm:mt-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[var(--color-border)] mb-4 sm:mb-6 gap-3">
                        <div ref={profileTabsContainerRef} className="relative flex items-center gap-4 sm:gap-8">
                          {/* Sliding Red Underline Indicator */}
                          <div
                            className="absolute bottom-0 h-[2.5px] rounded-full bg-[var(--color-val-red)] shadow-[0_0_12px_rgba(255,70,85,0.9)] pointer-events-none z-10"
                            style={{
                              transform: `translateX(${profileUnderlineStyle.left}px)`,
                              width: `${profileUnderlineStyle.width}px`,
                              opacity: profileUnderlineStyle.opacity,
                              transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                            }}
                          />

                          {[
                            { id: "performance", label: "Performances" },
                            { id: "agents", label: "Agents" },
                            { id: "matches", label: "Historique" },
                          ].map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                              <button
                                key={tab.id}
                                ref={(el) => {
                                  profileTabRefs.current[tab.id] = el;
                                }}
                                onMouseEnter={() => sounds.playHover()}
                                onClick={() => {
                                  sounds.playTabSwitch();
                                  setActiveTab(tab.id);
                                  const isOwn = myRiotId && riotId.toLowerCase() === myRiotId.toLowerCase();
                                  pushUrl({ tab: tab.id, playerId: riotId || myRiotId, isOwnProfile: !!isOwn });
                                }}
                                className={`pb-3 text-xs sm:text-sm uppercase tracking-widest font-black transition-colors duration-300 relative cursor-pointer select-none active:scale-95 ${
                                  isActive
                                    ? "text-[var(--color-val-red)] drop-shadow-[0_0_8px_rgba(255,70,85,0.4)]"
                                    : "text-[var(--color-text-secondary)] hover:text-white"
                                }`}
                              >
                                {tab.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Filtres mode de jeu & saison */}
                        <div className="flex items-center gap-2 sm:gap-3 pb-3 flex-wrap">
                          <select
                            value={selectedSeason}
                            onChange={(e) => {
                              setSelectedSeason(e.target.value);
                              setVisibleMatchesCount(10);
                            }}
                            className="bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs font-bold rounded-lg px-2.5 sm:px-3 py-1.5 outline-none cursor-pointer hover:border-[var(--color-val-red)] transition-colors"
                          >
                            <option value="all">Toutes les saisons</option>
                            {availableSeasons.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>

                          {/* Mode Filter Capsule with Sliding Pill (All, Competitive, Unrated, Others) */}
                          <div
                            ref={gameModeContainerRef}
                            className="relative flex items-center gap-0.5 p-1 rounded-2xl glass-pill"
                          >
                            {/* Animated Sliding Red Pill */}
                            <div
                              className="absolute top-1 bottom-1 rounded-xl bg-[var(--color-val-red)] shadow-[0_0_18px_rgba(255,70,85,0.6)] pointer-events-none z-0"
                              style={{
                                transform: `translateX(${gameModePillStyle.left}px)`,
                                width: `${gameModePillStyle.width}px`,
                                opacity: gameModePillStyle.opacity,
                                transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                              }}
                            />

                            {[
                              { id: "all", label: "All" },
                              { id: "competitive", label: "Competitive" },
                              { id: "unrated", label: "Unrated" },
                              { id: "other", label: "Others" },
                            ].map((mode) => {
                              const isActive = gameMode === mode.id;
                              return (
                                <button
                                  key={mode.id}
                                  ref={(el) => {
                                    gameModeBtnRefs.current[mode.id] = el;
                                  }}
                                  onClick={() => {
                                    sounds.playTabSwitch();
                                    setGameMode(mode.id);
                                    setVisibleMatchesCount(10);
                                  }}
                                  onMouseEnter={() => sounds.playHover()}
                                  className={`relative z-10 px-3 py-1 rounded-xl text-xs font-bold transition-colors duration-200 cursor-pointer select-none active:scale-95 whitespace-nowrap ${
                                    isActive ? "text-white" : "text-neutral-400 hover:text-white"
                                  }`}
                                >
                                  {mode.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Performance Tab */}
                      {s && (
                        (() => {
                          let appliedHiddenStats: string[] = [];
                          if (!canEditProfile && playerData?.player?.hiddenStats) {
                            try {
                              appliedHiddenStats =
                                typeof playerData.player.hiddenStats === "string"
                                  ? JSON.parse(playerData.player.hiddenStats)
                                  : playerData.player.hiddenStats || [];
                            } catch {
                              appliedHiddenStats = [];
                            }
                          }

                          const userKey = session?.user?.email || (isGuestMode ? "guest" : p.puuid || "default");

                          return (
                            <div className={activeTab === "performance" ? "w-full animate-in fade-in duration-500" : "hidden"}>
                              <DashboardGrid
                                stats={s}
                                warnings={w}
                                smartRating={smartRating}
                                matchHistory={filteredMatches}
                                canEdit={canEditProfile}
                                hiddenStatsByPrivacy={appliedHiddenStats}
                                userStorageKey={userKey}
                                initialGridData={playerData?.player?.dashboardGrid}
                                performanceScoreResult={performanceScoreResult}
                                onOpenPerformanceModal={() => setShowPerformanceModal(true)}
                                onOpenCoachModal={() => setShowCoachModal(true)}
                                agentStats={playerData?.player?.agentStats}
                                playerName={playerData?.player?.name}
                                onSaveGridData={(gridJson) => {
                                  setPlayerData((prev: any) => {
                                    if (!prev) return prev;
                                    return {
                                      ...prev,
                                      player: { ...(prev.player || {}), dashboardGrid: gridJson },
                                      dashboardGrid: gridJson,
                                    };
                                  });
                                }}
                              />
                            </div>
                          );
                        })()
                      )}

                      {/* Agents Tab */}
                      {activeTab === "agents" && p.agentStats && (
                        <div className="space-y-3 animate-in fade-in duration-500">
                          {p.agentStats.map((agent: any) => (
                            <div
                              key={agent.name}
                              className="glass-panel rounded-2xl p-4 sm:p-5 flex items-center gap-4 sm:gap-5 hover:bg-[var(--color-surface-hover)] transition-all duration-300"
                            >
                              <img
                                referrerPolicy="no-referrer"
                                src={agent.icon}
                                alt={agent.name}
                                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border border-[rgba(255,255,255,0.1)] flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-[var(--color-text-on-surface)] text-base sm:text-lg">{agent.name}</span>
                                  <span className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-widest bg-[rgba(255,255,255,0.05)] px-2 py-0.5 rounded-full">
                                    {agent.role}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 sm:gap-5 mt-2 flex-wrap">
                                  <div className="flex flex-col">
                                    <span className="text-[9px] text-[var(--color-text-secondary)] uppercase tracking-widest font-bold">
                                      Parties
                                    </span>
                                    <span className="text-xs sm:text-sm font-bold text-[var(--color-text-on-surface)]">{agent.games}</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[9px] text-[var(--color-text-secondary)] uppercase tracking-widest font-bold">
                                      Win Rate
                                    </span>
                                    <span className={`text-xs sm:text-sm font-bold ${agent.winRate >= 50 ? "text-emerald-400" : "text-red-400"}`}>
                                      {agent.winRate}%
                                    </span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[9px] text-[var(--color-text-secondary)] uppercase tracking-widest font-bold">
                                      K/D
                                    </span>
                                    <span className={`text-xs sm:text-sm font-bold ${agent.kd >= 1 ? "text-emerald-400" : "text-red-400"}`}>
                                      {agent.kd}
                                    </span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[9px] text-[var(--color-text-secondary)] uppercase tracking-widest font-bold">
                                      Heures
                                    </span>
                                    <span className="text-xs sm:text-sm font-bold text-[var(--color-text-on-surface)]">{agent.hoursPlayed}h</span>
                                  </div>
                                </div>
                              </div>
                              <div className="w-20 sm:w-24 h-2 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden hidden sm:block flex-shrink-0">
                                <div
                                  className={`h-full rounded-full transition-all ${agent.winRate >= 50 ? "bg-emerald-500" : "bg-red-500"}`}
                                  style={{ width: `${agent.winRate}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Matches Tab */}
                      {activeTab === "matches" && filteredMatches && (
                        <MatchHistory
                          matches={filteredMatches}
                          searchPlayer={searchPlayer}
                          visibleCount={visibleMatchesCount}
                          onLoadMore={() => setVisibleMatchesCount((prev) => prev + 10)}
                          currentPlayerRank={p?.rank}
                          currentPlayerRankUrl={p?.rankUrl}
                          currentPlayerRankTier={p?.rankTier}
                        />
                      )}
                    </div>
                  </div>
                );
              })()}
          </div>
        )}

        {/* Bottom Mobile Navigation (< 768px) */}
        <MobileNav
          activeTab={activeTab}
          newsView={newsView}
          agentsView={agentsView}
          lobbiesView={lobbiesView}
          settingsOpen={settingsOpen}
          onGoHome={() => {
            setNewsView(false);
            setAgentsView(false);
            setLobbiesView(false);
            setSettingsOpen(false);
            goHome();
          }}
          onSelectTab={(tab) => {
            setLobbiesView(false);
            setActiveTab(tab);
            const isOwn = myRiotId && riotId.toLowerCase() === myRiotId.toLowerCase();
            pushUrl({ tab, playerId: riotId || myRiotId, isOwnProfile: !!isOwn });
          }}
          onOpenNews={() => {
            setNewsView(true);
            setAgentsView(false);
            setLobbiesView(false);
            setSettingsOpen(false);
            const isOwn = myRiotId && riotId.toLowerCase() === myRiotId.toLowerCase();
            pushUrl({ view: "news", playerId: riotId || myRiotId, isOwnProfile: !!isOwn });
          }}
          onOpenAgents={() => {
            setAgentsView(true);
            setNewsView(false);
            setLobbiesView(false);
            setSettingsOpen(false);
            const isOwn = myRiotId && riotId.toLowerCase() === myRiotId.toLowerCase();
            pushUrl({ view: "agents", playerId: riotId || myRiotId, isOwnProfile: !!isOwn });
          }}
          onOpenLobbies={() => {
            setLobbiesView(true);
            setNewsView(false);
            setAgentsView(false);
            setSettingsOpen(false);
          }}
          onToggleSettings={() => {
            const newVal = !settingsOpen;
            setSettingsOpen(newVal);
            if (newVal) {
              pushUrl({ view: "settings" });
            } else {
              const isOwn = myRiotId && riotId.toLowerCase() === myRiotId.toLowerCase();
              pushUrl({ tab: activeTab, playerId: riotId || myRiotId, isOwnProfile: !!isOwn });
            }
          }}
          onOpenMenuDrawer={() => setShowMobileDrawer(true)}
        />

        {/* Hotkeys Help Modal */}
        <HotkeysHelpModal
          isOpen={showHotkeysModal}
          onClose={() => setShowHotkeysModal(false)}
          ecoMode={ecoMode}
          onToggleEcoMode={() => setEcoMode(!ecoMode)}
        />

        {/* Official Riot Leaderboard Modal */}
        {showLeaderboardModal && (
          <LeaderboardModal onClose={() => setShowLeaderboardModal(false)} />
        )}

        {/* Exportable Player Card Modal */}
        {showCardModal && (
          <PlayerCardModal
            playerData={playerData}
            onClose={() => setShowCardModal(false)}
            performanceScoreResult={performanceScoreResult}
            isPublicSPI={!hiddenStats.includes("performanceScore")}
          />
        )}

        {/* Mobile 4-Squares App Drawer */}
        <MobileAppDrawer
          isOpen={showMobileDrawer}
          onClose={() => setShowMobileDrawer(false)}
          onOpenSettings={() => {
            setSettingsOpen(true);
            pushUrl({ view: "settings" });
          }}
          onOpenLeaderboard={() => setShowLeaderboardModal(true)}
          onToggleFullscreen={toggleFullscreen}
          onSignOut={() => signOut({ callbackUrl: "/" })}
        />

        {/* Persistent Floating Voice Bar when navigating across Spycam */}
        {!lobbiesView && isInVoiceGlobal && activeVoiceLobby && (
          <FloatingVoiceBar
            activeLobby={activeVoiceLobby}
            isInVoice={isInVoiceGlobal}
            isMicMuted={isMicMutedGlobal}
            isSpeaking={isMyVoiceSpeakingGlobal}
            voiceVolumeLevel={voiceVolumeLevelGlobal}
            onToggleMute={() => {
              const nextMute = !isMicMutedGlobal;
              setIsMicMutedGlobal(nextMute);
              globalVoiceManagerRef.current?.setMute(nextMute);
            }}
            onOpenSalon={() => {
              setNewsView(false);
              setAgentsView(false);
              setSettingsOpen(false);
              setLobbiesView(true);
            }}
            onLeaveVoice={async () => {
              if (globalVoiceManagerRef.current) {
                globalVoiceManagerRef.current.stop();
                globalVoiceManagerRef.current = null;
              }
              setIsInVoiceGlobal(false);
              setIsMyVoiceSpeakingGlobal(false);
              if (activeVoiceLobby) {
                try {
                  const myName = playerData?.gameName || playerData?.player?.gameName || "Joueur";
                  const myTag = playerData?.tagLine || playerData?.player?.tagLine || "EUW";
                  await fetch(`/api/lobbies/${activeVoiceLobby.id}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "voice-leave",
                      gameName: myName,
                      tagLine: myTag,
                    }),
                  });
                } catch {}
              }
            }}
          />
        )}
      </main>

      {/* SGS & Riot Games Legal Footer */}
      <footer className="w-full border-t border-white/10 bg-[#070a0e]/95 backdrop-blur-md px-4 py-8 text-[11px] text-[var(--color-text-secondary)] leading-relaxed mb-12 md:mb-0">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold">
            <button
              onClick={() => { sounds.playClick(); setLegalModalTab("cgu"); setShowLegalModal(true); }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Conditions d&apos;Utilisation (CGU)
            </button>
            <span className="text-white/20">•</span>
            <button
              onClick={() => { sounds.playClick(); setLegalModalTab("mentions"); setShowLegalModal(true); }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Mentions Légales & Hébergeur
            </button>
            <span className="text-white/20">•</span>
            <button
              onClick={() => { sounds.playClick(); setLegalModalTab("privacy"); setShowLegalModal(true); }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Confidentialité & RGPD
            </button>
            <span className="text-white/20">•</span>
            <button
              onClick={() => { sounds.playClick(); setLegalModalTab("riot"); setShowLegalModal(true); }}
              className="text-red-400 hover:text-red-300 transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <IconSword size={12} className="text-red-400" />
              <span>Règles Riot Games</span>
            </button>
          </div>

          <p className="text-[10px] text-center max-w-3xl mx-auto text-gray-500 leading-relaxed">
            « Spycam et tout l’écosystème SGS » est un projet indépendant qui n’est pas approuvé par Riot Games et ne reflète pas les opinions ou les avis de Riot Games ou de toute personne officiellement impliquée dans la production ou la gestion des propriétés de Riot Games. Riot Games et toutes les propriétés associées sont des marques ou des marques déposées de Riot Games, Inc.
          </p>
        </div>
      </footer>

      {/* SGS Centralized Legal Modal */}
      <SgsLegalModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        defaultTab={legalModalTab}
      />

      {/* Direct SGS Login / Register Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />

      {/* Spycam Performance Index (SPI) Modal */}
      {performanceScoreResult && (
        <PerformanceScoreModal
          isOpen={showPerformanceModal}
          onClose={() => setShowPerformanceModal(false)}
          result={performanceScoreResult}
          isOwner={canEditProfile}
          isPublic={!hiddenStats.includes("performanceScore")}
          onTogglePrivacy={() => {
            const isCurrentlyHidden = hiddenStats.includes("performanceScore");
            const newHidden = isCurrentlyHidden
              ? hiddenStats.filter((id) => id !== "performanceScore")
              : [...hiddenStats, "performanceScore"];
            setHiddenStats(newHidden);
            fetch("/api/user/settings", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ hiddenStats: JSON.stringify(newHidden) }),
            }).catch(() => {});
          }}
        />
      )}

      {/* Spycam Tactical Coach Modal */}
      {showCoachModal && (
        <AiCoachModal
          isOpen={showCoachModal}
          onClose={() => setShowCoachModal(false)}
          matches={filteredMatches}
          agentStats={playerData?.player?.agentStats}
          stats={playerData?.player?.stats}
          playerName={playerData?.player?.name}
        />
      )}

      {/* Panneau Admin Développeur Local (Strictement actif sur localhost, jamais actif sur Vercel/production) */}
      {isLocalhost && (
        <LocalDevStatsPanel
          currentRole={dominantRole}
          onOverridesChange={setDevOverrides}
          currentRiotId={
            playerData?.player
              ? `${playerData.player.gameName}#${playerData.player.tagLine}`
              : riotId || myRiotId || "Gr4phØ#0001"
          }
          onRiotKeyChange={handleRiotKeyChange}
          isLiveRiotData={playerData?.isMock === false}
          playerStats={playerData?.player?.stats || playerData?.stats}
        />
      )}
    </>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-[var(--color-text-secondary)] font-bold tracking-widest uppercase animate-pulse">
          Chargement...
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
