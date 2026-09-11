"use client";

import {
  useState,
  useCallback,
  useMemo,
  useRef,
  useLayoutEffect,
} from "react";
import { trackPageView } from "@/lib/analytics";
import { sounds } from "@/lib/soundEffects";

export interface NavigationState {
  activeTab: string;
  setActiveTab: (v: string) => void;
  newsView: boolean;
  setNewsView: (v: boolean) => void;
  agentsView: boolean;
  setAgentsView: (v: boolean) => void;
  lobbiesView: boolean;
  setLobbiesView: (v: boolean) => void;
  leaderboardView: boolean;
  setLeaderboardView: (v: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
  targetNewsId: string | null;
  setTargetNewsId: (v: string | null) => void;
  showHotkeysModal: boolean;
  setShowHotkeysModal: (v: boolean) => void;
  showLeaderboardModal: boolean;
  setShowLeaderboardModal: (v: boolean) => void;
  showCardModal: boolean;
  setShowCardModal: (v: boolean) => void;
  showMobileDrawer: boolean;
  setShowMobileDrawer: (v: boolean) => void;
  showLegalModal: boolean;
  setShowLegalModal: (v: boolean) => void;
  legalModalTab: "cgu" | "mentions" | "privacy" | "riot";
  setLegalModalTab: (v: "cgu" | "mentions" | "privacy" | "riot") => void;
  showPerformanceModal: boolean;
  setShowPerformanceModal: (v: boolean) => void;
  showCoachModal: boolean;
  setShowCoachModal: (v: boolean) => void;
  debugOpen: boolean;
  setDebugOpen: (v: boolean) => void;

  // URL routing
  TAB_TO_SLUG: Record<string, string>;
  SLUG_TO_TAB: Record<string, string>;
  VALID_SLUGS: string[];
  riotIdToSlug: (id: string) => string;
  slugToRiotId: (slug: string) => string;
  pushUrl: (opts?: PushUrlOptions) => void;

  // Profile tabs sliding underline
  profileTabsContainerRef: React.RefObject<HTMLDivElement | null>;
  profileTabRefs: React.MutableRefObject<
    Record<string, HTMLButtonElement | null>
  >;
  profileUnderlineStyle: { left: number; width: number; opacity: number };

  // Helper navigation functions
  resetToProfile: () => void;
}

export interface PushUrlOptions {
  tab?: string;
  playerId?: string | null;
  isOwnProfile?: boolean;
  view?:
    | "news"
    | "agents"
    | "settings"
    | "lobbies"
    | "leaderboard"
    | null;
  agentSlug?: string | null;
  settingsTab?: string | null;
}

export function useNavigation(
  initialLobbiesView = false,
  initialLeaderboardView = false
): NavigationState {
  const [activeTab, setActiveTab] = useState("performance");
  const [newsView, setNewsView] = useState(false);
  const [agentsView, setAgentsView] = useState(false);
  const [lobbiesView, setLobbiesView] = useState(initialLobbiesView);
  const [leaderboardView, setLeaderboardView] = useState(
    initialLeaderboardView
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [targetNewsId, setTargetNewsId] = useState<string | null>(null);
  const [showHotkeysModal, setShowHotkeysModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] =
    useState<boolean>(false);
  const [showCardModal, setShowCardModal] = useState<boolean>(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState<boolean>(false);
  const [showLegalModal, setShowLegalModal] = useState<boolean>(false);
  const [legalModalTab, setLegalModalTab] = useState<
    "cgu" | "mentions" | "privacy" | "riot"
  >("cgu");
  const [showPerformanceModal, setShowPerformanceModal] =
    useState<boolean>(false);
  const [showCoachModal, setShowCoachModal] = useState<boolean>(false);
  const [debugOpen, setDebugOpen] = useState(false);

  // URL routing mappings
  const TAB_TO_SLUG: Record<string, string> = useMemo(
    () => ({
      performance: "home",
      agents: "agents-stats",
      maps: "cartes",
      matches: "historique",
    }),
    []
  );
  const SLUG_TO_TAB: Record<string, string> = useMemo(
    () => ({
      home: "performance",
      "agents-stats": "agents",
      cartes: "maps",
      historique: "matches",
    }),
    []
  );
  const VALID_SLUGS = useMemo(
    () => [
      "home",
      "performance",
      "historique",
      "agents",
      "agents-stats",
      "cartes",
      "actualites",
      "parametres",
    ],
    []
  );

  const riotIdToSlug = useCallback((id: string) => {
    const hashIndex = id.lastIndexOf("#");
    if (hashIndex === -1) return encodeURIComponent(id);
    return encodeURIComponent(
      id.substring(0, hashIndex) + "-" + id.substring(hashIndex + 1)
    );
  }, []);

  const slugToRiotId = useCallback((slug: string) => {
    const decoded = decodeURIComponent(slug);
    const lastDash = decoded.lastIndexOf("-");
    if (lastDash === -1) return decoded;
    return (
      decoded.substring(0, lastDash) + "#" + decoded.substring(lastDash + 1)
    );
  }, []);

  const pushUrl = useCallback(
    (opts?: PushUrlOptions) => {
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
        path =
          isOwn || !playerId
            ? "/actualites"
            : `/${riotIdToSlug(playerId)}/actualites`;
      } else if (view === "agents") {
        if (agentSlug) {
          path =
            isOwn || !playerId
              ? `/agents/${agentSlug}`
              : `/${riotIdToSlug(playerId)}/agents/${agentSlug}`;
        } else {
          path =
            isOwn || !playerId
              ? "/agents"
              : `/${riotIdToSlug(playerId)}/agents`;
        }
      } else if (view === "settings") {
        path = sTab ? `/parametres/${sTab}` : "/parametres";
      } else if (tab) {
        const slug = TAB_TO_SLUG[tab] || tab;
        if (isOwn || !playerId) {
          path =
            slug === "home" && !isOwn && !playerId
              ? "/home"
              : `/home/${slug}`;
          if (slug === "home" && isOwn) path = "/home";
        } else {
          path = `/${riotIdToSlug(playerId)}/home/${slug}`;
          if (slug === "home")
            path = `/${riotIdToSlug(playerId)}/home`;
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

      const pageTitle =
        view === "leaderboard"
          ? "Classement Valorant"
          : view === "lobbies"
          ? "Salons LFG & Vocal"
          : view === "news"
          ? "Actualités & Patchs"
          : view === "agents"
          ? "Agents & Guides"
          : view === "settings"
          ? "Profil & Paramètres"
          : tab === "maps"
          ? "Cartes & Lineups"
          : "Accueil / Live Tracker";
      trackPageView(pageTitle, path);
    },
    [riotIdToSlug, TAB_TO_SLUG]
  );

  // Profile tabs sliding red underline
  const profileTabsContainerRef = useRef<HTMLDivElement | null>(null);
  const profileTabRefs = useRef<
    Record<string, HTMLButtonElement | null>
  >({});
  const [profileUnderlineStyle, setProfileUnderlineStyle] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });

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
  }, [activeTab, updateProfileUnderline]);

