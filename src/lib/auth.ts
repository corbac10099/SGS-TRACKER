import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const authOptions: NextAuthOptions = {
  providers: [
    // Email / Password & SGS SSO Handshake Token
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
        ssoToken: { label: 'SSO Token', type: 'text' },
      },
      async authorize(credentials) {
        // 1. Branche SGS SSO Token (Connexion 1-Clic depuis un compte SGS existant)
        if (credentials?.ssoToken && credentials?.email) {
          try {
            const secret = process.env.NEXTAUTH_SECRET || 'sgs-sso-secret-fallback';
            const [payloadStr, sig] = credentials.ssoToken.split('.');
            const expectedSig = crypto.createHmac('sha256', secret).update(payloadStr).digest('base64url');

            if (sig === expectedSig) {
              const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf-8'));
              if (Date.now() <= payload.exp && payload.email?.toLowerCase() === credentials.email.toLowerCase()) {
                const user = await prisma.user.findUnique({
                  where: { email: credentials.email.toLowerCase() },
                });
                if (user) {
                  return {
                    id: user.id,
                    email: user.email,
                    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || user.email.split('@')[0],
                  };
                }
              }
            }
          } catch (e) {
            console.error('[SSO AUTHORIZE ERROR]', e);
          }
          return null;
        }

        if (!credentials?.email || !credentials?.password) return null;

        // Riot Games reviewer demo account bypass & auto-creation
        if (credentials.email === 'spycam_riot_temp@gmail.com' && credentials.password === '8fb0518f-23af-4755-a994-ef21cd161b25') {
          const hashedPassword = await bcrypt.hash('8fb0518f-23af-4755-a994-ef21cd161b25', 10);
          const demoUser = await prisma.user.upsert({
            where: { email: 'spycam_riot_temp@gmail.com' },
            update: { onboardingDone: true, riotGameName: 'riot_test' },
            create: {
              email: 'spycam_riot_temp@gmail.com',
              password: hashedPassword,
              firstName: 'Riot',
              lastName: 'Reviewer',
              onboardingDone: true,
              theme: 'dark',
              language: 'fr',
              riotGameName: 'riot_test',
            },
          });
          return {
            id: demoUser.id,
            email: demoUser.email,
            name: 'Riot Reviewer',
          };
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        };
      },
    }),

    // Google OAuth
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],

  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  useSecureCookies: process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_URL?.includes('localhost'),

  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_URL?.includes('localhost')
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_URL?.includes('localhost'),
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_URL?.includes('localhost')
        ? '__Secure-next-auth.callback-url'
        : 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_URL?.includes('localhost'),
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_URL?.includes('localhost')
        ? '__Host-next-auth.csrf-token'
        : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_URL?.includes('localhost'),
      },
    },
    pkceCodeVerifier: {
      name: process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_URL?.includes('localhost')
        ? '__Secure-next-auth.pkce.code_verifier'
        : 'next-auth.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_URL?.includes('localhost'),
        maxAge: 900,
      },
    },
    state: {
      name: process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_URL?.includes('localhost')
        ? '__Secure-next-auth.state'
        : 'next-auth.state',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_URL?.includes('localhost'),
        maxAge: 900,
      },
    },
  },

  pages: {
    signIn: '/login',
  },

  callbacks: {
    async redirect({ url, baseUrl }) {
      // Autoriser les redirections relatives sans forcer baseUrl de production
      if (url.startsWith("/")) return url;
      try {
        const parsed = new URL(url);
        if (
          parsed.hostname === "localhost" ||
          parsed.hostname === "127.0.0.1" ||
          parsed.hostname.endsWith(".local") ||
          parsed.origin === baseUrl
        ) {
          return url;
        }
      } catch {}
      return "/";
    },

    async signIn({ user, account }) {
      // For OAuth providers, auto-create the user if they don't exist
      if (account?.provider === 'google' && user.email) {
        try {
          const email = user.email.toLowerCase().trim();
          const existingUser = await prisma.user.findUnique({
            where: { email },
          });

          if (!existingUser) {
            const nameParts = (user.name || '').split(' ');
            const newUser = await prisma.user.create({
              data: {
                email,
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                onboardingDone: true,
                googleConnected: true,
                googleEmail: email,
              },
            });

            // Link the OAuth account
            await prisma.account.create({
              data: {
                userId: newUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              },
            });
          } else {
            if (!existingUser.googleConnected) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: { googleConnected: true, googleEmail: email },
              });
            }

            // Check if this OAuth account is already linked
            const existingAccount = await prisma.account.findUnique({
              where: {
                provider_providerAccountId: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                },
              },
            });

            if (!existingAccount) {
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  refresh_token: account.refresh_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                },
              });
            }
          }
        } catch (e) {
          console.error('[NEXTAUTH GOOGLE SIGNIN ERROR]', e);
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      // Always fetch fresh user data
      if (token.email) {
        try {
          const email = token.email.toLowerCase().trim();
          const dbUser = await prisma.user.findUnique({
            where: { email },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.onboardingDone = dbUser.onboardingDone;
            token.theme = dbUser.theme;
            token.language = dbUser.language;
            token.firstName = dbUser.firstName;
            token.lastName = dbUser.lastName;
            token.riotConnected = dbUser.riotConnected;
            token.riotGameName = dbUser.riotGameName;
            token.riotPuuid = dbUser.riotPuuid;
            token.bannerUrl = dbUser.bannerUrl;
            token.bannerOffsetY = dbUser.bannerOffsetY;
            token.smartRating = dbUser.smartRating;
            token.isPublic = (dbUser as any).isPublic ?? true;
            token.videoLoop = (dbUser as any).videoLoop ?? true;
            token.videoLoopDelay = (dbUser as any).videoLoopDelay ?? 500;
            token.hiddenStats = (dbUser as any).hiddenStats ?? "[]";
            token.enforcePublicStats = (dbUser as any).enforcePublicStats ?? false;

            // Auto-set riotGameName for known users
            if (!dbUser.riotGameName) {
              const gameNameMap: Record<string, string> = {
                'laffont.romain64@gmail.com': 'Gr4phØ',
                'romain.lft64@gmail.com': 'SENPAII#6767',
              };
              const mappedName = gameNameMap[email];
              if (mappedName) {
                await prisma.user.update({ where: { id: dbUser.id }, data: { riotGameName: mappedName, riotConnected: true } });
                token.riotGameName = mappedName;
                token.riotConnected = true;
              }
            }
          }
        } catch (e) {
          console.error('[NEXTAUTH JWT ERROR]', e);
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).onboardingDone = token.onboardingDone;
        (session.user as any).theme = token.theme;
        (session.user as any).language = token.language;
        (session.user as any).firstName = token.firstName;
        (session.user as any).lastName = token.lastName;
        (session.user as any).riotConnected = token.riotConnected;
        (session.user as any).riotGameName = token.riotGameName;
        (session.user as any).riotPuuid = token.riotPuuid;
        (session.user as any).riotId = token.riotGameName;
        (session.user as any).bannerUrl = token.bannerUrl;
        (session.user as any).bannerOffsetY = token.bannerOffsetY;
        (session.user as any).smartRating = token.smartRating;
        (session.user as any).isPublic = token.isPublic ?? true;
        (session.user as any).videoLoop = token.videoLoop ?? true;
        (session.user as any).videoLoopDelay = token.videoLoopDelay ?? 500;
        (session.user as any).hiddenStats = token.hiddenStats ?? "[]";
        (session.user as any).enforcePublicStats = token.enforcePublicStats ?? false;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET || "sgs-spycam-nextauth-super-secret-key-32chars",
};
