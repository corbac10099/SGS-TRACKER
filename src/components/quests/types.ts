import React from "react";
import {
  IconTrophy,
  IconFlame,
  IconCrosshair,
  IconSword,
  IconShield,
  IconUsers,
} from "@/components/icons/SpyIcons";

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

export interface LevelReward {
  level: number;
  type: "badge" | "banner_effect" | "banner_border";
  title: string;
  description: string;
  effectKey: string;
}

/**
 * Calcul de l'XP nécessaire pour franchir un niveau spécifique (courbe exponentielle douce).
 */
export function xpForLevel(level: number): number {
  return Math.floor(200 * Math.pow(1.15, level - 1));
}

/**
 * Calcul du total cumulé d'XP requis pour atteindre un niveau donné.
 */
export function xpTotalForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) total += xpForLevel(i);
  return total;
}

/**
 * Paliers de récompenses cosmétiques exclusives pour le niveau Tracker (sans aucun emoji).
 */
export const LEVEL_REWARDS_PREVIEW: LevelReward[] = [
  { level: 1, type: "badge", title: "Badge Recrue", description: "Badge officiel de recrue sur votre profil", effectKey: "recrue" },
  { level: 2, type: "banner_effect", title: "Cyber Glow", description: "Aura lumineuse pulsante sur votre bannière", effectKey: "cyber_glow" },
  { level: 3, type: "banner_effect", title: "Scanlines", description: "Lignes cathodiques arcade sur votre bannière", effectKey: "scanlines" },
  { level: 4, type: "badge", title: "Vétéran Spycam", description: "Badge de fidélité affiché sur votre profil", effectKey: "veteran" },
  { level: 5, type: "banner_effect", title: "Matrix Rain", description: "Pluie de code digital vert animé", effectKey: "matrix" },
  { level: 6, type: "banner_border", title: "Bordure RGB Conic", description: "Bordure rotative animée ultra-stylée", effectKey: "rgb_conic" },
  { level: 7, type: "banner_effect", title: "Stardust", description: "Particules d'étoiles scintillantes", effectKey: "stardust" },
  { level: 8, type: "banner_border", title: "Bordure Néon Pulse", description: "Pulsation néon dynamique réactive", effectKey: "neon_pulse" },
  { level: 9, type: "banner_effect", title: "Faille Abyssale", description: "Volutes spectrales violettes mystérieuses", effectKey: "void_rift" },
  { level: 10, type: "banner_border", title: "Arcs Électriques", description: "Bordure cyan haute tension", effectKey: "electric_arc" },
  { level: 11, type: "banner_effect", title: "Éruption Solaire", description: "Vague de plasma doré incandescent", effectKey: "solar_flare" },
  { level: 12, type: "badge", title: "Chasseur d'Élite", description: "Badge honorifique de duelliste confirmé", effectKey: "champion" },
  { level: 13, type: "banner_effect", title: "Grille Holographique", description: "Maillage vectoriel cyan en mouvement", effectKey: "hologram_grid" },
  { level: 14, type: "banner_border", title: "Liseré Or Impérial", description: "Bordure dorée précieuse noble", effectKey: "golden_royale" },
  { level: 15, type: "badge", title: "Radiant Master", description: "Badge suprême Spycam Tracker", effectKey: "radiant" },
  { level: 16, type: "banner_border", title: "Contour Cyber Glitch", description: "Bordure glitchée chromatique", effectKey: "glitch_cyber" },
  { level: 20, type: "badge", title: "Légende Spycam", description: "Trophée ultime des maîtres du protocole", effectKey: "vip" },
];

export interface BannerCosmeticDefinition {
  id: string;
  name: string;
  minLevel: number;
  desc: string;
  color: string;
  cssRules?: string;
}

/**
 * Effets visuels intérieurs de la bannière (ne touchent pas au contour).
 */
