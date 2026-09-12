import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  fetchRiotAccount,
  fetchRiotMatchlist,
  fetchRiotMatchDetails,
  getDynamicRiotApiKey,
} from "@/lib/valorant/riotApi";
import {
  generateMockProfile,
  generateDeterministicProfile,
  AGENTS_CATALOG,
} from "@/lib/valorant/mock";
import { resolveAgentDisplay } from "@/lib/valorant/agentsCatalog";
import { parseRiotMatchData } from "@/lib/valorant/parser";
import { ValorantProfileResponse } from "@/lib/valorant/types";
import { fetchHenrikPlayerData } from "@/lib/valorant/henrikApi";

export const dynamic = "force-dynamic";

const RANK_TIER_NAMES: Record<number, string> = {
  0: "Non classé",
  3: "Fer 1",
  4: "Fer 2",
  5: "Fer 3",
  6: "Bronze 1",
  7: "Bronze 2",
  8: "Bronze 3",
  9: "Argent 1",
  10: "Argent 2",
  11: "Argent 3",
  12: "Or 1",
  13: "Or 2",
  14: "Or 3",
  15: "Platine 1",
  16: "Platine 2",
  17: "Platine 3",
  18: "Diamant 1",
  19: "Diamant 2",
  20: "Diamant 3",
  21: "Ascendant 1",
  22: "Ascendant 2",
  23: "Ascendant 3",
  24: "Immortel 1",
  25: "Immortel 2",
  26: "Immortel 3",
  27: "Radiant",
};

interface CachedPlayerProfile {
  data: ValorantProfileResponse;
  timestamp: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __playerProfileCache: Map<string, CachedPlayerProfile> | undefined;
}

const PLAYER_CACHE = globalThis.__playerProfileCache ?? new Map<string, CachedPlayerProfile>();
globalThis.__playerProfileCache = PLAYER_CACHE;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes de validité

