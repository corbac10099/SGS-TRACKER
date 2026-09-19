import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { completeDesktopTicket } from "@/lib/desktopAuthStore";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Non authentifié dans le navigateur" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const ticket = body.ticket?.trim();
    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "Ticket manquant" },
        { status: 400 }
      );
    }

    const email = session.user.email.toLowerCase().trim();

    // Générer le jeton SSO sécurisé signé par HMAC-SHA256 (compatible avec authOptions credentials)
    const secret = process.env.NEXTAUTH_SECRET || "sgs-sso-secret-fallback";
    const payload = {
      email,
      exp: Date.now() + 5 * 60 * 1000, // Valide 5 minutes
    };
    const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const sig = crypto.createHmac("sha256", secret).update(payloadStr).digest("base64url");
    const ssoToken = `${payloadStr}.${sig}`;

    // Marquer le ticket comme authentifié
    const ok = await completeDesktopTicket(ticket, email, ssoToken);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: "Ticket invalide ou expiré" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      email,
      name: session.user.name || email.split("@")[0],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erreur validation ticket" },
      { status: 500 }
    );
  }
}
