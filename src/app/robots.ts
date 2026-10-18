import { MetadataRoute } from 'next';

const CANONICAL_URL = "https://spycam-tan.vercel.app";
const rawEnvUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
const SITE_URL = (
  rawEnvUrl && !rawEnvUrl.includes("127.0.0.1") && !rawEnvUrl.includes("localhost")
    ? rawEnvUrl
    : CANONICAL_URL
).replace(/\/$/, "");

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
