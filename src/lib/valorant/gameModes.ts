export interface GameModeInfo {
  id: string;
  displayName: string;
  icon: string;
  hasTeams: boolean;
  teamFormat?: "standard" | "duos" | "ffa";
  maxTeams?: number;
  hasRounds: boolean;
  isRanked: boolean;
  scoreLabel?: string;
  aliases?: string[];
  parsingStrategy?: "standard" | "ffa" | "duos" | "multi-team";
  trackAgentStats?: boolean;
}

export const GAME_MODES_CATALOG: Record<string, GameModeInfo> = {
  competitive: {
    id: "competitive",
    displayName: "Compétitif",
    icon: "https://media.valorant-api.com/gamemodes/96bd3920-4f36-d026-2b28-c683eb0bcac5/displayicon.png",
    hasTeams: true,
    teamFormat: "standard",
    maxTeams: 2,
    hasRounds: true,
    isRanked: true,
    scoreLabel: "Manches",
    aliases: ["competitive", "ranked", "classe"],
    parsingStrategy: "standard",
    trackAgentStats: true,
  },
  unrated: {
    id: "unrated",
    displayName: "Non classé",
    icon: "https://media.valorant-api.com/gamemodes/96bd3920-4f36-d026-2b28-c683eb0bcac5/displayicon.png",
    hasTeams: true,
    teamFormat: "standard",
    maxTeams: 2,
    hasRounds: true,
    isRanked: false,
    scoreLabel: "Manches",
    aliases: ["unrated", "standard", "nonclasse"],
    parsingStrategy: "standard",
    trackAgentStats: true,
  },
  deathmatch: {
    id: "deathmatch",
    displayName: "Deathmatch",
    icon: "https://media.valorant-api.com/gamemodes/a8790ec5-4237-f2f0-e93b-08a8e89865b2/displayicon.png",
    hasTeams: false,
    teamFormat: "ffa",
    maxTeams: 1,
    hasRounds: false,
    isRanked: false,
    scoreLabel: "Frags",
    aliases: ["deathmatch", "ffa"],
    parsingStrategy: "ffa",
    trackAgentStats: false,
  },
  team_deathmatch: {
    id: "team_deathmatch",
    displayName: "Match à mort par équipe",
    icon: "https://media.valorant-api.com/gamemodes/e086db66-47fd-e791-ca81-06a645ac7661/displayicon.png",
    hasTeams: true,
    teamFormat: "standard",
    maxTeams: 2,
    hasRounds: false,
    isRanked: false,
    scoreLabel: "Frags",
    aliases: ["teamdeathmatch", "hurm", "ggteam", "tdm"],
    parsingStrategy: "standard",
    trackAgentStats: true,
  },
  swiftplay: {
    id: "swiftplay",
    displayName: "Swiftplay",
    icon: "https://media.valorant-api.com/gamemodes/5d0f264b-4ebe-cc63-c147-809e1374484b/displayicon.png",
    hasTeams: true,
    teamFormat: "standard",
    maxTeams: 2,
    hasRounds: true,
    isRanked: false,
    scoreLabel: "Manches",
    aliases: ["swiftplay", "swift"],
    parsingStrategy: "standard",
    trackAgentStats: true,
  },
  spikerush: {
    id: "spikerush",
    displayName: "Spike Rush",
    icon: "https://media.valorant-api.com/gamemodes/e921d1e6-416b-c31f-1291-74930c330b7b/displayicon.png",
    hasTeams: true,
    teamFormat: "standard",
    maxTeams: 2,
    hasRounds: true,
    isRanked: false,
    scoreLabel: "Manches",
    aliases: ["spikerush", "quickbomb"],
    parsingStrategy: "standard",
    trackAgentStats: true,
  },
  premier: {
    id: "premier",
    displayName: "Premier",
    icon: "https://media.valorant-api.com/gamemodes/96bd3920-4f36-d026-2b28-c683eb0bcac5/displayicon.png",
    hasTeams: true,
    teamFormat: "standard",
    maxTeams: 2,
    hasRounds: true,
    isRanked: true,
    scoreLabel: "Manches",
    aliases: ["premier"],
    parsingStrategy: "standard",
    trackAgentStats: true,
  },
  gauntlet: {
    id: "gauntlet",
    displayName: "Gauntlet: Glitched",
    icon: "https://media.valorant-api.com/gamemodes/106cc7b7-444a-14e5-4ac6-5eadb9864b67/displayicon.png",
    hasTeams: true,
    teamFormat: "duos",
    maxTeams: 8,
    hasRounds: false,
    isRanked: false,
    scoreLabel: "Éliminations",
    aliases: ["gauntlet", "abilitydraft", "abilitydraftarena", "glitched", "arena"],
    parsingStrategy: "duos",
    trackAgentStats: false,
  },
  escalation: {
    id: "escalation",
    displayName: "Escalade",
    icon: "https://media.valorant-api.com/gamemodes/a4ed6518-4741-6dcb-35bd-f884aecdc859/displayicon.png",
    hasTeams: true,
    teamFormat: "standard",
    maxTeams: 2,
    hasRounds: false,
    isRanked: false,
    scoreLabel: "Niveaux",
    aliases: ["escalation", "gungame"],
    parsingStrategy: "standard",
    trackAgentStats: false,
  },
  replication: {
    id: "replication",
    displayName: "Réplication",
    icon: "https://media.valorant-api.com/gamemodes/4744698a-4513-dc96-9c22-a9aa437e4a58/displayicon.png",
    hasTeams: true,
    teamFormat: "standard",
    maxTeams: 2,
    hasRounds: true,
    isRanked: false,
    scoreLabel: "Manches",
    aliases: ["replication", "onefa", "oneforall"],
    parsingStrategy: "standard",
    trackAgentStats: true,
  },
  snowball: {
    id: "snowball",
    displayName: "Bataille de boules de neige",
    icon: "https://media.valorant-api.com/gamemodes/57038d6d-49b1-3a74-c5ef-3395d9f23a97/displayicon.png",
    hasTeams: true,
    teamFormat: "standard",
    maxTeams: 2,
    hasRounds: false,
    isRanked: false,
    scoreLabel: "Frags",
    aliases: ["snowball"],
    parsingStrategy: "standard",
    trackAgentStats: false,
  },
  all_random_one_site: {
    id: "all_random_one_site",
    displayName: "All Random One Site",
    icon: "https://media.valorant-api.com/gamemodes/1cd8901f-47af-49cb-d758-e2afd0eb2a39/displayicon.png",
    hasTeams: true,
    teamFormat: "standard",
    maxTeams: 2,
    hasRounds: true,
    isRanked: false,
    scoreLabel: "Manches",
    aliases: ["aros", "allrandomonesite", "randomsite"],
    parsingStrategy: "standard",
    trackAgentStats: true,
  },
  knockout: {
    id: "knockout",
    displayName: "Knockout",
    icon: "https://media.valorant-api.com/gamemodes/1a4a3fd5-4966-62cb-7fe4-15b0317f5c80/displayicon.png",
    hasTeams: true,
    teamFormat: "standard",
    maxTeams: 2,
    hasRounds: true,
    isRanked: false,
    scoreLabel: "Manches",
    aliases: ["knockout", "dodgeball"],
    parsingStrategy: "standard",
    trackAgentStats: true,
  },
  retake: {
    id: "retake",
    displayName: "Retake",
    icon: "https://media.valorant-api.com/gamemodes/75b7b658-472c-0264-cbe6-049abf14f54b/displayicon.png",
    hasTeams: true,
    teamFormat: "standard",
    maxTeams: 2,
    hasRounds: true,
    isRanked: false,
    scoreLabel: "Manches",
    aliases: ["retake", "fortcollins"],
    parsingStrategy: "standard",
    trackAgentStats: true,
  },
  skirmish: {
    id: "skirmish",
    displayName: "Escarmouche",
    icon: "https://media.valorant-api.com/gamemodes/0e9805d8-4af6-5ffb-f467-55806a6bc484/displayicon.png",
    hasTeams: true,
    teamFormat: "standard",
    maxTeams: 2,
    hasRounds: true,
    isRanked: false,
    scoreLabel: "Manches",
    aliases: ["skirmish"],
    parsingStrategy: "standard",
    trackAgentStats: true,
  },
};

