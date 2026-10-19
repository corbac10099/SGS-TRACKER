"use client";

import React, { useState, useEffect, useMemo } from "react";
import VideoPlayer from "./VideoPlayer";
import { tr } from "@/lib/i18n";

export interface Lineup {
  id: string;
  agentUuid?: string;
  agentName: string;
  ability: "C" | "Q" | "E" | "X" | string;
  abilityName?: string;
  map: string;
  mapUuid?: string;
  side: "attack" | "defense" | string;
  site?: "A" | "B" | "C" | "Mid" | string;
  difficulty?: "easy" | "medium" | "hard" | string;
  title: string;
  description?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  tags?: string[];
  createdAt?: string;
}

interface AgentLineupsSectionProps {
  agentName: string;
  agentUuid?: string;
  videoLoop?: boolean;
  videoLoopDelay?: number;
}

const DIFFICULTY_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  easy: {
    label: "Facile",
    color: "#22c55e",
    bg: "rgba(34, 197, 94, 0.15)",
    border: "rgba(34, 197, 94, 0.35)",
  },
  medium: {
    label: "Moyen",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.15)",
    border: "rgba(245, 158, 11, 0.35)",
  },
  hard: {
    label: "Difficile",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.15)",
    border: "rgba(239, 68, 68, 0.35)",
  },
};

const SIDE_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  attack: {
    label: "Attaque",
    color: "#ff4655",
    bg: "rgba(255, 70, 85, 0.15)",
    border: "rgba(255, 70, 85, 0.35)",
  },
  defense: {
    label: "Défense",
    color: "#38bdf8",
    bg: "rgba(56, 189, 248, 0.15)",
    border: "rgba(56, 189, 248, 0.35)",
  },
};

