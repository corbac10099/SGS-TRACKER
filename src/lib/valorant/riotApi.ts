// Official Riot Games API Client (With dynamic key support & multi-cluster routing)
declare global {
  // eslint-disable-next-line no-var
  var __dynamicRiotApiKey: string | null | undefined;
}

export function setDynamicRiotApiKey(key: string | null) {
  const clean = key ? key.trim() : null;
  globalThis.__dynamicRiotApiKey = clean;
}

export function getDynamicRiotApiKey(): string | null {
  if (globalThis.__dynamicRiotApiKey !== undefined) {
    return globalThis.__dynamicRiotApiKey;
  }
  const envKey = process.env.RIOT_API_KEY || process.env.VALORANT_API_KEY || null;
  if (
    envKey &&
    !envKey.includes("votre_cle") &&
    !envKey.includes("_ici") &&
    !envKey.includes("placeholder") &&
    !envKey.includes("xxxx")
  ) {
    return envKey;
  }
  return null;
}

const CLUSTERS: Record<string, string> = {
  eu: "europe",
  na: "americas",
  latam: "americas",
  br: "americas",
  ap: "asia",
  kr: "asia",
};

const REGIONS: Record<string, string> = {
  eu: "eu",
  na: "na",
  latam: "latam",
  br: "br",
  ap: "ap",
  kr: "kr",
};

export async function fetchRiotAccount(
  gameName: string,
  tagLine: string,
  region = "eu",
  overrideKey?: string | null
) {
  const key = overrideKey?.trim() || getDynamicRiotApiKey();
  if (!key) return null;

  const primaryCluster = CLUSTERS[region.toLowerCase()] || "europe";
  const clustersToTry = [
    primaryCluster,
    ...["europe", "americas", "asia"].filter((c) => c !== primaryCluster),
  ];

  for (const cluster of clustersToTry) {
    const url = `https://${cluster}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
      gameName
    )}/${encodeURIComponent(tagLine)}`;

    try {
      const res = await fetch(url, {
        headers: {
          "X-Riot-Token": key,
        },
        cache: "no-store",
      });

      if (res.status === 200) {
        const data = await res.json();
        return { ...data, cluster };
      }
      if (res.status === 401 || res.status === 403) {
        console.warn(`[Riot API] Auth failed on cluster ${cluster} (Status: ${res.status})`);
        return { error: "unauthorized", status: res.status };
      }
      if (res.status === 429) {
        console.warn(`[Riot API] Rate limit hit (429)`);
        return { error: "rate_limited", status: 429 };
      }
    } catch (err) {
      console.warn(`[Riot API] Error on cluster ${cluster}:`, err);
    }
  }

  return null;
}

export async function fetchRiotAccountByPuuid(
  puuid: string,
  region = "eu",
  overrideKey?: string | null
) {
  const key = overrideKey?.trim() || getDynamicRiotApiKey();
  if (!key) return null;

  const primaryCluster = CLUSTERS[region.toLowerCase()] || "europe";
  const clustersToTry = [
    primaryCluster,
    ...["europe", "americas", "asia"].filter((c) => c !== primaryCluster),
  ];

  for (const cluster of clustersToTry) {
    const url = `https://${cluster}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${encodeURIComponent(
      puuid
    )}`;

    try {
      const res = await fetch(url, {
        headers: {
          "X-Riot-Token": key,
        },
        cache: "no-store",
      });

      if (res.status === 200) {
        const data = await res.json();
        return { ...data, cluster };
      }
    } catch (err) {
      console.warn(`[Riot API] Error by-puuid on cluster ${cluster}:`, err);
    }
  }

  return null;
}

export async function fetchRiotMatchlist(
  puuid: string,
  region = "eu",
  overrideKey?: string | null
) {
  const key = overrideKey?.trim() || getDynamicRiotApiKey();
  if (!key) return null;
  const valRegion = REGIONS[region.toLowerCase()] || "eu";
  const url = `https://${valRegion}.api.riotgames.com/val/match/v1/matchlists/by-puuid/${puuid}`;

  try {
    const res = await fetch(url, {
      headers: {
        "X-Riot-Token": key,
      },
      cache: "no-store",
    });

    if (res.status === 200) {
      return await res.json();
    }
    if (res.status === 403) {
      // Riot Personal Developer Keys are restricted on VAL-MATCH-V1 by default
      console.warn("[Riot API] 403 Forbidden on val/match/v1 (Personal Dev Key limitation)");
      return { restricted: true, status: 403 };
    }
    if (res.status === 401) {
      return { error: "unauthorized", status: 401 };
    }
    return null;
  } catch (err) {
    console.warn("[Riot API] Error fetching matchlist:", err);
    return null;
  }
}

