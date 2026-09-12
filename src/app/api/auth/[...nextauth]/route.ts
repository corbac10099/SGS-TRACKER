import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';

const defaultNextAuthUrl = process.env.NEXTAUTH_URL;

async function authHandler(req: NextRequest, ctx: any) {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https');
  const currentOrigin = `${proto}://${host}`;

  // Ajuster dynamiquement l'URL de base pour NextAuth en local
  if (host.includes('localhost') || host.includes('127.0.0.1') || host.endsWith('.local')) {
    process.env.NEXTAUTH_URL = currentOrigin;
  } else if (defaultNextAuthUrl) {
    process.env.NEXTAUTH_URL = defaultNextAuthUrl;
  }

  // @ts-ignore
  return NextAuth(req, ctx, authOptions);
}

export { authHandler as GET, authHandler as POST };

