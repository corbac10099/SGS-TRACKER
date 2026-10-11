import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 12);
}

// POST: Create or retrieve temporary guest user in Neon DB for this IP
export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const ipIdentifier = hashIp(ip);
    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const clientToken = body?.token || "";
    const guestEmail = clientToken
      ? `guest_${ipIdentifier}_${clientToken.slice(0, 8)}@temp.spycam.gg`
      : `guest_${ipIdentifier}@temp.spycam.gg`;

    // 1. Nettoyer les anciens comptes invités temporaires (> 2 heures)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    try {
      await prisma.user.deleteMany({
        where: {
          email: { endsWith: "@temp.spycam.gg" },
          updatedAt: { lt: twoHoursAgo },
        },
      });
    } catch (cleanErr) {
      console.warn("Nettoyage anciens comptes temporaires:", cleanErr);
    }

    // 2. Trouver ou créer le compte temporaire pour cette IP
    let user = await prisma.user.findUnique({
      where: { email: guestEmail },
    });

    if (!user) {
      // Count existing guest accounts to generate unique Shadow name
      const existingGuestCount = await prisma.user.count({
        where: { email: { endsWith: "@temp.spycam.gg" } },
      });
      const shadowNumber = existingGuestCount + 1;

      user = await prisma.user.create({
        data: {
          email: guestEmail,
          firstName: "Invité",
          lastName: "Bêta",
          riotGameName: `Shadow${shadowNumber}`,
          riotPuuid: `debug-beta-guest-puuid-${shadowNumber}`,
          onboardingDone: false,
          theme: "dark",
          language: "fr",
          smartRating: true,
          isPublic: false,
          bannerOffsetY: 50,
        },
      });
    }

    return NextResponse.json({
      success: true,
      guestId: user.id,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        riotId: `${user.riotGameName || "Shadow"}#BETA`,
        riotGameName: user.riotGameName || "Shadow",
        riotPuuid: user.riotPuuid || "debug-beta-guest-puuid",
        theme: user.theme,
        bannerUrl: user.bannerUrl,
        bannerOffsetY: user.bannerOffsetY,
        smartRating: user.smartRating,
        isPublic: user.isPublic,
        videoLoop: user.videoLoop,
        videoLoopDelay: user.videoLoopDelay,
        hiddenStats: user.hiddenStats,
        enforcePublicStats: user.enforcePublicStats,
        language: user.language,
        onboardingDone: Boolean(user.onboardingDone && user.dataRetentionAcceptedAt),
        dataRetentionPolicy: user.dataRetentionPolicy,
        dataRetentionDays: user.dataRetentionDays,
        dataRetentionAcceptedAt: user.dataRetentionAcceptedAt,
      },
    });
  } catch (error: any) {
    console.error("Erreur création guest session Neon:", error);
    return NextResponse.json(
      { error: "Impossible de créer la session temporaire", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Remove temporary guest user when all tabs/pages are closed
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const guestId = url.searchParams.get("guestId");
    const ip = getClientIp(req);
    const ipIdentifier = hashIp(ip);
    const guestEmail = `guest_${ipIdentifier}@temp.spycam.gg`;

    if (guestId) {
      await prisma.user.deleteMany({
        where: {
          id: guestId,
          email: { endsWith: "@temp.spycam.gg" },
        },
      });
    } else {
      await prisma.user.deleteMany({
        where: {
          email: guestEmail,
        },
      });
    }

    return NextResponse.json({ success: true, message: "Session temporaire supprimée" });
  } catch (error: any) {
    console.error("Erreur suppression guest session Neon:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