export async function fetchRiotMatchDetails(
  matchId: string,
  region = "eu",
  overrideKey?: string | null
) {
  const key = overrideKey?.trim() || getDynamicRiotApiKey();
  if (!key) return null;
  const valRegion = REGIONS[region.toLowerCase()] || "eu";
  const url = `https://${valRegion}.api.riotgames.com/val/match/v1/matches/${matchId}`;

  try {
    const res = await fetch(url, {
      headers: {
        "X-Riot-Token": key,
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("[Riot API] Error fetching match details:", err);
    return null;
  }
}

export async function fetchRiotLeaderboard(
  actId: string,
  region = "eu",
  size = 100,
  startIndex = 0,
  overrideKey?: string | null
) {
  const key = overrideKey?.trim() || getDynamicRiotApiKey();
  if (!key) return null;
  const valRegion = REGIONS[region.toLowerCase()] || "eu";
  const url = `https://${valRegion}.api.riotgames.com/val/ranked/v1/leaderboards/by-act/${actId}?size=${size}&startIndex=${startIndex}`;

  try {
    const res = await fetch(url, {
      headers: {
        "X-Riot-Token": key,
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("[Riot API] Error fetching leaderboard:", err);
    return null;
  }
}

export async function testRiotApiKey(
  key: string,
  testName = "Corbac",
  testTag = "EU1",
  region = "eu"
) {
  const cleanKey = key?.trim();
  if (!cleanKey) {
    return { valid: false, error: "Clé API vide." };
  }

  // Support for HenrikDev API key if user supplies HDEV-
  if (cleanKey.startsWith("HDEV-")) {
    try {
      const res = await fetch(
        `https://api.henrikdev.xyz/valorant/v1/account/${encodeURIComponent(
          testName
        )}/${encodeURIComponent(testTag)}?api_key=${encodeURIComponent(cleanKey)}`,
        {
          headers: { Authorization: cleanKey, Accept: "application/json" },
          cache: "no-store",
        }
      );
      const data = await res.json().catch(() => ({}));
      if (res.status === 200 && data?.data) {
        return {
          valid: true,
          type: "henrik",
          account: {
            puuid: data.data.puuid,
            gameName: data.data.name,
            tagLine: data.data.tag,
          },
          message: "Clé HenrikDev validée avec succès !",
        };
      }
      return {
        valid: false,
        error: data?.errors?.[0]?.message || `Erreur HenrikDev (Status ${res.status})`,
      };
    } catch (e: any) {
      return { valid: false, error: e.message || "Erreur réseau vers HenrikDev" };
    }
  }

  // Official Riot Games Developer Key
  const account: any = await fetchRiotAccount(testName, testTag, region, cleanKey);
  if (account && account.puuid) {
    return {
      valid: true,
      type: "riot",
      account: {
        puuid: account.puuid,
        gameName: account.gameName || testName,
        tagLine: account.tagLine || testTag,
        cluster: account.cluster,
      },
      message: `Connexion Riot Games réussie ! Compte vérifié : ${account.gameName || testName}#${account.tagLine || testTag}`,
    };
  }

  if (account && account.error === "unauthorized") {
    return {
      valid: false,
      error:
        "La clé Riot Games est invalide ou expirée (Erreur 401/403). Vérifiez votre clé sur developer.riotgames.com (validité 24h).",
    };
  }

  if (account && account.error === "rate_limited") {
    return {
      valid: false,
      error: "Limite de requêtes atteinte (Rate limit 429). Veuillez patienter 1 minute.",
    };
  }

  return {
    valid: false,
    error: `Compte ${testName}#${testTag} introuvable sur Riot Games avec cette clé. Vérifiez le pseudo/tag ou la région.`,
  };
}
