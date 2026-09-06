"use client";

import React from "react";
import { PerformanceGrade } from "@/lib/valorant/performanceScore";

export interface PerformanceStarBadgeProps {
  grade: PerformanceGrade;
  score: number;
  gradeColor: string;
  gradeBg: string;
  gradeBorder: string;
  gradeGlow?: string;
  gradeTitle?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  layout?: "beside" | "below" | "icon-only";
  showTitle?: boolean;
  className?: string;
}

/**
 * Composant Étoile Géométrique SPI
 * Construit à partir de 3 carrés concentriques pivotés (0°, 22.5°, 45°),
 * reproduisant fidèlement le croquis fourni avec la lettre au centre
 * et le score affiché soit en dessous, soit à côté.
 */
export default function PerformanceStarBadge({
  grade,
  score,
  gradeColor,
  gradeBg,
  gradeBorder,
  gradeGlow,
  gradeTitle,
  size = "md",
  layout = "beside",
  showTitle = true,
  className = "",
}: PerformanceStarBadgeProps) {
  // Dimensions de l'étoile selon la taille demandée
  const starSizes = {
    xs: { px: 28, fontSize: grade.length === 3 ? 10 : grade.length === 2 ? 12 : 14 },
    sm: { px: 38, fontSize: grade.length === 3 ? 12 : grade.length === 2 ? 15 : 17 },
    md: { px: 56, fontSize: grade.length === 3 ? 17 : grade.length === 2 ? 21 : 25 },
    lg: { px: 76, fontSize: grade.length === 3 ? 22 : grade.length === 2 ? 28 : 34 },
    xl: { px: 104, fontSize: grade.length === 3 ? 28 : grade.length === 2 ? 35 : 42 },
  };

  const currentSize = starSizes[size] || starSizes.md;

  // Rendu de l'étoile SVG géométrique (3 carrés imbriqués)
  const starSvg = (
    <div
      className="relative flex items-center justify-center flex-shrink-0 select-none group"
      style={{
        width: currentSize.px,
        height: currentSize.px,
        filter: gradeGlow ? `drop-shadow(0 0 10px ${gradeBorder})` : undefined,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full overflow-visible transition-transform duration-300 group-hover:scale-105"
        style={{ color: gradeColor }}
      >
        <defs>
          <filter id={`star-glow-${grade}-${size}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Carré 1 : Orientation droite (0°) */}
        <rect
          x="24"
          y="24"
          width="52"
          height="52"
          rx="2.5"
          transform="rotate(0 50 50)"
          fill={gradeBg}
          stroke={gradeColor}
          strokeWidth="2.2"
          className="transition-all duration-300"
        />

        {/* Carré 2 : Rotation intermédiaire (22.5°) */}
        <rect
          x="24"
          y="24"
          width="52"
          height="52"
          rx="2.5"
          transform="rotate(22.5 50 50)"
          fill={gradeBg}
          stroke={gradeColor}
          strokeWidth="2.2"
          className="transition-all duration-300"
        />

        {/* Carré 3 : Pointe vers le haut (45°) */}
        <rect
          x="24"
          y="24"
          width="52"
          height="52"
          rx="2.5"
          transform="rotate(45 50 50)"
          fill={gradeBg}
          stroke={gradeColor}
          strokeWidth="2.2"
          className="transition-all duration-300"
        />

        {/* Cœur central sombre pour contraste et lisibilité parfaite de la lettre */}
        <circle
          cx="50"
          cy="50"
          r="23"
          fill="#0b0f14"
          stroke={gradeBorder}
          strokeWidth="1.5"
        />
      </svg>

      {/* Lettre du Grade au centre géométrique de l'étoile */}
      <span
        className="absolute inset-0 flex items-center justify-center font-black tracking-tight pointer-events-none drop-shadow-md transition-transform duration-300 group-hover:scale-110"
        style={{
          color: gradeColor,
          fontSize: currentSize.fontSize,
          textShadow: "0 1px 3px rgba(0,0,0,0.9), 0 0 1px #000",
          lineHeight: 1,
        }}
      >
        {grade}
      </span>
    </div>
  );

  if (layout === "icon-only") {
    return starSvg;
  }

  // Disposition avec le score EN DESSOUS de l'étoile
  if (layout === "below") {
    return (
      <div className={`flex flex-col items-center justify-center text-center gap-2 ${className}`}>
        {starSvg}
        <div className="flex flex-col items-center leading-tight">
          <div className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-baseline gap-1">
            {score}
            <span className="text-xs font-semibold text-gray-400">/ 1 000 pts</span>
          </div>
          {showTitle && (
            <span
              className="text-[11px] font-black uppercase tracking-wider mt-0.5"
              style={{ color: gradeColor }}
            >
              Grade {grade}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Disposition par défaut : le score À CÔTÉ de l'étoile
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {starSvg}
      <div className="flex flex-col text-left leading-tight">
        <div className="flex items-baseline gap-1">
          <span className="text-sm sm:text-base font-black text-white tracking-tight">
            {score}
          </span>
          <span className="text-[10px] font-semibold text-gray-400">/ 1000 pts</span>
        </div>
        {showTitle && (
          <span
            className="text-[10px] font-bold uppercase tracking-wider mt-0.5"
            style={{ color: gradeColor }}
          >
            Grade {grade}
          </span>
        )}
      </div>
    </div>
  );
}
