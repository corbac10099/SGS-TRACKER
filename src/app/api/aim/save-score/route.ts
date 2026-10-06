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

    // 2. Attribution d'XP et progression niveau si utilisateur connecté
    let xpGained = Math.min(150, Math.max(30, Math.round(score / 800)));
    let currentXp = 0;
    let currentLevel = 1;

    if (userId !== "anonymous") {
      try {
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

        // 3. Mise à jour de l'AimProfile de l'utilisateur
        await (prisma as any).aimProfile.upsert({
          where: { userId },
          create: {
            userId,
            userRank: body.userRank || "gold",
            calibrationDone: Boolean(body.calibrationDone),
            adaptiveDifficulty: difficulty,
            overallScore: score,
            accuracyAvg: accuracy,
          },
          update: {
            overallScore: Math.max(score, 0),
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
    });
  } catch (error: any) {
    console.error("Save aim score API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur sauvegarde score" },
      { status: 500 }
    );
  }
}
