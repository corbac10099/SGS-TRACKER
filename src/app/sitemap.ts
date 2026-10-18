import { MetadataRoute } from 'next';
import { BASE_AGENTS_CATALOG } from '@/lib/valorant/agentsCatalog';
import seoConfig from '@/data/seo_config.json';

type ChangeFrequency = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

const rawEnvUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
const SITE_URL = (
  rawEnvUrl && !rawEnvUrl.includes("127.0.0.1") && !rawEnvUrl.includes("localhost")
    ? rawEnvUrl
    : (seoConfig?.canonicalUrl || "https://spycam-tan.vercel.app")
).replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const configuredPages = seoConfig?.sitemap?.pages || [
    { path: '', priority: 1.0, changeFrequency: 'daily' },
    { path: '/download', priority: 0.95, changeFrequency: 'weekly' },
    { path: '/leaderboard', priority: 0.9, changeFrequency: 'daily' },
    { path: '/salons', priority: 0.85, changeFrequency: 'daily' },
    { path: '/actualites', priority: 0.85, changeFrequency: 'daily' },
    { path: '/agents', priority: 0.85, changeFrequency: 'weekly' },
    { path: '/login', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/register', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/onboarding', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/cgu', priority: 0.3, changeFrequency: 'monthly' },
    { path: '/confidentialite', priority: 0.3, changeFrequency: 'monthly' },
    { path: '/mentions-legales', priority: 0.3, changeFrequency: 'monthly' },
  ];

  const staticRoutes = configuredPages.map((page: { path: string; priority?: number; changeFrequency?: string }) => {
    let p = page.path.trim();
    if (p && !p.startsWith('/')) {
      p = `/${p}`;
    }
    return {
      path: p,
      priority: typeof page.priority === 'number' ? page.priority : 0.7,
      changeFrequency: (page.changeFrequency || 'weekly') as ChangeFrequency,
    };
  });

  const includeDynamicAgents = seoConfig?.sitemap?.includeDynamicAgents ?? true;
  const agentRoutes = includeDynamicAgents
    ? Object.keys(BASE_AGENTS_CATALOG).map((agentKey) => ({
        path: `/agents/${agentKey.toLowerCase()}`,
        priority: 0.8,
        changeFrequency: 'weekly' as ChangeFrequency,
      }))
    : [];

  const allRoutes = [...staticRoutes, ...agentRoutes];

  return allRoutes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: new Date(),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
