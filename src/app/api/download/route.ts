import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "exe";
  const isZip = format.toLowerCase() === "zip";

  const fileName = isZip ? "SGS-Tracker-Setup.zip" : "SGS-Tracker-Setup.exe";
  const contentType = isZip ? "application/zip" : "application/vnd.microsoft.portable-executable";

  try {
    const filePath = path.join(process.cwd(), "public", "installers", fileName);
    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Content-Length": String(fileBuffer.length),
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  } catch (err) {
    console.warn("[Download Route] Erreur lecture fichier local:", err);
  }

  // Fallback direct vers Cloudflare R2
  const r2Key = `releases/${fileName}`;
  const url = new URL(`/api/media/stream?key=${encodeURIComponent(r2Key)}`, request.url);
  return NextResponse.redirect(url, { status: 302 });
}