export default function AgentLineupsSection({
  agentName,
  agentUuid,
  videoLoop = true,
  videoLoopDelay = 500,
}: AgentLineupsSectionProps) {
  const [lineups, setLineups] = useState<Lineup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMap, setSelectedMap] = useState<string>("all");
  const [selectedSide, setSelectedSide] = useState<string>("all");
  const [selectedAbility, setSelectedAbility] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [expandedLineupId, setExpandedLineupId] = useState<string | null>(null);

  // Charger les lineups depuis l'API CMS
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const query = new URLSearchParams({ agent: agentName });
    if (agentUuid) query.set("agentUuid", agentUuid);

    fetch(`/api/cms/lineups?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (Array.isArray(data)) {
            setLineups(data);
          } else {
            setLineups([]);
          }
        }
      })
      .catch((err) => {
        console.error("[AgentLineups] Fetch error:", err);
        if (isMounted) setLineups([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [agentName, agentUuid]);

  // Cartes uniques disponibles pour cet agent
  const availableMaps = useMemo(() => {
    const maps = new Set<string>();
    lineups.forEach((l) => {
      if (l.map) maps.add(l.map);
    });
    return Array.from(maps);
  }, [lineups]);

  // Compétences uniques disponibles pour cet agent
  const availableAbilities = useMemo(() => {
    const abMap = new Map<string, string>();
    lineups.forEach((l) => {
      if (l.ability) {
        abMap.set(l.ability.toUpperCase(), l.abilityName || `Touche ${l.ability.toUpperCase()}`);
      }
    });
    return Array.from(abMap.entries()).map(([slot, name]) => ({ slot, name }));
  }, [lineups]);

  // Filtrage dynamique
  const filteredLineups = useMemo(() => {
    return lineups.filter((item) => {
      if (selectedMap !== "all" && item.map.toLowerCase() !== selectedMap.toLowerCase()) {
        return false;
      }
      if (selectedSide !== "all" && item.side.toLowerCase() !== selectedSide.toLowerCase()) {
        return false;
      }
      if (selectedAbility !== "all" && item.ability.toUpperCase() !== selectedAbility.toUpperCase()) {
        return false;
      }
      if (selectedDifficulty !== "all" && (item.difficulty || "medium").toLowerCase() !== selectedDifficulty.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [lineups, selectedMap, selectedSide, selectedAbility, selectedDifficulty]);

  return (
    <div className="w-full">
      {/* Entête de section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-val-red,#ff4655)] animate-pulse" />
            <span className="text-[11px] font-black tracking-widest uppercase text-[var(--color-val-red,#ff4655)]">
              Guide Tactique Vidéo
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white flex items-center gap-2">
            LINEUPS & SETUPS {agentName.toUpperCase()} <span className="text-[var(--color-val-red,#ff4655)]">•</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-xl">
            Retrouvez tous les alignements de flèches, fumigènes, mollies et pièges configurés via AppControl.
          </p>
        </div>

        {/* Compteur */}
        <div className="flex items-center gap-2 text-xs font-mono text-gray-400 bg-white/[0.03] border border-white/10 px-3 py-1.5 rounded-xl self-start md:self-auto">
          <span className="text-white font-bold">{filteredLineups.length}</span>
          <span>/</span>
          <span>{lineups.length} lineups</span>
        </div>
      </div>

      {/* Barre de filtres interactive */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 mb-8 space-y-4">
        {/* Filtre Carte */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 min-w-[70px]">
            Carte :
          </span>
          <button
            onClick={() => setSelectedMap("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              selectedMap === "all"
                ? "bg-[var(--color-val-red,#ff4655)] text-white shadow-[0_0_12px_rgba(255,70,85,0.4)]"
                : "bg-white/[0.04] text-gray-300 hover:text-white hover:bg-white/[0.08] border border-white/5"
            }`}
          >
            Toutes ({lineups.length})
          </button>
          {availableMaps.map((mapName) => {
            const count = lineups.filter((l) => l.map.toLowerCase() === mapName.toLowerCase()).length;
            const isSelected = selectedMap.toLowerCase() === mapName.toLowerCase();
            return (
              <button
                key={mapName}
                onClick={() => setSelectedMap(mapName)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[var(--color-val-red,#ff4655)] text-white shadow-[0_0_12px_rgba(255,70,85,0.4)]"
                    : "bg-white/[0.04] text-gray-300 hover:text-white hover:bg-white/[0.08] border border-white/5"
                }`}
              >
                <span>{mapName}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Filtre Côté (Attaque / Défense) */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 min-w-[70px]">
            Côté :
          </span>
          <button
            onClick={() => setSelectedSide("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              selectedSide === "all"
                ? "bg-white/20 text-white border border-white/30"
                : "bg-white/[0.04] text-gray-300 hover:text-white border border-white/5"
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => setSelectedSide("attack")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
              selectedSide === "attack"
                ? "bg-[rgba(255,70,85,0.25)] text-[#ff4655] border-[#ff4655] shadow-[0_0_12px_rgba(255,70,85,0.3)]"
                : "bg-white/[0.04] text-gray-300 hover:text-white border-white/5"
            }`}
          >
            ⚔️ Attaque
          </button>
          <button
            onClick={() => setSelectedSide("defense")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
              selectedSide === "defense"
                ? "bg-[rgba(56,189,248,0.25)] text-[#38bdf8] border-[#38bdf8] shadow-[0_0_12px_rgba(56,189,248,0.3)]"
                : "bg-white/[0.04] text-gray-300 hover:text-white border-white/5"
            }`}
          >
            🛡️ Défense
          </button>
        </div>

        {/* Filtre Compétence & Difficulté */}
        <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-white/5">
          {/* Touche / Compétence */}
          {availableAbilities.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sort :</span>
              <button
                onClick={() => setSelectedAbility("all")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  selectedAbility === "all" ? "bg-white/20 text-white" : "bg-white/[0.04] text-gray-400 hover:text-white"
                }`}
              >
                Tous
              </button>
              {availableAbilities.map(({ slot, name }) => (
                <button
                  key={slot}
                  onClick={() => setSelectedAbility(slot)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                    selectedAbility === slot
                      ? "bg-[var(--color-val-red,#ff4655)] text-white"
                      : "bg-white/[0.04] text-gray-400 hover:text-white"
                  }`}
                >
                  <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-black/40">{slot}</span>
                  <span className="truncate max-w-[120px]">{name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Difficulté */}
          <div className="flex items-center gap-2 flex-wrap ml-auto">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Difficulté :</span>
            {(["all", "easy", "medium", "hard"] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  selectedDifficulty === diff
                    ? "bg-white/20 text-white border border-white/30"
                    : "bg-white/[0.04] text-gray-400 hover:text-white"
                }`}
              >
                {diff === "all" ? "Toutes" : DIFFICULTY_MAP[diff]?.label || diff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Squelette de chargement */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/10 p-5 bg-white/[0.02] space-y-4 animate-pulse">
              <div className="w-full aspect-video rounded-xl bg-white/5" />
              <div className="h-4 w-3/4 bg-white/10 rounded" />
              <div className="h-3 w-1/2 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* État vide */}
      {!loading && filteredLineups.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl border border-white/10">
            🎯
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-wider text-white mb-1">
              {lineups.length === 0
                ? "Aucun lineup configuré pour cet agent"
                : "Aucun lineup ne correspond à vos filtres"}
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto">
              {lineups.length === 0
                ? `Les vidéos et setups pour ${agentName} peuvent être ajoutés directement depuis le panneau AppControl.`
                : "Essayez de réinitialiser vos filtres (carte, attaque/défense, compétence) pour afficher tous les guides."}
            </p>
          </div>
          {lineups.length > 0 && (
            <button
              onClick={() => {
                setSelectedMap("all");
                setSelectedSide("all");
                setSelectedAbility("all");
                setSelectedDifficulty("all");
              }}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold uppercase tracking-wider text-white transition-colors cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      )}

      {/* Grille des Lineups */}
      {!loading && filteredLineups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLineups.map((lineup) => {
            const sideInfo = SIDE_MAP[lineup.side] || SIDE_MAP.attack;
            const diffInfo = DIFFICULTY_MAP[lineup.difficulty || "medium"] || DIFFICULTY_MAP.medium;
            const isExpanded = expandedLineupId === lineup.id;

            return (
              <div
                key={lineup.id}
                className="group rounded-2xl bg-[#0f1923]/90 border border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden shadow-xl flex flex-col"
              >
                {/* Zone Vidéo ou Aperçu Thumbnail */}
                <div className="relative w-full aspect-video bg-black/80 overflow-hidden border-b border-white/10">
                  {lineup.videoUrl && isExpanded ? (
                    <div className="w-full h-full">
                      <VideoPlayer
                        src={lineup.videoUrl}
                        poster={lineup.thumbnailUrl}
                        autoPlay={true}
                        loop={videoLoop}
                        loopDelayMs={videoLoopDelay}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      onClick={() => setExpandedLineupId(isExpanded ? null : lineup.id)}
                      className="w-full h-full relative cursor-pointer group/thumb"
                    >
                      {lineup.thumbnailUrl ? (
                        <img
                          src={lineup.thumbnailUrl}
                          alt={lineup.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#121620] to-[#070a0f] text-center">
                          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white mb-2 group-hover/thumb:scale-110 group-hover/thumb:bg-[var(--color-val-red,#ff4655)] transition-all shadow-lg">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 translate-x-0.5">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          </div>
                          <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">
                            {lineup.videoUrl ? "Lire le Guide Vidéo" : "Vidéo en cours d'ajout"}
                          </span>
                        </div>
                      )}

                      {/* Badge Carte + Site en haut à gauche */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                        <span className="px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-white border border-white/15">
                          {lineup.map}
                        </span>
                        {lineup.site && (
                          <span className="px-2 py-1 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-black uppercase text-amber-400 border border-amber-400/30">
                            Site {lineup.site}
                          </span>
                        )}
                      </div>

                      {/* Badge Attaque / Défense en haut à droite */}
                      <div className="absolute top-3 right-3 z-10">
                        <span
                          className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border backdrop-blur-md"
                          style={{
                            color: sideInfo.color,
                            backgroundColor: sideInfo.bg,
                            borderColor: sideInfo.border,
                          }}
                        >
                          {sideInfo.label}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Contenu textuel */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Touche et difficulté */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <span className="w-5 h-5 rounded bg-white/10 flex items-center justify-center font-mono text-[10px] text-gray-300">
                          {lineup.ability}
                        </span>
                        <span className="text-gray-300 truncate text-[11px]">
                          {lineup.abilityName || `Touche ${lineup.ability}`}
                        </span>
                      </div>

                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border"
                        style={{
                          color: diffInfo.color,
                          backgroundColor: diffInfo.bg,
                          borderColor: diffInfo.border,
                        }}
                      >
                        {diffInfo.label}
                      </span>
                    </div>

                    {/* Titre */}
                    <h4 className="text-sm sm:text-base font-black uppercase tracking-tight text-white leading-snug group-hover:text-[var(--color-val-red,#ff4655)] transition-colors">
                      {lineup.title}
                    </h4>

                    {/* Description */}
                    {lineup.description && (
                      <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">
                        {lineup.description}
                      </p>
                    )}
                  </div>

                  {/* Tags & Action */}
                  <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(lineup.tags || []).slice(0, 3).map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 rounded bg-white/[0.04] text-[10px] font-mono text-gray-400 border border-white/5 uppercase"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {lineup.videoUrl && (
                      <button
                        onClick={() => setExpandedLineupId(isExpanded ? null : lineup.id)}
                        className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-val-red,#ff4655)] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <span>{isExpanded ? "Fermer" : "Voir"}</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
                          <polyline points={isExpanded ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
