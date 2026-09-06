import { NextRequest, NextResponse } from "next/server";
import {
  setDynamicRiotApiKey,
  getDynamicRiotApiKey,
  testRiotApiKey,
} from "@/lib/valorant/riotApi";

export const dynamic = "force-dynamic";

export async function GET() {
  const activeKey = getDynamicRiotApiKey();
  if (!activeKey) {
    return NextResponse.json({
      hasKey: false,
      maskedKey: null,
      type: null,
      status: "mock",
    });
  }

  // Mask key for safety (e.g. RGAPI-••••••••-••••)
  const isHenrik = activeKey.startsWith("HDEV-");
  const prefix = isHenrik ? "HDEV-" : "RGAPI-";
  const maskedKey = `${prefix}${"•".repeat(12)}...${activeKey.slice(-4)}`;

  return NextResponse.json({
    hasKey: true,
    maskedKey,
    type: isHenrik ? "henrik" : "riot",
    status: "live",
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const apiKey = body.apiKey?.trim();
    const testName = body.testName?.trim() || "Corbac";
    const testTag = body.testTag?.trim() || "EU1";
    const region = body.region?.trim() || "eu";

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Veuillez renseigner une clé API Riot (RGAPI-...)" },
        { status: 400 }
      );
    }

    const testResult = await testRiotApiKey(apiKey, testName, testTag, region);

    if (testResult.valid) {
      // Set key in memory for dynamic usage across API routes
      setDynamicRiotApiKey(apiKey);

      return NextResponse.json({
        success: true,
        type: testResult.type,
        account: testResult.account,
        message: testResult.message,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: testResult.error || "Impossible de valider la clé auprès de Riot Games.",
      },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  setDynamicRiotApiKey(null);
  return NextResponse.json({
    success: true,
    message: "Clé Riot API retirée. Retour au mode simulation (mock).",
  });
}
