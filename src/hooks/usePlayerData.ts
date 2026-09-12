"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import type { NavigationState } from "./useNavigation";
import type { AuthState } from "./useAuth";
import type { SettingsState } from "./useSettings";
import type { DevStatOverrides } from "@/components/LocalDevStatsPanel";

export interface PlayerDataState {
  riotId: string;
  setRiotId: (v: string) => void;
  myRiotId: string;
  setMyRiotId: (v: string) => void;
  loading: boolean;
  playerData: any;
  setPlayerData: React.Dispatch<React.SetStateAction<any>>;
  error: string;
  setError: (v: string) => void;
  devOverrides: DevStatOverrides | null;
  setDevOverrides: (v: DevStatOverrides | null) => void;
  searchPlayer: (searchId: string) => void;
  goHome: () => void;
  handleSearch: (e: React.FormEvent) => Promise<void>;
  handleDebugGenerate: () => Promise<void>;
  handleRiotKeyChange: (newKey: string | null) => void;
  rawMatches: any[];
  rawAgentStats: any[];
  rawStats: any;
  newsItems: any[];
  setNewsItems: (v: any[]) => void;
}

export function usePlayerData(
  auth: AuthState,
  nav: NavigationState,
  settings: SettingsState,
  setAppLanguage: (lang: string) => void
): PlayerDataState {
  const [riotId, setRiotId] = useState("");
  const [myRiotId, setMyRiotId] = useState("");
  const [loading, setLoading] = useState(false);
  const [playerData, setPlayerData] = useState<any>(null);
  const [error, setError] = useState("");
  const [devOverrides, setDevOverrides] = useState<DevStatOverrides | null>(null);
  const [newsItems, setNewsItems] = useState<any[]>([]);

  const getDevKeyHeader = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (typeof window !== "undefined") {
      const k = localStorage.getItem("spycam_riot_dev_key");
      if (k) headers["x-riot-dev-key"] = k;
      if (
        auth.session?.user?.email === "laffont.romain64@gmail.com" ||
        localStorage.getItem("sgs_admin_mode") === "true"
      ) {
        headers["x-admin-bypass"] = "true";
      }
    }
    return headers;
  }, [auth.session?.user?.email]);

  const searchPlayer = useCallback(
    (searchId: string) => {
      const isOwn =
        myRiotId && searchId.toLowerCase() === myRiotId.toLowerCase();
      setRiotId(searchId);
      setLoading(true);
      setError("");
      setPlayerData(null);
      nav.pushUrl({
        tab: nav.activeTab,
        playerId: searchId,
        isOwnProfile: !!isOwn,
      });
      fetch("/api/valorant/player", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getDevKeyHeader(),
        },
        body: JSON.stringify({ riotId: searchId }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.error) setError(d.error);
          else setPlayerData(d);
        })
        .catch(() => setError("Serveur inaccessible."))
        .finally(() => setLoading(false));
    },
    [myRiotId, nav, getDevKeyHeader]
  );

  const goHome = useCallback(() => {
    if (myRiotId) {
      setRiotId(myRiotId);
      setLoading(true);
      setError("");
      setPlayerData(null);
      nav.pushUrl({
        tab: nav.activeTab,
        playerId: myRiotId,
        isOwnProfile: true,
      });
      fetch("/api/valorant/player", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getDevKeyHeader(),
        },
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
  }, [myRiotId, nav, getDevKeyHeader]);

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError("");
      setPlayerData(null);
      const isOwn =
        myRiotId && riotId.toLowerCase() === myRiotId.toLowerCase();

      nav.setNewsView(false);
      nav.setAgentsView(false);
      nav.setSettingsOpen(false);
      nav.pushUrl({
        tab: "performance",
        playerId: riotId,
        isOwnProfile: !!isOwn,
      });
      try {
        const r = await fetch("/api/valorant/player", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getDevKeyHeader(),
          },
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
    },
    [riotId, myRiotId, nav, getDevKeyHeader]
  );

  const handleDebugGenerate = useCallback(async () => {
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
  }, []);

  const handleRiotKeyChange = useCallback(
    (newKey: string | null) => {
      const targetId = riotId || myRiotId || "Gr4phØ#0001";
      setLoading(true);
      setError("");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
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
    },
    [riotId, myRiotId]
  );

  // Auth redirect & initial fetch
  useEffect(() => {
    if (auth.status === "loading") return;

    if (auth.status === "unauthenticated" && !auth.isDemo) {
      return;
    } else if (auth.status === "authenticated" && auth.session?.user) {
      const user = auth.session.user as any;

      settings.syncFromSession(user);
      if (user.language) {
        setAppLanguage(user.language);
      }

      if (!playerData && !loading) {
        let initialRiotId = user.riotGameName || user.riotId;

        if (!auth.isDemo && user.email === "laffont.romain64@gmail.com") {
          initialRiotId = user.riotGameName || "Gr4phØ#0001";
        } else if (
          !auth.isDemo &&
          user.email === "spycam_riot_temp@gmail.com"
        ) {
          initialRiotId = user.riotGameName || "riot_test#TEST";
        } else if (
          !auth.isDemo &&
          user.email === "romain.lft64@gmail.com"
        ) {
          initialRiotId = user.riotGameName || "SENPAII#6767";
        } else if (auth.isGuestMode) {
          initialRiotId = "Shadow#BETA";
        }

        if (initialRiotId) setMyRiotId(initialRiotId);
        if (auth.isSimulatedNewUser) initialRiotId = null;

        // Parse URL for initial routing
        const pathname = window.location.pathname;
        const segments = pathname.split("/").filter(Boolean);
        let urlRiotId: string | null = null;
        let urlTab: string | null = null;
        let urlView:
          | "news"
          | "agents"
          | "settings"
          | "lobbies"
          | "leaderboard"
          | null = null;
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
            if (segments[1] && nav.SLUG_TO_TAB[segments[1]]) {
              urlTab = nav.SLUG_TO_TAB[segments[1]];
            } else {
              urlTab = "performance";
            }
          } else {
            urlRiotId = nav.slugToRiotId(segments[0]);
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
              if (segments[2] && nav.SLUG_TO_TAB[segments[2]]) {
                urlTab = nav.SLUG_TO_TAB[segments[2]];
              } else {
                urlTab = "performance";
              }
            }
          }
        }

        if (urlView === "lobbies") nav.setLobbiesView(true);
        else if (urlView === "leaderboard") nav.setLeaderboardView(true);
        else if (urlView === "news") nav.setNewsView(true);
        else if (urlView === "agents") nav.setAgentsView(true);
        else if (urlView === "settings") {
          nav.setSettingsOpen(true);
          if (uSettingsTab) settings.setSettingsTab(uSettingsTab);
        }
        if (urlTab) nav.setActiveTab(urlTab);

        const targetRiotId = urlRiotId || initialRiotId;

        if (targetRiotId) {
          setRiotId(targetRiotId);
          setLoading(true);
          setError("");
          setPlayerData(null);
          const isOwn =
            initialRiotId &&
            targetRiotId.toLowerCase() === initialRiotId.toLowerCase();
          if (pathname === "/" || pathname === "") {
            nav.pushUrl({
              tab: urlTab || "performance",
              playerId: targetRiotId,
              isOwnProfile: !!isOwn,
            });
          }
          fetch("/api/valorant/player", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...getDevKeyHeader(),
            },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.status, auth.isSimulatedNewUser]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname;
      const segments = pathname.split("/").filter(Boolean);

      nav.setNewsView(false);
      nav.setAgentsView(false);
      nav.setSettingsOpen(false);
      nav.setLobbiesView(false);
      nav.setLeaderboardView(false);

      if (segments.length === 0) {
        if (myRiotId) searchPlayer(myRiotId);
        nav.setActiveTab("performance");
        return;
      }

      let urlRiotId: string | null = null;
      let urlTab: string | null = null;

      if (segments[0] === "salons") {
        nav.setLobbiesView(true);
      } else if (segments[0] === "leaderboard") {
        nav.setLeaderboardView(true);
      } else if (segments[0] === "actualites") {
        nav.setNewsView(true);
      } else if (segments[0] === "agents") {
        nav.setAgentsView(true);
      } else if (segments[0] === "parametres") {
        nav.setSettingsOpen(true);
        if (segments[1]) settings.setSettingsTab(segments[1]);
      } else if (segments[0] === "home") {
        if (segments[1] && nav.SLUG_TO_TAB[segments[1]]) {
          urlTab = nav.SLUG_TO_TAB[segments[1]];
        } else {
          urlTab = "performance";
        }
      } else {
        urlRiotId = nav.slugToRiotId(segments[0]);
        if (segments[1] === "salons") {
          nav.setLobbiesView(true);
        } else if (segments[1] === "leaderboard") {
          nav.setLeaderboardView(true);
        } else if (segments[1] === "actualites") {
          nav.setNewsView(true);
        } else if (segments[1] === "agents") {
          nav.setAgentsView(true);
        } else if (segments[1] === "parametres") {
          nav.setSettingsOpen(true);
        } else if (segments[1] === "home") {
          if (segments[2] && nav.SLUG_TO_TAB[segments[2]]) {
            urlTab = nav.SLUG_TO_TAB[segments[2]];
          } else {
            urlTab = "performance";
          }
        }
      }

      if (urlTab) nav.setActiveTab(urlTab);

      if (urlRiotId && urlRiotId !== riotId) {
        setRiotId(urlRiotId);
        setLoading(true);
        setError("");
        setPlayerData(null);
        fetch("/api/valorant/player", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getDevKeyHeader(),
          },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myRiotId, riotId, nav.SLUG_TO_TAB, nav.slugToRiotId]);

  const rawMatches = useMemo(() => {
    return (playerData?.matchHistory ||
      playerData?.player?.matchHistory ||
      []) as any[];
  }, [playerData]);

  const rawAgentStats = useMemo(() => {
    return (playerData?.agentStats ||
      playerData?.player?.agentStats ||
      []) as any[];
  }, [playerData]);

  const rawStats = useMemo(() => {
    return (playerData?.stats ||
      playerData?.player?.stats ||
      null) as any;
  }, [playerData]);

  return {
    riotId,
    setRiotId,
    myRiotId,
    setMyRiotId,
    loading,
    playerData,
    setPlayerData,
    error,
    setError,
    devOverrides,
    setDevOverrides,
    searchPlayer,
    goHome,
    handleSearch,
    handleDebugGenerate,
    handleRiotKeyChange,
    rawMatches,
    rawAgentStats,
    rawStats,
    newsItems,
    setNewsItems,
  };
}
