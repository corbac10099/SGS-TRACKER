import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import https from "https";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ValorantLockfileData {
  process: string;
  pid: string;
  port: string;
  password: string;
  protocol: string;
}

export interface LivePlayer {
  puuid: string;
  name: string;
  tag: string;
  team: "ally" | "enemy";
  rank: string;
  rankTier: number;
  rankIcon: string;
  isPrivateRank: boolean;
  agent: string;
  agentName: string;
  agentIcon: string;
  isMe: boolean;
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  spi: number;
}

// ─── Dictionnaire des Agents Valorant ───────────────────────────────────────

const VALORANT_AGENTS: Record<string, { name: string; icon: string }> = {
  "e370fa57-4757-3604-3648-499e1f642d3f": { name: "Gekko", icon: "https://media.valorant-api.com/agents/e370fa57-4757-3604-3648-499e1f642d3f/displayicon.png" },
  "dade69b4-4f5a-8528-247b-219e5a1facd6": { name: "Fade", icon: "https://media.valorant-api.com/agents/dade69b4-4f5a-8528-247b-219e5a1facd6/displayicon.png" },
  "5f8d3a7f-467b-97f3-062c-13acf203c006": { name: "Breach", icon: "https://media.valorant-api.com/agents/5f8d3a7f-467b-97f3-062c-13acf203c006/displayicon.png" },
  "cc8b64c8-4b25-4ff9-6e7f-37b4da43d235": { name: "Deadlock", icon: "https://media.valorant-api.com/agents/cc8b64c8-4b25-4ff9-6e7f-37b4da43d235/displayicon.png" },
  "b444168c-4e35-8076-db47-ef9bf368f384": { name: "Tejo", icon: "https://media.valorant-api.com/agents/b444168c-4e35-8076-db47-ef9bf368f384/displayicon.png" },
  "f94c3b30-42be-e959-889c-5aa313dba261": { name: "Raze", icon: "https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5aa313dba261/displayicon.png" },
  "22697a3d-45bf-8dd7-4fec-84a9e28c69d7": { name: "Chamber", icon: "https://media.valorant-api.com/agents/22697a3d-45bf-8dd7-4fec-84a9e28c69d7/displayicon.png" },
  "601dbbe7-43ce-be57-2a40-4abd24953621": { name: "KAY/O", icon: "https://media.valorant-api.com/agents/601dbbe7-43ce-be57-2a40-4abd24953621/displayicon.png" },
  "6f2a04ca-43e0-be17-7f36-b3908627744d": { name: "Skye", icon: "https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/displayicon.png" },
  "117ed9e3-49f3-6512-3ccf-0cada7e3823b": { name: "Cypher", icon: "https://media.valorant-api.com/agents/117ed9e3-49f3-6512-3ccf-0cada7e3823b/displayicon.png" },
  "320b2a48-4d9b-a075-30f1-1f93a9b638fa": { name: "Sova", icon: "https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/displayicon.png" },
  "1e58de9c-4950-5125-93e9-a0aee9f98746": { name: "Killjoy", icon: "https://media.valorant-api.com/agents/1e58de9c-4950-5125-93e9-a0aee9f98746/displayicon.png" },
  "95b78ed7-4637-86d9-7e41-71ba8c293152": { name: "Harbor", icon: "https://media.valorant-api.com/agents/95b78ed7-4637-86d9-7e41-71ba8c293152/displayicon.png" },
  "efba5359-4016-a1e5-7626-b1ae76895940": { name: "Vyse", icon: "https://media.valorant-api.com/agents/efba5359-4016-a1e5-7626-b1ae76895940/displayicon.png" },
  "707eab51-4836-f488-046a-cda6bf494859": { name: "Viper", icon: "https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494859/displayicon.png" },
  "eb93336a-449b-9c1b-0a54-a891f7921d69": { name: "Phoenix", icon: "https://media.valorant-api.com/agents/eb93336a-449b-9c1b-0a54-a891f7921d69/displayicon.png" },
  "41fb69c1-4189-7b37-f117-bcaf1e96f1bf": { name: "Astra", icon: "https://media.valorant-api.com/agents/41fb69c1-4189-7b37-f117-bcaf1e96f1bf/displayicon.png" },
  "9f0d8ba9-4140-b941-57d3-a7ad57c6b417": { name: "Brimstone", icon: "https://media.valorant-api.com/agents/9f0d8ba9-4140-b941-57d3-a7ad57c6b417/displayicon.png" },
  "0e38b510-41a8-5780-5e8f-568b2a4f2d6c": { name: "Iso", icon: "https://media.valorant-api.com/agents/0e38b510-41a8-5780-5e8f-568b2a4f2d6c/displayicon.png" },
  "1dbf2edd-4729-0984-3115-daa5eed44993": { name: "Clove", icon: "https://media.valorant-api.com/agents/1dbf2edd-4729-0984-3115-daa5eed44993/displayicon.png" },
  "bb2a4828-46eb-8cd1-e765-15848195d751": { name: "Neon", icon: "https://media.valorant-api.com/agents/bb2a4828-46eb-8cd1-e765-15848195d751/displayicon.png" },
  "7f94d92c-4234-0a36-9646-3a87eb8b5c89": { name: "Yoru", icon: "https://media.valorant-api.com/agents/7f94d92c-4234-0a36-9646-3a87eb8b5c89/displayicon.png" },
  "569fdd95-4d10-43ab-ca70-79becc718b46": { name: "Sage", icon: "https://media.valorant-api.com/agents/569fdd95-4d10-43ab-ca70-79becc718b46/displayicon.png" },
  "a3bfb853-43b2-7238-a4f1-ad90e9e46bcc": { name: "Reyna", icon: "https://media.valorant-api.com/agents/a3bfb853-43b2-7238-a4f1-ad90e9e46bcc/displayicon.png" },
  "8e253930-4c05-31dd-1b6c-968525494517": { name: "Omen", icon: "https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png" },
  "add6443a-41bd-e414-f6ad-e58d267f4e95": { name: "Jett", icon: "https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png" }
};

