import { trFormat } from "@/lib/i18n";

/**
 * Génère des avertissements Smart Rating basés sur les seuils de performance.
 * Retourne un objet clé → message pour chaque métrique en dessous du seuil.
 */
export function getWarnings(stats: any): Record<string, string> {
  if (!stats) return {};
  const w: Record<string, string> = {};
  if (stats.kdRatio < 1)
    w.kd = trFormat(
      "K/D de {kd} — en dessous de 1.0. Vous mourez plus que vous ne tuez. Travaillez le positionnement.",
      { kd: stats.kdRatio }
    );
  if (stats.headshotPct < 20)
    w.hs = trFormat(
      "Headshot à {hs}% — sous la moyenne de 20%. Travaillez le crosshair placement.",
      { hs: stats.headshotPct }
    );
  if (stats.winRate < 50)
    w.wr = trFormat(
      "Win rate de {wr}% — sous 50%. Adaptez vos stratégies et communiquez.",
      { wr: stats.winRate }
    );
  if (stats.acs < 200)
    w.acs = trFormat(
      "ACS de {acs} — sous 200. Participez davantage aux rounds.",
      { acs: stats.acs }
    );
  if (stats.kast < 65)
    w.kast = trFormat(
      "KAST de {kast}% — sous 65%. Impliquez-vous plus (Kill/Assist/Survived/Trade).",
      { kast: stats.kast }
    );
  if (stats.ddDelta < 0)
    w.dd = trFormat(
      "DDΔ négatif ({dd}) — vous subissez plus de dégâts que vous n'en infligez.",
      { dd: stats.ddDelta }
    );
  return w;
}
