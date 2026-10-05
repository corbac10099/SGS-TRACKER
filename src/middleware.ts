import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get("host") || "";
  const pathname = url.pathname;

  // Réécrire la requête /overlay.html vers la route dédiée /overlay
  if (pathname === "/overlay.html") {
    url.pathname = "/overlay";
    return NextResponse.rewrite(url);
  }

  // Ignorer les fichiers statiques et les routes API internes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Rediriger la route legacy /sgs vers le site officiel SGS
  if (pathname === "/sgs") {
    const sgsUrl = process.env.NEXT_PUBLIC_SGS_URL || "https://sgs-brown.vercel.app";
    return NextResponse.redirect(new URL(sgsUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