function getAgentInfo(characterId: string): { name: string; icon: string } {
  if (!characterId) return { name: "Sélection...", icon: "" };
  const lower = characterId.toLowerCase().trim();
  if (VALORANT_AGENTS[lower]) return VALORANT_AGENTS[lower];
  return {
    name: "Agent",
    icon: `https://media.valorant-api.com/agents/${characterId}/displayicon.png`,
  };
}

// ─── Dictionnaire Noms Internes Moteur Valorant ──────────────────────────────

const AGENT_INTERNAL_TO_NAME: Record<string, string> = {
  smonk: "Clove",
  guide: "Skye",
  thorne: "Sage",
  vampire: "Reyna",
  stealth: "Yoru",
  bountyhunter: "Fade",
  grenadier: "KAY/O",
  aggrobot: "Gekko",
  wushu: "Jett",
  clay: "Raze",
  deadeye: "Chamber",
  sprinter: "Neon",
  gumshoe: "Cypher",
  hunter: "Sova",
  killjoy: "Killjoy",
  nox: "Deadlock",
  cable: "Iso",
  cashew: "Iso",
  panda: "Harbor",
  sequoia: "Harbor",
  mage: "Astra",
  wraith: "Omen",
  breach: "Breach",
  phoenix: "Phoenix",
  vyse: "Vyse",
  iris: "Vyse",
  tejo: "Tejo",
  pandora: "Viper",
  pandemic: "Viper",
  viper: "Viper",
  sarge: "Brimstone",
  brimstone: "Brimstone",
};

// ─── Extraction des Événements de Combat en Direct (ShooterGame.log) ─────────

interface LiveCombatSummary {
  detectedRound: number;
  detectedMode?: string;
  detectedMap?: string;
  agentStats: Record<string, { kills: number; deaths: number; assists: number; score: number }>;
}

