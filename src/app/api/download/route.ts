import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const filePath = path.join(process.cwd(), "public", "installers", "SGS-Tracker-Setup.exe");
    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "application/vnd.microsoft.portable-executable",
          "Content-Disposition": 'attachment; filename="SGS-Tracker-Setup.exe"',
          "Content-Length": String(fileBuffer.length),
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  } catch (err) {
    console.warn("[Download Route] Erreur lecture binaire local:", err);
  }

  // Fallback redirection directe vers le fichier statique
  const url = new URL("/installers/SGS-Tracker-Setup.exe", request.url);
  return NextResponse.redirect(url, { status: 302 });
}
