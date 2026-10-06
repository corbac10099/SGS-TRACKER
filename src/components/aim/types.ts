// ══════════════════════════════════════════════════════
// SGS AIM Native — Types (Directly embedded in Tracker)
// ══════════════════════════════════════════════════════

export type AimScenarioId =
  // 3D Scenarios — Précision
  | "gridshot_3d"
  | "microflick_3d"
  | "headshot_range"
  // 3D Scenarios — Flicking
  | "spider_3d"
  // 3D Scenarios — Tracking
  | "tracking_strafe"
  // 3D Scenarios — Réflexes
  | "floating_orbs"
  | "reaction_3d"
  // 3D Scenarios — Élimination
  | "speed_arena"
  // 3D Scenarios — Mode Course / Parkour Infini avec Tir
  | "assault_runner_3d";

export type AimRankId =
  | "iron"
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond"
  | "ascendant"
  | "immortal"
  | "radiant_aim";

export type AimMapId =
  | "range"
  | "arena"
  | "corridor"
  | "sky_dome"
  | "city"
  | "infinite_highway";

export type PlayerProfile = "sniper" | "duelist" | "tracker" | "balanced";

export interface AimRankTier {
  id: AimRankId;
  name: string;
  minScore: number;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  description: string;
}

export interface AimScenario {
  id: AimScenarioId;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  category: "precision" | "flicking" | "tracking" | "reflexes" | "elimination" | "runner";
  mapId: AimMapId;
  difficulty: "Facile" | "Intermédiaire" | "Difficile" | "Extrême";
  defaultDurationSec: number;
  targetCount: number;
  targetRadius: number;
  targetColor: string;
  scoreMultiplier: number;
  /** Permet au joueur de se déplacer (WASD/ZQSD + Saut Espace) */
  allowMovement: boolean;
  /** Active le circuit de course / parkour linéaire infini */
  isRunnerMode?: boolean;
}

export interface CrosshairSettings {
  color: string;
  showCenterDot: boolean;
  centerDotSize: number;
  innerLinesLength: number;
  innerLinesThickness: number;
  innerLinesOffset: number;
  innerLinesOpacity: number;
  outerLines: boolean;
  outerLinesLength: number;
  outerLinesThickness: number;
  outerLinesOffset: number;
  outerLinesOpacity: number;
}

export interface ValorantSensSettings {
  sens: number;
  dpi: number;
  fov: number;
}

export interface AimScoreRecord {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRank?: AimRankId;
  scenarioId: AimScenarioId;
  score: number;
  targetsHit: number;
  totalShots: number;
  accuracy: number;
  headshotRate: number;
  avgTimeToHitMs: number;
  maxCombo?: number;
  difficulty?: number;
  distanceTraveled?: number;
  timestamp: number;
  verified: boolean;
}

export interface CalibrationResult {
  completedAt: number;
  overallScore: number;
  rankId: AimRankId;
  flickScore: number;
  microScore: number;
  trackingScore: number;
  reactionTimeMs: number;
  accuracyAvg: number;
  playerProfile: PlayerProfile;
  adaptiveDifficulty: number;
  recommendedSens: number;
  recommendedDpi: number;
}

export interface AdaptiveConfig {
  targetScale: number;
  spawnRateMs: number;
  targetSpeed: number;
  targetDistance: [number, number];
  angleSpread: number;
}