function parseLiveGameEvents(matchId?: string): LiveCombatSummary | null {
  try {
    const localAppData = process.env.LOCALAPPDATA;
    if (!localAppData) return null;
    const logPath = path.join(localAppData, "VALORANT", "Saved", "Logs", "ShooterGame.log");
    if (!fs.existsSync(logPath)) return null;

    const content = fs.readFileSync(logPath, "utf-8");
    const lines = content.split("\n");

    // Détection précise du début du match actuel
    let startIdx = -1;
    let detectedMode: string | undefined = undefined;
    let detectedMap: string | undefined = undefined;

    // 1. Recherche de la PREMIÈRE ligne contenant le matchId (début de partie)
    if (matchId) {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(matchId)) {
          startIdx = i;
          break;
        }
      }
    }

    // 2. Sinon, recherche du début du match actuel (ignorer les lignes Match Complete)
    if (startIdx === -1) {
      let lastComplete = -1;
      for (let i = lines.length - 1; i >= 0; i--) {
        if (
          lines[i].includes("LogMapLoadModel: Update:") &&
          lines[i].includes("Game/Maps/") &&
          lines[i].includes("Match Complete: TRUE") &&
          !lines[i].includes("MainMenu")
        ) {
          lastComplete = i;
          break;
        }
      }

      const searchFrom = lastComplete !== -1 ? lastComplete - 1 : lines.length - 1;
      for (let i = searchFrom; i >= 0; i--) {
        const l = lines[i];
        if (
          l.includes("LogMapLoadModel: Update:") &&
          l.includes("Game/Maps/") &&
          !l.includes("MainMenu") &&
          (l.includes("Local World: TRUE") || l.includes("Match Setup: TRUE")) &&
          !l.includes("Match Complete: TRUE")
        ) {
          startIdx = i;
          while (
            startIdx > 0 &&
            lines[startIdx - 1].includes("LogMapLoadModel: Update:") &&
            lines[startIdx - 1].includes("Game/Maps/") &&
            !lines[startIdx - 1].includes("MainMenu")
          ) {
            startIdx--;
          }
          break;
        }
      }
    }

    // Détection du mode de jeu et de la carte depuis le log
    const scanStart = startIdx !== -1 ? startIdx : Math.max(0, lines.length - 4000);
    for (let i = scanStart; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes("game=/Game/GameModes/")) {
        const modeMatch = line.match(/game=\/Game\/GameModes\/([^/\s?#]+)/i);
        if (modeMatch) {
          detectedMode = modeMatch[1];
        }
      }
      if (line.includes("/Game/Maps/")) {
        const mapMatch = line.match(/\/Game\/Maps\/([^/\s?#]+)/i);
        if (mapMatch && !mapMatch[1].toLowerCase().includes("menu")) {
          detectedMap = mapMatch[1];
        }
      }
    }

    if (startIdx === -1) {
      startIdx = Math.max(0, lines.length - 4000);
    }

    const matchLines = lines.slice(startIdx);
    const agentStats: Record<string, { kills: number; deaths: number; assists: number; score: number }> = {};

    for (const name of Object.values(AGENT_INTERNAL_TO_NAME)) {
      agentStats[name.toLowerCase()] = { kills: 0, deaths: 0, assists: 0, score: 0 };
    }

    let detectedRound = 0;
    const deadThisRound = new Set<string>();
    const isDeathmatch = detectedMode?.toLowerCase().includes("deathmatch") ?? false;
    const lastVictimLine: Record<string, number> = {};

    for (let i = 0; i < matchLines.length; i++) {
      const line = matchLines[i];

      // Changement de manche en mode classique
      const roundMatch = line.match(/OnRoundEnded for round '(\d+)'/);
      if (roundMatch) {
        detectedRound = parseInt(roundMatch[1], 10) + 1;
        deadThisRound.clear();
        continue;
      }

      // En mode classique : 1 mort par manche par joueur
      // En Deathmatch : détection continue avec dédoublonnage des logs ragdoll consécutifs
      let victimAgent = "";

      // 1. Détection via transition ragdoll (LogActorComponent: Error: May not destroy component StaticMeshComponent owned by <Agent>_PC_C)
      const ragdollMatch = line.match(/owned by ([a-zA-Z0-9]+)_PC_C/i);
      if (ragdollMatch) {
        const rawCode = ragdollMatch[1].toLowerCase();
        victimAgent = AGENT_INTERNAL_TO_NAME[rawCode]?.toLowerCase() || "";
      } else {
        // 2. Dégâts fatals (Debuff_GrievousWounds_C)
        const gwMatch = line.match(/([a-zA-Z0-9]+)_PC_C_(\d+)\s+Debuff_GrievousWounds_C/i);
        if (gwMatch) {
          const rawCode = gwMatch[1].toLowerCase();
          victimAgent = AGENT_INTERNAL_TO_NAME[rawCode]?.toLowerCase() || "";
        } else {
          // 3. PostDeath de compétences (Clove / Smonk)
          const pdMatch = line.match(/([a-zA-Z0-9]+)_PostDeath_PC_C_(\d+)/i);
          if (pdMatch) {
            const rawCode = pdMatch[1].toLowerCase();
            victimAgent = AGENT_INTERNAL_TO_NAME[rawCode]?.toLowerCase() || "";
          }
        }
      }

      // Traitement de l'élimination avec dédoublonnage
      if (victimAgent) {
        if (!isDeathmatch && deadThisRound.has(victimAgent)) {
          continue;
        }

        const lastLine = lastVictimLine[victimAgent];
        if (lastLine !== undefined && i - lastLine <= 4) {
          continue;
        }
        lastVictimLine[victimAgent] = i;

        if (!isDeathmatch) {
          deadThisRound.add(victimAgent);
        }

        if (agentStats[victimAgent]) {
          agentStats[victimAgent].deaths += 1;
        }

        // Attribution du kill et de l'assist
        let killerAgent: string | null = null;
        const assisters = new Set<string>();

        // En Deathmatch : vérification des orbes de soin (Buff_HealthPack_HUD_C) attribués au tueur
        const searchRangeStart = Math.max(0, i - 12);
        const searchRangeEnd = Math.min(matchLines.length - 1, i + 8);

        for (let j = searchRangeStart; j <= searchRangeEnd; j++) {
          const nearLine = matchLines[j];
          const hpMatch = nearLine.match(/([a-zA-Z0-9]+)_PC_C_\d+\s+Buff_HealthPack_HUD_C/i);
          if (hpMatch) {
            const hpRaw = hpMatch[1].toLowerCase();
            const hpAgent = AGENT_INTERNAL_TO_NAME[hpRaw]?.toLowerCase();
            if (hpAgent && hpAgent !== victimAgent) {
              killerAgent = hpAgent;
              break;
            }
          }
        }

        // Si non trouvé par orbe de soin, chercher les tirs ou compétences de l'agent
        if (!killerAgent) {
          for (let j = Math.max(0, i - 20); j < i; j++) {
            const prevLine = matchLines[j];
            const killerMatch = prevLine.match(
              /(?:1P_([a-zA-Z0-9]+)_Mat|Gun_([a-zA-Z0-9]+)_|([a-zA-Z0-9]+)_PC_C_\d+.*(?:Buff_|Debuff_|Equippable|AssaultRifle|Revolver|Shotgun|Sniper))/i
            );
            if (killerMatch) {
              const kRaw = (killerMatch[1] || killerMatch[2] || killerMatch[3]).toLowerCase();
              const kName = AGENT_INTERNAL_TO_NAME[kRaw]?.toLowerCase();
              if (kName && kName !== victimAgent) {
                killerAgent = kName;
                break;
              }
            }
          }
        }

        if (killerAgent && agentStats[killerAgent]) {
          agentStats[killerAgent].kills += 1;
        }

        for (const aName of assisters) {
          if (aName !== killerAgent && agentStats[aName]) {
            agentStats[aName].assists += 1;
          }
        }
      }
    }

    // Calcul du score de combat ACS
    for (const key of Object.keys(agentStats)) {
      const s = agentStats[key];
      s.score = s.kills * 200 + s.assists * 75;
    }

    return { detectedRound, detectedMode, detectedMap, agentStats };
  } catch (err) {
    console.warn("[LiveCombat] Erreur parsing log:", err);
    return null;
  }
}

// ─── Lockfile ───────────────────────────────────────────────────────────────

function readLockfile(): ValorantLockfileData | null {
  try {
    const localAppData = process.env.LOCALAPPDATA;
    if (!localAppData) return null;

    const lockfilePath = path.join(
      localAppData,
      "Riot Games",
      "Riot Client",
      "Config",
      "lockfile"
    );

    if (!fs.existsSync(lockfilePath)) return null;

    const content = fs.readFileSync(lockfilePath, "utf-8").trim();
    const parts = content.split(":");
    if (parts.length >= 5) {
      return {
        process: parts[0],
        pid: parts[1],
        port: parts[2],
        password: parts[3],
        protocol: parts[4],
      };
    }
  } catch (err) {
    console.warn("[Lockfile] Erreur de lecture:", err);
  }
  return null;
}

// ─── HTTP Helpers ───────────────────────────────────────────────────────────

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const CLIENT_PLATFORM = Buffer.from(
  JSON.stringify({
    platformType: "PC",
    platformOS: "Windows",
    platformOSVersion: "10.0.19042.1.256.64bit",
    platformChipset: "Unknown",
  })
).toString("base64");

async function queryLocalApi(
  lockfile: ValorantLockfileData,
  endpoint: string
): Promise<any> {
  const url = `${lockfile.protocol}://127.0.0.1:${lockfile.port}${endpoint}`;
  const auth = Buffer.from(`riot:${lockfile.password}`).toString("base64");

  return new Promise((resolve) => {
    const req = https.get(
      url,
      {
        agent: httpsAgent,
        headers: {
          Authorization: `Basic ${auth}`,
          "User-Agent": "SGS-Tracker-Desktop-ReadOnly",
          Accept: "application/json",
        },
        timeout: 3000,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(null);
          }
        });
      }
    );
    req.on("error", () => resolve(null));
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
  });
}

