"use client";

import React, { useState, useEffect } from "react";
import { sounds } from "@/lib/soundEffects";
import { IconTrophy, IconPlus, IconCheck, IconTrash } from "./icons/SpyIcons";

export interface PersonalGoal {
  id: string;
  title: string;
  type: "kd" | "winrate" | "headshot" | "matches" | "acs";
  targetValue: number;
  createdAt: number;
}

export interface PersonalGoalsWidgetProps {
  currentStats: any;
  matchesCount?: number;
}

const DEFAULT_PRESETS: Omit<PersonalGoal, "id" | "createdAt">[] = [
  { title: "Atteindre 1.25 de K/D", type: "kd", targetValue: 1.25 },
  { title: "Viser 55% de Win Rate", type: "winrate", targetValue: 55 },
  { title: "Franchir 25% de Headshots", type: "headshot", targetValue: 25 },
  { title: "Atteindre 240 d'ACS moyen", type: "acs", targetValue: 240 },
  { title: "Disputer 50 parties", type: "matches", targetValue: 50 },
];

export default function PersonalGoalsWidget({
  currentStats,
  matchesCount = 0,
}: PersonalGoalsWidgetProps) {
  const [goals, setGoals] = useState<PersonalGoal[]>([]);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<PersonalGoal["type"]>("kd");
  const [newTarget, setNewTarget] = useState<string>("1.30");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sgs_user_personal_goals");
      if (stored) {
        setGoals(JSON.parse(stored));
      } else {
        const initial: PersonalGoal[] = [
          { id: "g-1", title: "Atteindre 1.20 de K/D", type: "kd", targetValue: 1.20, createdAt: Date.now() },
          { id: "g-2", title: "Viser 55% de Win Rate", type: "winrate", targetValue: 55, createdAt: Date.now() },
        ];
        setGoals(initial);
        localStorage.setItem("sgs_user_personal_goals", JSON.stringify(initial));
      }
    } catch {}
  }, []);

  const saveGoals = (newGoals: PersonalGoal[]) => {
    setGoals(newGoals);
    try {
      localStorage.setItem("sgs_user_personal_goals", JSON.stringify(newGoals));
    } catch {}
  };

  const getCurrentVal = (type: PersonalGoal["type"]): number => {
    if (!currentStats) return 0;
    switch (type) {
      case "kd":
        return parseFloat(currentStats.kdRatio || currentStats.kd || 0);
      case "winrate":
        return parseFloat(currentStats.winRate || 0);
      case "headshot":
        return parseFloat(currentStats.headshotPct || currentStats.headshotPercentage || 0);
      case "acs":
        return parseFloat(currentStats.acs || currentStats.combatScore || 0);
      case "matches":
        return currentStats.matchesPlayed || matchesCount || 0;
      default:
        return 0;
    }
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    const targetVal = parseFloat(newTarget);
    if (isNaN(targetVal) || targetVal <= 0 || !newTitle.trim()) return;

    const newGoal: PersonalGoal = {
      id: `goal-${Date.now()}`,
      title: newTitle.trim(),
      type: newType,
      targetValue: targetVal,
      createdAt: Date.now(),
    };

    const updated = [...goals, newGoal];
    saveGoals(updated);
    setNewTitle("");
    setIsAdding(false);
  };

  const handleAddPreset = (p: Omit<PersonalGoal, "id" | "createdAt">) => {
    sounds.playClick();
    const newGoal: PersonalGoal = {
      ...p,
      id: `goal-${Date.now()}`,
      createdAt: Date.now(),
    };
    saveGoals([...goals, newGoal]);
  };

  const handleDeleteGoal = (id: string) => {
    sounds.playClick();
    const updated = goals.filter((g) => g.id !== id);
    saveGoals(updated);
  };

  const completedCount = goals.filter(
    (g) => getCurrentVal(g.type) >= g.targetValue
  ).length;

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between gap-5 h-full">
      {/* Halo d'ambiance doré subtil */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-3xl pointer-events-none" />

      {/* En-tête */}
      <div className="flex items-center justify-between gap-3 relative z-10 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">
              SGS Training // Progression
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
            <IconTrophy size={18} className="text-amber-400" />
            <span>Objectifs Personnels</span>
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {goals.length > 0 && (
            <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-gray-300">
              {completedCount} / {goals.length} atteints
            </span>
          )}

          <button
            onClick={() => {
              sounds.playClick();
              setIsAdding(!isAdding);
            }}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[var(--color-val-red)] border border-white/10 hover:border-[var(--color-val-red)] text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5"
          >
            {isAdding ? "Fermer ✕" : "+ Nouvel Objectif"}
          </button>
        </div>
      </div>

      {/* Formulaire d'ajout rapide */}
      {isAdding && (
        <form
          onSubmit={handleAddGoal}
          className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3 animate-in fade-in duration-200 relative z-10"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold block mb-1">
                Titre de l&apos;objectif
              </label>
              <input
                type="text"
                placeholder="Ex: Passer à 1.40 K/D"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-amber-400 outline-none"
                required
              />
            </div>

            <div>
              <label className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold block mb-1">
                Métrique ciblée
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-[#0e141b] border border-white/10 text-white text-xs focus:border-amber-400 outline-none"
              >
                <option value="kd">Ratio K/D</option>
                <option value="winrate">Win Rate (%)</option>
                <option value="headshot">Tirs à la tête (%)</option>
                <option value="acs">ACS Moyen</option>
                <option value="matches">Nombre de parties</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold block mb-1">
                Valeur cible
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="1.30"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-amber-400 outline-none"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              Enregistrer l&apos;objectif
            </button>
          </div>
        </form>
      )}

      {/* Liste des objectifs actifs */}
      <div className="grid grid-cols-1 gap-3 relative z-10 flex-1">
        {goals.map((goal) => {
          const currentVal = getCurrentVal(goal.type);
          const percent = Math.min(100, Math.round((currentVal / goal.targetValue) * 100));
          const isCompleted = currentVal >= goal.targetValue;

          return (
            <div
              key={goal.id}
              className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                isCompleted
                  ? "bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                  : "bg-white/[0.02] border-white/5 hover:border-white/15"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isCompleted ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                    }`}
                  />
                  <h4 className="text-xs sm:text-sm font-bold text-white">{goal.title}</h4>
                </div>

                <div className="flex items-center gap-2">
                  {isCompleted ? (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 uppercase tracking-widest border border-emerald-500/30 flex items-center gap-1">
                      <IconCheck size={10} /> Validé
                    </span>
                  ) : (
                    <span className="text-[11px] font-black text-amber-300">
                      {percent}%
                    </span>
                  )}
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="text-white/40 hover:text-[var(--color-val-red)] transition-colors text-xs cursor-pointer p-1"
                    title="Supprimer cet objectif"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-[var(--color-text-secondary)]">
                    Actuel : <strong className="text-white">{currentVal}</strong>
                  </span>
                  <span className="text-[var(--color-text-secondary)]">
                    Cible :{" "}
                    <strong className={isCompleted ? "text-emerald-400" : "text-amber-300"}>
                      {goal.targetValue}
                    </strong>
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isCompleted
                        ? "bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.7)]"
                        : "bg-gradient-to-r from-amber-500 to-[var(--color-val-red)] shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggestions d'objectifs si peu d'objectifs */}
      {goals.length < 3 && (
        <div className="pt-2 border-t border-white/5 relative z-10">
          <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] tracking-wider block mb-2">
            Objectifs suggérés en 1 clic :
          </span>
          <div className="flex flex-wrap gap-1.5">
            {DEFAULT_PRESETS.slice(0, 3).map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleAddPreset(p)}
                className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-[11px] font-bold border border-white/5 hover:border-white/20 transition-all cursor-pointer active:scale-95"
              >
                + {p.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
