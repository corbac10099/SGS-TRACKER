// ══════════════════════════════════════════════════════
// SGS AIM Native — Scénarios 3D
// ══════════════════════════════════════════════════════

import type { AimScenario, AimScenarioId } from "./types";

export const SCENARIOS: AimScenario[] = [
  // ═══════════════════ MODE RUNNER / PARKOUR COURSE ═══════════════════
  {
    id: "assault_runner_3d",
    name: "Cyber Assault Runner",
    tagline: "Parkour infini avec rampes, sauts & cibles d'assaut",
    description:
      "Avancez en ligne droite sur une autoroute cyber infinie ! Grimpez sur des rampes, franchissez des fossés avec la barre d'espace et éliminez les bots qui surgissent devant vous. Plus vous avancez vite et tuez de cibles, plus le multiplicateur explose !",
    icon: "move",
    category: "runner",
    mapId: "infinite_highway",
    difficulty: "Difficile",
    defaultDurationSec: 75,
    targetCount: 4,
    targetRadius: 0.25,
    targetColor: "#ff4655",
    scoreMultiplier: 2.5,
    allowMovement: true,
    isRunnerMode: true,
  },

  // ═══════════════════ PRÉCISION ═══════════════════
  {
    id: "gridshot_3d",
    name: "Gridshot 3D",
    tagline: "Mémoire musculaire dans l'espace",
    description:
      "3 sphères lumineuses apparaissent simultanément dans une arène 3D ouverte. Détruisez-les le plus vite possible : chaque destruction en fait apparaître une nouvelle. 60 secondes chrono.",
    icon: "grid",
    category: "precision",
    mapId: "arena",
    difficulty: "Intermédiaire",
    defaultDurationSec: 60,
    targetCount: 3,
    targetRadius: 0.3,
    targetColor: "#ff4655",
    scoreMultiplier: 1.0,
    allowMovement: false,
  },
  {
    id: "microflick_3d",
    name: "Micro-Flick Headshots",
    tagline: "Précision chirurgicale à distances variées",
    description:
      "Des têtes d'agents apparaissent à des distances de 10m à 50m dans le stand de tir. Chaque tir doit être un headshot chirurgical. Cibles réduites pour les joueurs confirmés. 45 secondes.",
    icon: "target",
    category: "precision",
    mapId: "range",
    difficulty: "Difficile",
    defaultDurationSec: 45,
    targetCount: 1,
    targetRadius: 0.16,
    targetColor: "#00ffaa",
    scoreMultiplier: 1.8,
    allowMovement: false,
  },
  {
    id: "headshot_range",
    name: "Headshot Range 50m",
    tagline: "One-tap longue distance — Vandal & Guardian",
    description:
      "Mannequins situés entre 30m et 50m. Seuls les headshots sont comptabilisés. Entraînement ultime pour les one-taps longue portée. 60 secondes.",
    icon: "crosshair",
    category: "precision",
    mapId: "range",
    difficulty: "Extrême",
    defaultDurationSec: 60,
    targetCount: 1,
    targetRadius: 0.13,
    targetColor: "#34d399",
    scoreMultiplier: 2.2,
    allowMovement: false,
  },

  // ═══════════════════ FLICKING ═══════════════════
  {
    id: "spider_3d",
    name: "Spider Flick 360°",
    tagline: "Tirs réflexes grand angle dans l'espace",
    description:
      "Des cibles apparaissent tout autour de vous à 90° et 180°. Tournez rapidement la caméra pour neutraliser les menaces dans votre dos. Vitesse adaptative. 45 secondes.",
    icon: "zap",
    category: "flicking",
    mapId: "arena",
    difficulty: "Difficile",
    defaultDurationSec: 45,
    targetCount: 1,
    targetRadius: 0.25,
    targetColor: "#ffaa00",
    scoreMultiplier: 2.0,
    allowMovement: false,
  },

  // ═══════════════════ TRACKING ═══════════════════
  {
    id: "tracking_strafe",
    name: "Strafe Bot Tracking",
    tagline: "Suivi de bot en mouvement continu",
    description:
      "Un mannequin 3D effectue des counter-strafes et accélérations réalistes style Valorant. Maintenez le viseur sur la tête pour scorer en continu. Vitesse adaptative. 30 secondes.",
    icon: "move",
    category: "tracking",
    mapId: "city",
    difficulty: "Difficile",
    defaultDurationSec: 30,
    targetCount: 1,
    targetRadius: 0.22,
    targetColor: "#38bdf8",
    scoreMultiplier: 1.7,
    allowMovement: false,
  },

  // ═══════════════════ RÉFLEXES ═══════════════════
  {
    id: "floating_orbs",
    name: "Orbes Flottantes",
    tagline: "Sphères lumineuses en mouvement libre",
    description:
      "Des orbes lumineuses flottent à différentes hauteurs et vitesses dans un ciel ouvert. Certaines accélèrent, d'autres zigzaguent. Cliquez avant qu'elles ne disparaissent. 45 secondes.",
    icon: "zap",
    category: "reflexes",
    mapId: "sky_dome",
    difficulty: "Intermédiaire",
    defaultDurationSec: 45,
    targetCount: 4,
    targetRadius: 0.28,
    targetColor: "#c084fc",
    scoreMultiplier: 1.4,
    allowMovement: false,
  },
  {
    id: "reaction_3d",
    name: "Réaction 3D",
    tagline: "Benchmark réflexe pur en espace 3D",
    description:
      "Attendez qu'une sphère lumineuse apparaisse dans l'espace 3D, puis cliquez dessus le plus vite possible. 10 essais pour calculer votre temps de réaction moyen en millisecondes.",
    icon: "clock",
    category: "reflexes",
    mapId: "sky_dome",
    difficulty: "Facile",
    defaultDurationSec: 0,
    targetCount: 1,
    targetRadius: 0.4,
    targetColor: "#22cc88",
    scoreMultiplier: 1.0,
    allowMovement: false,
  },

  // ═══════════════════ ÉLIMINATION ═══════════════════
  {
    id: "speed_arena",
    name: "Speed Arena",
    tagline: "50 cibles à éliminer à cadence rapide",
    description:
      "50 mannequins apparaissent un par un dans une arène avec des colonnes et obstacles. La vitesse d'apparition s'adapte en direct à votre cadence d'élimination.",
    icon: "grid",
    category: "elimination",
    mapId: "arena",
    difficulty: "Intermédiaire",
    defaultDurationSec: 90,
    targetCount: 1,
    targetRadius: 0.22,
    targetColor: "#f43f5e",
    scoreMultiplier: 1.5,
    allowMovement: false,
  },
];

export function getScenarioById(id: string): AimScenario {
  return SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
}

export function getScenariosByCategory(cat: AimScenario["category"]): AimScenario[] {
  return SCENARIOS.filter((s) => s.category === cat);
}

export const SCENARIO_CATEGORIES: { id: AimScenario["category"]; label: string; icon: string }[] = [
  { id: "runner", label: "Course & Parkour", icon: "move" },
  { id: "precision", label: "Précision", icon: "target" },
  { id: "flicking", label: "Flicking", icon: "zap" },
  { id: "tracking", label: "Tracking", icon: "move" },
  { id: "reflexes", label: "Réflexes", icon: "clock" },
  { id: "elimination", label: "Élimination", icon: "grid" },
];