async function queryRemoteRiotApi(
  url: string,
  accessToken: string,
  entitlementToken: string,
  clientVersion: string,
  method = "GET",
  bodyData: any = null
): Promise<any> {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const req = https.request(
        {
          hostname: u.hostname,
          path: u.pathname + (u.search || ""),
          method,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Riot-Entitlements-JWT": entitlementToken,
            "X-Riot-ClientPlatform": CLIENT_PLATFORM,
            "X-Riot-ClientVersion": clientVersion,
            "Content-Type": "application/json",
          },
          timeout: 4000,
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve(null);
            }
          });
        }
      );
      req.on("error", () => resolve(null));
      req.on("timeout", () => {
        req.destroy();
        resolve(null);
      });
      if (bodyData) {
        req.write(JSON.stringify(bodyData));
      }
      req.end();
    } catch {
      resolve(null);
    }
  });
}

// ─── Utilitaires ────────────────────────────────────────────────────────────

function friendlyQueueName(queueId: string, provisioningFlow = ""): string {
  const p = (provisioningFlow || "").toLowerCase();
  const q = (queueId || "").toLowerCase();
  if (p.includes("custom") || q.includes("custom")) return "Partie personnalisée";
  if (q.includes("competitive") || q.includes("comp")) return "Compétitif";
  if (q.includes("swiftplay") || q.includes("swift")) return "Swiftplay";
  if (q.includes("unrated")) return "Non classé";
  if (q.includes("spikerush") || q.includes("spike")) return "Spike Rush";
  if (q.includes("deathmatch") || q.includes("ggteam")) return "Deathmatch";
  if (q.includes("hurm") || q.includes("tdm") || q.includes("teamdeathmatch")) return "Match à mort par équipe";
  if (q.includes("escalation") || q.includes("ggteam")) return "Intensification";
  if (q.includes("premier")) return "Premier";
  if (q.includes("snowball")) return "Bataille de boules de neige";
  return "Partie standard";
}

function mapPathToFriendlyName(mapPath: string): { name: string; id: string } {
  const lower = (mapPath || "").toLowerCase();
  if (lower.includes("ascent")) return { name: "Ascent", id: "ascent" };
  if (lower.includes("bind") || lower.includes("duality")) return { name: "Bind", id: "bind" };
  if (lower.includes("haven") || lower.includes("triad")) return { name: "Haven", id: "haven" };
  if (lower.includes("split") || lower.includes("bonsai")) return { name: "Split", id: "split" };
  if (lower.includes("sunset") || lower.includes("rook") || lower.includes("juliett")) return { name: "Sunset", id: "sunset" };
  if (lower.includes("lotus") || lower.includes("jam")) return { name: "Lotus", id: "lotus" };
  if (lower.includes("abyss") || lower.includes("infinity")) return { name: "Abyss", id: "abyss" };
  if (lower.includes("icebox") || lower.includes("port")) return { name: "Icebox", id: "icebox" };
  if (lower.includes("breeze") || lower.includes("foxtrot")) return { name: "Breeze", id: "breeze" };
  if (lower.includes("fracture") || lower.includes("canyon")) return { name: "Fracture", id: "fracture" };
  if (lower.includes("pearl") || lower.includes("pitt")) return { name: "Pearl", id: "pearl" };
  if (lower.includes("plummet") || lower.includes("drift")) return { name: "Drift", id: "drift" };
  if (lower.includes("district") || lower.includes("hurm_district")) return { name: "District", id: "district" };
  if (lower.includes("kasbah") || lower.includes("hurm_yard")) return { name: "Kasbah", id: "kasbah" };
  if (lower.includes("piazza") || lower.includes("hurm_alley")) return { name: "Piazza", id: "piazza" };
  if (lower.includes("glitch") || lower.includes("hurm_glitch")) return { name: "Glitch", id: "glitch" };
  return { name: "Match Direct", id: "unknown" };
}

