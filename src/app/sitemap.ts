import { MetadataRoute } from 'next';

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://spycam-tan.vercel.app').replace(/\/$/, '');

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/download', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/leaderboard', priority: 0.8, changeFrequency: 'daily' as const },
    { path: '/salons', priority: 0.7, changeFrequency: 'daily' as const },
    { path: '/cgu', priority: 0.4, changeFrequency: 'monthly' as const },
    { path: '/confidentialite', priority: 0.4, changeFrequency: 'monthly' as const },
    { path: '/mentions-legales', priority: 0.4, changeFrequency: 'monthly' as const },
  ];

  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: new Date(),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