export const BANNER_INTERIOR_EFFECTS: BannerCosmeticDefinition[] = [
  { id: "", name: "Aucun effet", minLevel: 1, desc: "Pas d'animation interne sur la bannière", color: "#6b7280" },
  {
    id: "cyber_glow", name: "Cyber Glow", minLevel: 2,
    desc: "Aura d'ambiance et lueur volumétrique cybernétique pulsante",
    color: "#ff4655",
    cssRules: `.banner-interior-cyber_glow, .banner-effect-cyber_glow {
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 5;
  box-shadow: inset 0 0 50px var(--cosmetic-accent, #ff4655), inset 0 0 20px rgba(255, 255, 255, 0.15);
  animation: pulse-cyber 3s ease-in-out infinite alternate;
}
@keyframes pulse-cyber {
  0% { opacity: 0.65; filter: drop-shadow(0 0 4px var(--cosmetic-accent, #ff4655)); }
  100% { opacity: 1; filter: drop-shadow(0 0 16px var(--cosmetic-accent, #ff4655)); }
}`,
  },
  {
    id: "scanlines", name: "Scanlines CRT", minLevel: 3,
    desc: "Trame cathodique rétro arcade avec balayage électronique",
    color: "#a0aec0",
    cssRules: `.banner-interior-scanlines, .banner-effect-scanlines {
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 5;
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.5) 50%),
              radial-gradient(circle at center, transparent 60%, rgba(0, 0, 0, 0.55) 100%);
  background-size: 100% 4px, 100% 100%; opacity: 0.85;
}
.banner-interior-scanlines::before, .banner-effect-scanlines::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(180deg, transparent 0%, var(--cosmetic-accent, rgba(255, 255, 255, 0.12)) 50%, transparent 100%);
  background-size: 100% 60px;
  animation: crt-sweep 4s linear infinite;
}
@keyframes crt-sweep {
  0% { background-position: 0 -60px; }
  100% { background-position: 0 100%; }
}`,
  },
  {
    id: "matrix", name: "Matrix Rain", minLevel: 5,
    desc: "Cascades numériques de données en flux vert phosphorescent",
    color: "#00ff41",
    cssRules: `.banner-interior-matrix, .banner-effect-matrix {
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 5;
  background-image:
    repeating-linear-gradient(90deg, transparent 0, transparent 18px, rgba(0, 0, 0, 0.75) 18px, rgba(0, 0, 0, 0.75) 20px),
    linear-gradient(180deg, transparent 0%, var(--cosmetic-accent, #00ff41) 75%, #ffffff 95%, transparent 100%),
    repeating-linear-gradient(0deg, transparent 0, transparent 3px, rgba(0, 255, 65, 0.18) 3px, rgba(0, 255, 65, 0.18) 6px);
  background-size: 100% 100%, 100% 140px, 100% 6px;
  box-shadow: inset 0 0 25px rgba(0, 255, 65, 0.2);
  animation: matrix-stream 2s linear infinite;
}
@keyframes matrix-stream {
  0% { background-position: 0 0, 0 -140px, 0 0; }
  100% { background-position: 0 0, 0 140px, 0 0; }
}`,
  },
  {
    id: "stardust", name: "Stardust", minLevel: 7,
    desc: "Constellations cosmiques scintillantes et nébuleuses stellaires",
    color: "#e2e8f0",
    cssRules: `.banner-interior-stardust, .banner-effect-stardust {
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 5;
  background-image:
    radial-gradient(1.5px 1.5px at 12% 22%, #ffffff 100%, transparent),
    radial-gradient(2px 2px at 28% 68%, var(--cosmetic-accent, #a78bfa) 100%, transparent),
    radial-gradient(1px 1px at 42% 18%, #ffffff 100%, transparent),
    radial-gradient(2.5px 2.5px at 62% 78%, var(--cosmetic-accent, #38bdf8) 100%, transparent),
    radial-gradient(1.5px 1.5px at 78% 32%, #ffffff 100%, transparent),
    radial-gradient(2px 2px at 89% 65%, var(--cosmetic-accent, #ec4899) 100%, transparent),
    radial-gradient(1px 1px at 94% 24%, #ffffff 100%, transparent),
    radial-gradient(circle at 75% 30%, rgba(168, 85, 247, 0.22) 0%, transparent 50%),
    radial-gradient(circle at 25% 70%, rgba(56, 189, 248, 0.18) 0%, transparent 50%);
  animation: stardust-glimmer 3.5s ease-in-out infinite alternate;
}
@keyframes stardust-glimmer {
  0% { opacity: 0.55; filter: drop-shadow(0 0 2px rgba(255,255,255,0.7)); }
  50% { opacity: 1; filter: drop-shadow(0 0 6px var(--cosmetic-accent, #a78bfa)); }
  100% { opacity: 0.7; filter: drop-shadow(0 0 3px rgba(56,189,248,0.8)); }
}`,
  },
  {
    id: "void_rift", name: "Faille Abyssale", minLevel: 9,
    desc: "Vortex de matière noire et fumerolles spectrales mystiques",
    color: "#a855f7",
    cssRules: `.banner-interior-void_rift, .banner-effect-void_rift {
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 5;
  background:
    radial-gradient(ellipse at 75% 50%, var(--cosmetic-accent, rgba(168, 85, 247, 0.35)) 0%, transparent 55%),
    radial-gradient(ellipse at 25% 60%, rgba(99, 102, 241, 0.25) 0%, transparent 50%);
  box-shadow: inset 0 0 40px rgba(88, 28, 135, 0.4);
  animation: void-swirl 4s ease-in-out infinite alternate;
}
@keyframes void-swirl {
  0% { transform: scale(1); filter: hue-rotate(0deg) brightness(0.9); }
  100% { transform: scale(1.04); filter: hue-rotate(20deg) brightness(1.2); }
}`,
  },
  {
    id: "solar_flare", name: "Éruption Solaire", minLevel: 11,
    desc: "Vague de plasma incandescent et ondes de chaleur ardentes",
    color: "#f59e0b",
    cssRules: `.banner-interior-solar_flare, .banner-effect-solar_flare {
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 5;
  background:
    linear-gradient(90deg, transparent 0%, var(--cosmetic-accent, rgba(245, 158, 11, 0.3)) 50%, transparent 100%),
    radial-gradient(circle at 10% 90%, var(--cosmetic-accent, rgba(239, 68, 68, 0.35)) 0%, transparent 50%);
  background-size: 200% 100%, 100% 100%;
  box-shadow: inset 0 0 35px var(--cosmetic-accent, rgba(245, 158, 11, 0.3));
  animation: solar-wave 3.5s ease-in-out infinite;
}
@keyframes solar-wave {
  0% { background-position: -200% 0, 0 0; }
  100% { background-position: 200% 0, 0 0; }
}`,
  },
  {
    id: "hologram_grid", name: "Grille Holographique 3D", minLevel: 13,
    desc: "Maillage vectoriel holographique avec balayage laser volumétrique",
    color: "#38bdf8",
    cssRules: `.banner-interior-hologram_grid, .banner-effect-hologram_grid {
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 5; overflow: hidden;
  background-image:
    linear-gradient(var(--cosmetic-accent, rgba(56, 189, 248, 0.35)) 1.5px, transparent 1.5px),
    linear-gradient(90deg, var(--cosmetic-accent, rgba(56, 189, 248, 0.35)) 1.5px, transparent 1.5px),
    radial-gradient(ellipse at 50% 100%, var(--cosmetic-accent, rgba(56, 189, 248, 0.35)) 0%, transparent 70%);
  background-size: 24px 24px, 24px 24px, 100% 100%;
  box-shadow: inset 0 0 35px var(--cosmetic-accent, rgba(56, 189, 248, 0.25));
  animation: holo-grid 6s linear infinite;
}
.banner-interior-hologram_grid::after, .banner-effect-hologram_grid::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(180deg, transparent 0%, var(--cosmetic-accent, rgba(56, 189, 248, 0.45)) 50%, transparent 100%);
  background-size: 100% 90px;
  animation: holo-scan 3.5s ease-in-out infinite;
}
@keyframes holo-grid {
  from { background-position: 0 0, 0 0, 0 0; }
  to { background-position: 0 24px, 24px 0, 0 0; }
}
@keyframes holo-scan {
  0% { background-position: 0 -90px; opacity: 0.2; }
  50% { opacity: 0.75; }
  100% { background-position: 0 200%; opacity: 0.2; }
}`,
  },
];

