import { MetadataRoute } from 'next';
import seoConfig from '@/data/seo_config.json';

const rawEnvUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
const SITE_URL = (
  rawEnvUrl && !rawEnvUrl.includes("127.0.0.1") && !rawEnvUrl.includes("localhost")
    ? rawEnvUrl
    : (seoConfig?.canonicalUrl || "https://spycam-tan.vercel.app")
).replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  const disallowList = (seoConfig?.robots?.disallowPaths && seoConfig.robots.disallowPaths.length > 0)
    ? seoConfig.robots.disallowPaths
    : ['/api/admin', '/api/cron'];
  const allowAll = seoConfig?.robots?.allowAll ?? true;
  const aiBotsAllowed = seoConfig?.robots?.aiBotsAllowed ?? true;

  const rules: MetadataRoute.Robots['rules'] = [
    {
      userAgent: '*',
      ...(allowAll ? { allow: '/' } : {}),
      disallow: disallowList,
    },
  ];

  if (aiBotsAllowed) {
    rules.push({
      userAgent: [
        'GPTBot',
        'ChatGPT-User',
        'ClaudeBot',
        'Claude-Web',
        'PerplexityBot',
        'Google-Extended',
        'Applebot-Extended',
      ],
      allow: '/',
      disallow: disallowList,
    });
  } else {
    rules.push({
      userAgent: [
        'GPTBot',
        'ChatGPT-User',
        'ClaudeBot',
        'Claude-Web',
        'PerplexityBot',
        'Google-Extended',
        'Applebot-Extended',
      ],
      disallow: ['/'],
    });
  }

  return {
    rules,
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
