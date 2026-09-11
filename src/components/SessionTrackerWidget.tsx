"use client";

import React, { useState, useEffect, useMemo } from "react";
import { sounds } from "@/lib/soundEffects";
import { IconGamepad, IconClock, IconFlame, IconTrophy } from "./icons/SpyIcons";

export interface SessionTrackerProps {
  currentMatches: any[];
  currentStats?: any;
}

interface StoredSessionData {
  startTime: number;
  initialMatchIds: string[];
}

export default function SessionTrackerWidget({
  currentMatches = [],
  currentStats,
}: SessionTrackerProps) {
  const [sessionActive, setSessionActive] = useState<boolean>(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [initialMatchIds, setInitialMatchIds] = useState<string[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [lastSessionSummary, setLastSessionSummary] = useState<any>(null);

  // Synchronisation depuis localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("sgs_live_session");
      if (stored) {
        const parsed: StoredSessionData = JSON.parse(stored);
        if (parsed.startTime) {
          setSessionActive(true);
          setSessionStartTime(parsed.startTime);
          setInitialMatchIds(parsed.initialMatchIds || []);
        }
      }
    } catch {}
  }, []);

  // Timer temps réel de session
  useEffect(() => {
    if (!sessionActive || !sessionStartTime) return;

    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - sessionStartTime) / 1000);
      setElapsedSeconds(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionActive, sessionStartTime]);

  // Matchs joués pendant la session active
  const sessionMatches = useMemo(() => {
    if (!sessionActive || !sessionStartTime) return [];
    return currentMatches.filter(
      (m) => !initialMatchIds.includes(m.matchId)
    );
  }, [sessionActive, sessionStartTime, currentMatches, initialMatchIds]);

  // Statistiques de la session
  const sessionStats = useMemo(() => {
    const total = sessionMatches.length;
    let wins = 0;
    let kills = 0;
    let deaths = 0;
    let totalAcs = 0;

    sessionMatches.forEach((m) => {
      if (m.won) wins++;
      kills += m.kills || 0;
      deaths += m.deaths || 0;
      totalAcs += m.acs || 0;
    });

    const losses = total - wins;
    const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toString();
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
    const avgAcs = total > 0 ? Math.round(totalAcs / total) : 0;

    return {
      total,
      wins,
      losses,
      kd,
      winRate,
      avgAcs,
    };
  }, [sessionMatches]);

  const handleStartSession = () => {
    sounds.playClick();
    const now = Date.now();
    const existingIds = currentMatches.map((m) => m.matchId).filter(Boolean);
    const sessionData: StoredSessionData = {
      startTime: now,
      initialMatchIds: existingIds,
    };

    localStorage.setItem("sgs_live_session", JSON.stringify(sessionData));
    setSessionActive(true);
    setSessionStartTime(now);
    setInitialMatchIds(existingIds);
    setElapsedSeconds(0);
  };

  const handleStopSession = () => {
    sounds.playClick();
    const summary = {
      durationSeconds: elapsedSeconds,
      ...sessionStats,
      date: new Date().toLocaleDateString("fr-FR"),
    };

    setLastSessionSummary(summary);
    setShowSummaryModal(true);
    setSessionActive(false);
    setSessionStartTime(null);
    setInitialMatchIds([]);
    setElapsedSeconds(0);
    localStorage.removeItem("sgs_live_session");
  };

  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
    return `${m}m ${s.toString().padStart(2, "0")}s`;
  };

  return (
    <>
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-[var(--color-border)] shadow-lg w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* En-tête statut */}
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              sessionActive
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-white/5 text-[var(--color-text-secondary)] border border-white/10"
            }`}
          >
            <IconClock size={18} className={sessionActive ? "animate-spin-slow" : ""} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                {sessionActive ? "Session de Jeu Active" : "Suivi de Session"}
              </span>
              {sessionActive ? (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              ) : (
                <span className="text-[10px] text-[var(--color-text-secondary)] font-bold uppercase tracking-widest">
                  Inactif
                </span>
              )}
            </div>

            <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
              {sessionActive
                ? `Durée : ${formatTimer(elapsedSeconds)}`
                : "Lancez le chrono pour mesurer vos victoires, défaites et variations de stats"}
            </p>
          </div>
        </div>

        {/* Détails de la session en cours */}
        {sessionActive && (
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-xs">
            <div className="px-3 py-1.5 rounded-xl glass-card border border-white/10 flex items-center gap-2">
              <IconGamepad size={14} className="text-[var(--color-val-red)]" />
              <span className="font-bold text-white">
                {sessionStats.total} {sessionStats.total > 1 ? "matchs" : "match"}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-xl glass-card border border-white/10 flex items-center gap-1.5">
              <span className="font-bold text-emerald-400">+{sessionStats.wins}V</span>
              <span className="text-white/40">/</span>
              <span className="font-bold text-[var(--color-val-red)]">-{sessionStats.losses}D</span>
              <span className="text-[10px] text-white/50 ml-1">({sessionStats.winRate}%)</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl glass-card border border-white/10">
              <span className="text-[var(--color-text-secondary)]">K/D : </span>
              <span className="font-black text-white">{sessionStats.kd}</span>
            </div>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
          {sessionActive ? (
            <button
              onClick={handleStopSession}
              className="px-4 py-2 rounded-xl bg-[var(--color-val-red)] hover:bg-[#ff5865] text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md hover:shadow-[0_0_15px_rgba(255,70,85,0.5)] flex items-center gap-1.5"
            >
              <span>Terminer la session</span>
            </button>
          ) : (
            <button
              onClick={handleStartSession}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center gap-1.5"
            >
              <IconGamepad size={14} />
              <span>Démarrer une session</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal Bilan Fin de Session */}
      {showSummaryModal && lastSessionSummary && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-panel rounded-2xl p-6 max-w-md w-full border border-[var(--color-val-red)]/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <IconTrophy size={18} className="text-amber-400" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  Bilan de votre Session
                </h3>
              </div>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="text-white/60 hover:text-white text-xs font-bold uppercase cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="glass-card p-3 rounded-xl">
                  <span className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold">Durée</span>
                  <div className="text-base font-black text-white mt-1">
                    {formatTimer(lastSessionSummary.durationSeconds)}
                  </div>
                </div>
                <div className="glass-card p-3 rounded-xl">
                  <span className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold">Matchs Joués</span>
                  <div className="text-base font-black text-white mt-1">
                    {lastSessionSummary.total}
                  </div>
                </div>
                <div className="glass-card p-3 rounded-xl">
                  <span className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold">Bilan V / D</span>
                  <div className="text-base font-black text-emerald-400 mt-1">
                    {lastSessionSummary.wins}V - {lastSessionSummary.losses}D ({lastSessionSummary.winRate}%)
                  </div>
                </div>
                <div className="glass-card p-3 rounded-xl">
                  <span className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold">K/D Moyen</span>
                  <div className="text-base font-black text-amber-300 mt-1">
                    {lastSessionSummary.kd}
                  </div>
                </div>
              </div>

              {lastSessionSummary.total === 0 && (
                <p className="text-xs text-center text-[var(--color-text-secondary)] italic">
                  Aucun nouveau match enregistré pendant cette session.
                </p>
              )}
            </div>

            <button
              onClick={() => setShowSummaryModal(false)}
              className="w-full py-2.5 rounded-xl bg-[var(--color-val-red)] hover:bg-[#ff5865] text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Fermer le bilan
            </button>
          </div>
        </div>
      )}
    </>
  );
}
