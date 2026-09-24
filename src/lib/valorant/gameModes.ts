export interface GameModeInfo {
  id: string;
  displayName: string;
  icon: string;
  hasTeams: boolean;
  hasRounds: boolean;
  isRanked: boolean;
  scoreLabel?: string;
}

export const GAME_MODES_CATALOG: Record<string, GameModeInfo> = {
  competitive: {
    id: "competitive",
    displayName: "Compétitif",
    icon: "https://media.valorant-api.com/gamemodes/96bd3920-4f36-d026-2b28-c683eb0bcac5/displayicon.png",
    hasTeams: true,
    hasRounds: true,
    isRanked: true,
    scoreLabel: "Manches",
  },
  unrated: {
    id: "unrated",
    displayName: "Non classé",
    icon: "https://media.valorant-api.com/gamemodes/96bd3920-4f36-d026-2b28-c683eb0bcac5/displayicon.png",
    hasTeams: true,
    hasRounds: true,
    isRanked: false,
    scoreLabel: "Manches",
  },
  deathmatch: {
    id: "deathmatch",
    displayName: "Deathmatch",
    icon: "https://media.valorant-api.com/gamemodes/a8790ec5-4237-f2f0-e93b-08a8e89865b2/displayicon.png",
    hasTeams: false,
    hasRounds: false,
    isRanked: false,
    scoreLabel: "Frags",
  },
  team_deathmatch: {
    id: "team_deathmatch",
    displayName: "Match à mort par équipe",
    icon: "https://media.valorant-api.com/gamemodes/e086db66-47fd-e791-ca81-06a645ac7661/displayicon.png",
    hasTeams: true,
    hasRounds: false,
    isRanked: false,
    scoreLabel: "Frags",
  },
  swiftplay: {
    id: "swiftplay",
    displayName: "Swiftplay",
    icon: "https://media.valorant-api.com/gamemodes/5d0f264b-4ebe-cc63-c147-809e1374484b/displayicon.png",
    hasTeams: true,
    hasRounds: true,
    isRanked: false,
    scoreLabel: "Manches",
  },
  spikerush: {
    id: "spikerush",
    displayName: "Spike Rush",
    icon: "https://media.valorant-api.com/gamemodes/e921d1e6-416b-c31f-1291-74930c330b7b/displayicon.png",
    hasTeams: true,
    hasRounds: true,
    isRanked: false,
    scoreLabel: "Manches",
  },
  premier: {
    id: "premier",
    displayName: "Premier",
    icon: "https://media.valorant-api.com/gamemodes/96bd3920-4f36-d026-2b28-c683eb0bcac5/displayicon.png",
    hasTeams: true,
    hasRounds: true,
    isRanked: true,
    scoreLabel: "Manches",
  },
  escalation: {
    id: "escalation",
    displayName: "Escalade",
    icon: "https://media.valorant-api.com/gamemodes/a4ed6518-4741-6dcb-35bd-f884aecdc859/displayicon.png",
    hasTeams: true,
    hasRounds: false,
    isRanked: false,
    scoreLabel: "Niveaux",
  },
  replication: {
    id: "replication",
    displayName: "Réplication",
    icon: "https://media.valorant-api.com/gamemodes/4744698a-4513-dc96-9c22-a9aa437e4a58/displayicon.png",
    hasTeams: true,
    hasRounds: true,
    isRanked: false,
    scoreLabel: "Manches",
  },
  snowball: {
    id: "snowball",
    displayName: "Bataille de boules de neige",
    icon: "https://media.valorant-api.com/gamemodes/57038d6d-49b1-3a74-c5ef-3395d9f23a97/displayicon.png",
    hasTeams: true,
    hasRounds: false,
    isRanked: false,
    scoreLabel: "Frags",
  },
  all_random_one_site: {
    id: "all_random_one_site",
    displayName: "All Random One Site",
    icon: "https://media.valorant-api.com/gamemodes/1cd8901f-47af-49cb-d758-e2afd0eb2a39/displayicon.png",
    hasTeams: true,
    hasRounds: true,
    isRanked: false,
    scoreLabel: "Manches",
  },
  gauntlet: {
    id: "gauntlet",
    displayName: "Gauntlet: Glitched",
    icon: "https://media.valorant-api.com/gamemodes/106cc7b7-444a-14e5-4ac6-5eadb9864b67/displayicon.png",
    hasTeams: true,
    hasRounds: false,
    isRanked: false,
    scoreLabel: "Manches",
  },
  knockout: {
    id: "knockout",
    displayName: "Knockout",
    icon: "https://media.valorant-api.com/gamemodes/1a4a3fd5-4966-62cb-7fe4-15b0317f5c80/displayicon.png",
    hasTeams: true,
    hasRounds: true,
    isRanked: false,
    scoreLabel: "Manches",
  },
  retake: {
    id: "retake",
    displayName: "Retake",
    icon: "https://media.valorant-api.com/gamemodes/75b7b658-472c-0264-cbe6-049abf14f54b/displayicon.png",
    hasTeams: true,
    hasRounds: true,
    isRanked: false,
    scoreLabel: "Manches",
  },
  skirmish: {
    id: "skirmish",
    displayName: "Escarmouche",
    icon: "https://media.valorant-api.com/gamemodes/0e9805d8-4af6-5ffb-f467-55806a6bc484/displayicon.png",
    hasTeams: true,
    hasRounds: true,
    isRanked: false,
    scoreLabel: "Manches",
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
};

/**
 * Normalise et détecte intelligemment le mode de jeu à partir des champs API
 * (queueId, meta.mode, meta.queue, raw.metadata, etc.)
 */
export function resolveGameMode(rawModeOrQueue?: string | null): GameModeInfo {
  if (!rawModeOrQueue) return GAME_MODES_CATALOG.competitive;

  const clean = String(rawModeOrQueue).toLowerCase().trim().replace(/[\s\-_]/g, "");

  // Match à mort solo (Deathmatch)
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
  // Gauntlet: Glitched (nouveau mode 8 duos)
  if (clean.includes("gauntlet") || clean.includes("abilitydraft") || clean.includes("glitched")) {
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
