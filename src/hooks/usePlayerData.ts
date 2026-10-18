"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { NavigationState } from "./useNavigation";
import type { AuthState } from "./useAuth";
import type { SettingsState } from "./useSettings";
import type { DevStatOverrides } from "@/lib/devStatsTypes";

export interface PlayerDataState {
  riotId: string;
  setRiotId: (v: string) => void;
  myRiotId: string;
  setMyRiotId: (v: string) => void;
  loading: boolean;
  isStreaming: boolean;
  playerData: any;
  setPlayerData: React.Dispatch<React.SetStateAction<any>>;
  myPlayerData: any;
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

// ─── Cache Local Rapide (Stale-While-Revalidate) ─────────────────────────
const LOCAL_PROFILE_CACHE = new Map<string, { data: any; timestamp: number }>();

function getLocalProfile(targetId: string): any | null {
  if (typeof window === "undefined" || !targetId) return null;
  const key = targetId.trim().toLowerCase();
  const mem = LOCAL_PROFILE_CACHE.get(key);
  if (mem && Date.now() - mem.timestamp < 10 * 60 * 1000) {
    return mem.data;
  }
  try {
    const raw = sessionStorage.getItem(`sgs_swr_p_${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.player) {
        LOCAL_PROFILE_CACHE.set(key, { data: parsed, timestamp: Date.now() });
        return parsed;
      }
    }
  } catch {}
  return null;
}

function saveLocalProfile(targetId: string, data: any) {
  if (typeof window === "undefined" || !targetId || !data) return;
  const key = targetId.trim().toLowerCase();
  LOCAL_PROFILE_CACHE.set(key, { data, timestamp: Date.now() });
  try {
    sessionStorage.setItem(`sgs_swr_p_${key}`, JSON.stringify(data));
  } catch {}
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
  const [isStreaming, setIsStreaming] = useState(false);
  const [playerData, setPlayerData] = useState<any>(null);
  const [myPlayerData, setMyPlayerData] = useState<any>(null);
  const [error, setError] = useState("");
  const [devOverrides, setDevOverrides] = useState<DevStatOverrides | null>(null);
  const [newsItems, setNewsItems] = useState<any[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);

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

  /**
   * Récupère le profil joueur via flux de streaming SSE progressif
   * ou fallback JSON avec hydratation immédiate SWR
   */
  const streamPlayerProfile = useCallback(
    async (targetId: string, isOwn: boolean = false, overrideKey?: string | null) => {
      const cleanTarget = targetId.trim();
      if (!cleanTarget) return;

      // 1. Annulation de la requête / stream en cours si l'utilisateur change de joueur
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // 2. Hydratation immédiate Stale-While-Revalidate (0ms)
      const cached = getLocalProfile(cleanTarget);
      if (cached && !overrideKey) {
        setPlayerData(cached);
        if (isOwn) setMyPlayerData(cached);
      } else if (!playerData) {
        setPlayerData(null);
      }

      setLoading(true);
      setIsStreaming(true);
      setError("");

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          ...getDevKeyHeader(),
        };
        if (overrideKey) {
          headers["x-riot-dev-key"] = overrideKey;
        }

        const response = await fetch("/api/valorant/player", {
          method: "POST",
          headers,
          body: JSON.stringify({ riotId: cleanTarget, stream: true }),
          signal: controller.signal,
        });

        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("text/event-stream") && response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder("utf-8");
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const chunks = buffer.split("\n\n");
            buffer = chunks.pop() || "";

            for (const chunk of chunks) {
              const trimmed = chunk.trim();
              if (!trimmed.startsWith("data:")) continue;
              const jsonText = trimmed.slice(5).trim();
              if (!jsonText) continue;

              try {
                const { type, data } = JSON.parse(jsonText);

                if (type === "cached" || type === "stale_db") {
                  setPlayerData(data);
                  if (isOwn) setMyPlayerData(data);
                } else if (type === "settings") {
                  setPlayerData((prev: any) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      player: { ...(prev.player || {}), ...data },
                      theme: data.theme || prev.theme,
                      bannerUrl: data.bannerUrl || prev.bannerUrl,
                      bannerOffsetY: data.bannerOffsetY ?? prev.bannerOffsetY,
                      dashboardGrid: data.dashboardGrid || prev.dashboardGrid,
                    };
                  });
                } else if (type === "identity") {
                  setPlayerData((prev: any) => {
                    const mergedPlayer = {
                      ...(prev?.player || {}),
                      ...(data.player || data),
                      matchHistory: (data.player || data).matchHistory || prev?.player?.matchHistory || prev?.matchHistory,
                      stats: (data.player || data).stats || prev?.player?.stats || prev?.stats,
                      agentStats: (data.player || data).agentStats || prev?.player?.agentStats || prev?.agentStats,
                    };
                    return {
                      ...(prev || {}),
                      matchHistory: prev?.matchHistory || mergedPlayer.matchHistory,
                      stats: prev?.stats || mergedPlayer.stats,
                      agentStats: prev?.agentStats || mergedPlayer.agentStats,
                      weapons: prev?.weapons,
                      mainAgent: prev?.mainAgent,
                      player: mergedPlayer,
                      gameName: mergedPlayer.gameName,
                      tagLine: mergedPlayer.tagLine,
                      level: mergedPlayer.accountLevel || mergedPlayer.level,
                      cardUrl: mergedPlayer.cardSmall || mergedPlayer.cardUrl,
                      cardWideUrl: mergedPlayer.cardWide || mergedPlayer.cardWideUrl,
                    };
                  });
                } else if (type === "rank") {
                  setPlayerData((prev: any) => ({
                    ...(prev || {}),
                    rank: data.rank,
                    rankUrl: data.rankUrl,
                    rankTier: data.rankTier,
                    matchHistory: prev?.matchHistory,
                    stats: prev?.stats,
                    agentStats: prev?.agentStats,
                    weapons: prev?.weapons,
                    mainAgent: prev?.mainAgent,
                    player: {
                      ...(prev?.player || {}),
                      rank: data.rank,
                      rankUrl: data.rankUrl,
                      rankTier: data.rankTier,
                      matchHistory: prev?.player?.matchHistory || prev?.matchHistory,
                      stats: prev?.player?.stats || prev?.stats,
                      agentStats: prev?.player?.agentStats || prev?.agentStats,
                    },
                  }));
                } else if (type === "stats") {
                  setPlayerData((prev: any) => ({
                    ...(prev || {}),
                    stats: data.stats,
                    agentStats: data.agentStats,
                    weapons: data.weapons,
                    matchHistory: data.matchHistory,
                    mainAgent: data.mainAgent,
                    player: {
                      ...(prev?.player || {}),
                      stats: data.stats,
                      agentStats: data.agentStats,
                      weapons: data.weapons,
                      matchHistory: data.matchHistory,
                      mainAgent: data.mainAgent,
                    },
                  }));
                } else if (type === "complete") {
                  setPlayerData(data);
                  if (isOwn) setMyPlayerData(data);
                  saveLocalProfile(cleanTarget, data);
                } else if (type === "error") {
                  setError(data.error || "Erreur de chargement.");
                }
              } catch (parseErr) {
                console.warn("[Stream Parse Warning]:", parseErr);
              }
            }
          }
        } else {
          // Fallback réponse standard non streamée
          const d = await response.json();
          if (d.error) {
            setError(d.error);
          } else {
            setPlayerData(d);
            if (isOwn) setMyPlayerData(d);
            saveLocalProfile(cleanTarget, d);
          }
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          return;
        }
        setError("Serveur inaccessible.");
      } finally {
        setLoading(false);
        setIsStreaming(false);
      }
    },
    [getDevKeyHeader, playerData]
  );

  const searchPlayer = useCallback(
    (searchId: string) => {
      const isOwn =
        myRiotId && searchId.toLowerCase() === myRiotId.toLowerCase();
      setRiotId(searchId);
      nav.pushUrl({
        tab: nav.activeTab,
        playerId: searchId,
        isOwnProfile: !!isOwn,
      });
      streamPlayerProfile(searchId, !!isOwn);

      // Si consultation d'un tiers et que nos données ne sont pas chargées, récupération discrète
      if (!isOwn && myRiotId && !myPlayerData) {
        const cachedOwn = getLocalProfile(myRiotId);
        if (cachedOwn) {
          setMyPlayerData(cachedOwn);
        } else {
          fetch("/api/valorant/player", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...getDevKeyHeader(),
            },
            body: JSON.stringify({ riotId: myRiotId }),
          })
            .then((r) => r.json())
            .then((md) => {
              if (!md.error) {
                setMyPlayerData(md);
                saveLocalProfile(myRiotId, md);
              }
            })
            .catch(() => {});
        }
      }
    },
    [myRiotId, nav, streamPlayerProfile, myPlayerData, getDevKeyHeader]
  );

  const goHome = useCallback(() => {
    if (myRiotId) {
      setRiotId(myRiotId);
      nav.pushUrl({
        tab: nav.activeTab,
        playerId: myRiotId,
        isOwnProfile: true,
      });
      streamPlayerProfile(myRiotId, true);
    }
  }, [myRiotId, nav, streamPlayerProfile]);

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
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
      await streamPlayerProfile(riotId, !!isOwn);
    },
    [riotId, myRiotId, nav, streamPlayerProfile]
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
      const isOwn = myRiotId && targetId.toLowerCase() === myRiotId.toLowerCase();
      // On vide le cache pour forcer un rechargement avec la nouvelle clé
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(`sgs_swr_p_${targetId.toLowerCase().trim()}`);
      }
      LOCAL_PROFILE_CACHE.delete(targetId.toLowerCase().trim());
      streamPlayerProfile(targetId, !!isOwn, newKey);
    },
    [riotId, myRiotId, streamPlayerProfile]
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
        const urlNewsId = new URLSearchParams(window.location.search).get("newsId");
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
        if (urlView === "news") {
          nav.setTargetNewsId(urlNewsId || null);
        } else {
          nav.setTargetNewsId(null);
        }

        const urlMatchId = new URLSearchParams(window.location.search).get("match");
        if (urlMatchId) {
          urlTab = "matches";
        }
        if (urlTab) nav.setActiveTab(urlTab);

        const targetRiotId = urlRiotId || initialRiotId;

        if (targetRiotId) {
          setRiotId(targetRiotId);
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
          streamPlayerProfile(targetRiotId, !!isOwn);
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
      const urlNewsId = new URLSearchParams(window.location.search).get("newsId");

      nav.setNewsView(false);
      nav.setAgentsView(false);
      nav.setSettingsOpen(false);
      nav.setLobbiesView(false);
      nav.setLeaderboardView(false);
      nav.setTargetNewsId(urlNewsId || null);

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

      const urlMatchId = new URLSearchParams(window.location.search).get("match");
      if (urlMatchId) {
        urlTab = "matches";
      }

      if (urlTab) nav.setActiveTab(urlTab);

      if (urlRiotId && urlRiotId !== riotId) {
        setRiotId(urlRiotId);
        const isOwn = myRiotId && urlRiotId.toLowerCase() === myRiotId.toLowerCase();
        streamPlayerProfile(urlRiotId, !!isOwn);
      } else if (!urlRiotId && myRiotId && riotId !== myRiotId) {
        searchPlayer(myRiotId);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myRiotId, riotId, nav.SLUG_TO_TAB, nav.slugToRiotId, streamPlayerProfile]);

  const rawMatches = useMemo(() => {
    const list = (playerData?.matchHistory ||
      playerData?.player?.matchHistory ||
      []) as any[];
    return list.filter(
      (m: any) =>
        m &&
        m.agent &&
        m.agent !== "Inconnu" &&
        !String(m.matchId || "").startsWith("henrik-match-")
    );
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
    isStreaming,
    playerData,
    setPlayerData,
    myPlayerData,
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
