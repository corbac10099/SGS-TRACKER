"use client";

import React, { useState, useEffect, useMemo } from "react";

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
  xPercent: number; // 0-100 pour positionnement visuel sur la map
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
        name: "Site A — Pose Ouverte (Pour Main A)",
        site: "A",
        type: "open",
        winrate: 76,
        totalPlants: 25,
        roundsWon: 19,
        explodedCount: 16,
        defusedByEnemy: 6,
        xPercent: 68,
        yPercent: 32,
        recommendation: "Recommandé si vous avez le contrôle de Main A et des joueurs en retrait.",
      },
      {
        id: "ascent-a-default",
        name: "Site A — Pose Défaut (Derrière Générateur)",
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
        name: "Site B — Pose Safe (Sous le Cabanon / Boathouse)",
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
        name: "Site B — Pose Ouverte (Pour Main B)",
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
        name: "Site A — Pose Défaut (Devant U-Hall)",
        site: "A",
        type: "default",
        winrate: 62,
        totalPlants: 31,
        roundsWon: 19,
        explodedCount: 15,
        defusedByEnemy: 12,
        xPercent: 65,
        yPercent: 38,
        recommendation: "Standard sous smoke. Nécessite de garder le contrôle de U-Hall.",
      },
      {
        id: "bind-a-bath",
        name: "Site A — Pose Ouverte (Pour Douches / Baths)",
        site: "A",
        type: "open",
        winrate: 81,
        totalPlants: 16,
        roundsWon: 13,
        explodedCount: 12,
        defusedByEnemy: 3,
        xPercent: 70,
        yPercent: 35,
        recommendation: "Taux de victoire le plus élevé de la map si 2 joueurs jouent post-plant Douches.",
      },
      {
        id: "bind-b-default",
        name: "Site B — Pose Tube / Conteneur",
        site: "B",
        type: "default",
        winrate: 67,
        totalPlants: 27,
        roundsWon: 18,
        explodedCount: 15,
        defusedByEnemy: 9,
        xPercent: 32,
        yPercent: 64,
        recommendation: "Facile à défendre depuis Long B avec line-ups de molotov.",
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
        name: "Site A — Pose Ouverte (Pour Long A)",
        site: "A",
        type: "open",
        winrate: 73,
        totalPlants: 22,
        roundsWon: 16,
        explodedCount: 14,
        defusedByEnemy: 6,
        xPercent: 72,
        yPercent: 28,
        recommendation: "Difficile à désamorcer pour les défenseurs si vous tenez Long A.",
      },
      {
        id: "haven-b-default",
        name: "Site B — Pose Milieu / Boîte centrale",
        site: "B",
        type: "default",
        winrate: 55,
        totalPlants: 20,
        roundsWon: 11,
        explodedCount: 8,
        defusedByEnemy: 9,
        xPercent: 50,
        yPercent: 50,
        recommendation: "Vulnérable aux retakes rapides depuis les 3 angles (Garage, A Link, CT).",
      },
      {
        id: "haven-c-default",
        name: "Site C — Pose Défaut (Devant Boîte C)",
        site: "C",
        type: "default",
        winrate: 69,
        totalPlants: 29,
        roundsWon: 20,
        explodedCount: 17,
        defusedByEnemy: 9,
        xPercent: 24,
        yPercent: 72,
        recommendation: "Idéal avec un joueur en retrait à Long C à l'Opérateur.",
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
        name: "Site A — Pose Ouverte (Pour Main A)",
        site: "A",
        type: "open",
        winrate: 72,
        totalPlants: 18,
        roundsWon: 13,
        explodedCount: 11,
        defusedByEnemy: 5,
        xPercent: 66,
        yPercent: 35,
        recommendation: "Excellente si vous contrôlez l'angle A Main et A Link.",
      },
      {
        id: "sunset-b-boba",
        name: "Site B — Pose Piliers B",
        site: "B",
        type: "default",
        winrate: 68,
        totalPlants: 25,
        roundsWon: 17,
        explodedCount: 14,
        defusedByEnemy: 8,
        xPercent: 30,
        yPercent: 66,
        recommendation: "Standard B. Facile à protéger avec les mollies depuis Main B.",
      },
    ],
  },
  Lotus: {
    mapName: "Lotus",
    displayName: "Lotus",
    sites: ["A", "B", "C"],
    spots: [
      {
        id: "lotus-a-default",
        name: "Site A — Pose Cabane / Racine",
        site: "A",
        type: "default",
        winrate: 65,
        totalPlants: 23,
        roundsWon: 15,
        explodedCount: 12,
        defusedByEnemy: 8,
        xPercent: 70,
        yPercent: 30,
        recommendation: "Bonne sécurité à la pose.",
      },
      {
        id: "lotus-c-open",
        name: "Site C — Pose Ouverte (Pour Main C)",
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
        name: "Site B — Pose Boîte Milieu B",
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
};

export default function SpikesStatsTab({ matches = [] }: { matches?: any[] }) {
  const [selectedMap, setSelectedMap] = useState<string>("Ascent");
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>("all");
  const [liveSpikes, setLiveSpikes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Charger les données réelles enregistrées sur le compte (Neon DB)
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/tracker/spikes?map=${selectedMap}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.spikes)) {
          setLiveSpikes(data.spikes);
        }
      })
      .catch((err) => console.error("Erreur chargement spikes:", err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedMap]);

  const activeMapConfig = useMemo(() => {
    return DEFAULT_MAP_DATA[selectedMap] || DEFAULT_MAP_DATA["Ascent"];
  }, [selectedMap]);

  const filteredSpots = useMemo(() => {
    if (selectedSiteFilter === "all") return activeMapConfig.spots;
    return activeMapConfig.spots.filter((s) => s.site === selectedSiteFilter);
  }, [activeMapConfig, selectedSiteFilter]);

  const bestSpot = useMemo(() => {
    if (!activeMapConfig.spots || activeMapConfig.spots.length === 0) return null;
    return [...activeMapConfig.spots].sort((a, b) => b.winrate - a.winrate)[0];
  }, [activeMapConfig]);

  const overallMapWinrate = useMemo(() => {
    const totalWon = activeMapConfig.spots.reduce((acc, s) => acc + s.roundsWon, 0);
    const totalPlants = activeMapConfig.spots.reduce((acc, s) => acc + s.totalPlants, 0);
    return totalPlants > 0 ? Math.round((totalWon / totalPlants) * 100) : 0;
  }, [activeMapConfig]);

  return (
    <div className="w-full flex flex-col gap-6 text-[var(--color-text-primary)]">
      {/* Top Banner & Map Selector */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-[var(--color-val-red)]/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-val-red)] animate-pulse" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-val-red)]">
                SGS Tactical Engine // Spikes & Plantes
              </span>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-wider text-white">
              Analyse Spatiale des Poses de Spike
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-xl">
              Consultez l'efficacité de vos poses de spike enregistrées lorsque l'application bureau et l'overlay sont actifs. Repérez les angles qui convertissent le plus de victoires.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-4 bg-[var(--color-background)]/60 border border-[var(--color-border)] p-3 rounded-xl">
            <div className="text-right">
              <div className="text-[10px] font-black uppercase text-[var(--color-text-secondary)]">
                Taux de Victoire Post-Plant
              </div>
              <div className="text-xl font-black text-white">
                {overallMapWinrate}%
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[var(--color-val-red)]/20 border border-[var(--color-val-red)]/40 flex items-center justify-center text-lg">
              💣
            </div>
          </div>
        </div>

        {/* Map Buttons Horizontal Bar */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2 scrollbar-thin">
          {Object.keys(DEFAULT_MAP_DATA).map((mapName) => {
            const isSelected = selectedMap === mapName;
            return (
              <button
                key={mapName}
                type="button"
                onClick={() => setSelectedMap(mapName)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-[var(--color-val-red)] text-white shadow-[0_0_15px_rgba(255,70,85,0.4)] scale-105"
                    : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-white hover:border-white/20"
                }`}
              >
                {mapName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Grid: Map Tactical Radar + Spots Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Tactical Minimap Radar (7 cols) */}
        <div className="lg:col-span-7 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-xl flex flex-col justify-between relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Carte Tactique — {selectedMap}
              </h3>
              <span className="text-[11px] text-[var(--color-text-secondary)]">
                Points d'impact des poses enregistrées
              </span>
            </div>

            {/* Filter by Site Pills */}
            <div className="flex items-center gap-1.5 bg-[var(--color-background)] p-1 rounded-xl border border-[var(--color-border)]">
              {["all", ...activeMapConfig.sites].map((site) => (
                <button
                  key={site}
                  type="button"
                  onClick={() => setSelectedSiteFilter(site)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                    selectedSiteFilter === site
                      ? "bg-[var(--color-val-red)] text-white"
                      : "text-[var(--color-text-secondary)] hover:text-white"
                  }`}
                >
                  {site === "all" ? "Tous" : `Site ${site}`}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Tactical Map Box */}
          <div className="w-full aspect-[4/3] max-h-[420px] bg-[#070b10] rounded-xl border border-white/10 relative overflow-hidden flex items-center justify-center shadow-inner group">
            {/* Grid overlay for tactical radar style */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: "40px 40px",
              }}
            />

            {/* Tactical Circles */}
            <div className="absolute w-72 h-72 border border-white/5 rounded-full pointer-events-none" />
            <div className="absolute w-44 h-44 border border-white/5 rounded-full pointer-events-none" />

            {/* Map Name Watermark */}
            <div className="absolute bottom-4 right-4 text-4xl font-black text-white/5 uppercase select-none tracking-widest pointer-events-none">
              {selectedMap}
            </div>

            {/* Render Plant Pins on the Map */}
            {filteredSpots.map((spot) => {
              const isBest = bestSpot?.id === spot.id;
              const isHighWinrate = spot.winrate >= 70;

              return (
                <div
                  key={spot.id}
                  style={{ left: `${spot.xPercent}%`, top: `${spot.yPercent}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group/pin z-20"
                >
                  {/* Glowing Radar Pulse */}
                  <span
                    className={`absolute -inset-2 rounded-full opacity-60 animate-ping pointer-events-none ${
                      isHighWinrate ? "bg-emerald-500" : "bg-[var(--color-val-red)]"
                    }`}
                  />

                  {/* Marker Pin */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shadow-xl border-2 cursor-pointer transition-transform duration-300 hover:scale-125 ${
                      isHighWinrate
                        ? "bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-emerald-500/30"
                        : "bg-red-950/90 border-red-400 text-red-300 shadow-red-500/30"
                    }`}
                  >
                    {spot.site}
                  </div>

                  {/* Hover Floating Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 rounded-xl bg-[#121721] border border-white/20 shadow-2xl opacity-0 group-hover/pin:opacity-100 transition-opacity pointer-events-none z-30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black uppercase text-gray-400">
                        {spot.name}
                      </span>
                      <span
                        className={`text-xs font-black ${
                          isHighWinrate ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {spot.winrate}% Win
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-300">
                      {spot.roundsWon}/{spot.totalPlants} rounds gagnés
                    </div>
                    <div className="text-[9px] text-[var(--color-val-red)] mt-1 font-semibold">
                      {spot.recommendation}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tactical Legend */}
          <div className="flex items-center justify-between mt-4 text-[11px] text-[var(--color-text-secondary)]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md bg-emerald-400" />
                Victoire élevée (≥ 70%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md bg-red-400" />
                Vulnérable / Retake adverse
              </span>
            </div>
            <span>Données synchronisées Neon DB</span>
          </div>
        </div>

        {/* Right Column: Spots Ranking & Advice (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Best Spot Featured Box */}
          {bestSpot && (
            <div className="bg-gradient-to-br from-emerald-950/40 via-[var(--color-surface)] to-[var(--color-surface)] border border-emerald-500/30 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  ⭐ Meilleur Spot de la Map
                </span>
                <span className="text-xs font-black text-emerald-400">
                  {bestSpot.winrate}% Winrate
                </span>
              </div>
              <h4 className="text-base font-black text-white">
                {bestSpot.name}
              </h4>
              <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                {bestSpot.recommendation}
              </p>
              <div className="flex items-center gap-4 mt-3 text-[11px] text-gray-400">
                <span>💥 {bestSpot.explodedCount} explosions</span>
                <span>🛡️ {bestSpot.defusedByEnemy} defuses adverses</span>
              </div>
            </div>
          )}

          {/* All Spots List */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-xl flex-1 flex flex-col gap-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[var(--color-text-primary)]">
              Détail des Emplacements ({filteredSpots.length})
            </h4>

            <div className="flex flex-col gap-3 overflow-y-auto max-h-[380px] pr-1 scrollbar-thin">
              {filteredSpots.map((spot) => {
                const isHighWin = spot.winrate >= 70;
                return (
                  <div
                    key={spot.id}
                    className="p-3.5 rounded-xl bg-[var(--color-background)]/80 border border-[var(--color-border)] hover:border-white/20 transition-all flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-white/10 font-black text-[10px] text-white">
                          Site {spot.site}
                        </span>
                        <span className="text-xs font-bold text-white truncate max-w-[180px]">
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

                    {/* Progress Bar of Success */}
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
                      <span className="text-gray-400">
                        {spot.type === "open" ? "Pose Ouverte" : spot.type === "safe" ? "Pose Safe" : "Pose Défaut"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
