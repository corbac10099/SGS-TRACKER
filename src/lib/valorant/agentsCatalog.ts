/**
 * Catalogue centralisé et résolveur dynamique d'agents pour Spycam
 * Permet l'association via le Déterminant JSON (clé de match), le nom ou l'UUID.
 * Si un agent n'est pas configuré, aucune fausse image n'est substituée.
 */

export interface AgentCatalogEntry {
  name: string;
  determinant: string;
  role: "Duelist" | "Initiator" | "Controller" | "Sentinel" | string;
  uuid: string;
  iconUrl: string;
  fullPortrait: string;
}

/**
 * Registre officiel complet des agents Valorant connus (dont Tejo, Vyse, Clove, etc.)
 */
export const BASE_AGENTS_CATALOG: Record<string, AgentCatalogEntry> = {
  Tejo: {
    name: "Tejo",
    determinant: "Tejo",
    role: "Initiator",
    uuid: "b444168c-4e35-8076-db47-ef9bf368f384",
    iconUrl: "https://media.valorant-api.com/agents/b444168c-4e35-8076-db47-ef9bf368f384/displayicon.png",
    fullPortrait: "https://media.valorant-api.com/agents/b444168c-4e35-8076-db47-ef9bf368f384/fullportrait.png",
  },
  Jett: {
    name: "Jett",
    determinant: "Jett",
    role: "Duelist",
    uuid: "add6443a-41bd-e414-f6ad-e58d267f4e95",
    iconUrl: "https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png",
    fullPortrait: "https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/fullportrait.png",
  },
  Reyna: {
    name: "Reyna",
    determinant: "Reyna",
    role: "Duelist",
    uuid: "a3bfb853-43b2-7238-a4f1-ad90e9e46bcc",
    iconUrl: "https://media.valorant-api.com/agents/a3bfb853-43b2-7238-a4f1-ad90e9e46bcc/displayicon.png",
    fullPortrait: "https://media.valorant-api.com/agents/a3bfb853-43b2-7238-a4f1-ad90e9e46bcc/fullportrait.png",
  },
  Raze: {
    name: "Raze",
    determinant: "Raze",
    role: "Duelist",
    uuid: "f94c3b30-42be-e959-889c-5aa313dba261",
    iconUrl: "https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5aa313dba261/displayicon.png",
    fullPortrait: "https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5aa313dba261/fullportrait.png",
  },
  Omen: {
    name: "Omen",
    determinant: "Omen",
    role: "Controller",
    uuid: "8e253930-4c05-31dd-1b6c-968525494517",
    iconUrl: "https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png",
    fullPortrait: "https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/fullportrait.png",
  },
  Clove: {
    name: "Clove",
    determinant: "Clove",
    role: "Controller",
    uuid: "1dbf2edd-4729-0984-3115-daa5eed44993",
    iconUrl: "https://media.valorant-api.com/agents/1dbf2edd-4729-0984-3115-daa5eed44993/displayicon.png",
    fullPortrait: "https://media.valorant-api.com/agents/1dbf2edd-4729-0984-3115-daa5eed44993/fullportrait.png",
  },
  Sova: {
    name: "Sova",
    determinant: "Sova",
    role: "Initiator",
    uuid: "320b2a48-4d9b-a075-30f1-1f93a9b638fa",
    iconUrl: "https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/displayicon.png",
    fullPortrait: "https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/fullportrait.png",
  },
  Cypher: {
    name: "Cypher",
    determinant: "Cypher",
    role: "Sentinel",
    uuid: "117ed9e3-49f3-6512-3ccf-0cada7e3823b",
    iconUrl: "https://media.valorant-api.com/agents/117ed9e3-49f3-6512-3ccf-0cada7e3823b/displayicon.png",
    fullPortrait: "https://media.valorant-api.com/agents/117ed9e3-49f3-6512-3ccf-0cada7e3823b/fullportrait.png",
  },
  Killjoy: {
    name: "Killjoy",
    determinant: "Killjoy",
    role: "Sentinel",
    uuid: "1e58de9c-4950-5125-93e9-a0aee9f98746",
    iconUrl: "https://media.valorant-api.com/agents/1e58de9c-4950-5125-93e9-a0aee9f98746/displayicon.png",
    fullPortrait: "https://media.valorant-api.com/agents/1e58de9c-4950-5125-93e9-a0aee9f98746/fullportrait.png",
  },
  Iso: {
    name: "Iso",
    determinant: "Iso",
    role: "Duelist",
    uuid: "0e38b510-41a8-5780-5e8f-568b2a4f2d6c",
    iconUrl: "https://media.valorant-api.com/agents/0e38b510-41a8-5780-5e8f-568b2a4f2d6c/displayicon.png",
    fullPortrait: "https://media.valorant-api.com/agents/0e38b510-41a8-5780-5e8f-568b2a4f2d6c/fullportrait.png",
  },
  Viper: {
    name: "Viper",
    determinant: "Viper",
    role: "Controller",
    uuid: "707eab51-4836-f488-046a-cda6bf494859",
    iconUrl: "https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494859/displayicon.png",
    fullPortrait: "https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494859/fullportrait.png",
  },
  Chamber: {
    name: "Chamber",
    determinant: "Chamber",
    role: "Sentinel",
    uuid: "22697a3d-45bf-8dd7-4fec-84a9e28c69d7",
    iconUrl: "https://media.valorant-api.com/agents/22697a3d-45bf-8dd7-4fec-84a9e28c69d7/displayicon.png",
    fullPortrait: "https://media.valorant-api.com/agents/22697a3d-45bf-8dd7-4fec-84a9e28c69d7/fullportrait.png",
  },
  Gekko: {
    name: "Gekko",
    determinant: "Gekko",
    role: "Initiator",
    uuid: "e370fa57-4757-3604-3648-499e1f642d3f",
    iconUrl: "https://media.valorant-api.com/agents/e370fa57-4757-3604-3648-499e1f642d3f/displayicon.png",
    fullPortrait: "https://media.valorant-api.com/agents/e370fa57-4757-3604-3648-499e1f642d3f/fullportrait.png",
  },
  Fade: {
    name: "Fade",
    determinant: "Fade",
    role: "Initiator",
    uuid: "dade69b4-4f5a-8528-247b-219e5a1facd6",
    iconUrl: "https://media.valorant-api.com/agents/dade69b4-4f5a-8528-247b-219e5a1facd6/displayicon.png",
    fullPortrait: "https://media.valorant-api.com/agents/dade69b4-4f5a-8528-247b-219e5a1facd6/fullportrait.png",
  },
  Breach: {
    name: "Breach",
    determinant: "Breach",
    role: "Initiator",
    uuid: "5f8d3a7f-467b-97f3-062c-13acf203c006",
    iconUrl: "https://media.valorant-api.com/agents/5f8d3a7f-467b-97f3-062c-13acf203c006/displayicon.png",
    fullPortrait: "https://media.valorant-api.com/agents/5f8d3a7f-467b-97f3-062c-13acf203c006/fullportrait.png",
  },
  Deadlock: {
    name: "Deadlock",
    determinant: "Deadlock",
    role: "Sentinel",
    uuid: "cc8b64c8-4b25-4ff9-6e7f-37b4da43d235",
    iconUrl: "https://media.valorant-api.com/agents/cc8b64c8-4b25-4ff9-6e7f-37b4da43d235/displayicon.png",
    fullPortrait: "https://media.valorant-api.com/agents/cc8b64c8-4b25-4ff9-6e7f-37b4da43d235/fullportrait.png",
  },
  Phoenix: {
    name: "Phoenix",
    determinant: "Phoenix",
    role: "Duelist",
    uuid: "eb93336a-449b-9c1b-0a54-a891f7921d69",
    iconUrl: "https://media.valorant-api.com/agents/eb93336a-449b-9c1b-0a54-a891f7921d69/displayicon.png",
    fullPortrait: "https://media.valorant-api.com/agents/eb93336a-449b-9c1b-0a54-a891f7921d69/fullportrait.png",
  },
  Sage: {
    name: "Sage",
    determinant: "Sage",
    role: "Sentinel",
    uuid: "569fdd95-4d10-43ab-ca70-79becc718b46",
    iconUrl: "https://media.valorant-api.com/agents/569fdd95-4d10-43ab-ca70-79becc718b46/displayicon.png",
    fullPortrait: "https://media.valorant-api.com/agents/569fdd95-4d10-43ab-ca70-79becc718b46/fullportrait.png",
  },
  Brimstone: {
    name: "Brimstone",
    determinant: "Brimstone",
    role: "Controller",
    uuid: "9f0d8ba9-4140-b941-57d3-a7ad57c6b417",
    iconUrl: "https://media.valorant-api.com/agents/9f0d8ba9-4140-b941-57d3-a7ad57c6b417/displayicon.png",
    fullPortrait: "https://media.valorant-api.com/agents/9f0d8ba9-4140-b941-57d3-a7ad57c6b417/fullportrait.png",
  },
  Skye: {
    name: "Skye",
    determinant: "Skye",
    role: "Initiator",
    uuid: "6f2a04ca-43e0-be17-7f36-b3908627744d",
    iconUrl: "https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/displayicon.png",
    fullPortrait: "https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/fullportrait.png",
  },
  Yoru: {
    name: "Yoru",
    determinant: "Yoru",
    role: "Duelist",
    uuid: "7f94d92c-4234-0a36-9646-3a87eb8b5c89",
    iconUrl: "https://media.valorant-api.com/agents/7f94d92c-4234-0a36-9646-3a87eb8b5c89/displayicon.png",
    fullPortrait: "https://media.valorant-api.com/agents/7f94d92c-4234-0a36-9646-3a87eb8b5c89/fullportrait.png",
  },
  Astra: {
    name: "Astra",
    determinant: "Astra",
    role: "Controller",
    uuid: "41fb69c1-4189-7b37-f117-bcaf1e96f1bf",
    iconUrl: "https://media.valorant-api.com/agents/41fb69c1-4189-7b37-f117-bcaf1e96f1bf/displayicon.png",
    fullPortrait: "https://media.valorant-api.com/agents/41fb69c1-4189-7b37-f117-bcaf1e96f1bf/fullportrait.png",
  },
  "KAY/O": {
    name: "KAY/O",
    determinant: "KAY/O",
    role: "Initiator",
    uuid: "601dbbe7-43ce-be57-2a40-4abd24953621",
    iconUrl: "https://media.valorant-api.com/agents/601dbbe7-43ce-be57-2a40-4abd24953621/displayicon.png",
    fullPortrait: "https://media.valorant-api.com/agents/601dbbe7-43ce-be57-2a40-4abd24953621/fullportrait.png",
  },
  Neon: {
    name: "Neon",
    determinant: "Neon",
    role: "Duelist",
    uuid: "bb2a4828-46eb-8cd1-e765-15848195d751",
    iconUrl: "https://media.valorant-api.com/agents/bb2a4828-46eb-8cd1-e765-15848195d751/displayicon.png",
    fullPortrait: "https://media.valorant-api.com/agents/bb2a4828-46eb-8cd1-e765-15848195d751/fullportrait.png",
  },
  Harbor: {
    name: "Harbor",
    determinant: "Harbor",
    role: "Controller",
    uuid: "95b78ed7-4637-86d9-7e41-71ba8c293152",
    iconUrl: "https://media.valorant-api.com/agents/95b78ed7-4637-86d9-7e41-71ba8c293152/displayicon.png",
    fullPortrait: "https://media.valorant-api.com/agents/95b78ed7-4637-86d9-7e41-71ba8c293152/fullportrait.png",
  },
  Vyse: {
    name: "Vyse",
    determinant: "Vyse",
    role: "Sentinel",
    uuid: "efba5359-4016-a1e5-7626-b1ae76895940",
    iconUrl: "https://media.valorant-api.com/agents/efba5359-4016-a1e5-7626-b1ae76895940/displayicon.png",
    fullPortrait: "https://media.valorant-api.com/agents/efba5359-4016-a1e5-7626-b1ae76895940/fullportrait.png",
  },
  Miks: {
    name: "Miks",
    determinant: "Miks",
    role: "Controller",
    uuid: "7c8a4701-4de6-9355-b254-e09bc2a34b72",
    iconUrl: "https://media.valorant-api.com/agents/7c8a4701-4de6-9355-b254-e09bc2a34b72/displayicon.png",
    fullPortrait: "https://media.valorant-api.com/agents/7c8a4701-4de6-9355-b254-e09bc2a34b72/fullportrait.png",
  },
  Veto: {
    name: "Veto",
    determinant: "Veto",
    role: "Sentinel",
    uuid: "92eeef5d-43b5-1d4a-8d03-b3927a09034b",
    iconUrl: "https://media.valorant-api.com/agents/92eeef5d-43b5-1d4a-8d03-b3927a09034b/displayicon.png",
    fullPortrait: "https://media.valorant-api.com/agents/92eeef5d-43b5-1d4a-8d03-b3927a09034b/fullportrait.png",
  },
  Waylay: {
    name: "Waylay",
    determinant: "Waylay",
    role: "Duelist",
    uuid: "df1cb487-4902-002e-5c17-d28e83e78588",
    iconUrl: "https://media.valorant-api.com/agents/df1cb487-4902-002e-5c17-d28e83e78588/displayicon.png",
    fullPortrait: "https://media.valorant-api.com/agents/df1cb487-4902-002e-5c17-d28e83e78588/fullportrait.png",
  },
};

