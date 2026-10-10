import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({
        success: true,
        profile: null,
        recentSessions: [],
      });
    }

    let profile = null;
    let recentSessions: any[] = [];
    let userXp = 0;

    try {
      profile = await (prisma as any).aimProfile.findUnique({
        where: { userId },
      });

      recentSessions = await (prisma as any).aimSession.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 15,
      });

      const userRecord = await prisma.user.findUnique({
        where: { id: userId },
        select: { xp: true },
      });
      userXp = userRecord?.xp || 0;
    } catch (e) {
      console.warn("Neon DB aimProfile query error:", e);
    }

    // Calcul de l'Aim XP et du Niveau d'Aim
    const sessionCount = recentSessions.length;
    const computedAimXp = Math.max(userXp, sessionCount * 120);
    const xpPerLevel = 750;
    const aimLevel = Math.floor(computedAimXp / xpPerLevel) + 1;
    const currentLevelXp = computedAimXp % xpPerLevel;
    const progressPercent = Math.min(100, Math.round((currentLevelXp / xpPerLevel) * 100));

    let title = "Novice de Visée";
    let badgeColor = "#94a3b8";
    if (aimLevel >= 60) {
      title = "Légende Radiant Aim";
      badgeColor = "#f59e0b";
    } else if (aimLevel >= 45) {
      title = "Sniper d'Élite";
      badgeColor = "#ef4444";
    } else if (aimLevel >= 30) {
      title = "Cyber Duelliste";
      badgeColor = "#10b981";
    } else if (aimLevel >= 20) {
      title = "Maître du Flick";
      badgeColor = "#a855f7";
    } else if (aimLevel >= 12) {
      title = "Spécialiste Headshot";
      badgeColor = "#06b6d4";
    } else if (aimLevel >= 6) {
      title = "Tireur Confirmé";
      badgeColor = "#eab308";
    }

    const aimLevelInfo = {
      level: aimLevel,
      totalXp: computedAimXp,
      currentLevelXp,
      nextLevelXp: xpPerLevel,
      progressPercent,
      title,
      badgeColor,
    };

    return NextResponse.json({
      success: true,
      profile,
      aimLevelInfo,
      recentSessions,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erreur récupération profil" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const userId = (session?.user as any)?.id || body.userId;

    if (!userId || userId === "anonymous") {
      return NextResponse.json({ success: true, saved: false });
    }

    const cal = body.calibration || body;

    const profile = await (prisma as any).aimProfile.upsert({
      where: { userId },
      create: {
        userId,
        userRank: cal.rankId || "gold",
        calibrationDone: true,
        adaptiveDifficulty: cal.adaptiveDifficulty || 1.0,
        overallScore: cal.overallScore || 0,
        flickScore: cal.flickScore || 0,
        microScore: cal.microScore || 0,
        trackingScore: cal.trackingScore || 0,
        reactionTimeMs: cal.reactionTimeMs || 215,
        accuracyAvg: cal.accuracyAvg || 85,
        playerProfile: cal.playerProfile || "balanced",
        recommendedSens: cal.recommendedSens || 0.35,
        recommendedDpi: cal.recommendedDpi || 800,
      },
      update: {
        userRank: cal.rankId || "gold",
        calibrationDone: true,
        adaptiveDifficulty: cal.adaptiveDifficulty || 1.0,
        overallScore: cal.overallScore || 0,
        flickScore: cal.flickScore || 0,
        microScore: cal.microScore || 0,
        trackingScore: cal.trackingScore || 0,
        reactionTimeMs: cal.reactionTimeMs || 215,
        accuracyAvg: cal.accuracyAvg || 85,
        playerProfile: cal.playerProfile || "balanced",
        recommendedSens: cal.recommendedSens || 0.35,
        recommendedDpi: cal.recommendedDpi || 800,
      },
    });

    // Grant Calibration Bonus XP (+250 XP)
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          xp: { increment: 250 },
        },
      });
    } catch {}

    return NextResponse.json({ success: true, profile });
  } catch (err: any) {
    console.error("Save aim calibration error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erreur sauvegarde calibration" },
      { status: 500 }
    );
  }
}
