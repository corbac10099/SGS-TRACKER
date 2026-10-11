import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET — Liste tous les profils suivis (filtrage optionnel par email)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    const where: any = {};
    if (email) where.linkedEmail = email;

    const profiles = await prisma.trackedValorantProfile.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        snapshots: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    return NextResponse.json({ success: true, profiles });
  } catch (error: any) {
    console.error("[Auto-Sync] GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST — Créer ou mettre à jour un profil suivi
 * Body: { riotId: "SENPAII#6767", linkedEmail: "ryzeapex64@gmail.com", syncIntervalMin: 1, region?: "eu" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { riotId, linkedEmail, syncIntervalMin, region } = body;

    if (!riotId || !linkedEmail) {
      return NextResponse.json(
        { error: "riotId et linkedEmail sont requis." },
        { status: 400 }
      );
    }

    // Parser le Riot ID en gameName + tagLine
    const parts = riotId.split("#");
    if (parts.length < 2) {
      return NextResponse.json(
        { error: "Format invalide. Utilisez le format Pseudo#Tag (ex: SENPAII#6767)." },
        { status: 400 }
      );
    }

    const gameName = parts[0].trim();
    const tagLine = parts.slice(1).join("#").trim();
    const cleanRiotId = `${gameName}#${tagLine}`;
    const interval = Math.max(1, Math.min(1440, syncIntervalMin || 5));

    // Vérifier si le profil existe déjà pour cet email
    const existing = await prisma.trackedValorantProfile.findUnique({
      where: {
        riotId_linkedEmail: {
          riotId: cleanRiotId,
          linkedEmail,
        },
      },
    });

    let profile;
    if (existing) {
      // Mise à jour de l'intervalle et réactivation
      profile = await prisma.trackedValorantProfile.update({
        where: { id: existing.id },
        data: {
          syncIntervalMin: interval,
          region: region || existing.region,
          isActive: true,
        },
      });
    } else {
      // Création
      profile = await prisma.trackedValorantProfile.create({
        data: {
          riotId: cleanRiotId,
          gameName,
          tagLine,
          region: region || "eu",
          linkedEmail,
          syncIntervalMin: interval,
          isActive: true,
        },
      });
    }

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error("[Auto-Sync] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT — Modifier un profil existant (intervalle, activation, etc.)
 * Body: { id: "...", syncIntervalMin?: 5, isActive?: true, region?: "eu" }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, syncIntervalMin, isActive, region } = body;

    if (!id) {
      return NextResponse.json({ error: "id requis." }, { status: 400 });
    }

    const data: any = {};
    if (syncIntervalMin !== undefined) data.syncIntervalMin = Math.max(1, Math.min(1440, syncIntervalMin));
    if (isActive !== undefined) data.isActive = isActive;
    if (region) data.region = region;

    const profile = await prisma.trackedValorantProfile.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error("[Auto-Sync] PUT error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE — Supprimer un profil suivi
 * Body: { id: "..." }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "id requis." }, { status: 400 });
    }

    await prisma.trackedValorantProfile.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Profil supprimé." });
  } catch (error: any) {
    console.error("[Auto-Sync] DELETE error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