/**
 * Normalise une chaîne pour comparaison insensible à la casse et aux espaces/caractères spéciaux.
 */
export function normalizeAgentKey(str?: string): string {
  if (!str || typeof str !== "string") return "";
  return str.trim().toLowerCase().replace(/[\s\-_/\\']/g, "");
}

/**
 * Recherche un agent dans une liste dynamique (venant d'AppControl / CMS)
 * ou dans le catalogue de base.
 */
export function getAgentInfo(
  identifier?: string,
  dynamicAgents?: any[]
): AgentCatalogEntry | null {
  if (!identifier || typeof identifier !== "string") return null;
  const target = normalizeAgentKey(identifier);
  if (!target) return null;

  // 1. Recherche prioritaire dans les agents configurés dynamiquement (AppControl / CMS)
  if (Array.isArray(dynamicAgents) && dynamicAgents.length > 0) {
    for (const ag of dynamicAgents) {
      const matchDet = normalizeAgentKey(ag.determinant);
      const matchName = normalizeAgentKey(ag.name);
      const matchUuid = normalizeAgentKey(ag.uuid);
      if (
        (matchDet && matchDet === target) ||
        (matchName && matchName === target) ||
        (matchUuid && matchUuid === target)
      ) {
        return {
          name: ag.name || identifier,
          determinant: ag.determinant || ag.name || identifier,
          role: ag.role || "Flex",
          uuid: ag.uuid || "",
          iconUrl: ag.iconUrl || (ag.uuid ? `https://media.valorant-api.com/agents/${ag.uuid}/displayicon.png` : ""),
          fullPortrait: ag.fullPortrait || (ag.uuid ? `https://media.valorant-api.com/agents/${ag.uuid}/fullportrait.png` : ""),
        };
      }
    }
  }

  // 2. Recherche dans le catalogue de base
  for (const [key, entry] of Object.entries(BASE_AGENTS_CATALOG)) {
    if (
      normalizeAgentKey(key) === target ||
      normalizeAgentKey(entry.determinant) === target ||
      normalizeAgentKey(entry.name) === target ||
      normalizeAgentKey(entry.uuid) === target
    ) {
      return entry;
    }
  }

  // 3. Si l'agent n'est pas configuré : renvoie strictement null (aucun fallback erroné)
  return null;
}

/**
 * Résout les métadonnées d'affichage pour un agent.
 * Si l'agent n'est pas configuré, renvoie une icône vide "" pour éviter
 * d'afficher l'image d'un autre agent.
 */
export function resolveAgentDisplay(
  identifier?: string,
  dynamicAgents?: any[]
): {
  name: string;
  role: string;
  iconUrl: string;
  fullPortrait: string;
  uuid: string;
  isConfigured: boolean;
} {
  const found = getAgentInfo(identifier, dynamicAgents);
  if (found) {
    return {
      name: found.name,
      role: found.role,
      iconUrl: found.iconUrl,
      fullPortrait: found.fullPortrait || "",
      uuid: found.uuid,
      isConfigured: true,
    };
  }
  return {
    name: identifier || "Inconnu",
    role: "Flex",
    iconUrl: "",
    fullPortrait: "",
    uuid: "",
    isConfigured: false,
  };
}
