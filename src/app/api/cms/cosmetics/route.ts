import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BANNER_INTERIOR_EFFECTS, BANNER_BORDER_EFFECTS } from "@/components/quests/types";

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
 * GET /api/cms/cosmetics
 * Renvoie la liste unifiée des effets de bannière (intérieur) et de bordure (contour) :
 * combine les effets par défaut et les effets dynamiques enregistrés dans Neon DB.
 */
export async function GET() {
  try {
    const dbRewards = await (prisma as any).levelReward.findMany({
      where: {
        type: { in: ["banner_effect", "banner_border"] },
        isActive: true,
      },
      orderBy: { level: "asc" },
    });

    const defaultInteriors = BANNER_INTERIOR_EFFECTS.map((fx) => ({
      ...fx,
      type: "banner_effect" as const,
      isSystem: true,
    }));

    const defaultBorders = BANNER_BORDER_EFFECTS.map((fx) => ({
      ...fx,
      type: "banner_border" as const,
      isSystem: true,
    }));

    const dynamicItems = dbRewards.map((r: any) => {
      let customCss: string | null = null;
      let r2Key: string | null = null;

      try {
        if (r.description && r.description.startsWith("{")) {
          const parsed = JSON.parse(r.description);
          customCss = parsed.cssRules || null;
          r2Key = parsed.r2Key || null;
        }
      } catch {}

      return {
        id: r.rewardKey,
        name: r.title,
        type: r.type as "banner_effect" | "banner_border",
        desc: customCss ? r.title : r.description,
        minLevel: r.level,
        color: r.badgeColor || "#ff4655",
        cssRules: customCss,
        r2Key,
        isSystem: false,
      };
    });

    const allEffects = [...defaultInteriors, ...defaultBorders];
    const map = new Map<string, any>();
    
    for (const item of allEffects) {
      if (item.id) map.set(item.id, item);
    }
    for (const item of dynamicItems) {
      if (item.id) map.set(item.id, item);
    }

    const cosmetics = Array.from(map.values());

    return setCORSHeaders(NextResponse.json({
      success: true,
      interiors: cosmetics.filter((c) => c.type === "banner_effect"),
      borders: cosmetics.filter((c) => c.type === "banner_border"),
      all: cosmetics,
    }));
  } catch (error: any) {
    console.error("[Cosmetics API Error]", error);
    return setCORSHeaders(
      NextResponse.json({ error: error.message }, { status: 500 })
    );
  }
}

/**
 * POST /api/cms/cosmetics
 * Crée ou met à jour un effet cosmétique dans Neon DB
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, type, desc, minLevel, color, cssRules, r2Key } = body;

    if (!id || !name || !type) {
      return setCORSHeaders(
        NextResponse.json({ error: "id, name et type sont obligatoires" }, { status: 400 })
      );
    }

    if (!["banner_effect", "banner_border"].includes(type)) {
      return setCORSHeaders(
        NextResponse.json({ error: "type doit être 'banner_effect' ou 'banner_border'" }, { status: 400 })
      );
    }

    const descriptionContent = (cssRules || r2Key)
      ? JSON.stringify({ desc: desc || name, cssRules, r2Key })
      : (desc || name);

    const existing = await (prisma as any).levelReward.findFirst({
      where: { rewardKey: id },
    });

    let saved;
    if (existing) {
      saved = await (prisma as any).levelReward.update({
        where: { id: existing.id },
        data: {
          level: Number(minLevel) || 1,
          type,
          title: name,
          description: descriptionContent,
          badgeColor: color || "#ff4655",
          isActive: true,
        },
      });
    } else {
      saved = await (prisma as any).levelReward.create({
        data: {
          level: Number(minLevel) || 1,
          type,
          title: name,
          description: descriptionContent,
          rewardKey: id,
          icon: type === "banner_border" ? "🌀" : "💻",
          badgeColor: color || "#ff4655",
          isActive: true,
        },
      });
    }

    return setCORSHeaders(NextResponse.json({ success: true, item: saved }));
  } catch (error: any) {
    console.error("[Cosmetics POST Error]", error);
    return setCORSHeaders(
      NextResponse.json({ error: error.message }, { status: 500 })
    );
  }
}