const FALLBACK_MODE: GameModeInfo = {
  id: "other",
  displayName: "Autre mode",
  icon: "https://media.valorant-api.com/gamemodes/96bd3920-4f36-d026-2b28-c683eb0bcac5/displayicon.png",
  hasTeams: true,
  hasRounds: true,
  isRanked: false,
  scoreLabel: "Score",
  parsingStrategy: "standard",
  trackAgentStats: true,
};

/**
 * Normalise et détecte intelligemment le mode de jeu à partir des champs API
 * (queueId, meta.mode, meta.queue, raw.metadata, etc.)
 * Supporte les modes personnalisés définis dynamiquement dans AppControl.
 */
export function resolveGameMode(
  rawModeOrQueue?: string | null,
  dynamicModes?: GameModeInfo[]
): GameModeInfo {
  if (!rawModeOrQueue) return GAME_MODES_CATALOG.competitive;

  const clean = String(rawModeOrQueue).toLowerCase().trim().replace(/[\s\-_:/]/g, "");

  // 1. Vérification prioritaire dans les modes configurés dynamiquement via AppControl
  if (Array.isArray(dynamicModes) && dynamicModes.length > 0) {
    for (const dm of dynamicModes) {
      const dmId = dm.id?.toLowerCase().trim().replace(/[\s\-_:/]/g, "");
      const dmName = dm.displayName?.toLowerCase().trim().replace(/[\s\-_:/]/g, "");
      if (dmId === clean || dmName === clean || clean.includes(dmId)) {
        return dm;
      }
      if (Array.isArray(dm.aliases)) {
        for (const alias of dm.aliases) {
          const cleanAlias = String(alias).toLowerCase().trim().replace(/[\s\-_:/]/g, "");
          if (cleanAlias && (clean === cleanAlias || clean.includes(cleanAlias))) {
            return dm;
          }
        }
      }
    }
  }

  // 2. Match à mort solo (Deathmatch)
  if (clean.includes("deathmatch") && !clean.includes("team") && !clean.includes("hurm") && !clean.includes("ggteam")) {
    return GAME_MODES_CATALOG.deathmatch;
  }
  // Match à mort par équipe (Team Deathmatch / HURM)
  if (
    clean.includes("teamdeathmatch") ||
    clean.includes("hurm") ||
    clean.includes("ggteam") ||
    clean === "tdm"
  ) {
    return GAME_MODES_CATALOG.team_deathmatch;
  }
  // Swiftplay
  if (clean.includes("swiftplay") || clean.includes("swift")) {
    return GAME_MODES_CATALOG.swiftplay;
  }
  // Spike Rush
  if (clean.includes("spikerush") || clean.includes("quickbomb")) {
    return GAME_MODES_CATALOG.spikerush;
  }
  // Compétitif
  if (clean.includes("competitive") || clean.includes("ranked") || clean.includes("classe")) {
    return GAME_MODES_CATALOG.competitive;
  }
  // Premier
  if (clean.includes("premier")) {
    return GAME_MODES_CATALOG.premier;
  }
  // Non classé / Standard / Unrated
  if (clean.includes("unrated") || clean.includes("standard") || clean.includes("nonclasse")) {
    return GAME_MODES_CATALOG.unrated;
  }
  // All Random One Site (AROS - nouveau mode)
  if (clean.includes("aros") || clean.includes("allrandomonesite") || clean.includes("randomsite")) {
    return GAME_MODES_CATALOG.all_random_one_site;
  }
  // Gauntlet: Glitched (mode temporaire 8 duos, Ability Draft Arena)
  if (
    clean.includes("gauntlet") ||
    clean.includes("abilitydraft") ||
    clean.includes("glitched") ||
    clean.includes("arena") ||
    clean.includes("duo")
  ) {
    return GAME_MODES_CATALOG.gauntlet;
  }
  // Escalade
  if (clean.includes("escalation") || clean.includes("gungame")) {
    return GAME_MODES_CATALOG.escalation;
  }
  // Réplication
  if (clean.includes("replication") || clean.includes("onefa") || clean.includes("oneforall")) {
    return GAME_MODES_CATALOG.replication;
  }
  // Bataille de boules de neige
  if (clean.includes("snowball")) {
    return GAME_MODES_CATALOG.snowball;
  }
  // Knockout
  if (clean.includes("knockout") || clean.includes("dodgeball")) {
    return GAME_MODES_CATALOG.knockout;
  }
  // Retake
  if (clean.includes("retake") || clean.includes("fortcollins")) {
    return GAME_MODES_CATALOG.retake;
  }
  // Skirmish
  if (clean.includes("skirmish")) {
    return GAME_MODES_CATALOG.skirmish;
  }

  return {
    ...FALLBACK_MODE,
    displayName: rawModeOrQueue.charAt(0).toUpperCase() + rawModeOrQueue.slice(1),
  };
}

/**
 * Retourne la liste complète des modes avec déduplication
 */
export function getAllGameModes(dynamicModes?: GameModeInfo[]): GameModeInfo[] {
  const map = new Map<string, GameModeInfo>();
  Object.values(GAME_MODES_CATALOG).forEach((m) => map.set(m.id, m));
  if (Array.isArray(dynamicModes)) {
    dynamicModes.forEach((m) => map.set(m.id, { ...map.get(m.id), ...m }));
  }
  return Array.from(map.values());
}
