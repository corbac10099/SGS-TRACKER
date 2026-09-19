import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SGS-Tracker — Valorant Performance Tracker",
    short_name: "SGS-Tracker",
    description: "Suivez vos performances, statistiques et progression Valorant avec SGS-Tracker.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0e13",
    theme_color: "#ff4655",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/spycam-icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/spycam-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/spycam-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["games", "utilities", "entertainment"],
    shortcuts: [
      {
        name: "Historique des Matchs",
        url: "/home/historique",
        description: "Accéder directement à l'historique des parties",
      },
      {
        name: "Wiki des Agents",
        url: "/agents",
        description: "Explorer les compétences et statistiques des agents",
      },
      {
        name: "Classement",
        url: "/leaderboard",
        description: "Voir le classement mondial Valorant",
      },
    ],
  };
}
