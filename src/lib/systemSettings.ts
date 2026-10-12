import { prisma } from "@/lib/prisma";

declare global {
  // eslint-disable-next-line no-var
  var __neonHenrikApiKey: { key: string | null; timestamp: number } | undefined;
}

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes de cache en mémoire

/**
 * Récupère un paramètre système depuis la base Neon DB (avec fallback)
 */
export async function getSystemSetting(key: string): Promise<string | null> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });
    return setting?.value?.trim() || null;
  } catch (err) {
    console.warn(`[SystemSettings] Erreur lecture ${key}:`, err);
    return null;
  }
}

/**
 * Enregistre ou met à jour un paramètre système dans Neon DB
 */
export async function setSystemSetting(
  key: string,
  value: string,
  description?: string,
  isSecret = true
): Promise<void> {
  const cleanVal = value.trim();
  await prisma.systemSetting.upsert({
    where: { key },
    update: {
      value: cleanVal,
      ...(description ? { description } : {}),
      isSecret,
      updatedAt: new Date(),
    },
    create: {
      key,
      value: cleanVal,
      description: description || "Paramètre système SGS",
      isSecret,
    },
  });

  // Invalider le cache mémoire si c'est la clé Henrik
  if (key === "HENRIK_DEV_API_KEY") {
    globalThis.__neonHenrikApiKey = {
      key: cleanVal,
      timestamp: Date.now(),
    };
  }
}

/**
 * Récupère la clé API Henrik Dev de manière centralisée et ultra-sécurisée :
 * 1. Clé dynamique passée en mémoire (ex: session en cours)
 * 2. Variables d'environnement HENRIK_DEV_API_KEY / RIOT_API_KEY (si HDEV-*)
 * 3. Base Neon DB (SystemSetting 'HENRIK_DEV_API_KEY')
 */
export async function getSecureHenrikApiKey(): Promise<string | null> {
  // 1. Clé dynamique globale en mémoire
  if (globalThis.__dynamicRiotApiKey && globalThis.__dynamicRiotApiKey.startsWith("HDEV-")) {
    return globalThis.__dynamicRiotApiKey;
  }

  // 2. Variables d'environnement
  const envHenrik = process.env.HENRIK_DEV_API_KEY?.trim();
  if (envHenrik && envHenrik.startsWith("HDEV-")) {
    return envHenrik;
  }

  const envRiot = process.env.RIOT_API_KEY?.trim();
  if (envRiot && envRiot.startsWith("HDEV-")) {
    return envRiot;
  }

  // 3. Cache mémoire du paramètre Neon
  const cached = globalThis.__neonHenrikApiKey;
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.key;
  }

  // 4. Lecture sécurisée dans Neon DB
  try {
    const dbKey = await getSystemSetting("HENRIK_DEV_API_KEY");
    if (dbKey && dbKey.startsWith("HDEV-")) {
      globalThis.__neonHenrikApiKey = {
        key: dbKey,
        timestamp: Date.now(),
      };
      return dbKey;
    }
  } catch (err) {
    console.warn("[SystemSettings] Impossible de lire HENRIK_DEV_API_KEY dans Neon:", err);
  }

  return null;
}