function tierToRank(tier: number): { name: string; icon: string } {
  const names = [
    "Non classé", "Non classé", "Non classé",
    "Fer 1", "Fer 2", "Fer 3",
    "Bronze 1", "Bronze 2", "Bronze 3",
    "Argent 1", "Argent 2", "Argent 3",
    "Or 1", "Or 2", "Or 3",
    "Platine 1", "Platine 2", "Platine 3",
    "Diamant 1", "Diamant 2", "Diamant 3",
    "Ascendant 1", "Ascendant 2", "Ascendant 3",
    "Immortel 1", "Immortel 2", "Immortel 3",
    "Radiant"
  ];
  const name = names[tier] || "Non classé";
  const icon = tier > 2
    ? `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${tier}/largeicon.png`
    : "";
  return { name, icon };
}

function readGameLogInfo(): { glzUrl: string; clientVersion: string } {
  const defaults = {
    glzUrl: "https://glz-eu-1.eu.a.pvp.net",
    clientVersion: "release-13.06-shipping-18-5590001",
  };

  try {
    const localAppData = process.env.LOCALAPPDATA;
    if (!localAppData) return defaults;

    const logPath = path.join(localAppData, "VALORANT", "Saved", "Logs", "ShooterGame.log");
    if (!fs.existsSync(logPath)) return defaults;

    const log = fs.readFileSync(logPath, "utf-8");

    const glzMatch = log.match(/https:\/\/glz-[a-z0-9-]+\.[a-z]+\.a\.pvp\.net/);
    if (glzMatch) defaults.glzUrl = glzMatch[0];

    const verMatch = log.match(/CI server version:\s*(release-[\d.]+-shipping-[\d-]+)/i);
    if (verMatch) defaults.clientVersion = verMatch[1];

    return defaults;
  } catch {
    return defaults;
  }
}

function getPdShard(region: string): string {
  const r = (region || "").toLowerCase();
  if (r.startsWith("eu")) return "eu";
  if (r.startsWith("na") || r.startsWith("latam") || r.startsWith("br")) return "na";
  if (r.startsWith("ap")) return "ap";
  if (r.startsWith("kr")) return "kr";
  return "eu";
}

// ─── Vérification de Confidentialité SGS ───────────────────────────────────

/**
 * Interroge la base de données SGS pour vérifier si les joueurs ont choisi
 * de garder leur profil ou rang privé sur SGS-Tracker.
 */
async function getSgsPrivateSet(puuids: string[], names: string[]): Promise<Set<string>> {
  const privateSet = new Set<string>();
  try {
    const cleanNames = names.filter(Boolean).map((n) => n.trim().toLowerCase());
    const cleanPuuids = puuids.filter(Boolean);

    const users = await (prisma.user as any).findMany({
      where: {
        OR: [
          { riotPuuid: { in: cleanPuuids } },
          { riotGameName: { in: cleanNames } },
        ],
      },
      select: {
        riotPuuid: true,
        riotGameName: true,
        isPublic: true,
        hiddenStats: true,
      },
    });

    for (const u of users) {
      const isPrivate = !u.isPublic || (u.hiddenStats && u.hiddenStats.includes("rank"));
      if (isPrivate) {
        if (u.riotPuuid) privateSet.add(u.riotPuuid);
        if (u.riotGameName) privateSet.add(u.riotGameName.toLowerCase());
      }
    }
  } catch (e) {
    console.warn("[SGS Privacy] Vérification confidentialité:", e);
  }
  return privateSet;
}

