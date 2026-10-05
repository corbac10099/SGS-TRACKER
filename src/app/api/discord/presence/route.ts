import { NextResponse } from "next/server";
import net from "net";

export const dynamic = "force-dynamic";

let discordClientIpc: any = null;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { details, state, mapName, agentName } = body;

    // Simulation de socket Discord IPC local sous Windows (\\?\pipe\discord-ipc-0)
    // Enregistrement de l'état actif pour inspection ou diffusion
    return NextResponse.json({
      success: true,
      presence: {
        details: details || "En ligne sur SGS-Tracker",
        state: state || "Consulte ses performances",
        assets: {
          large_image: "sgs_logo",
          large_text: "SGS-Tracker Valorant",
          small_image: agentName ? agentName.toLowerCase() : "valorant_icon",
          small_text: mapName || "Valorant",
        },
        timestamps: {
          start: Date.now(),
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  return NextResponse.json({ success: true, message: "Présence Discord réinitialisée." });
}
