/**
 * Utilitaire de redirection sécurisée après authentification.
 * Empêche formellement toute boucle de redirection infinie vers /login ou /register,
 * qu'il s'agisse d'URLs relatives ou absolues (avec domaine et protocole).
 */
export function sanitizeRedirectTarget(targetUrl?: string | null): string {
  if (!targetUrl || typeof targetUrl !== "string") return "/";

  const trimmed = targetUrl.trim();
  if (!trimmed) return "/";

  try {
    // Si URL absolue (ex: http://localhost:3000/login ou https://mon-domaine.com/login?callbackUrl=...)
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const parsed = new URL(trimmed);
      const p = parsed.pathname.toLowerCase();
      if (p === "/login" || p.startsWith("/login/") || p === "/register" || p.startsWith("/register/")) {
        return "/";
      }
      return parsed.pathname + parsed.search;
    }

    // Si URL relative
    const lower = trimmed.toLowerCase();
    if (lower === "/login" || lower.startsWith("/login?") || lower.startsWith("/login/") ||
        lower === "/register" || lower.startsWith("/register?") || lower.startsWith("/register/")) {
      return "/";
    }

    // Doit commencer par '/'
    if (!trimmed.startsWith("/")) {
      return "/";
    }

    return trimmed;
  } catch {
    return "/";
  }
}
