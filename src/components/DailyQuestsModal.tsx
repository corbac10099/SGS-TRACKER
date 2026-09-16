"use client";

import React, { useState, useEffect, useMemo } from "react";
import { sounds } from "@/lib/soundEffects";
import { IconTrophy, IconFlame, IconCrosshair, IconSword, IconShield, IconUsers, IconCheck } from "./icons/SpyIcons";

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  category: string;
  targetStat?: string;
  progress: number;
  targetValue: number;
  xpReward: number;
  completed: boolean;
  claimed: boolean;
}

interface DailyQuestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  xp: number;
  trackerLevel: number;
  quests: DailyQuest[];
  onClaimQuest: (questId: string) => void;
}

// Calcul de l'XP nécessaire pour le prochain niveau (formule exponentielle douce)
function xpForLevel(level: number): number {
  return Math.floor(200 * Math.pow(1.15, level - 1));
}

function xpTotalForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) total += xpForLevel(i);
  return total;
}

// Icône de catégorie de défi
function QuestCategoryIcon({ category, size = 16 }: { category: string; size?: number }) {
  switch (category) {
    case "combat": return <IconSword size={size} />;
    case "precision": return <IconCrosshair size={size} />;
    case "tactical": return <IconShield size={size} />;
    case "social": return <IconUsers size={size} />;
    case "agent": return <IconFlame size={size} />;
    default: return <IconTrophy size={size} />;
  }
}

// Couleur d'accent par catégorie
function categoryAccent(category: string): string {
  switch (category) {
    case "combat": return "#ef4444";
    case "precision": return "#f59e0b";
    case "tactical": return "#3b82f6";
    case "social": return "#8b5cf6";
    case "agent": return "#10b981";
    default: return "var(--color-val-red)";
  }
}

const LEVEL_REWARDS_PREVIEW = [
  { level: 1, type: "badge", title: "Badge Recrue Tracker", description: "Badge officiel de recrue sur votre profil", icon: "🎖️" },
  { level: 2, type: "banner_effect", title: "Effet Cyber Glow", description: "Aura lumineuse pulsante sur votre bannière de profil", icon: "⚡" },
  { level: 3, type: "banner_effect", title: "Effet Scanlines Rétro", description: "Lignes d'écran cathodique arcade sur votre bannière", icon: "📺" },
  { level: 4, type: "badge", title: "Badge Vétéran Spycam", description: "Badge de fidélité affiché sur votre profil", icon: "🛡️" },
  { level: 5, type: "banner_effect", title: "Effet Matrix Rain", description: "Pluie de code digital vert animé sur votre bannière", icon: "🟩" },
  { level: 7, type: "banner_effect", title: "Effet Stardust", description: "Particules d'étoiles scintillantes sur votre bannière", icon: "✨" },
  { level: 10, type: "banner_border", title: "Bordure Tournante Conic RGB", description: "Bordure rotative animée ultra-stylée", icon: "👑" },
  { level: 15, type: "badge", title: "Badge Radiant Master", description: "Badge d'élite suprême Spycam Tracker", icon: "💎" },
];

