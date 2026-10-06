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

    try {
      profile = await (prisma as any).aimProfile.findUnique({
        where: { userId },
      });

      recentSessions = await (prisma as any).aimSession.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 15,
      });
    } catch (e) {
      console.warn("Neon DB aimProfile query error:", e);
    }

    return NextResponse.json({
      success: true,
      profile,
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
