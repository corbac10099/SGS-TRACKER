import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const userId = (session?.user as any)?.id || body.userId || "anonymous";
    const userName = session?.user?.name || body.userName || "Agent";

    const score = parseInt(body.score) || 0;
    const accuracy = parseFloat(body.accuracy) || 0;
    const headshotRate = parseFloat(body.headshotRate) || 0;
    const avgTimeToHitMs = parseInt(body.avgTimeToHitMs) || 0;
    const targetsHit = parseInt(body.targetsHit) || 0;
    const totalShots = parseInt(body.totalShots) || 0;
    const maxCombo = parseInt(body.maxCombo) || 0;
    const difficulty = parseFloat(body.difficulty) || 1.0;
    const scenarioId = body.scenarioId || "gridshot_3d";

    // 1. Enregistrement de la session dans Neon DB
    let savedSession = null;
    try {
      savedSession = await (prisma as any).aimSession.create({
        data: {
          userId,
          userName,
          scenarioId,
          score,
          accuracy,
          headshotRate,
          avgTimeToHitMs,
          targetsHit,
          totalShots,
          maxCombo,
          difficulty,
        },
      });
    } catch (dbErr) {
      console.warn("Neon DB aimSession insert fallback:", dbErr);
    }

    // 2. Attribution d'XP avancée (Tirs au but, Headshots, Combo, Performance)
    const baseHitXp = targetsHit * 4;
    const scoreFactorXp = Math.round(score / 450);
    const comboBonusXp = maxCombo >= 15 ? 50 : maxCombo >= 8 ? 25 : 10;
    const hsBonusXp = Math.round((headshotRate / 100) * targetsHit * 3);
    let xpGained = Math.min(350, Math.max(40, baseHitXp + scoreFactorXp + comboBonusXp + hsBonusXp));

    let currentXp = 0;
    let currentLevel = 1;
    let promoted = false;
    let previousRank = body.userRank || "gold";
    let newRank = body.userRank || "gold";

    const RANK_STEPS: Record<string, string> = {
      iron: "bronze",
      bronze: "silver",
      silver: "gold",
      gold: "platinum",
      platinum: "diamond",
      diamond: "ascendant",
      ascendant: "immortal",
      immortal: "radiant_aim",
    };

    if (userId !== "anonymous") {
      try {
        // Récupérer le profil actuel
        const existingProfile = await (prisma as any).aimProfile.findUnique({
          where: { userId },
        });

        if (existingProfile?.userRank) {
          previousRank = existingProfile.userRank;
          newRank = existingProfile.userRank;
        }

        // Vérification de la 1ère place du mois pour la promotion
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Score max actuel de ce rang ce mois-ci
        const topRankSession = await (prisma as any).aimSession.findFirst({
          where: {
            createdAt: { gte: startOfMonth },
            userId: { not: userId },
          },
          orderBy: { score: "desc" },
        });

        const thresholdToBeat = topRankSession ? topRankSession.score : 65000;

        // Si le score dépasse le 1er du rang et qu'un rang supérieur existe
        if (score > thresholdToBeat && RANK_STEPS[previousRank]) {
          newRank = RANK_STEPS[previousRank];
          promoted = true;
          xpGained += 500; // Bonus de promotion +500 XP
        }

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, xp: true, trackerLevel: true },
        });

        if (user) {
          const newXp = (user.xp || 0) + xpGained;
          const newLevel = Math.floor(newXp / 1000) + 1;

          await prisma.user.update({
            where: { id: userId },
            data: {
              xp: newXp,
              trackerLevel: newLevel,
            },
          });

          currentXp = newXp;
          currentLevel = newLevel;
        }

        // 3. Mise à jour de l'AimProfile de l'utilisateur (avec promotion si éligible)
        await (prisma as any).aimProfile.upsert({
          where: { userId },
          create: {
            userId,
            userRank: newRank,
            calibrationDone: Boolean(body.calibrationDone),
            adaptiveDifficulty: difficulty,
            overallScore: score,
            accuracyAvg: accuracy,
          },
          update: {
            userRank: newRank,
            overallScore: Math.max(score, existingProfile?.overallScore || 0),
            adaptiveDifficulty: difficulty,
            accuracyAvg: accuracy,
          },
        });
      } catch (userErr) {
        console.warn("User aim update error:", userErr);
      }
    }

    return NextResponse.json({
      success: true,
      savedSession,
      xpGained,
      currentXp,
      currentLevel,
      promoted,
      previousRank,
      newRank,
    });
  } catch (error: any) {
    console.error("Save aim score API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur sauvegarde score" },
      { status: 500 }
    );
  }
}
