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

    // 1. Chercher un manifest Tauri officiel
    const targetFile = target.includes("local") ? "latest-local.json" : "latest-online.json";
    const manifestPath = path.join(process.cwd(), "public", "updates", targetFile);

    if (fs.existsSync(manifestPath)) {
      const content = fs.readFileSync(manifestPath, "utf-8");
      const data = JSON.parse(content);

      if (data.version === currentVersion) {
        return new NextResponse(null, { status: 204 });
      }

      return NextResponse.json(data, {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }

    // 2. Fallback dynamique vers public/data/app_release.json
    const releasePath = path.join(process.cwd(), "public", "data", "app_release.json");
    if (fs.existsSync(releasePath)) {
      const relContent = fs.readFileSync(releasePath, "utf-8");
      const release = JSON.parse(relContent);

      if (release.version && release.version !== currentVersion && release.isPublished !== false) {
        const downloadUrl = release.r2DownloadUrl || release.r2Url || release.downloadUrl || "/installers/SGS-Tracker-Setup.exe";
        const changelogNotes = Array.isArray(release.changelog)
          ? release.changelog.join("\n• ")
          : (release.changelog || release.notes || "Mise à jour disponible");

        return NextResponse.json({
          version: release.version,
          notes: changelogNotes,
          pub_date: release.releaseDate ? `${release.releaseDate}T00:00:00Z` : new Date().toISOString(),
          downloadUrl: downloadUrl,
          platforms: {
            "windows-x86_64": {
              url: downloadUrl,
            }
          }
        }, {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        });
      }
    }

    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    console.error("[Updater Manifest Error]", err);
    return new NextResponse(null, { status: 204 });
  }
}