  const resetToProfile = useCallback(() => {
    setNewsView(false);
    setAgentsView(false);
    setLobbiesView(false);
    setLeaderboardView(false);
    setSettingsOpen(false);
  }, []);

  return {
    activeTab,
    setActiveTab,
    newsView,
    setNewsView,
    agentsView,
    setAgentsView,
    lobbiesView,
    setLobbiesView,
    leaderboardView,
    setLeaderboardView,
    settingsOpen,
    setSettingsOpen,
    targetNewsId,
    setTargetNewsId,
    showHotkeysModal,
    setShowHotkeysModal,
    showLeaderboardModal,
    setShowLeaderboardModal,
    showCardModal,
    setShowCardModal,
    showMobileDrawer,
    setShowMobileDrawer,
    showLegalModal,
    setShowLegalModal,
    legalModalTab,
    setLegalModalTab,
    showPerformanceModal,
    setShowPerformanceModal,
    showCoachModal,
    setShowCoachModal,
    debugOpen,
    setDebugOpen,
    TAB_TO_SLUG,
    SLUG_TO_TAB,
    VALID_SLUGS,
    riotIdToSlug,
    slugToRiotId,
    pushUrl,
    profileTabsContainerRef,
    profileTabRefs,
    profileUnderlineStyle,
    resetToProfile,
  };
}
