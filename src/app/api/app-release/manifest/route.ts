import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const appControlReleasePath = path.resolve(process.cwd(), "../AppControl/data/app_release.json");
    const localReleasePath = path.resolve(process.cwd(), "public/data/app_release.json");
    const targetPath = fs.existsSync(appControlReleasePath) ? appControlReleasePath : localReleasePath;

    let releaseData: any = {
      version: "1.0.0",
      changelog: "Version initiale",
      downloadUrl: "/installers/SGS-Tracker-Setup.exe",
      releaseDate: new Date().toISOString(),
    };

    if (fs.existsSync(targetPath)) {
      try {
        releaseData = JSON.parse(fs.readFileSync(targetPath, "utf-8"));
      } catch {}
    }

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const manifest = {
      version: releaseData.version || "1.0.0",
      notes: releaseData.changelog || "Mises à jour et améliorations des performances",
      pub_date: releaseData.releaseDate || new Date().toISOString(),
      platforms: {
        "windows-x86_64": {
          signature: "",
          url: releaseData.downloadUrl?.startsWith("http")
            ? releaseData.downloadUrl
            : `${baseUrl}/installers/SGS-Tracker-Setup.exe`,
        },
      },
    };

    const res = NextResponse.json(manifest);
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    return res;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
