import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { generatePresignedVideoUrl } from "@/lib/r2";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), "public", "data", "app_release.json");
    if (fs.existsSync(dataPath)) {
      const content = fs.readFileSync(dataPath, "utf-8");
      const data = JSON.parse(content);

      // Si un binaire est stocké sur Cloudflare R2, générer un lien de téléchargement direct
      if (data.r2Key) {
        try {
          const r2DirectUrl = await generatePresignedVideoUrl(data.r2Key, 3600);
          if (r2DirectUrl) {
            data.r2DownloadUrl = r2DirectUrl;
          }
        } catch (r2Err) {
          console.warn("[AppRelease] Erreur génération URL R2:", r2Err);
        }
      }

      return NextResponse.json(data);
    }
  } catch (error) {
    console.error("Error reading app_release.json:", error);
  }

  // Fallback par défaut
  return NextResponse.json({
    version: "1.0.0",
    releaseName: "SGS Tracker Desktop v1.0.0 (Official)",
    releaseDate: "2026-09-29",
    filename: "SGS-Tracker-Setup.exe",
    fileSize: "2.33 MB",
    downloadUrl: "/installers/SGS-Tracker-Setup.exe",
    isPublished: true,
    channel: "stable",
    minWindowsVersion: "Windows 10 / 11 (64-bit)",
    changelog: [
      "Catalogue complet des 21 cartes Valorant avec vues 2D",
      "Statistiques de performance avancées",
      "Overlay natif basse latence",
      "Synchronisation des profils et défis"
    ]
  });
}
