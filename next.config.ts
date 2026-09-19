import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  async rewrites() {
    // Routes réservées (ne PAS intercepter)
    // api, login, register, onboarding, _next, favicon
    
    // Onglets principaux (propre profil) — URL en français
    const mainTabs = ['home', 'actualites', 'agents', 'parametres'];
    // Sous-onglets du home
    const homeSubs = ['historique', 'agents-stats', 'performance'];
    // Sous-onglets des paramètres
    const settingsSubs = ['features', 'privacy', 'appearance', 'about', 'language'];

    return [
      // /home, /actualites, /agents, /parametres → racine
      ...mainTabs.map(tab => ({
        source: `/${tab}`,
        destination: '/',
      })),
      // /home/historique, /home/agents-stats, /home/performance → racine
      ...homeSubs.map(sub => ({
        source: `/home/${sub}`,
        destination: '/',
      })),
      // /parametres/privacy, /parametres/appearance, etc. → racine
      ...settingsSubs.map(sub => ({
        source: `/parametres/${sub}`,
        destination: '/',
      })),
      // /agents/:agentSlug → racine (ex: /agents/jett)
      {
        source: '/agents/:slug',
        destination: '/',
      },
      // === Routes avec Riot ID (autre joueur) ===
      // /:riotId/home, /:riotId/actualites, etc. → racine
      ...mainTabs.map(tab => ({
        source: `/:riotId/${tab}`,
        destination: '/',
      })),
      // /:riotId/home/historique, etc. → racine
      ...homeSubs.map(sub => ({
        source: `/:riotId/home/${sub}`,
        destination: '/',
      })),
      // /:riotId/agents/:slug → racine
      {
        source: '/:riotId/agents/:slug',
        destination: '/',
      },
      // /:riotId seul (sans tab) → racine, si pas réservé
      {
        source: '/:riotId((?!api|auth|login|register|onboarding|_next|favicon).*)',
        destination: '/',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },
  turbopack: {
    resolveAlias:
      process.env.NODE_ENV === "production"
        ? {
            "@/components/LocalDevStatsPanel": "./src/components/EmptyDevPanel.tsx",
          }
        : {},
  },
  webpack(config, { dev }) {
    if (!dev) {
      // En production : exclut totalement le panel admin en le substituant par un composant vide (0 octet)
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        "@/components/LocalDevStatsPanel": path.resolve(
          process.cwd(),
          "src/components/EmptyDevPanel.tsx"
        ),
      };
    }
    return config;
  },
};

export default nextConfig;
