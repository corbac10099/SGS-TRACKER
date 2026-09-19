import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BADGES_REGISTRY } from "@/components/UserBadges";

export const dynamic = "force-dynamic";

const setCORSHeaders = (res: NextResponse) => {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
};

export async function OPTIONS() {
  return setCORSHeaders(new NextResponse(null, { status: 200 }));
}

/**
 * GET /api/cms/badges
 * Renvoie la liste consolidée de tous les badges (système natifs + personnalisés avec image ou SVG).
 */
export async function GET() {
  try {
    // Badges enregistrés dans Neon (via levelReward type='badge')
    const dbBadges = await (prisma as any).levelReward.findMany({
      where: { type: "badge", isActive: true },
      orderBy: { level: "asc" },
    });

    // Registre système statique
    const systemBadges = Object.entries(BADGES_REGISTRY).map(([key, b]) => ({
      id: key,
      label: b.label,
      description: b.description,
      iconType: b.iconType || "svg",
      imageUrl: b.imageUrl || null,
      colorClass: b.colorClass,
      bgClass: b.bgClass,
      borderClass: b.borderClass,
      glowClass: b.glowClass,
      isSystem: true,
    }));

    // Badges dynamiques créés via AppControl
    const dynamicBadges = dbBadges.map((r: any) => {
      let iconType = "svg";
      let imageUrl: string | null = null;
      let cleanDesc = r.description;
      let colorClass = "text-amber-400";
      let bgClass = "bg-amber-500/10";
      let borderClass = "border-amber-400/30";
      let glowClass = "shadow-[0_0_12px_rgba(251,191,36,0.25)]";

      try {
        if (r.description && r.description.startsWith("{")) {
          const parsed = JSON.parse(r.description);
          iconType = parsed.iconType || (parsed.imageUrl ? "image" : "svg");
          imageUrl = parsed.imageUrl || null;
          cleanDesc = parsed.description || r.title;
          if (parsed.colorClass) colorClass = parsed.colorClass;
          if (parsed.bgClass) bgClass = parsed.bgClass;
          if (parsed.borderClass) borderClass = parsed.borderClass;
          if (parsed.glowClass) glowClass = parsed.glowClass;
        }
      } catch {}

      return {
        id: r.rewardKey,
        label: r.title,
        description: cleanDesc,
        iconType,
        imageUrl,
        colorClass,
        bgClass,
        borderClass,
        glowClass,
        minLevel: r.level,
        isSystem: false,
      };
    });

    // Fusion et dédoublonnage par ID
    const badgeMap = new Map<string, any>();
    for (const b of systemBadges) {
      badgeMap.set(b.id.toLowerCase().trim(), b);
    }
    for (const b of dynamicBadges) {
      badgeMap.set(b.id.toLowerCase().trim(), b);
    }

    return setCORSHeaders(
      NextResponse.json({
        success: true,
        badges: Array.from(badgeMap.values()),
      })
    );
  } catch (error: any) {
    console.error("[Badges API Error]", error);
    return setCORSHeaders(
      NextResponse.json({ error: error.message }, { status: 500 })
    );
  }
}

/**
 * POST /api/cms/badges
 * Enregistre ou met à jour un badge dans Neon DB (avec support image R2 ou icône SVG)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      label,
      description,
      iconType,
      imageUrl,
      color,
      colorClass,
      bgClass,
      borderClass,
      glowClass,
      minLevel,
    } = body;

    if (!id || !label) {
      return setCORSHeaders(
        NextResponse.json({ error: "id et label sont obligatoires" }, { status: 400 })
      );
    }

    const cleanId = id.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_");

    const metaPayload = {
      description: description || label,
      iconType: iconType || (imageUrl ? "image" : "svg"),
      imageUrl: imageUrl || null,
      colorClass: colorClass || "text-amber-400",
      bgClass: bgClass || "bg-amber-500/10",
      borderClass: borderClass || "border-amber-400/30",
      glowClass: glowClass || "shadow-[0_0_12px_rgba(251,191,36,0.25)]",
    };

    const existing = await (prisma as any).levelReward.findFirst({
      where: { rewardKey: cleanId },
    });

    let saved;
    if (existing) {
      saved = await (prisma as any).levelReward.update({
        where: { id: existing.id },
        data: {
          level: Number(minLevel) || 1,
          type: "badge",
          title: label,
          description: JSON.stringify(metaPayload),
          badgeColor: color || "#ff4655",
          isActive: true,
        },
      });
    } else {
      saved = await (prisma as any).levelReward.create({
        data: {
          level: Number(minLevel) || 1,
          type: "badge",
          title: label,
          description: JSON.stringify(metaPayload),
          rewardKey: cleanId,
          icon: imageUrl ? "🖼️" : "🛡️",
          badgeColor: color || "#ff4655",
          isActive: true,
        },
      });
    }

    return setCORSHeaders(NextResponse.json({ success: true, badge: saved }));
  } catch (error: any) {
    console.error("[Badges POST Error]", error);
    return setCORSHeaders(
      NextResponse.json({ error: error.message }, { status: 500 })
    );
  }
}