/**
 * Effets de bordure extérieure de la bannière (contour uniquement).
 */
export const BANNER_BORDER_EFFECTS: BannerCosmeticDefinition[] = [
  { id: "", name: "Aucune bordure", minLevel: 1, desc: "Contour classique discret sans effet", color: "#6b7280" },
  {
    id: "rgb_conic", name: "Bordure Chroma RGB", minLevel: 6,
    desc: "Contour rotatif dynamique à gradient spectral conique continu",
    color: "#f59e0b",
    cssRules: `.banner-border-rgb_conic, .banner-border-animated {
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 6;
  padding: 2.5px; overflow: hidden;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}
.banner-border-rgb_conic::before, .banner-border-animated::before {
  content: ''; position: absolute; top: -150%; left: -50%; width: 200%; height: 400%;
  background: conic-gradient(from 0deg, var(--cosmetic-accent, #ff4655) 0deg, #38bdf8 72deg, #a855f7 144deg, #ec4899 216deg, #f59e0b 288deg, var(--cosmetic-accent, #ff4655) 360deg);
  animation: spin-conic-border 4s linear infinite;
}
@keyframes spin-conic-border {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}`,
  },
  {
    id: "neon_pulse", name: "Bordure Néon Pulse", minLevel: 8,
    desc: "Contour néon incandescent avec halo lumineux pulsant",
    color: "#ff4655",
    cssRules: `.banner-border-neon_pulse {
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 6;
  border: 2px solid var(--cosmetic-accent, #ff4655);
  box-shadow: 0 0 16px var(--cosmetic-accent, rgba(255, 70, 85, 0.65)), inset 0 0 6px var(--cosmetic-accent, rgba(255, 70, 85, 0.35));
  animation: pulse-neon-border 2s ease-in-out infinite alternate;
}
@keyframes pulse-neon-border {
  0% { opacity: 0.8; filter: drop-shadow(0 0 4px var(--cosmetic-accent, #ff4655)); }
  100% { opacity: 1; box-shadow: 0 0 24px var(--cosmetic-accent, rgba(255, 70, 85, 0.9)), inset 0 0 10px var(--cosmetic-accent, rgba(255, 70, 85, 0.5)); }
}`,
  },
  {
    id: "electric_arc", name: "Arcs Électriques Cyan", minLevel: 10,
    desc: "Bordure cyan parcourue d'impulsions électriques à haute tension",
    color: "#06b6d4",
    cssRules: `.banner-border-electric_arc {
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 6;
  border: 2px solid var(--cosmetic-accent, #06b6d4);
  box-shadow: 0 0 14px var(--cosmetic-accent, rgba(6, 182, 212, 0.6));
  animation: electric-flicker 1.8s steps(2, start) infinite;
}
@keyframes electric-flicker {
  0%, 100% { border-color: var(--cosmetic-accent, #06b6d4); box-shadow: 0 0 14px var(--cosmetic-accent, rgba(6, 182, 212, 0.6)); }
  50% { border-color: #67e8f9; box-shadow: 0 0 24px #67e8f9, inset 0 0 8px #67e8f9; }
}`,
  },
  {
    id: "golden_royale", name: "Liseré Or Impérial", minLevel: 14,
    desc: "Bordure dorée précieuse avec halo d'ambre et brillance métallique noble",
    color: "#fbbf24",
    cssRules: `.banner-border-golden_royale {
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 6;
  border: 2px solid var(--cosmetic-accent, #fbbf24);
  box-shadow: 0 0 16px var(--cosmetic-accent, rgba(251, 191, 36, 0.5)), inset 0 0 8px rgba(251, 191, 36, 0.3);
  overflow: hidden;
}
.banner-border-golden_royale::before {
  content: ''; position: absolute; inset: -100%;
  background: linear-gradient(115deg, transparent 40%, rgba(255, 255, 255, 0.85) 50%, var(--cosmetic-accent, #fbbf24) 55%, transparent 65%);
  animation: gold-glint 3.8s infinite cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes gold-glint {
  0% { transform: translate(-80%, -80%); }
  40%, 100% { transform: translate(80%, 80%); }
}`,
  },
  {
    id: "glitch_cyber", name: "Contour Cyber Glitch", minLevel: 16,
    desc: "Contour fracturé avec micro-décalages chromatiques glitchés",
    color: "#ec4899",
    cssRules: `.banner-border-glitch_cyber {
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 6;
  border: 2px solid var(--cosmetic-accent, #06b6d4);
  box-shadow: 0 0 12px var(--cosmetic-accent, rgba(6, 182, 212, 0.5));
  animation: cyber-glitch-border 3.2s steps(1) infinite;
}
@keyframes cyber-glitch-border {
  0%, 88%, 100% {
    border-color: var(--cosmetic-accent, #06b6d4);
    box-shadow: 0 0 12px var(--cosmetic-accent, rgba(6, 182, 212, 0.5));
    clip-path: none;
  }
  89% {
    border-color: #ec4899;
    box-shadow: -3px 0 0 #ec4899, 3px 0 0 var(--cosmetic-accent, #06b6d4), 0 0 15px rgba(236, 72, 153, 0.8);
    clip-path: polygon(0 0, 100% 0, 100% 35%, 0 35%, 0 70%, 100% 70%, 100% 100%, 0 100%);
  }
  91% {
    border-color: #ffffff;
    box-shadow: 3px -1px 0 var(--cosmetic-accent, #06b6d4), -3px 1px 0 #ec4899;
    clip-path: polygon(0 15%, 100% 15%, 100% 55%, 0 55%, 0 85%, 100% 85%);
  }
  93% {
    border-color: var(--cosmetic-accent, #06b6d4);
    box-shadow: 0 0 12px var(--cosmetic-accent, rgba(6, 182, 212, 0.6));
    clip-path: none;
  }
  95% {
    border-color: #ec4899;
    box-shadow: -2px 0 0 #ec4899, 2px 0 0 #38bdf8;
  }
}`,
  },
];


/**
 * Retourne le composant icône correspondant à la catégorie de défi.
 */
export function getCategoryIcon(category: string, size = 15): React.ReactNode {
  switch (category) {
    case "combat":
      return React.createElement(IconSword, { size });
    case "precision":
      return React.createElement(IconCrosshair, { size });
    case "tactical":
      return React.createElement(IconShield, { size });
    case "social":
      return React.createElement(IconUsers, { size });
    case "agent":
      return React.createElement(IconFlame, { size });
    default:
      return React.createElement(IconTrophy, { size });
  }
}

/**
 * Couleur d'accentuation dynamique par catégorie de défi.
 */
export function getCategoryAccent(category: string): string {
  switch (category) {
    case "combat":
      return "#ef4444";
    case "precision":
      return "#f59e0b";
    case "tactical":
      return "#3b82f6";
    case "social":
      return "#8b5cf6";
    case "agent":
      return "#10b981";
    default:
      return "var(--color-val-red, #ff4655)";
  }
}
