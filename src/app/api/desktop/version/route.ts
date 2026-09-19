import { NextResponse } from "next/server";

export async function GET() {
  // URL canonique de production — ne pas utiliser process.env.NEXT_PUBLIC_APP_URL
  // qui peut résoudre en localhost en développement
  const currentAppUrl = "https://spycam-tan.vercel.app";

  return NextResponse.json({
    latestVersion: "1.0.0",
    clientType: "desktop",
    releaseDate: "2026-09-19",
    features: [
      "Application de bureau native Windows (Tauri v2)",
      "Optimisation mémoire (~30 Mo RAM avec WebView2)",
      "Support PWA et mode hors-ligne intelligent",
      "Chargement modulaire dynamique des composants",
    ],
    serverUrl: currentAppUrl,
    downloadUrl: `${currentAppUrl.replace(/\/$/, "")}/installers/SGS-Tracker-Setup.exe`,
  });
}
