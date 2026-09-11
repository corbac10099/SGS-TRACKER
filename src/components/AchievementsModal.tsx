"use client";

import React, { useState, useMemo } from "react";
import { sounds } from "@/lib/soundEffects";
import { IconTrophy, IconStar, IconFlame, IconCrosshair, IconGamepad } from "./icons/SpyIcons";

export interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: any;
  matches: any[];
  playerName?: string;
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  category: "combat" | "progression" | "special";
  tier: "bronze" | "silver" | "gold" | "radiant";
  points: number;
  currentValue: number;
  targetValue: number;
  isUnlocked: boolean;
  unit?: string;
  iconType: "trophy" | "star" | "flame" | "crosshair" | "gamepad";
}

export default function AchievementsModal({
  isOpen,
  onClose,
  stats,
  matches = [],
  playerName = "Joueur",
}: AchievementsModalProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "unlocked" | "locked">("all");

  const achievementsList = useMemo<AchievementItem[]>(() => {
    if (!stats) return [];

    const kd = parseFloat(stats.kdRatio || stats.kd || 0);
    const hs = parseFloat(stats.headshotPct || stats.headshotPercentage || 0);
    const acs = parseFloat(stats.acs || stats.combatScore || 0);
    const winRate = parseFloat(stats.winRate || 0);
    const matchesCount = stats.matchesPlayed || matches.length || 0;
    const kast = parseFloat(stats.kast || 0);
    const aceCount = stats.aceCount || matches.filter((m) => m.aceCount > 0).length || 0;

    // Calcul de la plus longue série de victoires dans les matchs
    let maxWinStreak = 0;
    let currentWinStreak = 0;
    matches.forEach((m) => {
      if (m.won) {
        currentWinStreak++;
        if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
      } else {
        currentWinStreak = 0;
      }
    });

    // Cartes distinctes remportées
    const uniqueMapsWon = new Set(matches.filter((m) => m.won).map((m) => m.map)).size;

    return [
      {
        id: "ach-1",
        title: "Tireur d'Élite",
        description: "Maintenir un taux de tir à la tête supérieur ou égal à 25%",
        category: "combat",
        tier: "silver",
        points: 50,
        currentValue: hs,
        targetValue: 25,
        unit: "%",
        isUnlocked: hs >= 25,
        iconType: "crosshair",
      },
      {
        id: "ach-2",
        title: "Visée Chirurgicale",
        description: "Franchir le palier Radiant de 32% de Headshots",
        category: "combat",
        tier: "radiant",
        points: 150,
        currentValue: hs,
        targetValue: 32,
        unit: "%",
        isUnlocked: hs >= 32,
        iconType: "crosshair",
      },
      {
        id: "ach-3",
        title: "Moissonneur de Frags",
        description: "Afficher un ratio K/D supérieur ou égal à 1.25",
        category: "combat",
        tier: "silver",
        points: 60,
        currentValue: kd,
        targetValue: 1.25,
        isUnlocked: kd >= 1.25,
        iconType: "flame",
      },
      {
        id: "ach-4",
        title: "Démon du Duel",
        description: "Maintenir un ratio K/D destructeur de 1.50 ou plus",
        category: "combat",
        tier: "gold",
        points: 120,
        currentValue: kd,
        targetValue: 1.50,
        isUnlocked: kd >= 1.50,
        iconType: "flame",
      },
      {
        id: "ach-5",
        title: "Force de la Victoire",
        description: "Maintenir un taux de victoire global d'au moins 55%",
        category: "progression",
        tier: "silver",
        points: 50,
        currentValue: winRate,
        targetValue: 55,
        unit: "%",
        isUnlocked: winRate >= 55,
        iconType: "trophy",
      },
      {
        id: "ach-6",
        title: "Série Royale",
        description: "Enchaîner au moins 4 victoires consécutives",
        category: "special",
        tier: "gold",
        points: 100,
        currentValue: maxWinStreak,
        targetValue: 4,
        unit: " V",
        isUnlocked: maxWinStreak >= 4,
        iconType: "trophy",
      },
      {
        id: "ach-7",
        title: "Vétéran de l'Arène",
        description: "Disputer au moins 25 parties enregistrées sur le tracker",
        category: "progression",
        tier: "bronze",
        points: 30,
        currentValue: matchesCount,
        targetValue: 25,
        unit: " parties",
        isUnlocked: matchesCount >= 25,
        iconType: "gamepad",
      },
      {
        id: "ach-8",
        title: "Légende Incontournable",
        description: "Franchir le cap des 100 parties disputées",
        category: "progression",
        tier: "radiant",
        points: 200,
        currentValue: matchesCount,
        targetValue: 100,
        unit: " parties",
        isUnlocked: matchesCount >= 100,
        iconType: "gamepad",
      },
      {
        id: "ach-9",
        title: "Impact Ultime",
        description: "Obtenir un score moyen de combat (ACS) de 250 ou plus",
        category: "combat",
        tier: "gold",
        points: 100,
        currentValue: acs,
        targetValue: 250,
        unit: " ACS",
        isUnlocked: acs >= 250,
        iconType: "star",
      },
      {
        id: "ach-10",
        title: "Pilier d'Équipe",
        description: "Maintenir un taux KAST (Kill, Assist, Survived, Traded) de 70%+",
        category: "special",
        tier: "silver",
        points: 70,
        currentValue: kast,
        targetValue: 70,
        unit: "%",
        isUnlocked: kast >= 70,
        iconType: "star",
      },
      {
        id: "ach-11",
        title: "As de l'Élimination (ACE)",
        description: "Avoir réalisé au moins un ACE (élimination de toute l'équipe adverse)",
        category: "special",
        tier: "gold",
        points: 100,
        currentValue: aceCount > 0 ? 1 : 0,
        targetValue: 1,
        unit: " ACE",
        isUnlocked: aceCount > 0,
        iconType: "flame",
      },
      {
        id: "ach-12",
        title: "Maître Cartographe",
        description: "Gagner sur au moins 4 cartes différentes sur Valorant",
        category: "special",
        tier: "silver",
        points: 60,
        currentValue: uniqueMapsWon,
        targetValue: 4,
        unit: " cartes",
        isUnlocked: uniqueMapsWon >= 4,
        iconType: "trophy",
      },
    ];
  }, [stats, matches]);

  const filteredAchievements = useMemo(() => {
    if (activeFilter === "unlocked") return achievementsList.filter((a) => a.isUnlocked);
    if (activeFilter === "locked") return achievementsList.filter((a) => !a.isUnlocked);
    return achievementsList;
  }, [achievementsList, activeFilter]);

  const totalPointsEarned = useMemo(() => {
    return achievementsList
      .filter((a) => a.isUnlocked)
      .reduce((acc, curr) => acc + curr.points, 0);
  }, [achievementsList]);

  const totalPossiblePoints = useMemo(() => {
    return achievementsList.reduce((acc, curr) => acc + curr.points, 0);
  }, [achievementsList]);

  const unlockedCount = achievementsList.filter((a) => a.isUnlocked).length;

  if (!isOpen) return null;

  const renderIcon = (type: AchievementItem["iconType"], size = 20) => {
    switch (type) {
      case "crosshair":
        return <IconCrosshair size={size} />;
      case "flame":
        return <IconFlame size={size} />;
      case "star":
        return <IconStar size={size} />;
      case "gamepad":
        return <IconGamepad size={size} />;
      case "trophy":
      default:
        return <IconTrophy size={size} />;
    }
  };

  const getTierColor = (tier: AchievementItem["tier"]) => {
    switch (tier) {
      case "radiant":
        return "text-amber-300 border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-red-500/20 shadow-[0_0_15px_rgba(245,158,11,0.3)]";
      case "gold":
        return "text-yellow-400 border-yellow-500/40 bg-yellow-500/10";
      case "silver":
        return "text-neutral-300 border-neutral-400/30 bg-neutral-500/10";
      case "bronze":
      default:
        return "text-amber-600 border-amber-700/30 bg-amber-700/10";
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="glass-panel rounded-3xl p-6 max-w-3xl w-full border border-[var(--color-border)] shadow-2xl space-y-5 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg">
              <IconTrophy size={22} />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-widest text-white">
                Succès &amp; Hauts Faits Débloquables
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Profil de <strong className="text-white">{playerName}</strong> — {unlockedCount}/{achievementsList.length} succès validés
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Bannière de score XP / Gamerscore */}
        <div className="glass-card p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0 bg-gradient-to-r from-[var(--color-val-red)]/10 via-black/40 to-amber-500/10">
          <div className="flex items-center gap-4">
            <div className="text-center sm:text-left">
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] tracking-wider">
                Score d&apos;Accomplissement
              </span>
              <div className="text-2xl font-black text-amber-300">
                {totalPointsEarned} <span className="text-xs text-white/50 font-normal">/ {totalPossiblePoints} pts</span>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
            <button
              onClick={() => {
                sounds.playTabSwitch();
                setActiveFilter("all");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFilter === "all" ? "bg-[var(--color-val-red)] text-[var(--color-accent-contrast,#ffffff)] shadow-accent-sm" : "text-white/60 hover:text-white"
              }`}
            >
              Tous ({achievementsList.length})
            </button>
            <button
              onClick={() => {
                sounds.playTabSwitch();
                setActiveFilter("unlocked");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFilter === "unlocked" ? "bg-emerald-600 text-white" : "text-white/60 hover:text-white"
              }`}
            >
              Débloqués ({unlockedCount})
            </button>
            <button
              onClick={() => {
                sounds.playTabSwitch();
                setActiveFilter("locked");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFilter === "locked" ? "bg-white/15 text-white" : "text-white/60 hover:text-white"
              }`}
            >
              En Cours ({achievementsList.length - unlockedCount})
            </button>
          </div>
        </div>

        {/* Grille scrollable des succès */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[300px]">
          {filteredAchievements.map((ach) => {
            const percent = Math.min(100, Math.round((ach.currentValue / ach.targetValue) * 100));

            return (
              <div
                key={ach.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                  ach.isUnlocked
                    ? "glass-panel border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.12)]"
                    : "glass-card border-white/5 opacity-70 hover:opacity-100"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                        ach.isUnlocked
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                          : "bg-white/5 text-white/40 border-white/10"
                      }`}
                    >
                      {renderIcon(ach.iconType, 18)}
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-black text-white">{ach.title}</h4>
                        <span
                          className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.2 rounded border ${getTierColor(
                            ach.tier
                          )}`}
                        >
                          {ach.tier}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                        {ach.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className="text-xs font-black text-amber-300 font-mono">
                      +{ach.points} pts
                    </span>
                    {ach.isUnlocked ? (
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 mt-1">
                        Débloqué ✓
                      </span>
                    ) : (
                      <span className="text-[9px] text-white/40 uppercase tracking-wider mt-1">
                        Verrouillé
                      </span>
                    )}
                  </div>
                </div>

                {/* Progression */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-[var(--color-text-secondary)]">
                      Progression :{" "}
                      <strong className={ach.isUnlocked ? "text-emerald-400" : "text-white"}>
                        {ach.currentValue}
                        {ach.unit || ""}
                      </strong>{" "}
                      / {ach.targetValue}
                      {ach.unit || ""}
                    </span>
                    <span className="text-white/60 font-bold">{percent}%</span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        ach.isUnlocked
                          ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)]"
                          : "bg-[var(--color-val-red)]/70"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
