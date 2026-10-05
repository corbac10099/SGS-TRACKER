// Catalogue complet et centralisé des cartes Valorant
// Synchronisé avec l'API officielle valorant-api.com

export interface MapInfo {
  name: string;
  uuid?: string;
  splash: string;
  listViewIcon?: string;
  displayIcon?: string;
  accent: string;
  bgGradient: string;
}

export const MAP_INFO: Record<string, MapInfo> = {
  Ascent: {
    name: "Ascent",
    uuid: "7eaecc1b-4337-bbf6-6ab9-04b8f06b3319",
    splash: "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png",
    listViewIcon: "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/listviewicon.png",
    displayIcon: "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/displayicon.png",
    accent: "#38bdf8",
    bgGradient: "from-sky-900/40 via-[#0a0e13] to-[#0a0e13]",
  },
  Bind: {
    name: "Bind",
    uuid: "2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba",
    splash: "https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/splash.png",
    listViewIcon: "https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/listviewicon.png",
    displayIcon: "https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/displayicon.png",
    accent: "#f59e0b",
    bgGradient: "from-amber-900/40 via-[#0a0e13] to-[#0a0e13]",
  },
  Haven: {
    name: "Haven",
    uuid: "2bee0dc9-4ffe-519b-1cbd-7fbe763a6047",
    splash: "https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6047/splash.png",
    listViewIcon: "https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6047/listviewicon.png",
    displayIcon: "https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6047/displayicon.png",
    accent: "#10b981",
    bgGradient: "from-emerald-900/40 via-[#0a0e13] to-[#0a0e13]",
  },
  Split: {
    name: "Split",
    uuid: "d960549e-485c-e861-8d71-aa9d1aed12a2",
    splash: "https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/splash.png",
    listViewIcon: "https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/listviewicon.png",
    displayIcon: "https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/displayicon.png",
    accent: "#a855f7",
    bgGradient: "from-purple-900/40 via-[#0a0e13] to-[#0a0e13]",
  },
  Sunset: {
    name: "Sunset",
    uuid: "92584fbe-486a-b1b2-9faa-39b0f486b498",
    splash: "https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/splash.png",
    listViewIcon: "https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/listviewicon.png",
    displayIcon: "https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/displayicon.png",
    accent: "#f43f5e",
    bgGradient: "from-rose-900/40 via-[#0a0e13] to-[#0a0e13]",
  },
  Lotus: {
    name: "Lotus",
    uuid: "2fe4ed3a-450a-948b-6d6b-e89a78e680a9",
    splash: "https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/splash.png",
    listViewIcon: "https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/listviewicon.png",
    displayIcon: "https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/displayicon.png",
    accent: "#14b8a6",
    bgGradient: "from-teal-900/40 via-[#0a0e13] to-[#0a0e13]",
  },
  Abyss: {
    name: "Abyss",
    uuid: "224b0a95-48b9-f703-1bd8-67aca101a61f",
    splash: "https://media.valorant-api.com/maps/224b0a95-48b9-f703-1bd8-67aca101a61f/splash.png",
    listViewIcon: "https://media.valorant-api.com/maps/224b0a95-48b9-f703-1bd8-67aca101a61f/listviewicon.png",
    displayIcon: "https://media.valorant-api.com/maps/224b0a95-48b9-f703-1bd8-67aca101a61f/displayicon.png",
    accent: "#06b6d4",
    bgGradient: "from-cyan-900/40 via-[#0a0e13] to-[#0a0e13]",
  },
  Icebox: {
    name: "Icebox",
    uuid: "e2ad5c54-4114-a870-9641-8ea21279579a",
    splash: "https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279579a/splash.png",
    listViewIcon: "https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279579a/listviewicon.png",
    displayIcon: "https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279579a/displayicon.png",
    accent: "#7dd3fc",
    bgGradient: "from-blue-900/40 via-[#0a0e13] to-[#0a0e13]",
  },
  Breeze: {
    name: "Breeze",
    uuid: "2fb9a4fd-47b8-4e7d-a969-74b4046ebd53",
    splash: "https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/splash.png",
    listViewIcon: "https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/listviewicon.png",
    displayIcon: "https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/displayicon.png",
    accent: "#84cc16",
    bgGradient: "from-lime-900/40 via-[#0a0e13] to-[#0a0e13]",
  },
  Fracture: {
    name: "Fracture",
    uuid: "b529448b-4d60-346e-e89e-00a4c527a405",
    splash: "https://media.valorant-api.com/maps/b529448b-4d60-346e-e89e-00a4c527a405/splash.png",
    listViewIcon: "https://media.valorant-api.com/maps/b529448b-4d60-346e-e89e-00a4c527a405/listviewicon.png",
    displayIcon: "https://media.valorant-api.com/maps/b529448b-4d60-346e-e89e-00a4c527a405/displayicon.png",
    accent: "#ea580c",
    bgGradient: "from-orange-900/40 via-[#0a0e13] to-[#0a0e13]",
  },
  Pearl: {
    name: "Pearl",
    uuid: "fd267378-4d1d-484f-ff52-77821ed10dc2",
    splash: "https://media.valorant-api.com/maps/fd267378-4d1d-484f-ff52-77821ed10dc2/splash.png",
    listViewIcon: "https://media.valorant-api.com/maps/fd267378-4d1d-484f-ff52-77821ed10dc2/listviewicon.png",
    displayIcon: "https://media.valorant-api.com/maps/fd267378-4d1d-484f-ff52-77821ed10dc2/displayicon.png",
    accent: "#6366f1",
    bgGradient: "from-indigo-900/40 via-[#0a0e13] to-[#0a0e13]",
  },
  Drift: {
    name: "Drift",
    uuid: "2c09d728-42d5-30d8-43dc-96a05cc7ee9d",
    splash: "https://media.valorant-api.com/maps/2c09d728-42d5-30d8-43dc-96a05cc7ee9d/splash.png",
    listViewIcon: "https://media.valorant-api.com/maps/2c09d728-42d5-30d8-43dc-96a05cc7ee9d/listviewicon.png",
    displayIcon: "https://media.valorant-api.com/maps/2c09d728-42d5-30d8-43dc-96a05cc7ee9d/displayicon.png",
    accent: "#0ea5e9",
    bgGradient: "from-sky-950/40 via-[#0a0e13] to-[#0a0e13]",
  },
  Piazza: {
    name: "Piazza",
    uuid: "de28aa9b-4cbe-1003-320e-6cb3ec309557",
    splash: "https://media.valorant-api.com/maps/de28aa9b-4cbe-1003-320e-6cb3ec309557/splash.png",
    listViewIcon: "https://media.valorant-api.com/maps/de28aa9b-4cbe-1003-320e-6cb3ec309557/listviewicon.png",
    displayIcon: "https://media.valorant-api.com/maps/de28aa9b-4cbe-1003-320e-6cb3ec309557/displayicon.png",
    accent: "#f97316",
    bgGradient: "from-orange-950/40 via-[#0a0e13] to-[#0a0e13]",
  },
  Glitch: {
    name: "Glitch",
    uuid: "d6336a5a-428f-c591-98db-c8a291159134",
    splash: "https://media.valorant-api.com/maps/d6336a5a-428f-c591-98db-c8a291159134/splash.png",
    listViewIcon: "https://media.valorant-api.com/maps/d6336a5a-428f-c591-98db-c8a291159134/listviewicon.png",
    displayIcon: "https://media.valorant-api.com/maps/d6336a5a-428f-c591-98db-c8a291159134/displayicon.png",
    accent: "#a855f7",
    bgGradient: "from-purple-950/40 via-[#0a0e13] to-[#0a0e13]",
  },
  Kasbah: {
    name: "Kasbah",
    uuid: "12452a9d-48c3-0b02-e7eb-0381c3520404",
    splash: "https://media.valorant-api.com/maps/12452a9d-48c3-0b02-e7eb-0381c3520404/splash.png",
    listViewIcon: "https://media.valorant-api.com/maps/12452a9d-48c3-0b02-e7eb-0381c3520404/listviewicon.png",
    displayIcon: "https://media.valorant-api.com/maps/12452a9d-48c3-0b02-e7eb-0381c3520404/displayicon.png",
    accent: "#eab308",
    bgGradient: "from-yellow-950/40 via-[#0a0e13] to-[#0a0e13]",
  },
  District: {
    name: "District",
    uuid: "690b3ed2-4dff-945b-8223-6da834e30d24",
    splash: "https://media.valorant-api.com/maps/690b3ed2-4dff-945b-8223-6da834e30d24/splash.png",
    listViewIcon: "https://media.valorant-api.com/maps/690b3ed2-4dff-945b-8223-6da834e30d24/listviewicon.png",
    displayIcon: "https://media.valorant-api.com/maps/690b3ed2-4dff-945b-8223-6da834e30d24/displayicon.png",
    accent: "#ec4899",
    bgGradient: "from-pink-950/40 via-[#0a0e13] to-[#0a0e13]",
  },
  Corrode: {
    name: "Corrode",
    uuid: "1c18ab1f-420d-0d8b-71d0-77ad3c439115",
    splash: "https://media.valorant-api.com/maps/1c18ab1f-420d-0d8b-71d0-77ad3c439115/splash.png",
    listViewIcon: "https://media.valorant-api.com/maps/1c18ab1f-420d-0d8b-71d0-77ad3c439115/listviewicon.png",
    displayIcon: "https://media.valorant-api.com/maps/1c18ab1f-420d-0d8b-71d0-77ad3c439115/displayicon.png",
    accent: "#14b8a6",
    bgGradient: "from-teal-950/40 via-[#0a0e13] to-[#0a0e13]",
  },
  Summit: {
    name: "Summit",
    uuid: "756da597-416b-c0f2-f47b-afbdf28670bc",
    splash: "https://media.valorant-api.com/maps/756da597-416b-c0f2-f47b-afbdf28670bc/splash.png",
    listViewIcon: "https://media.valorant-api.com/maps/756da597-416b-c0f2-f47b-afbdf28670bc/listviewicon.png",
    displayIcon: "https://media.valorant-api.com/maps/756da597-416b-c0f2-f47b-afbdf28670bc/displayicon.png",
    accent: "#38bdf8",
    bgGradient: "from-sky-950/40 via-[#0a0e13] to-[#0a0e13]",
  },
  Gauntlet: {
    name: "Gauntlet",
    uuid: "dd3a1cd9-41b1-50ea-3bd6-a7bb3c5978bd",
    splash: "https://media.valorant-api.com/maps/dd3a1cd9-41b1-50ea-3bd6-a7bb3c5978bd/splash.png",
    listViewIcon: "https://media.valorant-api.com/maps/dd3a1cd9-41b1-50ea-3bd6-a7bb3c5978bd/listviewicon.png",
    displayIcon: "https://media.valorant-api.com/maps/dd3a1cd9-41b1-50ea-3bd6-a7bb3c5978bd/displayicon.png",
    accent: "#ff4655",
    bgGradient: "from-rose-950/40 via-[#0a0e13] to-[#0a0e13]",
  },
  "The Range": {
    name: "The Range",
    uuid: "ee613ee9-28b7-4beb-9666-08db13bb2244",
    splash: "https://media.valorant-api.com/maps/ee613ee9-28b7-4beb-9666-08db13bb2244/splash.png",
    listViewIcon: "https://media.valorant-api.com/maps/ee613ee9-28b7-4beb-9666-08db13bb2244/listviewicon.png",
    displayIcon: "https://media.valorant-api.com/maps/ee613ee9-28b7-4beb-9666-08db13bb2244/displayicon.png",
    accent: "#64748b",
    bgGradient: "from-slate-900/40 via-[#0a0e13] to-[#0a0e13]",
  },
  "Entraînement": {
    name: "Entraînement",
    uuid: "ee613ee9-28b7-4beb-9666-08db13bb2244",
    splash: "https://media.valorant-api.com/maps/ee613ee9-28b7-4beb-9666-08db13bb2244/splash.png",
    listViewIcon: "https://media.valorant-api.com/maps/ee613ee9-28b7-4beb-9666-08db13bb2244/listviewicon.png",
    displayIcon: "https://media.valorant-api.com/maps/ee613ee9-28b7-4beb-9666-08db13bb2244/displayicon.png",
    accent: "#64748b",
    bgGradient: "from-slate-900/40 via-[#0a0e13] to-[#0a0e13]",
  },
};