// ─── Route GET ──────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const lockfile = readLockfile();
  if (!lockfile) {
    return NextResponse.json({
      active: false,
      mode: "live",
      status: "OFFLINE",
      message: "Client Valorant fermé ou introuvable (Lockfile non présent).",
      players: [],
    });
  }

  try {
    // 1. Session locale, présences et tokens
    const [session, presencesData, tokensData] = await Promise.all([
      queryLocalApi(lockfile, "/chat/v1/session"),
      queryLocalApi(lockfile, "/chat/v4/presences"),
      queryLocalApi(lockfile, "/entitlements/v1/token"),
    ]);

    if (!presencesData || !Array.isArray(presencesData.presences)) {
      return NextResponse.json({
        active: false,
        mode: "live",
        status: "RUNNING_NO_PRESENCE",
        message: "Valorant est ouvert mais aucune donnée de présence n'a été reçue.",
        players: [],
      });
    }

    const localPuuid = session?.puuid;

    // 2. Trouver la présence du joueur local
    let myPresenceData: any = null;

    for (const p of presencesData.presences) {
      if (p.product === "valorant" && p.private && typeof p.private === "string") {
        if (!localPuuid || p.puuid === localPuuid) {
          try {
            myPresenceData = JSON.parse(
              Buffer.from(p.private, "base64").toString("utf-8")
            );
            break;
          } catch {}
        }
      }
    }

    if (!myPresenceData) {
      for (const p of presencesData.presences) {
        if (p.product === "valorant" && p.private) {
          try {
            const parsed = JSON.parse(
              Buffer.from(p.private, "base64").toString("utf-8")
            );
            if (
              parsed?.matchPresenceData?.sessionLoopState ||
              parsed?.partyOwnerSessionLoopState
            ) {
              myPresenceData = parsed;
              break;
            }
          } catch {}
        }
      }
    }

    const rawState = (
      myPresenceData?.matchPresenceData?.sessionLoopState ||
      myPresenceData?.partyOwnerSessionLoopState ||
      myPresenceData?.sessionLoopState ||
      "MENUS"
    ).toUpperCase();

    const state = rawState.includes("INGAME")
      ? "INGAME"
      : rawState.includes("PREGAME")
      ? "PREGAME"
      : "MENUS";

    if (state === "MENUS") {
      return NextResponse.json({
        active: false,
        mode: "live",
        status: "MENUS",
        stateLabel: "Dans les menus",
        message: "En attente du lancement d'une partie...",
        players: [],
      });
    }

    const rawMap =
      myPresenceData?.matchPresenceData?.matchMap ||
      myPresenceData?.partyOwnerMatchMap ||
      myPresenceData?.matchMap ||
      "";
    const mapInfo = mapPathToFriendlyName(rawMap);

    const allyScore = Number(myPresenceData?.partyOwnerMatchScoreAllyTeam ?? 0);
    const enemyScore = Number(myPresenceData?.partyOwnerMatchScoreEnemyTeam ?? 0);
    const queueId =
      myPresenceData?.matchPresenceData?.queueId ||
      myPresenceData?.queueId ||
      "";
    const provisioningFlow =
      myPresenceData?.provisioningFlow ||
      myPresenceData?.partyPresenceData?.partyOwnerProvisioningFlow ||
      myPresenceData?.matchPresenceData?.provisioningFlow ||
      "";
    const queueLabel = friendlyQueueName(queueId, provisioningFlow);
    const myPartyId =
      myPresenceData?.partyId ||
      myPresenceData?.partyPresenceData?.partyId;
    const myCustomTeam =
      myPresenceData?.partyPresenceData?.customGameTeam ||
      myPresenceData?.customGameTeam ||
      "";

    // 3. Tenter de récupérer les 10 joueurs via GLZ API
    let allPlayers: LivePlayer[] = [];
    let usedGlz = false;
    let liveCombat: LiveCombatSummary | null = null;

    if (tokensData?.accessToken && tokensData?.token && localPuuid) {
      const { glzUrl, clientVersion } = readGameLogInfo();
      const pdShard = getPdShard(session?.region || "eu1");

      const playerEndpoint =
        state === "PREGAME"
          ? `${glzUrl}/pregame/v1/players/${localPuuid}`
          : `${glzUrl}/core-game/v1/players/${localPuuid}`;

      const playerData = await queryRemoteRiotApi(
        playerEndpoint,
        tokensData.accessToken,
        tokensData.token,
        clientVersion
      );

      let targetMatchId = playerData?.MatchID;

      // Si non trouvé via GLZ, vérifier ShooterGame.log pour le dernier matchId
      if (!targetMatchId) {
        try {
          const logPath = path.join(process.env.LOCALAPPDATA || "", "VALORANT", "Saved", "Logs", "ShooterGame.log");
          if (fs.existsSync(logPath)) {
            const logContent = fs.readFileSync(logPath, "utf-8");
            const matches = [...logContent.matchAll(/\/matches\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi)];
            if (matches.length > 0) {
              targetMatchId = matches[matches.length - 1][1];
            }
          }
        } catch {}
      }

      if (targetMatchId) {
        const matchEndpoint =
          state === "PREGAME"
            ? `${glzUrl}/pregame/v1/matches/${targetMatchId}`
            : `${glzUrl}/core-game/v1/matches/${targetMatchId}`;

        const matchData = await queryRemoteRiotApi(
          matchEndpoint,
          tokensData.accessToken,
          tokensData.token,
          clientVersion
        );

        if (matchData) {
          usedGlz = true;
          const rawPlayers: any[] =
            matchData.Players ||
            [
              ...(matchData.AllyTeam?.Players || []),
              ...(matchData.EnemyTeam?.Players || []),
            ];

          const puuidsList = rawPlayers.map((p: any) => p.Subject).filter(Boolean);

          // Résolution des noms via le service de noms Riot pd.<shard>.a.pvp.net
          const nameServiceData = await queryRemoteRiotApi(
            `https://pd.${pdShard}.a.pvp.net/name-service/v2/players`,
            tokensData.accessToken,
            tokensData.token,
            clientVersion,
            "PUT",
            puuidsList
          ).catch(() => null);

          const puuidToName = new Map<string, { name: string; tag: string }>();
          if (Array.isArray(nameServiceData)) {
            for (const item of nameServiceData) {
              if (item.Subject) {
                puuidToName.set(item.Subject, {
                  name: item.GameName || "Joueur",
                  tag: item.TagLine || "",
                });
              }
            }
          }

          // Compléter avec les présences chat
          for (const pr of presencesData.presences) {
            if (pr.puuid && pr.game_name && !puuidToName.has(pr.puuid)) {
              puuidToName.set(pr.puuid, {
                name: pr.game_name,
                tag: pr.game_tag || "",
              });
            }
          }
          if (localPuuid && session?.game_name) {
            puuidToName.set(localPuuid, {
              name: session.game_name,
              tag: session.game_tag || "",
            });
          }

          // MMR et Rangs pour chaque joueur
          const mmrPromises = rawPlayers.map((p: any) =>
            queryRemoteRiotApi(
              `https://pd.${pdShard}.a.pvp.net/mmr/v1/players/${p.Subject}`,
              tokensData.accessToken,
              tokensData.token,
              clientVersion
            ).catch(() => null)
          );

          const mmrResults = await Promise.all(mmrPromises);

          // Analyse des événements de combat en direct depuis ShooterGame.log
          liveCombat = parseLiveGameEvents(targetMatchId);

          for (let i = 0; i < rawPlayers.length; i++) {
            const p = rawPlayers[i];
            const puuid = p.Subject;
            const isMe = puuid === localPuuid;

            let team: "ally" | "enemy" = "enemy";
            if (matchData.Players) {
              const myTeam = matchData.Players.find(
                (x: any) => x.Subject === localPuuid
              )?.TeamID;
              if (p.TeamID === myTeam) team = "ally";
            } else {
              const inAlly = (matchData.AllyTeam?.Players || []).some(
                (x: any) => x.Subject === puuid
              );
              if (inAlly) team = "ally";
            }

            const mmr = mmrResults[i];
            let tier = 0;
            if (mmr?.QueueSkills?.competitive?.SeasonalInfoBySeasonID) {
              const seasons = Object.values(mmr.QueueSkills.competitive.SeasonalInfoBySeasonID) as any[];
              for (const s of seasons) {
                if (s?.CompetitiveTier && s.CompetitiveTier > tier) {
                  tier = s.CompetitiveTier;
                }
              }
            }
            if (tier === 0 && isMe && myPresenceData) {
              tier = Number(
                myPresenceData?.playerPresenceData?.competitiveTier ??
                myPresenceData?.competitiveTier ??
                0
              );
            }

            const rankInfo = tierToRank(tier);
            const nameInfo = puuidToName.get(puuid);
            const characterId = p.CharacterID || p.CharacterSelectionResponse || "";
            const agentDetails = getAgentInfo(characterId);

            const agentKey = (agentDetails.name || "").toLowerCase();
            const liveStats = liveCombat?.agentStats?.[agentKey] || { kills: 0, deaths: 0, assists: 0, score: 0 };

            const finalKills = liveStats.kills;
            const finalDeaths = liveStats.deaths;
            const finalAssists = liveStats.assists;
            const finalScore = liveStats.score;
            const finalSpi = tier > 0
              ? Math.min(100, Math.max(15, Math.round(((finalKills * 2 + finalAssists) / Math.max(1, finalDeaths)) * 20 + (tier / 27) * 40)))
              : Math.min(100, Math.max(20, Math.round(((finalKills * 2 + finalAssists) / Math.max(1, finalDeaths)) * 30)));

            allPlayers.push({
              puuid,
              name: isMe ? (session?.game_name || "Vous") : (nameInfo?.name || `Joueur ${i + 1}`),
              tag: nameInfo?.tag || "",
              team,
              rank: rankInfo.name,
              rankTier: tier,
              rankIcon: rankInfo.icon,
              isPrivateRank: false,
              agent: characterId,
              agentName: agentDetails.name,
              agentIcon: agentDetails.icon,
              isMe,
              kills: finalKills,
              deaths: finalDeaths,
              assists: finalAssists,
              score: finalScore,
              spi: finalSpi,
            });
          }
        }
      }
    }

    // 4. Fallback Présences locales (si GLZ non connecté)
    if (!usedGlz || allPlayers.length === 0) {
      if (!liveCombat) {
        liveCombat = parseLiveGameEvents();
      }
      const seenPuuids = new Set<string>();
      allPlayers = [];

      for (const p of presencesData.presences) {
        if (p.product === "valorant" && p.private && typeof p.private === "string") {
          try {
            const decoded = Buffer.from(p.private, "base64").toString("utf-8");
            const parsed = JSON.parse(decoded);
            if (!parsed) continue;

            const pLoop = (
              parsed.matchPresenceData?.sessionLoopState ||
              parsed.partyOwnerSessionLoopState ||
              parsed.sessionLoopState ||
              ""
            ).toUpperCase();

            const partyId = parsed.partyId || parsed.partyPresenceData?.partyId;
            const isSameParty = myPartyId && partyId === myPartyId;
            const isSameLoop =
              pLoop === rawState ||
              (state === "INGAME" && pLoop.includes("INGAME")) ||
              (state === "PREGAME" && pLoop.includes("PREGAME"));

            if (isSameParty || isSameLoop) {
              const puuid = p.puuid || p.game_name;
              if (seenPuuids.has(puuid)) continue;
              seenPuuids.add(puuid);

              const isMe = puuid === localPuuid || p.game_name === session?.game_name;
              const pCustomTeam =
                parsed.partyPresenceData?.customGameTeam ||
                parsed.customGameTeam ||
                "";
              const isAlly =
                myCustomTeam && pCustomTeam
                  ? pCustomTeam === myCustomTeam
                  : isSameParty || isMe;
              const tier = Number(
                parsed.playerPresenceData?.competitiveTier ??
                parsed.competitiveTier ??
                0
              );
              const rankInfo = tierToRank(tier);
              const characterId = parsed.characterId || "";
              const agentDetails = getAgentInfo(characterId);

              const agentKey = (agentDetails.name || "").toLowerCase();
              const liveStats = liveCombat?.agentStats?.[agentKey] || { kills: 0, deaths: 0, assists: 0, score: 0 };

              const kills = liveStats.kills;
              const deaths = liveStats.deaths;
              const assists = liveStats.assists;
              const score = liveStats.score;
              const spi = tier > 0
                ? Math.min(100, Math.max(15, Math.round(((kills * 2 + assists) / Math.max(1, deaths)) * 20 + (tier / 27) * 40)))
                : Math.min(100, Math.max(20, Math.round(((kills * 2 + assists) / Math.max(1, deaths)) * 30)));

              allPlayers.push({
                puuid,
                name: p.game_name || "Joueur",
                tag: p.game_tag || "",
                team: isAlly ? "ally" : "enemy",
                rank: rankInfo.name,
                rankTier: tier,
                rankIcon: rankInfo.icon,
                isPrivateRank: false,
                agent: characterId,
                agentName: agentDetails.name,
                agentIcon: agentDetails.icon,
                isMe,
                kills,
                deaths,
                assists,
                score,
                spi,
              });
            }
          } catch {}
        }
      }

      // Ajouter le joueur local s'il manque
      if (localPuuid && !allPlayers.some((p) => p.isMe)) {
        const myTier = Number(
          myPresenceData?.playerPresenceData?.competitiveTier ??
          myPresenceData?.competitiveTier ??
          0
        );
        const myRank = tierToRank(myTier);
        const myAgentDetails = getAgentInfo(myPresenceData?.characterId || "");

        const myAgentKey = (myAgentDetails.name || "").toLowerCase();
        const myLive = liveCombat?.agentStats?.[myAgentKey] || { kills: 0, deaths: 0, assists: 0, score: 0 };

        const myKills = myLive.kills;
        const myDeaths = myLive.deaths;
        const myAssists = myLive.assists;
        const myScore = myLive.score;
        const mySpi = myTier > 0
          ? Math.min(100, Math.max(15, Math.round(((myKills * 2 + myAssists) / Math.max(1, myDeaths)) * 20 + (myTier / 27) * 40)))
          : Math.min(100, Math.max(20, Math.round(((myKills * 2 + myAssists) / Math.max(1, myDeaths)) * 30)));

        allPlayers.unshift({
          puuid: localPuuid,
          name: session?.game_name || "Vous",
          tag: session?.game_tag || "",
          team: "ally",
          rank: myRank.name,
          rankTier: myTier,
          rankIcon: myRank.icon,
          isPrivateRank: false,
          agent: myPresenceData?.characterId || "",
          agentName: myAgentDetails.name,
          agentIcon: myAgentDetails.icon,
          isMe: true,
          kills: myKills,
          deaths: myDeaths,
          assists: myAssists,
          score: myScore,
          spi: mySpi,
        });
      }
    }

    // 5. RÈGLE STRICTE SGS : Ne pas afficher le rang des profils privés sur SGS !
    const puuidsToCheck = allPlayers.map((p) => p.puuid).filter(Boolean);
    const namesToCheck = allPlayers.map((p) => p.name).filter(Boolean);
    const sgsPrivateSet = await getSgsPrivateSet(puuidsToCheck, namesToCheck);

    for (const player of allPlayers) {
      // Le joueur lui-même n'est JAMAIS masqué sur son propre overlay
      if (player.isMe) {
        player.isPrivateRank = false;
        continue;
      }

      const isPrivateOnSgs =
        sgsPrivateSet.has(player.puuid) ||
        sgsPrivateSet.has(player.name.toLowerCase());

      if (isPrivateOnSgs) {
        player.isPrivateRank = true;
        player.rank = "Privé";
        player.rankIcon = "";
      }
    }

    // 6. Règle d'affichage par phase :
    // - PREGAME (Sélection des agents) : MATES UNIQUEMENT. Adversaires masqués.
    // - INGAME (Partie lancée) : Tout le monde révélé.
    let filteredPlayers = allPlayers;
    if (state === "PREGAME") {
      filteredPlayers = allPlayers.filter((pl) => pl.team === "ally");
    }

    const finalMap = (mapInfo.id === "unknown" && liveCombat?.detectedMap)
      ? mapPathToFriendlyName(liveCombat.detectedMap)
      : mapInfo;

    const finalQueue = (queueLabel === "Partie standard" && liveCombat?.detectedMode)
      ? friendlyQueueName(liveCombat.detectedMode)
      : queueLabel;

    return NextResponse.json({
      active: true,
      mode: "live",
      status: state,
      stateLabel:
        state === "INGAME"
          ? "En match direct"
          : "Sélection des agents (Pregame)",
      map: {
        id: finalMap.id,
        name: finalMap.name,
      },
      queue: finalQueue,
      round: Math.max(allyScore + enemyScore + 1, liveCombat?.detectedRound || 1),
      score: {
        ally: allyScore,
        enemy: enemyScore,
      },
      partySize: myPresenceData?.partySize || 1,
      players: filteredPlayers,
      source: usedGlz ? "glz" : "presences",
    });
  } catch (err: any) {
    return NextResponse.json({
      active: false,
      mode: "live",
      status: "ERROR",
      message: `Erreur de communication locale: ${err.message}`,
      players: [],
    });
  }
}
