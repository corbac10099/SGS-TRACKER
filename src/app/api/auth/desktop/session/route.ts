import { NextRequest, NextResponse } from "next/server";
import { createDesktopTicket } from "@/lib/desktopAuthStore";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ticket = await createDesktopTicket();

    // Déterminer l'URL canonique pour le navigateur externe
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");

    // En production ou si host distant, utiliser l'URL de production officielle
    const origin =
      host.includes("localhost") || host.includes("127.0.0.1")
        ? `${proto}://${host}`
        : "https://spycam-tan.vercel.app";

    const authUrl = `${origin}/auth/desktop-login?ticket=${ticket}`;

    return NextResponse.json({
      success: true,
      ticket,
      authUrl,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erreur initialisation session desktop" },
      { status: 500 }
    );
  }
}
