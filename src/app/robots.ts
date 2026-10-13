import { MetadataRoute } from 'next';

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://spycam-tan.vercel.app').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/admin', '/api/cron'],
      },
      {
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
        disallow: ['/api/admin', '/api/cron'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
