"use client";

import { useState, useEffect, useCallback } from "react";
import { DailyQuest } from "@/components/quests";
import { sounds } from "@/lib/soundEffects";

interface UseQuestsProps {
  auth: {
    status: string;
    isLocalhost: boolean;
    session: any;
  };
  setPlayerData: (updater: any) => void;
}

export function useQuests({ auth, setPlayerData }: UseQuestsProps) {
  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>([]);
  const [trackerXp, setTrackerXp] = useState(0);
  const [trackerLevel, setTrackerLevel] = useState(1);

  // ─── Chargement initial des défis quotidiens ──────────────────────
  useEffect(() => {
    if (auth.status === "loading") return;
    const guestId =
      typeof window !== "undefined"
        ? sessionStorage.getItem("spycam_guest_id")
        : null;
    const headers: Record<string, string> = {};
    if (guestId) headers["x-guest-id"] = guestId;
    if (
      auth.isLocalhost ||
      auth.session?.user?.email === "laffont.romain64@gmail.com"
    ) {
      headers["x-admin-bypass"] = "true";
      headers["x-user-email"] = "laffont.romain64@gmail.com";
    }

    fetch("/api/quests", { headers })
      .then((r) => r.json())
      .then((data) => {
        if (data.quests && data.quests.length > 0) setDailyQuests(data.quests);
        if (data.xp !== undefined) setTrackerXp(data.xp);
        if (data.trackerLevel !== undefined) setTrackerLevel(data.trackerLevel);
      })
      .catch(() => {});
  }, [auth.status, auth.isLocalhost, auth.session?.user?.email]);

  // ─── Réclamation d'une quête ─────────────────────────────────────
  const handleClaimQuest = useCallback(
    async (questId: string) => {
      const guestId =
        typeof window !== "undefined"
          ? sessionStorage.getItem("spycam_guest_id")
          : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (guestId) headers["x-guest-id"] = guestId;
      if (
        auth.isLocalhost ||
        auth.session?.user?.email === "laffont.romain64@gmail.com"
      ) {
        headers["x-admin-bypass"] = "true";
        headers["x-user-email"] = "laffont.romain64@gmail.com";
      }

      const currentQuest = dailyQuests.find((q) => q.id === questId);

      try {
        const res = await fetch("/api/quests", {
          method: "POST",
          headers,
          body: JSON.stringify({
            questId,
            action: "claim",
            adminBypass: true,
            xpReward: currentQuest?.xpReward || 100,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setDailyQuests((prev) =>
            prev.map((q) =>
              q.id === questId ? { ...q, claimed: true, completed: true } : q
            )
          );
          setTrackerXp(data.xp);
          setTrackerLevel(data.trackerLevel);
          sounds.playLevelUp();
          return;
        }
      } catch {}

      // Fallback local immédiat pour le bypass admin
      if (currentQuest) {
        setDailyQuests((prev) =>
          prev.map((q) =>
            q.id === questId ? { ...q, claimed: true, completed: true } : q
          )
        );
        const addedXp = currentQuest.xpReward || 100;
        const newXp = trackerXp + addedXp;
        let level = 1;
        let xpNeeded = 0;
        while (true) {
          const levelXp = Math.floor(200 * Math.pow(1.15, level - 1));
          if (xpNeeded + levelXp > newXp) break;
          xpNeeded += levelXp;
          level++;
        }
        setTrackerXp(newXp);
        setTrackerLevel(level);
        sounds.playLevelUp();
      }
    },
    [auth.isLocalhost, auth.session, dailyQuests, trackerXp]
  );

  // ─── Modificateur XP & Niveau Tracker (Panel Admin Local) ─────────
  const handleAdminXpDelta = useCallback(
    (delta: number) => {
      setTrackerXp((prevXp) => {
        const newXp = Math.max(0, prevXp + delta);
        let level = 1;
        let needed = 0;
        while (true) {
          const req = Math.floor(200 * Math.pow(1.15, level - 1));
          if (needed + req > newXp) break;
          needed += req;
          level++;
        }
        setTrackerLevel(level);

        setPlayerData((pPrev: any) => {
          if (!pPrev) return pPrev;
          return {
            ...pPrev,
            xp: newXp,
            trackerLevel: level,
            player: {
              ...(pPrev.player || {}),
              xp: newXp,
              trackerLevel: level,
            },
          };
        });

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "x-admin-bypass": "true",
          "x-user-email": "laffont.romain64@gmail.com",
        };
        fetch("/api/quests", {
          method: "POST",
          headers,
          body: JSON.stringify({
            action: "sync_progress",
            xp: newXp,
            trackerLevel: level,
          }),
        }).catch(() => {});

        if (delta > 0) sounds.playLevelUp();
        else sounds.playClick();

        return newXp;
      });
    },
    [setPlayerData]
  );

  // ─── Modificateur de Stats en temps réel (Panel Admin) ────────────
  const handleAdminStatDelta = useCallback(
    (statKey: string, delta: number) => {
      setPlayerData((prev: any) => {
        if (!prev) return prev;
        const prevStats = prev.stats || prev.player?.stats || {};
        const updatedStats = { ...prevStats };
        if (statKey === "kills") {
          updatedStats.kills = Math.max(0, (prevStats.kills || 0) + delta);
          updatedStats.kdRatio = Number(
            (updatedStats.kills / Math.max(updatedStats.deaths || 1, 1)).toFixed(2)
          );
        } else if (statKey === "deaths") {
          updatedStats.deaths = Math.max(0, (prevStats.deaths || 0) + delta);
          updatedStats.kdRatio = Number(
            ((updatedStats.kills || 0) / Math.max(updatedStats.deaths, 1)).toFixed(2)
          );
        } else if (statKey === "wins") {
          updatedStats.wins = Math.max(0, (prevStats.wins || 0) + delta);
          const matches = updatedStats.matchesPlayed || 1;
          updatedStats.winRate = Math.round((updatedStats.wins / matches) * 100);
        } else if (statKey === "assists") {
          updatedStats.assists = Math.max(0, (prevStats.assists || 0) + delta);
        } else if (statKey === "headshots") {
          updatedStats.headshotPct = Math.min(
            100,
            Math.max(0, (prevStats.headshotPct || 25) + delta)
          );
        } else if (statKey === "firstBloods") {
          updatedStats.firstBloods = Math.max(0, (prevStats.firstBloods || 0) + delta);
        } else if (statKey === "clutches") {
          updatedStats.clutches = Math.max(0, (prevStats.clutches || 0) + delta);
        } else if (statKey === "aces") {
          updatedStats.aceCount = Math.max(0, (prevStats.aceCount || 0) + delta);
        } else if (statKey === "flawlessRounds" || statKey === "flawless") {
          updatedStats.flawlessRounds = Math.max(
            0,
            (prevStats.flawlessRounds || 0) + delta
          );
        }

        return {
          ...prev,
          stats: updatedStats,
          player: {
            ...(prev.player || {}),
            stats: updatedStats,
          },
        };
      });

      // Progression dynamique des défis quotidiens
      setDailyQuests((prev) =>
        prev.map((quest) => {
          const target = (quest.targetStat || "").toLowerCase();
          const title = (quest.title || "").toLowerCase();
          const desc = (quest.description || "").toLowerCase();

          let matches = false;
          let isAbsolute = false;

          if (
            statKey === "kills" &&
            (target === "kills" ||
              target === "combat" ||
              title.includes("frag") ||
              title.includes("kill") ||
              title.includes("élimin") ||
              desc.includes("élimin") ||
              desc.includes("kill"))
          ) {
            matches = true;
          } else if (
            statKey === "headshots" &&
            (target === "headshotpercent" ||
              target === "headshots" ||
              target === "hs" ||
              title.includes("tête") ||
              title.includes("headshot") ||
              desc.includes("tête"))
          ) {
            matches = true;
          } else if (
            statKey === "wins" &&
            (target === "wins" ||
              target === "dailywins" ||
              title.includes("victoire") ||
              title.includes("gagn") ||
              desc.includes("victoire"))
          ) {
            matches = true;
          } else if (
            statKey === "assists" &&
            (target === "assists" ||
              title.includes("assist") ||
              desc.includes("assist"))
          ) {
            matches = true;
          } else if (
            statKey === "firstBloods" &&
            (target === "firstbloods" ||
              title.includes("premier sang") ||
              desc.includes("premier sang"))
          ) {
            matches = true;
          } else if (
            statKey === "clutches" &&
            (target === "clutches" ||
              title.includes("clutch") ||
              desc.includes("clutch"))
          ) {
            matches = true;
          } else if (
            statKey === "aces" &&
            (target === "aces" ||
              title.includes("ace") ||
              desc.includes("ace"))
          ) {
            matches = true;
          } else if (
            (statKey === "flawlessRounds" || statKey === "flawless") &&
            (target === "flawlessrounds" ||
              target === "flawless" ||
              title.includes("parfait") ||
              desc.includes("parfait") ||
              desc.includes("sans aucune mort"))
          ) {
            matches = true;
          } else if (
            (statKey === "kdPositive" ||
              statKey === "kd" ||
              statKey === "kdOver2") &&
            (target === "kdpositive" ||
              target === "kdover2" ||
              target === "kd" ||
              title.includes("k/d") ||
              desc.includes("k/d"))
          ) {
            matches = true;
          } else if (
            (statKey === "spiScore" || statKey === "spi") &&
            (target === "spiscore" ||
              target === "spi" ||
              title.includes("spi") ||
              desc.includes("spi"))
          ) {
            matches = true;
            if (delta >= 100) isAbsolute = true;
          } else if (target === statKey.toLowerCase()) {
            matches = true;
          }

          if (!matches) return quest;

          const newProgress = isAbsolute
            ? Math.max(quest.progress, delta)
            : Math.max(0, quest.progress + delta);
          const completed = newProgress >= quest.targetValue;
          return {
            ...quest,
            progress: newProgress,
            completed,
          };
        })
      );
    },
    [setPlayerData]
  );

  // ─── Simulateur de match inventé (Panel Admin) ────────────────────
  const handleSimulateMatch = useCallback(
    (simMatch: any) => {
      setPlayerData((prev: any) => {
        if (!prev) return prev;
        const prevMatches = prev.matchHistory || prev.player?.matchHistory || [];
        const updatedMatches = [simMatch, ...prevMatches];

        const prevStats = prev.stats || prev.player?.stats || {};
        const newKills = (prevStats.kills || 0) + simMatch.kills;
        const newDeaths = (prevStats.deaths || 0) + simMatch.deaths;
        const newAssists = (prevStats.assists || 0) + simMatch.assists;
        const newWins = (prevStats.wins || 0) + (simMatch.won ? 1 : 0);
        const newMatchesCount =
          (prevStats.matchesPlayed || prevMatches.length) + 1;
        const newKd = Number((newKills / Math.max(newDeaths, 1)).toFixed(2));
        const newWinRate = Math.round(
          (newWins / Math.max(newMatchesCount, 1)) * 100
        );
        const newAcs = Math.round(
          ((prevStats.acs || 200) * (newMatchesCount - 1) + simMatch.acs) /
            newMatchesCount
        );
        const newHs = Math.round(
          ((prevStats.headshotPct || 25) * (newMatchesCount - 1) +
            simMatch.headshotPct) /
            newMatchesCount
        );

        const updatedStats = {
          ...prevStats,
          kills: newKills,
          deaths: newDeaths,
          assists: newAssists,
          wins: newWins,
          matchesPlayed: newMatchesCount,
          kdRatio: newKd,
          winRate: newWinRate,
          acs: newAcs,
          headshotPct: newHs,
          firstBloods: (prevStats.firstBloods || 0) + (simMatch.firstBloods || 0),
          clutches: (prevStats.clutches || 0) + (simMatch.clutches || 0),
          aceCount: (prevStats.aceCount || 0) + (simMatch.aces || 0),
          flawlessRounds:
            (prevStats.flawlessRounds || 0) + (simMatch.flawlessRounds || 0),
        };

        return {
          ...prev,
          matchHistory: updatedMatches,
          stats: updatedStats,
          player: {
            ...(prev.player || {}),
            matchHistory: updatedMatches,
            stats: updatedStats,
          },
        };
      });

      const matchKd = Number(
        (simMatch.kills / Math.max(simMatch.deaths, 1)).toFixed(2)
      );
      const matchSpi = Math.min(
        1000,
        Math.round(
          simMatch.acs * 1.5 + matchKd * 120 + simMatch.headshotPct * 3
        )
      );
      const simFlawless = simMatch.flawlessRounds ?? 2;

      if (simMatch.kills > 0) handleAdminStatDelta("kills", simMatch.kills);
      if (simMatch.headshots > 0)
        handleAdminStatDelta("headshots", simMatch.headshots);
      if (simMatch.won) handleAdminStatDelta("wins", 1);
      if (simMatch.assists > 0)
        handleAdminStatDelta("assists", simMatch.assists);
      if (simMatch.firstBloods > 0)
        handleAdminStatDelta("firstBloods", simMatch.firstBloods);
      if (simMatch.clutches > 0)
        handleAdminStatDelta("clutches", simMatch.clutches);
      if (simMatch.aces > 0) handleAdminStatDelta("aces", simMatch.aces);
      if (simFlawless > 0)
        handleAdminStatDelta("flawlessRounds", simFlawless);
      if (matchKd > 1.0) handleAdminStatDelta("kdPositive", 1);
      if (matchKd >= 2.0) handleAdminStatDelta("kdOver2", 1);
      if (matchSpi >= 700) handleAdminStatDelta("spiScore", matchSpi);
      handleAdminStatDelta("matchesPlayed", 1);

      sounds.playLevelUp();
    },
    [setPlayerData, handleAdminStatDelta]
  );

  return {
    dailyQuests,
    setDailyQuests,
    trackerXp,
    setTrackerXp,
    trackerLevel,
    setTrackerLevel,
    handleClaimQuest,
    handleAdminXpDelta,
    handleAdminStatDelta,
    handleSimulateMatch,
  };
}
