"use client";

import React, { useState, useEffect } from "react";
import { sounds } from "@/lib/soundEffects";
import { IconTrophy, IconCrosshair, IconFlame } from "./icons/SpyIcons";

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

  // Charger depuis localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("sgs_user_personal_goals");
      if (stored) {
        setGoals(JSON.parse(stored));
      } else {
        // 2 objectifs par défaut pour démarrer
        const initial = [
          { id: "g-1", title: "Atteindre 1.20 de K/D", type: "kd" as const, targetValue: 1.20, createdAt: Date.now() },
          { id: "g-2", title: "Viser 55% de Win Rate", type: "winrate" as const, targetValue: 55, createdAt: Date.now() },
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

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-[var(--color-border)] shadow-xl w-full space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
        <div className="flex items-center gap-2">
          <IconTrophy size={18} className="text-amber-400" />
          <h3 className="text-sm font-black uppercase tracking-widest text-[var(--color-text-on-surface)]">
            Objectifs Personnels de Performance
          </h3>
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            setIsAdding(!isAdding);
          }}
          className="px-3 py-1.5 rounded-xl bg-[var(--color-surface)] hover:bg-[var(--color-val-red)] border border-[var(--color-border)] hover:border-[var(--color-val-red)] text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
        >
          {isAdding ? "Annuler ✕" : "+ Nouvel Objectif"}
        </button>
      </div>

      {/* Formulaire d'ajout rapide */}
      {isAdding && (
        <form onSubmit={handleAddGoal} className="p-4 rounded-xl glass-card border border-white/10 space-y-3 animate-in fade-in duration-200">
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
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:border-[var(--color-val-red)] outline-none"
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
                className="w-full px-3 py-2 rounded-lg bg-[#0d1218] border border-white/10 text-white text-xs focus:border-[var(--color-val-red)] outline-none"
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
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:border-[var(--color-val-red)] outline-none"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Enregistrer l&apos;objectif
            </button>
          </div>
        </form>
      )}

      {/* Liste des objectifs actifs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {goals.map((goal) => {
          const currentVal = getCurrentVal(goal.type);
          const percent = Math.min(100, Math.round((currentVal / goal.targetValue) * 100));
          const isCompleted = currentVal >= goal.targetValue;

          return (
            <div
              key={goal.id}
              className={`p-4 rounded-xl border transition-all ${
                isCompleted
                  ? "bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                  : "glass-card border-white/5 hover:border-white/15"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isCompleted ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                  <h4 className="text-xs font-bold text-white">{goal.title}</h4>
                </div>

                <div className="flex items-center gap-2">
                  {isCompleted && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 uppercase tracking-widest">
                      Atteint ! 🎉
                    </span>
                  )}
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="text-white/40 hover:text-[var(--color-val-red)] text-xs cursor-pointer px-1"
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
                    Cible : <strong className={isCompleted ? "text-emerald-400" : "text-amber-300"}>{goal.targetValue}</strong> ({percent}%)
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCompleted
                        ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)]"
                        : "bg-gradient-to-r from-amber-500 to-[var(--color-val-red)]"
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
        <div className="pt-2">
          <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] tracking-wider block mb-2">
            Objectifs suggérés en 1 clic :
          </span>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_PRESETS.slice(0, 3).map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleAddPreset(p)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-[11px] font-bold border border-white/10 transition-colors cursor-pointer"
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