export default function DailyQuestsModal({
  isOpen,
  onClose,
  xp,
  trackerLevel,
  quests,
  onClaimQuest,
}: DailyQuestsModalProps) {
  const [modalTab, setModalTab] = useState<"quests" | "rewards">("quests");
  const [isClosing, setIsClosing] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState("");

  // Timer de réinitialisation quotidienne (minuit UTC)
  useEffect(() => {
    if (!isOpen) return;
    const update = () => {
      const now = new Date();
      const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
      const diff = tomorrow.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeUntilReset(`${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // XP progression du niveau actuel
  const currentLevelXp = useMemo(() => xpTotalForLevel(trackerLevel), [trackerLevel]);
  const nextLevelXp = useMemo(() => xpForLevel(trackerLevel), [trackerLevel]);
  const xpInLevel = xp - currentLevelXp;
  const xpPercent = Math.min(100, Math.max(0, (xpInLevel / nextLevelXp) * 100));

  const completedCount = quests.filter(q => q.completed).length;

  const handleClose = () => {
    sounds.playClick();
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 250);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 ${
        isClosing ? "animate-drawer-backdrop-out" : "animate-drawer-backdrop"
      }`}
      style={{ backgroundColor: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(6px)" }}
      onClick={handleClose}
    >
      <div
        className={`glass-modal rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto custom-scrollbar ${
          isClosing ? "animate-drawer-content-out" : "animate-player-card-modal"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête : Niveau Tracker */}
        <div className="p-5 sm:p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-val-red)] to-[var(--color-val-red)]/60 flex items-center justify-center shadow-accent-md">
                <span className="text-lg font-black text-white">{trackerLevel}</span>
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-[var(--color-text-primary)] uppercase tracking-wider">
                  Niveau Tracker & Défis
                </h2>
                <p className="text-[10px] sm:text-xs text-[var(--color-text-secondary)] font-medium">
                  Niveau {trackerLevel} • {completedCount}/{quests.length} défi{completedCount > 1 ? "s" : ""} prêt{completedCount > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              onMouseEnter={() => sounds.playHover()}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-[var(--color-text-secondary)] hover:text-white transition-all cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Barre XP */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-[var(--color-text-secondary)] uppercase tracking-wider">XP Progression</span>
              <span className="text-[var(--color-val-red)] font-mono">
                {xpInLevel.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
              </span>
            </div>
            <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${xpPercent}%`,
                  background: `linear-gradient(90deg, var(--color-val-red), color-mix(in srgb, var(--color-val-red) 70%, #ff9800))`,
                  boxShadow: `0 0 10px var(--accent-glow-md)`,
                }}
              />
            </div>
          </div>

          {/* Sélecteur d'onglets Défis / Récompenses */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => { sounds.playClick(); setModalTab("quests"); }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                modalTab === "quests"
                  ? "bg-[var(--color-val-red)] text-white shadow-accent-sm"
                  : "bg-white/5 text-[var(--color-text-secondary)] hover:text-white hover:bg-white/10"
              }`}
            >
              <span>🎯</span>
              <span>Défis Quotidiens</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-black/40 text-white">
                {completedCount}/{quests.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => { sounds.playClick(); setModalTab("rewards"); }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                modalTab === "rewards"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                  : "bg-white/5 text-[var(--color-text-secondary)] hover:text-white hover:bg-white/10"
              }`}
            >
              <span>🎁</span>
              <span>Récompenses</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-black/40 text-white">
                Niv. {trackerLevel}
              </span>
            </button>
          </div>
        </div>

        {/* Onglet 1 : Liste des défis */}
        {modalTab === "quests" && (
          <>
            <div className="p-4 sm:p-5 space-y-3">
              {quests.length === 0 ? (
                <div className="text-center py-10">
                  <IconTrophy size={32} className="mx-auto text-[var(--color-text-secondary)] mb-3" />
                  <p className="text-sm text-[var(--color-text-secondary)] font-medium">
                    Aucun défi disponible pour le moment
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)]/60 mt-1">
                    Les défis sont assignés selon votre rang et votre SPI
                  </p>
                </div>
              ) : (
                quests.map((quest) => {
                  const progressPercent = Math.min(100, (quest.progress / quest.targetValue) * 100);
                  const accent = categoryAccent(quest.category);
                  return (
                    <div
                      key={quest.id}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-300 ${
                        quest.claimed
                          ? "bg-white/[0.02] border-white/5 opacity-50"
                          : quest.completed
                          ? "bg-emerald-500/[0.06] border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                          : "bg-white/[0.03] border-white/8 hover:border-white/15"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icône catégorie */}
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{
                            backgroundColor: `${accent}15`,
                            border: `1px solid ${accent}30`,
                            color: accent,
                          }}
                        >
                          <QuestCategoryIcon category={quest.category} size={16} />
                        </div>

                        {/* Contenu défi */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)] truncate">
                              {quest.title}
                            </h4>
                            <span
                              className="text-[10px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0"
                              style={{
                                backgroundColor: `${accent}20`,
                                color: accent,
                              }}
                            >
                              +{quest.xpReward} XP
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-xs text-[var(--color-text-secondary)] mb-2 line-clamp-1">
                            {quest.description}
                          </p>

                          {/* Barre de progression */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${progressPercent}%`,
                                  backgroundColor: quest.completed ? "#10b981" : accent,
                                  boxShadow: quest.completed ? "0 0 8px rgba(16,185,129,0.4)" : `0 0 6px ${accent}40`,
                                }}
                              />
                            </div>
                            <span className="text-[10px] font-mono font-bold text-[var(--color-text-secondary)] flex-shrink-0">
                              {quest.progress}/{quest.targetValue}
                            </span>

                            {/* Bouton Réclamer */}
                            {quest.completed && !quest.claimed && (
                              <button
                                onClick={() => {
                                  sounds.playClick();
                                  onClaimQuest(quest.id);
                                }}
                                onMouseEnter={() => sounds.playHover()}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                              >
                                <IconCheck size={10} />
                                Réclamer
                              </button>
                            )}
                            {quest.claimed && (
                              <span className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-wider flex items-center gap-1">
                                <IconCheck size={10} />
                                Réclamé
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer : Timer de réinitialisation */}
            <div className="px-5 pb-4 sm:pb-5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-[10px] sm:text-xs text-[var(--color-text-secondary)] font-medium">
                  Prochaine rotation des défis
                </span>
                <span className="text-xs sm:text-sm font-mono font-black text-[var(--color-val-red)]">
                  {timeUntilReset}
                </span>
              </div>
            </div>
          </>
        )}

        {/* Onglet 2 : Liste des récompenses de niveau */}
        {modalTab === "rewards" && (
          <div className="p-4 sm:p-5 space-y-3">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
              💡 <strong>Récompenses exclusives :</strong> Chaque palier de niveau Tracker débloque des cosmétiques (effets de bannière, badges, bordures RGB). Les récompenses débloquées sont équipables dans vos <strong>Paramètres</strong>.
            </div>

            <div className="space-y-2">
              {LEVEL_REWARDS_PREVIEW.map((reward) => {
                const isUnlocked = trackerLevel >= reward.level;
                return (
                  <div
                    key={reward.level}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                      isUnlocked
                        ? "bg-emerald-500/[0.05] border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.08)]"
                        : "bg-white/[0.02] border-white/5 opacity-70"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 border ${
                          isUnlocked
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                            : "bg-white/5 border-white/10 text-gray-500"
                        }`}
                      >
                        {reward.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white truncate">
                            {reward.title}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase font-mono bg-white/10 text-gray-300">
                            Niv. {reward.level}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 truncate">
                          {reward.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {isUnlocked ? (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                          <IconCheck size={10} />
                          Débloqué
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-white/5 text-gray-400 border border-white/10">
                          Niv. {reward.level} Requis
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
