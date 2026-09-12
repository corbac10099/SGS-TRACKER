import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateDeterministicProfile } from '@/lib/valorant/mock';

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('riot_access_token')?.value;

  if (!accessToken) {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
        });
        const riotId = user?.riotGameName || (session.user as any).riotGameName || (session.user as any).name || "SENPAII#6767";
        const parts = riotId.split("#");
        const profile = generateDeterministicProfile(parts[0]?.trim() || "Joueur", parts[1]?.trim() || "EU1");
        return NextResponse.json(profile);
      } catch (e) {
        return NextResponse.json(generateDeterministicProfile("Joueur", "EU1"));
      }
    }
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  try {
    // Avec un RSO valide, on interroge l'endpoint "/me" pour avoir les infos de l'utilisateur connecté
    const accountResponse = await fetch('https://americas.api.riotgames.com/riot/account/v1/accounts/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!accountResponse.ok) {
      // Si le token est expiré
      return NextResponse.json({ error: 'Session expirée ou invalide' }, { status: 401 });
    }

    const accountData = await accountResponse.json();

    // Comme l'API officielle requiert le RSO mais ne renvoie pas nativement le niveau 
    // et le rang dans le endpoint /me sans droits spécifiques, on les simule pour l'UI,
    // mais au moins le gameName et le tagLine proviendront du VRAI compte connecté !
    
    return NextResponse.json({
      player: {
        gameName: accountData.gameName || accountData.puuid.substring(0, 8),
        tagLine: accountData.tagLine || 'RIOT',
        puuid: accountData.puuid,
        level: 142, // Valeur simulée pour l'interface
        rank: "Diamant 2", // Valeur simulée pour l'interface
        cardUrl: "https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/displayicon.png",
        cardWideUrl: "https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/wideart.png",
        rankUrl: "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/19/largeicon.png",
        stats: {
          kills: 1245,
          deaths: 1080,
          assists: 432,
          kdRatio: 0.95,
          headshotPct: 24.5,
          winRate: 54.2,
          matchesPlayed: 85,
          acs: 235,
          aceCount: 4,
          kast: 71.9,
          kastPercentile: "Top 35,0%",
          ddDelta: 12.4
        }
      }
    });

  } catch (error) {
    console.error("Erreur API auth/me:", error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
