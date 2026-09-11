/**
 * Utilitaire d'export de données pour SGS-Tracker
 * Permet d'exporter l'historique des matchs et statistiques en CSV formaté.
 */

export function exportMatchesToCSV(matches: any[], playerName: string = "Joueur"): void {
  if (!matches || matches.length === 0) {
    alert("Aucun match disponible à exporter.");
    return;
  }

  const headers = [
    "Date",
    "Heure",
    "Carte",
    "Mode",
    "Agent",
    "Résultat",
    "Score",
    "Éliminations (K)",
    "Morts (D)",
    "Passes décisives (A)",
    "Ratio K/D",
    "ACS",
    "Headshot %",
    "KAST %",
    "Dégâts Delta (DD)"
  ];

  const rows = matches.map((m) => {
    const d = m.date ? new Date(m.date) : new Date();
    const dateStr = !isNaN(d.getTime())
      ? d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
      : "N/A";
    const timeStr = !isNaN(d.getTime())
      ? d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
      : "N/A";

    const deaths = m.deaths || 0;
    const kills = m.kills || 0;
    const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toString();
    const result = m.won ? "Victoire" : "Défaite";
    const score = m.score ? `"${m.score}"` : "N/A";

    return [
      dateStr,
      timeStr,
      `"${m.map || "Inconnue"}"`,
      `"${m.mode || "Compétitif"}"`,
      `"${m.agent || "Agent"}"`,
      result,
      score,
      kills,
      deaths,
      m.assists || 0,
      kd,
      m.acs || 0,
      m.headshotPct ? `${m.headshotPct}%` : "N/A",
      m.kast ? `${m.kast}%` : "N/A",
      m.ddDelta || 0
    ].join(";");
  });

  // BOM UTF-8 pour ouverture correcte dans Excel
  const csvContent = "\uFEFF" + headers.join(";") + "\n" + rows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const cleanName = playerName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const nowStr = new Date().toISOString().split("T")[0];

  link.setAttribute("href", url);
  link.setAttribute("download", `SGS_Tracker_${cleanName}_Matchs_${nowStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
