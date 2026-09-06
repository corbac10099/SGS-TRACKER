"use client";

import React from "react";
import { PerformanceScoreResult } from "@/lib/valorant/performanceScore";
import { IconLock, IconChevronRight } from "./icons/SpyIcons";

import PerformanceStarBadge from "./PerformanceStarBadge";

interface PerformanceScoreCardProps {
  result: PerformanceScoreResult;
  onClickDetail?: () => void;
  isPublic?: boolean;
  isOwner?: boolean;
  compact?: boolean;
}

export default function PerformanceScoreCard({
  result,
  onClickDetail,
  isPublic = true,
  isOwner = false,
  compact = false,
}: PerformanceScoreCardProps) {
  const { totalScore, grade, gradeColor, gradeBg, gradeBorder, gradeGlow, gradeTitle, dominantRole } = result;

  // Option: Adapter au thème d'apparence SEULEMENT si l'utilisateur est le propriétaire (isOwner === true)
  // Pour tout visiteur externe (!isOwner), la case reste strictement avec les couleurs d'origine officielles de son rang
  const [themeAdapted, setThemeAdapted] = React.useState(false);

  React.useEffect(() => {
    if (!isOwner) {
      setThemeAdapted(false);
      return;
    }
    const checkThemeAdapt = () => {
      const adapt = typeof window !== "undefined" && localStorage.getItem("spycam_spi_theme_adapt") === "true";
      setThemeAdapted(adapt);
    };
    checkThemeAdapt();
    window.addEventListener("spycam_settings_updated", checkThemeAdapt);
    return () => window.removeEventListener("spycam_settings_updated", checkThemeAdapt);
  }, [isOwner]);

  const activeGradeColor = themeAdapted ? "var(--custom-accent, var(--color-val-red, #ff4655))" : gradeColor;
  const activeGradeBg = themeAdapted ? "rgba(255, 70, 85, 0.12)" : gradeBg;
  const activeGradeBorder = themeAdapted ? "rgba(255, 70, 85, 0.4)" : gradeBorder;

  // Si le score est masqué par l'utilisateur et que le viewer n'est pas le propriétaire
  if (!isPublic && !isOwner) {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center p-3 rounded-2xl bg-[#0a0e13]/80 border border-white/10 text-center ${
          compact ? "py-1.5 px-2.5" : "p-4"
        }`}
      >
        <span className="text-amber-400 mb-1"><IconLock size={16} /></span>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          Score SPI Masqué
        </span>
        <span className="text-[9px] text-gray-500">Par le joueur</span>
      </div>
    );
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClickDetail}
        title={`Score SPI : ${totalScore} pts (Grade ${grade})`}
        className="relative transition-all hover:scale-110 cursor-pointer group flex items-center justify-center p-0.5 bg-transparent border-none drop-shadow-lg"
      >
        <PerformanceStarBadge
          grade={grade}
          score={totalScore}
          gradeColor={activeGradeColor}
          gradeBg={activeGradeBg}
          gradeBorder={activeGradeBorder}
          gradeGlow={gradeGlow}
          size="sm"
          layout="icon-only"
        />
        {!isPublic && isOwner && (
          <span className="absolute -top-1 -right-1 p-0.5 bg-black/90 rounded-full border border-amber-500/40 text-amber-400" title="Score masqué au public">
            <IconLock size={10} />
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      onClick={onClickDetail}
      className="w-full h-full p-4 rounded-2xl glass-panel border border-white/10 hover:border-white/20 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
      style={{
        boxShadow: `inset 0 0 20px ${activeGradeBg}`,
      }}
    >
      {/* BACKGROUND ACCENT */}
      <div
        className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 pointer-events-none blur-xl"
        style={{ backgroundColor: activeGradeColor }}
      />

      {/* TOP BAR */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeGradeColor }} />
          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-secondary)]">
            Score SPI • {dominantRole}
          </span>
        </div>

        {!isPublic && isOwner && (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <IconLock size={10} /> Privé
          </span>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div className="flex items-center justify-between my-2">
        <div>
          <div className="text-3xl font-black text-white tracking-tight flex items-baseline gap-1">
            {totalScore}
            <span className="text-xs font-bold text-[var(--color-text-secondary)]">/ 1000</span>
          </div>
          <span
            className="text-[11px] font-black uppercase tracking-wider"
            style={{ color: activeGradeColor }}
          >
            Grade {grade}
          </span>
        </div>

        <PerformanceStarBadge
          grade={grade}
          score={totalScore}
          gradeColor={activeGradeColor}
          gradeBg={activeGradeBg}
          gradeBorder={activeGradeBorder}
          gradeGlow={gradeGlow}
          size="md"
          layout="icon-only"
        />
      </div>

      {/* FOOTER */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400">
        <span>Cliquer pour le détail</span>
        <span className="group-hover:translate-x-1 transition-transform">
          <IconChevronRight size={12} />
        </span>
      </div>
    </div>
  );
}
