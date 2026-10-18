import { MetadataRoute } from 'next';
import { BASE_AGENTS_CATALOG } from '@/lib/valorant/agentsCatalog';

// Domaine canonique de production : évite les IPs locales ou URLs de staging
const CANONICAL_URL = "https://spycam-tan.vercel.app";
const rawEnvUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
const SITE_URL = (
  rawEnvUrl && !rawEnvUrl.includes("127.0.0.1") && !rawEnvUrl.includes("localhost")
    ? rawEnvUrl
    : CANONICAL_URL
).replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  // Routes statiques principales
  const staticRoutes = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/download', priority: 0.95, changeFrequency: 'weekly' as const },
    { path: '/leaderboard', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/salons', priority: 0.85, changeFrequency: 'daily' as const },
    { path: '/actualites', priority: 0.85, changeFrequency: 'daily' as const },
    { path: '/agents', priority: 0.85, changeFrequency: 'weekly' as const },
    { path: '/login', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/register', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/onboarding', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/cgu', priority: 0.3, changeFrequency: 'monthly' as const },
    { path: '/confidentialite', priority: 0.3, changeFrequency: 'monthly' as const },
    { path: '/mentions-legales', priority: 0.3, changeFrequency: 'monthly' as const },
  ];

  // Pages dédiées à chaque agent Valorant (/agents/[nom])
  const agentRoutes = Object.keys(BASE_AGENTS_CATALOG).map((agentKey) => ({
    path: `/agents/${agentKey.toLowerCase()}`,
    priority: 0.8,
    changeFrequency: 'weekly' as const,
  }));

  const allRoutes = [...staticRoutes, ...agentRoutes];

  return allRoutes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: new Date(),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
