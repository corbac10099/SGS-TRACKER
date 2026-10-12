import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchHenrikPlayerData } from "@/lib/valorant/henrikApi";
import { getSecureHenrikApiKey } from "@/lib/systemSettings";
import {
  saveMatchesToNeon,
  getPersistedMatchesForPlayer,
  mergeMatchHistories,
} from "@/lib/valorant/matchStorage";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Max 60s pour Vercel

/**
 * GET/POST — Synchronise tous les profils Valorant actifs dont l'intervalle est échu.
 * 
 * Appelé par :
 *  - Vercel Cron (toutes les minutes)
 *  - Appel manuel depuis l'AppControl
 *  - Le composant client via setInterval côté navigateur
 * 
 * Query params optionnels :
 *  - ?id=xxx      → Sync uniquement ce profil (force la sync)
 *  - ?email=xxx   → Sync uniquement les profils liés à cet email
 */
export async function GET(request: NextRequest) {
  return handleSync(request);
}

export async function POST(request: NextRequest) {
  return handleSync(request);
}

async function handleSync(request: NextRequest) {
  try {
    // Authentification optionnelle via CRON_SECRET
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const host = request.headers.get("host") || "";
    const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");

    if (cronSecret && authHeader !== `Bearer ${cronSecret}` && !isLocalhost) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const forceId = searchParams.get("id");
    const filterEmail = searchParams.get("email");

    const now = new Date();
    let profilesToSync: any[];

    if (forceId) {
      // Sync forcé d'un seul profil
      const profile = await prisma.trackedValorantProfile.findUnique({
        where: { id: forceId },
      });
      profilesToSync = profile ? [profile] : [];
    } else {
      // Récupérer tous les profils actifs dont le dernier sync est dépassé
      const allActive = await prisma.trackedValorantProfile.findMany({
        where: {
          isActive: true,
          ...(filterEmail ? { linkedEmail: filterEmail } : {}),
        },
      });

      profilesToSync = allActive.filter((p) => {
        if (!p.lastSyncAt) return true; // Jamais synchronisé
        const elapsedMs = now.getTime() - new Date(p.lastSyncAt).getTime();
        const intervalMs = p.syncIntervalMin * 60 * 1000;
        return elapsedMs >= intervalMs;
      });
    }

    if (profilesToSync.length === 0) {
      return NextResponse.json({
        success: true,
        synced: 0,
        message: "Aucun profil à synchroniser pour le moment.",
      });
    }

    // Récupérer la clé API Henrik Dev (depuis mémoire, env ou base Neon DB)
    const apiKey = await getSecureHenrikApiKey();
    if (!apiKey || !apiKey.startsWith("HDEV-")) {
      return NextResponse.json(
        {
          error: "Aucune clé API Henrik Dev (HDEV-*) configurée dans Neon DB ou en variable d'environnement.",
        },
        { status: 500 }
      );
    }

    const results: any[] = [];

    for (const profile of profilesToSync) {
      try {
        // Déterminer la durée de rétention demandée par le joueur
        let userRetentionDays = 90;
        try {
          const user = await prisma.user.findUnique({
            where: { email: profile.linkedEmail },
          });
          if (user && user.dataRetentionDays !== undefined) {
            userRetentionDays = user.dataRetentionDays;
          }
        } catch {}

        // Appel à l'API Henrik Dev
        const playerData = await fetchHenrikPlayerData(
          profile.gameName,
          profile.tagLine,
          profile.region,
          apiKey
        );

        if (playerData && playerData.player) {
          const stats = playerData.stats || playerData.player?.stats || {};
          const rank = playerData.rank || playerData.player?.rank || "Non classé";
          const rankTier = playerData.rankTier || playerData.player?.rankTier || 0;
          const rankUrl = playerData.rankUrl || playerData.player?.rankUrl || "";
          const mainAgent = playerData.mainAgent?.name || playerData.player?.mainAgent?.name || "";
          const puuid = playerData.player.puuid;

          // ─── CUMUL ET EXTENSION INFINIE DE L'HISTORIQUE DE MATCHS ───
          // 1. Sauvegarder les nouveaux matchs retournés par l'API dans Neon DB
          if (Array.isArray(playerData.matchHistory) && playerData.matchHistory.length > 0) {
            await saveMatchesToNeon(
              profile.riotId,
              profile.gameName,
              profile.tagLine,
              puuid,
              playerData.matchHistory,
              userRetentionDays
            );
          }

          // 2. Récupérer l'ensemble de l'historique cumulé stocké sur Neon DB
          const persistedMatches = await getPersistedMatchesForPlayer(
            profile.riotId,
            puuid,
            userRetentionDays
          );

          // 3. Fusionner les matchs récents et persistés pour allonger l'historique
          if (persistedMatches.length > 0) {
            playerData.matchHistory = mergeMatchHistories(
              playerData.matchHistory || [],
              persistedMatches
            );
          }

          // Mettre à jour le profil suivi avec le profil complet enrichi
          await prisma.trackedValorantProfile.update({
            where: { id: profile.id },
            data: {
              lastSyncAt: now,
              lastSyncStatus: "success",
              lastSyncError: null,
              lastRank: rank,
              lastRankTier: rankTier,
              lastRankUrl: rankUrl,
              totalSyncs: { increment: 1 },
              cachedData: JSON.stringify(playerData),
            },
          });

          // Créer un snapshot de l'état actuel
          await prisma.trackedProfileSnapshot.create({
            data: {
              trackedProfileId: profile.id,
              rank,
              rankTier,
              kills: stats.kills || 0,
              deaths: stats.deaths || 0,
              assists: stats.assists || 0,
              kdRatio: stats.kdRatio || 0,
              headshotPct: stats.headshotPct || 0,
              winRate: stats.winRate || 0,
              acs: stats.acs || 0,
              matchesPlayed: playerData.matchHistory?.length || stats.matchesPlayed || 0,
              mainAgent,
              snapshotData: JSON.stringify(playerData),
            },
          });

          // Mettre à jour le profil utilisateur correspondant sur Neon DB
          try {
            const user = await prisma.user.findUnique({
              where: { email: profile.linkedEmail },
            });

            if (user) {
              const updateData: any = {
                riotGameName: `${playerData.player.gameName}#${playerData.player.tagLine}`,
                riotConnected: true,
              };

              // Si le joueur a un PUUID réel, le stocker
              if (playerData.player.puuid && !playerData.player.puuid.startsWith("mock-")) {
                updateData.riotPuuid = playerData.player.puuid;
              }

              await prisma.user.update({
                where: { id: user.id },
                data: updateData,
              });
            }
          } catch (userUpdateErr) {
            console.warn(`[Auto-Sync] Mise à jour utilisateur échouée pour ${profile.linkedEmail}:`, userUpdateErr);
          }

          results.push({
            id: profile.id,
            riotId: profile.riotId,
            status: "success",
            rank,
            rankTier,
            mainAgent,
            matchesPlayed: stats.matchesPlayed || 0,
          });
        } else {
          // Profil introuvable via Henrik Dev
          await prisma.trackedValorantProfile.update({
            where: { id: profile.id },
            data: {
              lastSyncAt: now,
              lastSyncStatus: "error",
              lastSyncError: "Profil introuvable via l'API Henrik Dev. Vérifiez le Riot ID.",
              totalSyncs: { increment: 1 },
            },
          });

          results.push({
            id: profile.id,
            riotId: profile.riotId,
            status: "error",
            error: "Profil introuvable",
          });
        }
      } catch (profileErr: any) {
        console.error(`[Auto-Sync] Erreur sync ${profile.riotId}:`, profileErr);

        await prisma.trackedValorantProfile.update({
          where: { id: profile.id },
          data: {
            lastSyncAt: now,
            lastSyncStatus: "error",
            lastSyncError: profileErr.message || "Erreur inconnue",
            totalSyncs: { increment: 1 },
          },
        });

        results.push({
          id: profile.id,
          riotId: profile.riotId,
          status: "error",
          error: profileErr.message,
        });
      }
    }

    const successCount = results.filter((r) => r.status === "success").length;
    const errorCount = results.filter((r) => r.status === "error").length;

    return NextResponse.json({
      success: true,
      syncedAt: now.toISOString(),
      synced: successCount,
      errors: errorCount,
      total: results.length,
      results,
      message: `${successCount} profil(s) synchronisé(s) avec succès, ${errorCount} erreur(s).`,
    });
  } catch (error: any) {
    console.error("[Valorant Sync Cron] Erreur globale:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
