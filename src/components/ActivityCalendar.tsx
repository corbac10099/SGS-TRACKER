"use client";

import React, { useMemo, useState } from "react";
import { sounds } from "@/lib/soundEffects";
import { IconFlame, IconTrophy, IconGamepad, IconCrosshair } from "./icons/SpyIcons";

export interface ActivityCalendarProps {
  matches: any[];
  className?: string;
}

interface DayData {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayOfWeek: number;
  matchesCount: number;
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
  kd: number;
  winRate: number;
  matches: any[];
}

const MONTH_NAMES_FR = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Août", "Sep", "Oct", "Nov", "Déc"
];

/**
 * Retourne la clé "YYYY-MM-DD" en heure locale du joueur.
 * Évite le décalage de fuseau horaire de toISOString() qui convertit en UTC (ex: 22h UTC = jour précédent).
 */
function getLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Calendrier d'activité temporelle annuel (style Heatmap / GitHub Contribution Graph).
 * Affiche l'intensité des sessions de jeu sur 52 semaines (365 jours),
 * occupant toute la largeur de la section avec alignement pixel-perfect des mois et jours.
 */
export default function ActivityCalendar({ matches = [], className = "" }: ActivityCalendarProps) {
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  // Construction des 53 semaines (exactement 365 ou 366 jours selon l'année) jusqu'à aujourd'hui
  const { weeks, statsSummary } = useMemo(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Midi pour éviter tout saut DST
    const todayKey = getLocalDateKey(today);

    // Dictionnaire des matchs par jour "YYYY-MM-DD" en heure locale
    const matchMap: Record<string, any[]> = {};
    matches.forEach((m) => {
      if (!m.date) return;
      const d = new Date(m.date);
      if (isNaN(d.getTime())) return;
      const key = getLocalDateKey(d);
      if (!matchMap[key]) matchMap[key] = [];
      matchMap[key].push(m);
    });

    // Détection si l'année glissante contient un 29 février (année bissextile = 366 jours, sinon 365)
    let daysInYear = 365;
    for (let i = 0; i < 366; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      if (checkDate.getMonth() === 1 && checkDate.getDate() === 29) {
        daysInYear = 366;
        break;
      }
    }

    // La période couvre exactement daysInYear jours (365 ou 366) se terminant aujourd'hui
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (daysInYear - 1));
    startDate.setHours(12, 0, 0, 0);

    // Lundi = 0, Dimanche = 6
    const startDayOfWeek = (startDate.getDay() + 6) % 7;
    const gridStartMonday = new Date(startDate);
    gridStartMonday.setDate(startDate.getDate() - startDayOfWeek);
    gridStartMonday.setHours(12, 0, 0, 0);

    const todayDayOfWeek = (today.getDay() + 6) % 7;
    const gridEndSunday = new Date(today);
    gridEndSunday.setDate(today.getDate() + (6 - todayDayOfWeek));
    gridEndSunday.setHours(12, 0, 0, 0);

    const totalDays = Math.round((gridEndSunday.getTime() - gridStartMonday.getTime()) / (24 * 3600 * 1000)) + 1;
    const totalWeeks = Math.ceil(totalDays / 7);

    const computedWeeks: {
      weekIndex: number;
      monthLabel?: string;
      days: (DayData & { isFuture: boolean; isOut: boolean })[];
    }[] = [];

    let totalMatchesInPeriod = 0;
    let totalWinsInPeriod = 0;
    let maxMatchesInDay = 0;
    let activeDaysCount = 0;
    const allDaysList: (DayData & { isFuture: boolean; isOut: boolean })[] = [];

    let currentMonth = -1;

    for (let w = 0; w < totalWeeks; w++) {
      const weekDays: (DayData & { isFuture: boolean; isOut: boolean })[] = [];
      let weekMonthLabel: string | undefined = undefined;

      for (let d = 0; d < 7; d++) {
        const curDate = new Date(gridStartMonday);
        curDate.setDate(gridStartMonday.getDate() + (w * 7 + d));
        const key = getLocalDateKey(curDate);
        
        // Est hors période si strictement antérieur à startDate ou postérieur à today
        const isOut = curDate.getTime() < startDate.getTime() || curDate.getTime() > today.getTime();
        const isFuture = curDate.getTime() > today.getTime();
        const dayMatches = (!isOut && matchMap[key]) || [];

        const matchesCount = dayMatches.length;
        let wins = 0;
        let kills = 0;
        let deaths = 0;

        dayMatches.forEach((m) => {
          if (m.won) wins++;
          kills += m.kills || 0;
          deaths += m.deaths || 0;
        });

        const losses = matchesCount - wins;
        const kd = deaths > 0 ? parseFloat((kills / deaths).toFixed(2)) : kills;
        const winRate = matchesCount > 0 ? Math.round((wins / matchesCount) * 100) : 0;

        if (!isOut && matchesCount > 0) {
          totalMatchesInPeriod += matchesCount;
          totalWinsInPeriod += wins;
          activeDaysCount++;
          if (matchesCount > maxMatchesInDay) maxMatchesInDay = matchesCount;
        }

        // Détection de changement de mois dans cette semaine
        const mIdx = curDate.getMonth();
        if (mIdx !== currentMonth && curDate.getDate() <= 7 && !weekMonthLabel && !isOut) {
          weekMonthLabel = MONTH_NAMES_FR[mIdx];
          currentMonth = mIdx;
        }

        const dayItem = {
          date: curDate,
          dateStr: key,
          dayOfWeek: curDate.getDay(),
          matchesCount,
          wins,
          losses,
          kills,
          deaths,
          kd,
          winRate,
          matches: dayMatches,
          isFuture,
          isOut,
        };

        weekDays.push(dayItem);
        if (!isOut) {
          allDaysList.push(dayItem);
        }
      }

      computedWeeks.push({
        weekIndex: w,
        monthLabel: weekMonthLabel,
        days: weekDays,
      });
    }

    // Calcul du streak consécutif (sur les jours réels analysés)
    let currentStreak = 0;
    for (let i = allDaysList.length - 1; i >= 0; i--) {
      if (allDaysList[i].matchesCount > 0) {
        currentStreak++;
      } else {
        if (i === allDaysList.length - 1) continue;
        break;
      }
    }

    const globalWinRate =
      totalMatchesInPeriod > 0
        ? Math.round((totalWinsInPeriod / totalMatchesInPeriod) * 100)
        : 0;

    return {
      weeks: computedWeeks,
      statsSummary: {
        totalMatches: totalMatchesInPeriod,
        globalWinRate,
        currentStreak,
        maxMatchesInDay,
        activeDaysCount,
        totalDaysInYear: daysInYear,
        totalWeeks,
      },
    };
  }, [matches]);

  // Couleur d'intensité de la cellule
  const getCellIntensityClass = (count: number) => {
    if (count === 0) {
      return "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.2)]";
    }
    if (count <= 2) {
      return "bg-[rgba(255,70,85,0.28)] border-[rgba(255,70,85,0.4)] hover:bg-[rgba(255,70,85,0.45)]";
    }
    if (count <= 4) {
      return "bg-[rgba(255,70,85,0.6)] border-[rgba(255,70,85,0.75)] hover:bg-[rgba(255,70,85,0.8)] shadow-[0_0_8px_rgba(255,70,85,0.3)]";
    }
    return "bg-[var(--color-val-red)] border-[var(--color-val-red)] hover:brightness-125 shadow-[0_0_12px_rgba(255,70,85,0.7)]";
  };

  // Formatage date lisible en français
  const formatFullDate = (d: Date) => {
    return d.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className={`w-full glass-panel rounded-2xl p-5 sm:p-6 space-y-5 border border-[var(--color-border)] shadow-xl ${className}`}>
      {/* Header & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-val-red)] animate-pulse shadow-[0_0_8px_rgba(255,70,85,0.8)]" />
            <h3 className="font-black text-sm uppercase tracking-widest text-[var(--color-text-on-surface)]">
              Calendrier d&apos;Activité &amp; Sessions
            </h3>
          </div>
          <p className="text-[11px] text-[var(--color-text-secondary)] mt-1 font-medium">
            Historique d&apos;engagement annuel ({statsSummary.totalWeeks} semaines — {statsSummary.totalDaysInYear} jours)
          </p>
        </div>

        {/* 4 KPI Pill Badges */}
        <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="glass-card px-3 py-1.5 rounded-xl flex items-center gap-2 border border-[rgba(255,255,255,0.06)]">
            <IconGamepad size={13} className="text-[var(--color-val-red)]" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-[var(--color-text-secondary)] font-bold">
                Parties
              </span>
              <span className="text-xs font-black text-white">
                {statsSummary.totalMatches}
              </span>
            </div>
          </div>

          <div className="glass-card px-3 py-1.5 rounded-xl flex items-center gap-2 border border-[rgba(255,255,255,0.06)]">
            <IconTrophy size={13} className="text-emerald-400" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-[var(--color-text-secondary)] font-bold">
                Win Rate
              </span>
              <span className="text-xs font-black text-emerald-400">
                {statsSummary.globalWinRate}%
              </span>
            </div>
          </div>

          <div className="glass-card px-3 py-1.5 rounded-xl flex items-center gap-2 border border-[rgba(255,255,255,0.06)]">
            <IconFlame size={13} className="text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-[var(--color-text-secondary)] font-bold">
                Série Active
              </span>
              <span className="text-xs font-black text-amber-400">
                {statsSummary.currentStreak} {statsSummary.currentStreak > 1 ? "jours" : "jour"}
              </span>
            </div>
          </div>

          <div className="glass-card px-3 py-1.5 rounded-xl flex items-center gap-2 border border-[rgba(255,255,255,0.06)]">
            <IconCrosshair size={13} className="text-blue-400" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-[var(--color-text-secondary)] font-bold">
                Pic / Jour
              </span>
              <span className="text-xs font-black text-white">
                {statsSummary.maxMatchesInDay} parties
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Matrix — Full Width Responsive Grid */}
      <div className="relative overflow-x-auto pb-2 scrollbar-none">
        <div className="min-w-[760px] w-full">
          <div className="flex gap-2 w-full items-start">
            {/* Weekday labels column */}
            <div className="flex flex-col flex-shrink-0 text-[9px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider select-none pr-1">
              {/* Top spacer matching month label header */}
              <div className="h-5 mb-1.5" />
              {/* 7 rows of weekday labels */}
              <div className="flex flex-col justify-between h-[116px] sm:h-[136px] py-0.5">
                <span>Lun</span>
                <span>Mer</span>
                <span>Ven</span>
                <span>Dim</span>
              </div>
            </div>

            {/* 52 Columns of Weeks */}
            <div className="flex gap-[2.5px] sm:gap-[3px] flex-1 w-full justify-between">
              {weeks.map((week) => (
                <div
                  key={week.weekIndex}
                  className="flex flex-col items-center flex-1 min-w-[8px] max-w-[18px]"
                >
                  {/* Month Label Header for this specific column */}
                  <div className="h-5 mb-1.5 text-[9px] sm:text-[10px] text-[var(--color-text-secondary)] font-black uppercase tracking-wider whitespace-nowrap overflow-visible flex items-center justify-center">
                    {week.monthLabel || ""}
                  </div>

                  {/* 7 Day squares for this week */}
                  <div className="flex flex-col gap-1 sm:gap-1.5 w-full">
                    {week.days.map((day) => {
                      if (day.isOut) {
                        return (
                          <div
                            key={`${day.dateStr}-${day.dayOfWeek}`}
                            className="w-full aspect-square rounded-[2.5px] sm:rounded-[3px] opacity-0 pointer-events-none"
                          />
                        );
                      }
                      const isSelected = selectedDay?.dateStr === day.dateStr;
                      return (
                        <div
                          key={day.dateStr}
                          onMouseEnter={() => {
                            sounds.playHover();
                            setHoveredDay(day);
                          }}
                          onMouseLeave={() => setHoveredDay(null)}
                          onClick={() => {
                            sounds.playClick();
                            setSelectedDay(isSelected ? null : day);
                          }}
                          className={`w-full aspect-square rounded-[2.5px] sm:rounded-[3px] border transition-all duration-200 cursor-pointer ${getCellIntensityClass(
                            day.matchesCount
                          )} ${
                            isSelected
                              ? "ring-2 ring-[var(--color-val-red)] scale-135 z-20 shadow-[0_0_14px_rgba(255,70,85,0.9)] animate-pulse"
                              : "hover:scale-135 hover:z-20 hover:shadow-[0_0_10px_rgba(255,70,85,0.7)] hover:border-white/60"
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic details bar (Hauteur verrouillée à h-9 pour zéro décalage de page) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 text-xs border-t border-[rgba(255,255,255,0.06)]">
        {/* Info on hovered or selected day */}
        <div className="h-9 flex items-center min-w-0 overflow-hidden">
          {(hoveredDay || selectedDay) ? (
            <div className="flex items-center gap-2.5 animate-in fade-in-0 zoom-in-95 duration-150 flex-nowrap whitespace-nowrap overflow-x-auto scrollbar-none bg-black/60 border border-[var(--color-val-red)]/40 shadow-[0_0_12px_rgba(255,70,85,0.2)] px-2.5 py-1 rounded-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-val-red)] animate-ping shrink-0" />
              <span className="font-black text-white capitalize text-xs">
                {formatFullDate((hoveredDay || selectedDay)!.date)} :
              </span>
              {(hoveredDay || selectedDay)!.matchesCount > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="font-black text-[var(--color-val-red)] bg-[rgba(255,70,85,0.15)] px-2 py-0.5 rounded-md border border-[rgba(255,70,85,0.3)]">
                    {(hoveredDay || selectedDay)!.matchesCount}{" "}
                    {(hoveredDay || selectedDay)!.matchesCount > 1
                      ? "parties"
                      : "partie"}
                  </span>
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    {(hoveredDay || selectedDay)!.wins}V -{" "}
                    {(hoveredDay || selectedDay)!.losses}D (
                    {(hoveredDay || selectedDay)!.winRate}%)
                  </span>
                  <span className="text-neutral-200 font-mono font-bold bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                    K/D {(hoveredDay || selectedDay)!.kd}
                  </span>
                </div>
              ) : (
                <span className="text-[var(--color-text-secondary)] italic text-xs">
                  Aucune partie jouée
                </span>
              )}
            </div>
          ) : (
            <span className="text-[var(--color-text-secondary)] text-[11px] italic">
              Survolez ou cliquez sur une case pour analyser les statistiques du jour
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-secondary)] font-bold uppercase tracking-wider self-end sm:self-auto">
          <span>Moins</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-[3px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]" />
            <span className="w-3 h-3 rounded-[3px] bg-[rgba(255,70,85,0.28)] border border-[rgba(255,70,85,0.4)]" />
            <span className="w-3 h-3 rounded-[3px] bg-[rgba(255,70,85,0.6)] border border-[rgba(255,70,85,0.75)]" />
            <span className="w-3 h-3 rounded-[3px] bg-[var(--color-val-red)] border border-[var(--color-val-red)] shadow-[0_0_8px_rgba(255,70,85,0.6)]" />
          </div>
          <span>Plus</span>
        </div>
      </div>

      {/* Selected Day Match Drawer (Dépliement fluide animé en accordéon) */}
      <div
        className={`grid transition-all duration-350 ease-in-out ${
          selectedDay && selectedDay.matchesCount > 0
            ? "grid-rows-[1fr] opacity-100 mt-3"
            : "grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
        style={{
          transition:
            "grid-template-rows 350ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms ease, margin 350ms ease",
        }}
      >
        <div className="overflow-hidden">
          {selectedDay && selectedDay.matchesCount > 0 && (
            <div className="p-4 rounded-xl glass-card border border-[var(--color-val-red)]/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    Détail des matchs — {formatFullDate(selectedDay.date)}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-val-red)]/20 text-[var(--color-val-red)]">
                    {selectedDay.matchesCount} {selectedDay.matchesCount > 1 ? "matchs" : "match"}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-[10px] text-[var(--color-text-secondary)] hover:text-white font-bold cursor-pointer uppercase tracking-widest px-2 py-1"
                >
                  Fermer ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {selectedDay.matches.map((m: any, idx: number) => (
                  <div
                    key={m.matchId || idx}
                    className={`p-3 rounded-lg flex items-center justify-between border ${
                      m.won
                        ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                        : "bg-[var(--color-val-red)]/5 border-[var(--color-val-red)]/20 text-[var(--color-val-red)]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {m.agentIcon && (
                        <img
                          referrerPolicy="no-referrer"
                          src={m.agentIcon}
                          alt={m.agent}
                          className="w-8 h-8 rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-black text-white truncate">
                          {m.agent || "Agent"} — {m.map || "Carte"}
                        </span>
                        <span className="text-[10px] text-[var(--color-text-secondary)]">
                          {m.mode || "Compétitif"} • {m.score || (m.won ? "Victoire" : "Défaite")}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-black">
                        {m.kills}/{m.deaths}/{m.assists}
                      </span>
                      <div className="text-[9px] text-[var(--color-text-secondary)] font-bold">
                        ACS {m.acs || 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
