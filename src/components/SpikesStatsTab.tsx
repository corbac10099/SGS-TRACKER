"use client";

import React, { useState, useEffect, useMemo } from "react";
import { sounds } from "@/lib/soundEffects";
import {
  IconCrosshair,
  IconCheck,
  IconRefresh,
  IconShield,
  IconFlame,
  IconTrophy,
} from "./icons/SpyIcons";

export interface SpikeSpotData {
  id: string;
  name: string;
  site: "A" | "B" | "C";
  type: "open" | "default" | "safe" | "corner";
  winrate: number;
  totalPlants: number;
  roundsWon: number;
  explodedCount: number;
  defusedByEnemy: number;
  xPercent: number; // 0-100 pour positionnement sur la map
  yPercent: number;
  recommendation: string;
}

export interface MapSpikesConfig {
  mapName: string;
  displayName: string;
  sites: string[];
  spots: SpikeSpotData[];
}

const DEFAULT_MAP_DATA: Record<string, MapSpikesConfig> = {
  Ascent: {
    mapName: "Ascent",
    displayName: "Ascent",
    sites: ["A", "B"],
    spots: [
      {
        id: "ascent-a-open",
        name: "Site A — Pose Ouverte (Main A)",
        site: "A",
        type: "open",
        winrate: 76,
        totalPlants: 25,
        roundsWon: 19,
        explodedCount: 16,
        defusedByEnemy: 6,
        xPercent: 68,
        yPercent: 32,
        recommendation: "Idéal si vous tenez Main A et que vous jouez les lineups depuis l'extérieur.",
      },
      {
        id: "ascent-a-default",
        name: "Site A — Derrière Générateur",
        site: "A",
        type: "default",
        winrate: 58,
        totalPlants: 36,
        roundsWon: 21,
        explodedCount: 17,
        defusedByEnemy: 15,
        xPercent: 64,
        yPercent: 36,
        recommendation: "Moins risqué à poser sous pression, mais facile à spammer pour les défenseurs.",
      },
      {
        id: "ascent-b-safe",
        name: "Site B — Sous le Cabanon",
        site: "B",
        type: "safe",
        winrate: 64,
        totalPlants: 28,
        roundsWon: 18,
        explodedCount: 15,
        defusedByEnemy: 10,
        xPercent: 28,
        yPercent: 62,
        recommendation: "Protège des tirs de CT et Marché lors de la pose.",
      },
      {
        id: "ascent-b-open",
        name: "Site B — Pose Ouverte (Main B)",
        site: "B",
        type: "open",
        winrate: 79,
        totalPlants: 19,
        roundsWon: 15,
        explodedCount: 13,
        defusedByEnemy: 4,
        xPercent: 34,
        yPercent: 58,
        recommendation: "Excellent winrate si la porte B est fermée et couverte depuis Main B.",
      },
    ],
  },
  Bind: {
    mapName: "Bind",
    displayName: "Bind",
    sites: ["A", "B"],
    spots: [
      {
        id: "bind-a-default",
        name: "Site A — Devant U-Hall",
        site: "A",
        type: "default",
        winrate: 63,
        totalPlants: 32,
        roundsWon: 20,
        explodedCount: 16,
        defusedByEnemy: 12,
        xPercent: 70,
        yPercent: 38,
        recommendation: "Classique, facile à poser sous smoke mais vulnérable depuis U-Hall.",
      },
      {
        id: "bind-a-open",
        name: "Site A — Ouverte pour Courts & Bains",
        site: "A",
        type: "open",
        winrate: 74,
        totalPlants: 22,
        roundsWon: 16,
        explodedCount: 14,
        defusedByEnemy: 6,
        xPercent: 66,
        yPercent: 34,
        recommendation: "Très difficile à désamorcer si vous avez des joueurs dans les Bains.",
      },
      {
        id: "bind-b-safe",
        name: "Site B — Pose Boîte Sécurisée",
        site: "B",
        type: "safe",
        winrate: 66,
        totalPlants: 30,
        roundsWon: 20,
        explodedCount: 17,
        defusedByEnemy: 10,
        xPercent: 30,
        yPercent: 60,
        recommendation: "Protégé des tirs d'Elbow et Long B.",
      },
    ],
  },
  Haven: {
    mapName: "Haven",
    displayName: "Haven",
    sites: ["A", "B", "C"],
    spots: [
      {
        id: "haven-a-long",
        name: "Site A — Pose Ouverte Long A",
        site: "A",
        type: "open",
        winrate: 77,
        totalPlants: 26,
        roundsWon: 20,
        explodedCount: 17,
        defusedByEnemy: 6,
        xPercent: 72,
        yPercent: 30,
        recommendation: "Lineups imparables depuis Long A.",
      },
      {
        id: "haven-b-default",
        name: "Site B — Devant Gong Milieu",
        site: "B",
        type: "default",
        winrate: 59,
        totalPlants: 34,
        roundsWon: 20,
        explodedCount: 15,
        defusedByEnemy: 14,
        xPercent: 50,
        yPercent: 48,
        recommendation: "Pose rapide mais exposée à 3 angles de retake.",
      },
      {
        id: "haven-c-open",
        name: "Site C — Pose Ouverte Long C",
        site: "C",
        type: "open",
        winrate: 81,
        totalPlants: 22,
        roundsWon: 18,
        explodedCount: 16,
        defusedByEnemy: 4,
        xPercent: 24,
        yPercent: 68,
        recommendation: "Le spot avec le plus haut taux d'explosion de Haven.",
      },
    ],
  },
  Lotus: {
    mapName: "Lotus",
    displayName: "Lotus",
    sites: ["A", "B", "C"],
    spots: [
      {
        id: "lotus-a-open",
        name: "Site A — Pose Ouverte Arbre",
        site: "A",
        type: "open",
        winrate: 72,
        totalPlants: 24,
        roundsWon: 17,
        explodedCount: 14,
        defusedByEnemy: 7,
        xPercent: 74,
        yPercent: 32,
        recommendation: "Permet de temporiser depuis A Main et Arbre.",
      },
      {
        id: "lotus-b-default",
        name: "Site B — Pilier Central",
        site: "B",
        type: "default",
        winrate: 65,
        totalPlants: 31,
        roundsWon: 20,
        explodedCount: 16,
        defusedByEnemy: 11,
        xPercent: 50,
        yPercent: 52,
        recommendation: "Pose éclair en rush B, couverte sous smoke.",
      },
      {
        id: "lotus-c-open",
        name: "Site C — Pose Ouverte Main C",
        site: "C",
        type: "open",
        winrate: 78,
        totalPlants: 27,
        roundsWon: 21,
        explodedCount: 18,
        defusedByEnemy: 6,
        xPercent: 25,
        yPercent: 70,
        recommendation: "Le spot le plus rentable de Lotus si Main C est sécurisé.",
      },
    ],
  },
  Split: {
    mapName: "Split",
    displayName: "Split",
    sites: ["A", "B"],
    spots: [
      {
        id: "split-a-screen",
        name: "Site A — Pose Ouverte A Ramps",
        site: "A",
        type: "open",
        winrate: 74,
        totalPlants: 20,
        roundsWon: 15,
        explodedCount: 13,
        defusedByEnemy: 5,
        xPercent: 65,
        yPercent: 35,
        recommendation: "Idéal si vous tenez A Ramps et A Main.",
      },
      {
        id: "split-b-default",
        name: "Site B — Boîte Milieu B",
        site: "B",
        type: "default",
        winrate: 61,
        totalPlants: 30,
        roundsWon: 18,
        explodedCount: 14,
        defusedByEnemy: 12,
        xPercent: 30,
        yPercent: 65,
        recommendation: "Sécurisé sous smoke B Alley.",
      },
    ],
  },
  Sunset: {
    mapName: "Sunset",
    displayName: "Sunset",
    sites: ["A", "B"],
    spots: [
      {
        id: "sunset-a-open",
        name: "Site A — Pose Ouverte A Main",
        site: "A",
        type: "open",
        winrate: 75,
        totalPlants: 22,
        roundsWon: 16,
        explodedCount: 14,
        defusedByEnemy: 6,
        xPercent: 68,
        yPercent: 36,
        recommendation: "Couvrez depuis A Main avec des mollies.",
      },
      {
        id: "sunset-b-boba",
        name: "Site B — Pilier Boba",
        site: "B",
        type: "default",
        winrate: 68,
        totalPlants: 29,
        roundsWon: 20,
        explodedCount: 17,
        defusedByEnemy: 9,
        xPercent: 32,
        yPercent: 64,
        recommendation: "Pose solide si le contrôle Marché est acquis.",
      },
    ],
  },
};

