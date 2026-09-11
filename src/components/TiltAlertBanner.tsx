"use client";

import React, { useState, useMemo } from "react";
import { IconFlame, IconAlertTriangle } from "./icons/SpyIcons";

export interface TiltAlertBannerProps {
  matches: any[];
  overallKd?: number;
  overallAcs?: number;
}

export default function TiltAlertBanner({
  matches = [],
  overallKd = 1.0,
  overallAcs = 200,
}: TiltAlertBannerProps) {
  const [dismissed, setDismissed] = useState<boolean>(false);

  const tiltAnalysis = useMemo(() => {
    if (!matches || matches.length < 3) return null;

    const recent = matches.slice(0, 5);

    // 1. Détection des défaites consécutives récentes
    let consecutiveLosses = 0;
    for (const m of recent) {
      if (!m.won) consecutiveLosses++;
      else break;
    }

    // 2. Moyenne K/D et ACS récents
    let totalKills = 0;
    let totalDeaths = 0;
    let totalAcs = 0;

    recent.forEach((m) => {
      totalKills += m.kills || 0;
      totalDeaths += m.deaths || 0;
      totalAcs += m.acs || 0;
    });

    const recentKd = totalDeaths > 0 ? parseFloat((totalKills / totalDeaths).toFixed(2)) : totalKills;
    const recentAvgAcs = Math.round(totalAcs / recent.length);

    const kdDropPct = overallKd > 0 ? Math.round(((overallKd - recentKd) / overallKd) * 100) : 0;
    const acsDropPct = overallAcs > 0 ? Math.round(((overallAcs - recentAvgAcs) / overallAcs) * 100) : 0;

    // Critères de déclenchement du Tilt
    const isLossTilt = consecutiveLosses >= 3;
    const isPerformanceDrop = (kdDropPct >= 30 && recentKd < 0.85) || acsDropPct >= 25;

    if (!isLossTilt && !isPerformanceDrop) return null;

    let title = "Alerte Fatigue / Risque de Tilt Détecté";
    let message = "";
    let recommendation = "Prenez 15 minutes de pause, buvez de l'eau ou lancez un Deathmatch d'échauffement avant de relancer en compétitif.";

    if (isLossTilt && isPerformanceDrop) {
      title = `Série Noire : ${consecutiveLosses} défaites d'affilée (-${kdDropPct}% K/D)`;
      message = `Votre concentration semble émoussée sur les ${recent.length} dernières parties. Votre impact de combat a chuté de ${kdDropPct}%.`;
      recommendation = "Pause impérative recommandée. Ne laissez pas la frustration impacter votre MMR compétitif.";
    } else if (isLossTilt) {
      title = `${consecutiveLosses} Défaites Consécutives en cours`;
      message = "Votre rythme de victoire est temporairement rompu. L'acharnement en ranked après 3 défaites est la 1ère cause de dé-rank.";
    } else {
      title = `Baisse de régime constatée (-${kdDropPct}% K/D récents)`;
      message = `Votre K/D récent (${recentKd}) est nettement inférieur à votre moyenne (${overallKd}).`;
      recommendation = "Ajustez votre sensibilité ou passez en mode Entraînement / The Range.";
    }

    return {
      severity: consecutiveLosses >= 4 ? "critical" : "warning",
      title,
      message,
      recommendation,
      consecutiveLosses,
      recentKd,
      kdDropPct,
    };
  }, [matches, overallKd, overallAcs]);

  if (!tiltAnalysis || dismissed) return null;

  const isCritical = tiltAnalysis.severity === "critical";

  return (
    <div
      className={`w-full rounded-2xl p-4 sm:p-5 border transition-all duration-300 animate-in fade-in slide-in-from-top-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        isCritical
          ? "bg-gradient-to-r from-red-950/60 via-black/80 to-red-950/40 border-red-500/50 shadow-[0_0_25px_rgba(255,70,85,0.25)]"
          : "bg-gradient-to-r from-amber-950/50 via-black/80 to-amber-950/30 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
      }`}
    >
      <div className="flex items-start gap-3.5 min-w-0">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
            isCritical
              ? "bg-[var(--color-val-red)]/20 text-[var(--color-val-red)] border border-[var(--color-val-red)]/30 animate-pulse"
              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
          }`}
        >
          {isCritical ? <IconFlame size={20} /> : <IconAlertTriangle size={20} />}
        </div>

        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-black uppercase tracking-wider ${
                isCritical ? "text-[var(--color-val-red)]" : "text-amber-400"
              }`}
            >
              {tiltAnalysis.title}
            </span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/80 uppercase tracking-widest">
              Coach IA
            </span>
          </div>

          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            {tiltAnalysis.message}
          </p>

          <p className="text-[11px] text-white/90 font-medium pt-0.5">
            💡 <strong className="text-amber-300">Conseil :</strong> {tiltAnalysis.recommendation}
          </p>
        </div>
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="self-end sm:self-center px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer border border-white/10 whitespace-nowrap flex-shrink-0"
      >
        J&apos;ai compris ✕
      </button>
    </div>
  );
}