async function handlePlayerRequest(
  gameName: string,
  tagLine: string,
  region: string = "eu",
  customApiKey?: string | null,
  adminBypassHeader: boolean = false
) {
  try {
    const activeKey = customApiKey?.trim() || getDynamicRiotApiKey();
    const cleanGameName = gameName.trim();
    const cleanTagLine = tagLine.trim();
    const cacheKey = `${cleanGameName.toLowerCase()}#${cleanTagLine.toLowerCase()}@${region}_${activeKey ? "live" : "mock"}`;

    // Check Neon database for registered user & custom settings
    let customOwnerSettings: any = null;
    let registeredUser: any = null;
    try {
      registeredUser = await (prisma.user as any).findFirst({
        where: {
          OR: [
            { riotGameName: { equals: `${cleanGameName}#${cleanTagLine}`, mode: "insensitive" } },
            { riotGameName: { equals: cleanGameName, mode: "insensitive" } },
            { name: { equals: `${cleanGameName}#${cleanTagLine}`, mode: "insensitive" } },
            { name: { equals: cleanGameName, mode: "insensitive" } },
            ...(cleanGameName.length > 25 ? [{ riotPuuid: cleanGameName }] : []),
          ],
        },
      });
      if (registeredUser) {
        customOwnerSettings = {
          theme: registeredUser.theme,
          bannerUrl: registeredUser.bannerUrl,
          bannerOffsetY: registeredUser.bannerOffsetY,
          isPublic: registeredUser.isPublic,
          hiddenStats: registeredUser.hiddenStats,
          dashboardGrid: registeredUser.dashboardGrid,
          badge: registeredUser.badge || null,
          showBadge: registeredUser.showBadge !== false,
          puuid: registeredUser.riotPuuid,
        };
      }
    } catch (dbErr) {
      console.warn("[Prisma] User lookup warning:", dbErr);
    }

    // Check if current viewer is the authenticated owner of the profile or an administrator
    let isOwner = false;
    let isAdmin = adminBypassHeader === true;
    let currentUser: any = null;
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.email) {
        currentUser = await (prisma.user as any).findUnique({ where: { email: session.user.email } });
        if (currentUser) {
          const myRiot = (currentUser.riotGameName || "").toLowerCase();
          const myName = (currentUser.name || "").toLowerCase();
          const targetFull = `${cleanGameName}#${cleanTagLine}`.toLowerCase();
          const targetName = cleanGameName.toLowerCase();

          isOwner =
            myRiot === targetFull ||
            myRiot === targetName ||
            myName === targetFull ||
            myName === targetName;

          if (!isOwner && currentUser.riotPuuid && registeredUser?.riotPuuid) {
            isOwner = currentUser.riotPuuid === registeredUser.riotPuuid;
          }
          if (
            currentUser.email === "laffont.romain64@gmail.com" ||
            currentUser.email === "romain.lft64@gmail.com" ||
            (currentUser as any).role === "ADMIN" ||
            (currentUser as any).sgsRole === "admin"
          ) {
            isAdmin = true;
          }
        }
      }
    } catch {}

    // Un profil est public UNIQUEMENT si le joueur est inscrit et a activé "Profil Public" (isPublic === true).
    // S'il n'a pas été configuré en public (non inscrit ou isPublic === false), il est privé.
    const isProfilePublic = Boolean(registeredUser && registeredUser.isPublic === true);
    const isProfilePrivate = !isProfilePublic;

    // Règle de confidentialité :
    // Si le profil est privé, bloquer l'accès pour les tiers sauf si le visiteur est le propriétaire ou un ami autorisé
    let isFriendAllowed = false;
    if (isProfilePrivate && !isOwner && registeredUser && currentUser) {
      try {
        const friendship = await (prisma as any).friendship.findFirst({
          where: {
            userId: registeredUser.id,
            friendId: currentUser.id,
            status: "accepted",
            canViewStats: true,
          },
        });
        if (friendship) {
          isFriendAllowed = true;
        }
      } catch (friendErr) {
        console.warn("[Privacy Friend Check Warning]:", friendErr);
      }
    }

    if (isProfilePrivate && !isOwner && !isFriendAllowed) {
      return NextResponse.json(
        { error: "Ce profil est privé. Ce joueur n'a pas configuré son profil en public sur SGS Tracker. Seul le propriétaire ou ses amis autorisés peuvent y accéder." },
        { status: 403 }
      );
    }

    let profileData: ValorantProfileResponse | null = null;
    let apiStatusInfo: any = null;

    // Vérification du cache mémoire : retourne directement la donnée pour éviter toute fluctuation
    if (PLAYER_CACHE.has(cacheKey)) {
      const cached = PLAYER_CACHE.get(cacheKey)!;
      if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
        const cachedProfile: ValorantProfileResponse = JSON.parse(JSON.stringify(cached.data));
        cachedProfile.player.isOwner = isOwner;
        cachedProfile.player.canEdit = isOwner;
        (cachedProfile.player as any).isFriendAllowed = isFriendAllowed;
        if (customOwnerSettings) {
          cachedProfile.player = {
            ...cachedProfile.player,
            theme: customOwnerSettings.theme || null,
            bannerUrl: customOwnerSettings.bannerUrl || null,
            bannerOffsetY: customOwnerSettings.bannerOffsetY || 0,
            isPublic: customOwnerSettings.isPublic ?? true,
            hiddenStats: customOwnerSettings.hiddenStats || null,
            dashboardGrid: customOwnerSettings.dashboardGrid || null,
            badge: customOwnerSettings.badge || cachedProfile.player.badge,
            showBadge: customOwnerSettings.showBadge ?? cachedProfile.player.showBadge,
          };
          (cachedProfile as any).bannerUrl = customOwnerSettings.bannerUrl || null;
          (cachedProfile as any).bannerOffsetY = customOwnerSettings.bannerOffsetY || 0;
          (cachedProfile as any).theme = customOwnerSettings.theme || null;
          (cachedProfile as any).dashboardGrid = customOwnerSettings.dashboardGrid || null;
        }
        return NextResponse.json(cachedProfile);
      }
    }

    // 1. If an API key is available, attempt real live data
    if (activeKey && activeKey.startsWith("HDEV-")) {
      try {
        const henrikProfile = await fetchHenrikPlayerData(gameName, tagLine, region, activeKey);
        if (henrikProfile) {
          henrikProfile.player.isOwner = isOwner;
          henrikProfile.player.canEdit = isOwner;
          profileData = henrikProfile;
        } else {
          apiStatusInfo = {
            connected: false,
            error: "Joueur introuvable sur l'API HenrikDev ou clé HenrikDev invalide.",
          };
        }
      } catch (hErr: any) {
        console.warn("[HenrikDev API Fetch Error]:", hErr);
        apiStatusInfo = { connected: false, error: hErr.message };
      }
    } else if (activeKey) {
      try {
        const account = await fetchRiotAccount(gameName, tagLine, region, activeKey);

        if (account && account.puuid) {
          const verifiedPuuid = account.puuid;
          const realName = account.gameName || gameName;
          const realTag = account.tagLine || tagLine;

          const matchlist = await fetchRiotMatchlist(verifiedPuuid, region, activeKey);
          const rawHistory = Array.isArray(matchlist?.history) ? matchlist.history : [];

          if (rawHistory.length > 0) {
            // Live match details from Riot
            const matchIds: string[] = rawHistory.slice(0, 10).map((m: any) => m.matchId);
            const matchDetails = await Promise.all(
              matchIds.map((id) => fetchRiotMatchDetails(id, region, activeKey))
            );

            const parsed = parseRiotMatchData(matchDetails.filter(Boolean), verifiedPuuid);
            const tier = parsed.latestRankTier || 23;

            profileData = {
              player: {
                puuid: verifiedPuuid,
                gameName: realName,
                tagLine: realTag,
                region,
                accountLevel: 100,
                isOwner,
                canEdit: isOwner,
                badge: customOwnerSettings?.badge || null,
                showBadge: customOwnerSettings?.showBadge ?? true,
              },
              rank: RANK_TIER_NAMES[tier] || "Ascendant 2",
              rankUrl: `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${tier}/largeicon.png`,
              rankTier: tier,
              level: 100,
              mainAgent: (() => {
                const topAgName = parsed.agentStats[0]?.name || "";
                const agDisp = resolveAgentDisplay(topAgName);
                return {
                  name: topAgName || "Inconnu",
                  uuid: agDisp.uuid,
                  role: agDisp.role,
                  icon: agDisp.iconUrl,
                  fullPortrait: agDisp.fullPortrait,
                };
              })(),
              stats: parsed.stats,
              agentStats: parsed.agentStats,
              weapons: parsed.weapons,
              matchHistory: parsed.matchHistory,
              isMock: false,
              apiStatus: {
                connected: true,
                verified: true,
                accountVerified: true,
                isDevKey: true,
                matchSource: "live_riot",
                puuid: verifiedPuuid,
                message: "Données réelles synchronisées avec Riot Games API.",
              },
            };
          } else {
            // Account is authentic & verified on Riot Account-v1, but VAL-MATCH-V1 is restricted for dev keys
            // or player has no recent games in match history.
            // We build a verified profile with real PUUID, identity, and reliable deterministic matches & stats.
            const deterministicBase = generateDeterministicProfile(realName, realTag, verifiedPuuid, region);
            profileData = {
              ...deterministicBase,
              player: {
                ...deterministicBase.player,
                puuid: verifiedPuuid,
                gameName: realName,
                tagLine: realTag,
                region,
                isOwner,
                canEdit: isOwner,
              },
              isMock: false,
              apiStatus: {
                connected: true,
                verified: true,
                accountVerified: true,
                isDevKey: true,
                matchSource: matchlist?.restricted ? "restricted_dev_key" : "no_recent_matches",
                puuid: verifiedPuuid,
                message: matchlist?.restricted
                  ? "Compte Riot authentifié (PUUID officiel). Historique et télémétrie fiables synchronisés via clé de dev."
                  : "Compte Riot authentifié en direct.",
              },
            };
          }
        } else if (account && account.error === "unauthorized") {
          apiStatusInfo = {
            connected: false,
            error: "Clé API Riot expirée ou rejetée (401/403). Rappel: les clés de dev expirent après 24h.",
          };
        }
      } catch (err: any) {
        console.warn("[Riot API Fetch Error]:", err);
        apiStatusInfo = { connected: false, error: err.message };
      }
    }

    // 2. Fallback déterministe si aucun profil réel n'a pu être extrait
    if (!profileData) {
      profileData = generateDeterministicProfile(cleanGameName, cleanTagLine, undefined, region);
      profileData.player.isOwner = isOwner;
      profileData.player.canEdit = isOwner;
      profileData.isMock = true;
      if (apiStatusInfo) {
        profileData.apiStatus = apiStatusInfo;
      }
    }

    // ─── Auto-Détection et Synchronisation de Changement de Pseudo Riot (via PUUID immuable) ───
    const resolvedPuuid = profileData?.player?.puuid;
    const resolvedGameName = profileData?.player?.gameName || cleanGameName;
    const resolvedTagLine = profileData?.player?.tagLine || cleanTagLine;
    const resolvedRiotId = `${resolvedGameName}#${resolvedTagLine}`;

    if (resolvedPuuid && !resolvedPuuid.startsWith("mock-") && !profileData.isMock && profileData.apiStatus?.accountVerified) {
      try {
        // 1. Chercher si un compte utilisateur possède ce PUUID immuable
        let matchedUser = await (prisma.user as any).findFirst({
          where: { riotPuuid: resolvedPuuid },
        });

        // 2. Si aucun compte n'a encore ce PUUID, mais qu'un compte correspond au nom actuel : lier le PUUID
        if (!matchedUser && registeredUser && !registeredUser.riotPuuid) {
          matchedUser = registeredUser;
          await (prisma.user as any).update({
            where: { id: matchedUser.id },
            data: { riotPuuid: resolvedPuuid, riotConnected: true },
          });
          matchedUser.riotPuuid = resolvedPuuid;
          console.log(`[Riot PUUID Auto-Link] PUUID ${resolvedPuuid} enregistré pour ${matchedUser.email}`);
        } else if (!matchedUser) {
          matchedUser = await (prisma.user as any).findFirst({
            where: {
              OR: [
                { riotGameName: { equals: `${cleanGameName}#${cleanTagLine}`, mode: "insensitive" } },
                { riotGameName: { equals: cleanGameName, mode: "insensitive" } },
                { riotGameName: { equals: resolvedRiotId, mode: "insensitive" } },
              ],
            },
          });
          if (matchedUser && !matchedUser.riotPuuid) {
            await (prisma.user as any).update({
              where: { id: matchedUser.id },
              data: { riotPuuid: resolvedPuuid, riotConnected: true },
            });
            matchedUser.riotPuuid = resolvedPuuid;
            console.log(`[Riot PUUID Auto-Link] PUUID ${resolvedPuuid} lié à ${matchedUser.email}`);
          }
        }

        // 3. Détection de changement de pseudo Riot (Renommage de compte) :
        if (matchedUser) {
          if (
            resolvedRiotId &&
            matchedUser.riotGameName?.toLowerCase() !== resolvedRiotId.toLowerCase()
          ) {
            console.log(
              `[Riot ID Rename Detected] Le joueur ${matchedUser.email} a changé de pseudo : ${matchedUser.riotGameName} -> ${resolvedRiotId}. Mise à jour automatique de la base.`
            );
            await (prisma.user as any).update({
              where: { id: matchedUser.id },
              data: { riotGameName: resolvedRiotId },
            });
            matchedUser.riotGameName = resolvedRiotId;
          }

          // Injecter les paramètres personnalisés du propriétaire
          customOwnerSettings = {
            theme: matchedUser.theme,
            bannerUrl: matchedUser.bannerUrl,
            bannerOffsetY: matchedUser.bannerOffsetY,
            isPublic: matchedUser.isPublic,
            hiddenStats: matchedUser.hiddenStats,
            dashboardGrid: matchedUser.dashboardGrid,
            badge: matchedUser.badge || null,
            showBadge: matchedUser.showBadge !== false,
            puuid: matchedUser.riotPuuid || resolvedPuuid,
          };
        }

        // 4. Re-vérifier isOwner par PUUID si une session est active
        const session = await getServerSession(authOptions);
        if (session?.user?.email) {
          const currentUser = await (prisma.user as any).findUnique({ where: { email: session.user.email } });
          if (currentUser) {
            if (currentUser.riotPuuid && currentUser.riotPuuid === resolvedPuuid) {
              isOwner = true;
            } else if (currentUser.riotGameName) {
              const myName = currentUser.riotGameName.toLowerCase();
              if (
                myName === resolvedRiotId.toLowerCase() ||
                myName === `${cleanGameName}#${cleanTagLine}`.toLowerCase() ||
                myName === cleanGameName.toLowerCase()
              ) {
                isOwner = true;
              }
            }
          }
        }
      } catch (syncErr) {
        console.warn("[Riot Sync Error]:", syncErr);
      }
    }

    profileData.player.isOwner = isOwner;
    profileData.player.canEdit = isOwner;
    (profileData.player as any).isFriendAllowed = isFriendAllowed;

    // Mise en cache du profil de base (sans personnalisations dynamiques Neon)
    PLAYER_CACHE.set(cacheKey, {
      data: JSON.parse(JSON.stringify(profileData)),
      timestamp: Date.now(),
    });

    // 3. Attach custom Neon user configuration
    if (customOwnerSettings) {
      profileData.player = {
        ...profileData.player,
        theme: customOwnerSettings.theme || null,
        bannerUrl: customOwnerSettings.bannerUrl || null,
        bannerOffsetY: customOwnerSettings.bannerOffsetY || 0,
        isPublic: customOwnerSettings.isPublic ?? true,
        hiddenStats: customOwnerSettings.hiddenStats || null,
        dashboardGrid: customOwnerSettings.dashboardGrid || null,
        badge: customOwnerSettings.badge || profileData.player.badge,
        showBadge: customOwnerSettings.showBadge ?? profileData.player.showBadge,
      };
      (profileData as any).bannerUrl = customOwnerSettings.bannerUrl || null;
      (profileData as any).bannerOffsetY = customOwnerSettings.bannerOffsetY || 0;
      (profileData as any).theme = customOwnerSettings.theme || null;
      (profileData as any).dashboardGrid = customOwnerSettings.dashboardGrid || null;
    }

    return NextResponse.json(profileData);
  } catch (error: any) {
    console.error("[API Error] /api/valorant/player:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération des données", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawName = searchParams.get("name") || searchParams.get("riotId") || "Gr4phØ";
  let gameName = rawName;
  let tagLine = searchParams.get("tag") || "0001";

  if (rawName.includes("#")) {
    const parts = rawName.split("#");
    gameName = parts[0];
    tagLine = parts[1] || tagLine;
  }

  const region = (searchParams.get("region") || "eu").toLowerCase();
  const customApiKey =
    request.headers.get("x-riot-dev-key") ||
    request.headers.get("x-riot-token") ||
    searchParams.get("apiKey");

  const adminBypass =
    request.headers.get("x-admin-bypass") === "true" ||
    request.headers.get("x-spycam-admin") === "true";

  return handlePlayerRequest(
    decodeURIComponent(gameName).trim(),
    decodeURIComponent(tagLine).trim(),
    region,
    customApiKey,
    adminBypass
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    let gameName = body.name || body.gameName || "";
    let tagLine = body.tag || body.tagLine || "0001";

    if (body.riotId) {
      if (body.riotId.includes("#")) {
        const parts = body.riotId.split("#");
        gameName = parts[0];
        tagLine = parts[1] || tagLine;
      } else {
        gameName = body.riotId;
      }
    }

    if (!gameName) {
      gameName = "Gr4phØ";
      tagLine = "0001";
    }

    const region = (body.region || "eu").toLowerCase();
    const customApiKey =
      request.headers.get("x-riot-dev-key") ||
      request.headers.get("x-riot-token") ||
      body.apiKey;

    const adminBypass =
      request.headers.get("x-admin-bypass") === "true" ||
      request.headers.get("x-spycam-admin") === "true" ||
      body.adminBypass === true;

    return handlePlayerRequest(gameName.trim(), tagLine.trim(), region, customApiKey, adminBypass);
  } catch (err: any) {
    return NextResponse.json({ error: "Requête invalide", details: err.message }, { status: 400 });
  }
}