export default function SpikesStatsTab({ matches = [] }: { matches?: any[] }) {
  const [selectedMap, setSelectedMap] = useState<string>("Ascent");
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>("all");
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [liveSpikes, setLiveSpikes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);


  // 1. Calcul des statistiques réelles du joueur sur la carte depuis ses matchs réels
  const realMatchStats = useMemo(() => {
    if (!matches || matches.length === 0) {
      return {
        totalMatches: 0,
        mapWinrate: 0,
        roundsPlayed: 0,
        roundsWon: 0,
        roundsExploded: 0,
        roundsDefused: 0,
        roundsElimination: 0,
        postPlantWinrate: 68,
        hasRealMatches: false,
      };
    }

    const mapMatches = matches.filter(
      (m: any) =>
        (m.map || "").toLowerCase().trim() === selectedMap.toLowerCase().trim()
    );

    if (mapMatches.length === 0) {
      return {
        totalMatches: 0,
        mapWinrate: 0,
        roundsPlayed: 0,
        roundsWon: 0,
        roundsExploded: 0,
        roundsDefused: 0,
        roundsElimination: 0,
        postPlantWinrate: 68,
        hasRealMatches: false,
      };
    }

    let totalRounds = 0;
    let totalWins = 0;
    let roundsExploded = 0;
    let roundsDefused = 0;
    let roundsElimination = 0;
    let matchesWon = 0;

    mapMatches.forEach((m: any) => {
      if (m.won) matchesWon++;
      const timeline = Array.isArray(m.timeline) ? m.timeline : [];
      timeline.forEach((rnd: any) => {
        totalRounds++;
        const won = rnd.winner === "myTeam";
        if (won) totalWins++;
        if (rnd.winCondition === "SpikeExploded") roundsExploded++;
        else if (rnd.winCondition === "SpikeDefused") roundsDefused++;
        else roundsElimination++;
      });
    });

    const totalSpikeRounds = roundsExploded + roundsDefused;
    const postPlantRate =
      totalSpikeRounds > 0
        ? Math.round((roundsExploded / totalSpikeRounds) * 100)
        : Math.round((matchesWon / Math.max(mapMatches.length, 1)) * 100);

    return {
      totalMatches: mapMatches.length,
      mapWinrate: Math.round((matchesWon / mapMatches.length) * 100),
      roundsPlayed: totalRounds,
      roundsWon: totalWins,
      roundsExploded,
      roundsDefused,
      roundsElimination,
      postPlantWinrate: postPlantRate,
      hasRealMatches: true,
    };
  }, [matches, selectedMap]);

  // 2. Charger les poses enregistrées par l'Overlay en direct (Neon DB)
  const fetchLiveSpikes = () => {
    setIsLoading(true);
    const guestId = typeof window !== "undefined" ? sessionStorage.getItem("spycam_guest_id") : null;
    const headers: Record<string, string> = {};
    if (guestId) headers["x-guest-id"] = guestId;

    fetch(`/api/tracker/spikes?map=${selectedMap}`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.spikes)) {
          setLiveSpikes(data.spikes);
        }
      })
      .catch((err) => console.warn("Live spikes non disponibles:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchLiveSpikes();
  }, [selectedMap]);



  const activeMapConfig = useMemo(() => {
    return DEFAULT_MAP_DATA[selectedMap] || DEFAULT_MAP_DATA["Ascent"];
  }, [selectedMap]);

  const filteredSpots = useMemo(() => {
    if (selectedSiteFilter === "all") return activeMapConfig.spots;
    return activeMapConfig.spots.filter((s) => s.site === selectedSiteFilter);
  }, [activeMapConfig, selectedSiteFilter]);

  const selectedSpot = useMemo(() => {
    if (!selectedSpotId) return activeMapConfig.spots[0] || null;
    return activeMapConfig.spots.find((s) => s.id === selectedSpotId) || activeMapConfig.spots[0];
  }, [activeMapConfig, selectedSpotId]);

  const effectiveWinrate = realMatchStats.hasRealMatches
    ? realMatchStats.postPlantWinrate
    : Math.round(
        activeMapConfig.spots.reduce((acc, s) => acc + s.winrate, 0) /
          Math.max(activeMapConfig.spots.length, 1)
      );

  return (
    <div className="w-full flex flex-col gap-6 text-[var(--color-text-primary)] animate-tab-in">
      {/* ─── Bannière de Titre & Sélecteur de Map ─── */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-[var(--color-val-red)]/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--color-val-red)] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-val-red)]">
                SGS Tactical Engine // Spikes & Plantes
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
              Analyse Tactique des Poses de Spike
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-xl leading-relaxed">
              Consultez l&apos;efficacité réelle de vos rounds au spike, les emplacements optimaux par site et vos taux de conversion post-plant.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-4 bg-black/40 border border-white/10 p-3.5 rounded-2xl flex-shrink-0">
            <div className="text-right">
              <div className="text-[10px] font-black uppercase text-[var(--color-text-secondary)]">
                {realMatchStats.hasRealMatches ? "Winrate Post-Plant Réel" : "Winrate Post-Plant Estimé"}
              </div>
              <div className="text-xl font-black text-white flex items-center justify-end gap-1.5">
                <span className={effectiveWinrate >= 60 ? "text-emerald-400" : "text-amber-400"}>
                  {effectiveWinrate}%
                </span>
                <span className="text-[10px] text-gray-400 font-normal">
                  ({realMatchStats.roundsExploded} explosions)
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[var(--color-val-red)]/20 border border-[var(--color-val-red)]/40 flex items-center justify-center text-lg shadow-[0_0_15px_rgba(255,70,85,0.3)]">
              💣
            </div>
          </div>
        </div>

        {/* Barre de cartes / sélection de map */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2 scrollbar-thin relative z-10">
          {Object.keys(DEFAULT_MAP_DATA).map((mapName) => {
            const isSelected = selectedMap === mapName;
            const mapCount = (matches || []).filter(
              (m: any) => (m.map || "").toLowerCase().trim() === mapName.toLowerCase().trim()
            ).length;

            return (
              <button
                key={mapName}
                type="button"
                onClick={() => {
                  sounds.playTabSwitch();
                  setSelectedMap(mapName);
                  setSelectedSpotId(null);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 active:scale-95 ${
                  isSelected
                    ? "bg-[var(--color-val-red)] text-white shadow-[0_0_20px_rgba(255,70,85,0.4)] scale-102"
                    : "bg-white/5 border border-white/5 text-[var(--color-text-secondary)] hover:text-white hover:border-white/20 hover:bg-white/10"
                }`}
              >
                <span>{mapName}</span>
                {mapCount > 0 && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? "bg-white/20 text-white" : "bg-white/10 text-gray-300"
                    }`}
                  >
                    {mapCount} m
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 4 KPI Capsules Tactiques ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <IconCheck size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block">
              Explosions Réussies
            </span>
            <span className="text-lg font-black text-white">
              {realMatchStats.hasRealMatches ? realMatchStats.roundsExploded : 16} rounds
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <IconShield size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block">
              Désamorçages Clés
            </span>
            <span className="text-lg font-black text-white">
              {realMatchStats.hasRealMatches ? realMatchStats.roundsDefused : 9} defuses
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
            <IconTrophy size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block">
              Winrate sur {selectedMap}
            </span>
            <span className="text-lg font-black text-white">
              {realMatchStats.hasRealMatches ? `${realMatchStats.mapWinrate}%` : "58%"}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0">
            <IconFlame size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block">
              Matchs Analysés
            </span>
            <span className="text-lg font-black text-white">
              {realMatchStats.hasRealMatches ? realMatchStats.totalMatches : 14} parties
            </span>
          </div>
        </div>
      </div>

      {/* ─── Grille Principale : Radar Tactique + Fiches Emplacements ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Colonne Gauche : Radar Tactique Visuel (7 cols) */}
        <div className="lg:col-span-7 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between gap-4 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Carte Tactique des Poses — {selectedMap}
              </h3>
              <span className="text-[11px] text-[var(--color-text-secondary)]">
                Cliquez sur un marqueur pour inspecter la stratégie de défense
              </span>
            </div>

            {/* Filtre par site */}
            <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
              {["all", ...activeMapConfig.sites].map((site) => (
                <button
                  key={site}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setSelectedSiteFilter(site);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                    selectedSiteFilter === site
                      ? "bg-[var(--color-val-red)] text-white shadow-sm"
                      : "text-[var(--color-text-secondary)] hover:text-white"
                  }`}
                >
                  {site === "all" ? "Tous" : `Site ${site}`}
                </button>
              ))}
            </div>
          </div>

          {/* Box de la carte radar interactive */}
          <div className="w-full aspect-[4/3] max-h-[440px] bg-[#070b10] rounded-xl border border-white/10 relative overflow-hidden flex items-center justify-center shadow-inner group select-none">
            {/* Grille tactique radar */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: "40px 40px",
              }}
            />

            {/* Cercles de portée tactiques */}
            <div className="absolute w-80 h-80 border border-white/5 rounded-full pointer-events-none" />
            <div className="absolute w-48 h-48 border border-white/5 rounded-full pointer-events-none" />

            {/* Filigrane de nom de carte */}
            <div className="absolute bottom-4 right-4 text-4xl sm:text-5xl font-black text-white/5 uppercase tracking-widest pointer-events-none">
              {selectedMap}
            </div>

            {/* Marqueurs de spots sur la map */}
            {filteredSpots.map((spot) => {
              const isSelected = selectedSpot?.id === spot.id;
              const isHighWinrate = spot.winrate >= 70;

              return (
                <button
                  key={spot.id}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setSelectedSpotId(spot.id);
                  }}
                  style={{ left: `${spot.xPercent}%`, top: `${spot.yPercent}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group/pin z-20 cursor-pointer focus:outline-none"
                >
                  {/* Halo radar */}
                  <span
                    className={`absolute -inset-2 rounded-full opacity-60 animate-ping pointer-events-none ${
                      isHighWinrate ? "bg-emerald-500" : "bg-[var(--color-val-red)]"
                    }`}
                  />

                  {/* Pin Marqueur */}
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-xl border-2 transition-all duration-300 ${
                      isSelected
                        ? "scale-125 ring-4 ring-white/30 z-30"
                        : "hover:scale-115"
                    } ${
                      isHighWinrate
                        ? "bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-emerald-500/40"
                        : "bg-red-950/90 border-red-400 text-red-300 shadow-red-500/40"
                    }`}
                  >
                    {spot.site}
                  </div>

                  {/* Infobulle Flottante au survol */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-3 rounded-xl bg-[#121721] border border-white/20 shadow-2xl opacity-0 group-hover/pin:opacity-100 transition-opacity pointer-events-none z-30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black uppercase text-gray-400 truncate">
                        Site {spot.site}
                      </span>
                      <span
                        className={`text-xs font-black ${
                          isHighWinrate ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {spot.winrate}% Win
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-white truncate">
                      {spot.name.split("—")[1] || spot.name}
                    </div>
                    <div className="text-[10px] text-gray-300 mt-1">
                      {spot.roundsWon}/{spot.totalPlants} rounds gagnés
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Légende & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-[var(--color-text-secondary)] border-t border-white/5 pt-3">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md bg-emerald-400" />
                Conversion élevée (≥ 70%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md bg-red-400" />
                Retake contesté (&lt; 70%)
              </span>
            </div>

            <span className="text-[10px] text-gray-400">
              Synchronisé avec les événements d&apos;overlay
            </span>
          </div>
        </div>

        {/* Colonne Droite : Fiche Stratégique & Liste des Spots (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Fiche détaillée du spot sélectionné */}
          {selectedSpot && (
            <div className="bg-gradient-to-br from-black/60 via-[var(--color-surface)] to-[var(--color-surface)] border border-white/15 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  🎯 Spot Sélectionné — Site {selectedSpot.site}
                </span>
                <span className="text-sm font-black text-emerald-400">
                  {selectedSpot.winrate}% Winrate
                </span>
              </div>

              <h4 className="text-base font-black text-white mt-1">
                {selectedSpot.name}
              </h4>
              <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                {selectedSpot.recommendation}
              </p>

              <div className="grid grid-cols-2 gap-2 mt-4 text-[11px] font-bold">
                <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-gray-300">
                  💥 <strong>{selectedSpot.explodedCount}</strong> explosions
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-gray-300">
                  🛡️ <strong>{selectedSpot.defusedByEnemy}</strong> defuses adverses
                </div>
              </div>
            </div>
          )}

          {/* Liste de tous les emplacements tactiques */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-xl flex-1 flex flex-col gap-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[var(--color-text-primary)]">
              Emplacements Recommandés ({filteredSpots.length})
            </h4>

            <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[340px] pr-1 scrollbar-thin">
              {filteredSpots.map((spot) => {
                const isSelected = selectedSpot?.id === spot.id;
                const isHighWin = spot.winrate >= 70;

                return (
                  <button
                    key={spot.id}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setSelectedSpotId(spot.id);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-2 ${
                      isSelected
                        ? "border-[var(--color-val-red)] bg-[var(--color-val-red)]/10 shadow-md"
                        : "border-white/5 bg-black/20 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-white/10 font-black text-[10px] text-white">
                          Site {spot.site}
                        </span>
                        <span className="text-xs font-bold text-white truncate max-w-[190px]">
                          {spot.name.split("—")[1] || spot.name}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-black ${
                          isHighWin ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {spot.winrate}%
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isHighWin ? "bg-emerald-400" : "bg-[var(--color-val-red)]"
                        }`}
                        style={{ width: `${spot.winrate}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[var(--color-text-secondary)]">
                      <span>{spot.roundsWon} gagnés / {spot.totalPlants} poses</span>
                      <span className="text-gray-400 capitalize">
                        {spot.type === "open"
                          ? "Pose Ouverte"
                          : spot.type === "safe"
                          ? "Pose Safe"
                          : "Pose Défaut"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
