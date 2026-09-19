import { NextRequest, NextResponse } from "next/server";
import { getDesktopTicket, consumeDesktopTicket } from "@/lib/desktopAuthStore";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ticket = searchParams.get("ticket");

    if (!ticket) {
      return NextResponse.json({ status: "error", error: "Ticket manquant" }, { status: 400 });
    }

    const data = await getDesktopTicket(ticket);
    if (!data) {
      return NextResponse.json({ status: "expired", message: "Ticket introuvable ou expiré" });
    }

    if (data.status === "authenticated" && data.email && data.ssoToken) {
      // Consommer le ticket pour qu'il ne puisse plus être réutilisé
      await consumeDesktopTicket(ticket);

      return NextResponse.json({
        status: "authenticated",
        email: data.email,
        ssoToken: data.ssoToken,
      });
    }

    return NextResponse.json({
      status: "pending",
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", error: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