const DEFAULT_MAP: MapInfo = {
  name: "Inconnue",
  splash: "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png",
  listViewIcon: "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/listviewicon.png",
  displayIcon: "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/displayicon.png",
  accent: "#ff4655",
  bgGradient: "from-zinc-900/40 via-[#0a0e13] to-[#0a0e13]",
};

/**
 * Récupère les métadonnées et visuels complets d'une carte par son nom ou alias
 */
export function getMapInfo(mapName: string | undefined | null): MapInfo {
  if (!mapName) return DEFAULT_MAP;
  
  const trimmed = mapName.trim();
  if (MAP_INFO[trimmed]) return MAP_INFO[trimmed];

  const lower = trimmed.toLowerCase();
  for (const [key, info] of Object.entries(MAP_INFO)) {
    if (key.toLowerCase() === lower || info.name.toLowerCase() === lower) {
      return info;
    }
  }

  // Détections d'alias
  if (lower.includes("gauntlet") || lower.includes("abilitydraft")) return MAP_INFO["Gauntlet"];
  if (lower.includes("range") || lower.includes("entrainement") || lower.includes("entraînement") || lower.includes("puddle")) return MAP_INFO["The Range"];
  if (lower.includes("drift")) return MAP_INFO["Drift"];
  if (lower.includes("piazza")) return MAP_INFO["Piazza"];
  if (lower.includes("glitch")) return MAP_INFO["Glitch"];
  if (lower.includes("kasbah")) return MAP_INFO["Kasbah"];
  if (lower.includes("district")) return MAP_INFO["District"];
  if (lower.includes("corrode")) return MAP_INFO["Corrode"];
  if (lower.includes("summit")) return MAP_INFO["Summit"];
  if (lower.includes("fracture")) return MAP_INFO["Fracture"];
  if (lower.includes("haven")) return MAP_INFO["Haven"];
  if (lower.includes("pearl")) return MAP_INFO["Pearl"];
  if (lower.includes("breeze")) return MAP_INFO["Breeze"];
  if (lower.includes("split")) return MAP_INFO["Split"];
  if (lower.includes("ascent")) return MAP_INFO["Ascent"];
  if (lower.includes("bind")) return MAP_INFO["Bind"];
  if (lower.includes("sunset")) return MAP_INFO["Sunset"];
  if (lower.includes("lotus")) return MAP_INFO["Lotus"];
  if (lower.includes("abyss")) return MAP_INFO["Abyss"];
  if (lower.includes("icebox")) return MAP_INFO["Icebox"];

  return {
    ...DEFAULT_MAP,
    name: trimmed,
  };
}
