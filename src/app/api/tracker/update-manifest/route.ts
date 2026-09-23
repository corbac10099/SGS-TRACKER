import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

/**
 * Endpoint de distribution des manifests de mise à jour pour SGS-Tracker Desktop (En Ligne).
 * Appelé automatiquement par tauri-plugin-updater lors de la vérification de mise à jour.
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const currentVersion = searchParams.get("current_version") || "1.0.0";
    const target = searchParams.get("target") || "windows-x86_64";

    // Chemin du fichier manifest de mise à jour officiel stocké dans public/updates/
    const manifestPath = path.join(process.cwd(), "public", "updates", "latest-online.json");

    if (fs.existsSync(manifestPath)) {
      const content = fs.readFileSync(manifestPath, "utf-8");
      const data = JSON.parse(content);

      // Si la version courante est déjà la plus récente, retourner 204 (Aucune mise à jour requise)
      if (data.version === currentVersion) {
        return new NextResponse(null, { status: 204 });
      }

      return NextResponse.json(data, {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }

    // Si aucun fichier manifest n'est encore publié, l'application est considérée à jour
    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    console.error("[Updater Manifest Error]", err);
    return new NextResponse(null, { status: 204 });
  }
}
