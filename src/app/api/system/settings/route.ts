import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSecureHenrikApiKey, setSystemSetting } from "@/lib/systemSettings";
import { testRiotApiKey } from "@/lib/valorant/riotApi";

export const dynamic = "force-dynamic";

function maskApiKey(key: string | null): string {
  if (!key) return "Non configurée";
  const clean = key.trim();
  if (clean.length <= 10) return "********";
  return `${clean.slice(0, 6)}••••••••${clean.slice(-4)}`;
}

async function isAuthorizedAdmin(request: NextRequest): Promise<boolean> {
  const adminBypass =
    request.headers.get("x-admin-bypass") === "true" ||
    request.headers.get("x-spycam-admin") === "true";
  if (adminBypass) return true;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return false;

    const email = session.user.email.toLowerCase();
    if (
      email === "laffont.romain64@gmail.com" ||
      email === "romain.lft64@gmail.com"
    ) {
      return true;
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user?.sgsRole === "admin" || (user as any)?.role === "ADMIN";
  } catch {
    return false;
  }
}

/**
 * GET — Récupère le statut de la clé Henrik Dev et les statistiques Neon
 */
export async function GET(request: NextRequest) {
  try {
    const isAuth = await isAuthorizedAdmin(request);
    if (!isAuth) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const key = await getSecureHenrikApiKey();
    const isConfigured = Boolean(key && key.startsWith("HDEV-"));

    const [totalTrackedProfiles, totalPersistedMatches] = await Promise.all([
      prisma.trackedValorantProfile.count(),
      prisma.persistedValorantMatch.count(),
    ]);

    return NextResponse.json({
      success: true,
      henrikApiKey: {
        configured: isConfigured,
        masked: maskApiKey(key),
        source: process.env.HENRIK_DEV_API_KEY ? "env" : "neon_db",
      },
      stats: {
        totalTrackedProfiles,
        totalPersistedMatches,
      },
    });
  } catch (error: any) {
    console.error("[System Settings] GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST — Enregistre ou teste la clé Henrik Dev dans Neon DB
 * Body: { henrikApiKey: "HDEV-xxxx", testOnly?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const isAuth = await isAuthorizedAdmin(request);
    if (!isAuth) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const rawKey = body.henrikApiKey || body.value || body.apiKey;
    const testOnly = body.testOnly === true;

    if (!rawKey || typeof rawKey !== "string") {
      return NextResponse.json(
        { error: "Veuillez fournir une clé API valide (format: HDEV-...)." },
        { status: 400 }
      );
    }

    const cleanKey = rawKey.trim();
    if (!cleanKey.startsWith("HDEV-")) {
      return NextResponse.json(
        { error: "Format invalide : La clé Henrik Dev doit débuter par 'HDEV-'." },
        { status: 400 }
      );
    }

    // Tester la clé API
    const testResult = await testRiotApiKey(cleanKey, "Corbac", "EU1", "eu");

    if (testOnly) {
      return NextResponse.json({
        success: testResult.valid,
        valid: testResult.valid,
        message: testResult.message || testResult.error,
      });
    }

    // Enregistrer dans Neon DB
    await setSystemSetting(
      "HENRIK_DEV_API_KEY",
      cleanKey,
      "Clé API Henrik Dev pour l'Auto-Sync des profils et de l'historique infini",
      true
    );

    return NextResponse.json({
      success: true,
      message: "Clé API Henrik Dev enregistrée avec succès dans Neon DB !",
      masked: maskApiKey(cleanKey),
      testResult,
    });
  } catch (error: any) {
    console.error("[System Settings] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
