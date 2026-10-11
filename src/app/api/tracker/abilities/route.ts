import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET : Récupérer les statistiques de compétences par agent
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const agentName = searchParams.get('agent');
    const guestId = request.headers.get('x-guest-id');

    let userId = (session?.user as any)?.id;
    if (!userId && session?.user?.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      if (dbUser) userId = dbUser.id;
    }

    if (!userId && guestId) {
      userId = guestId;
    }

    const whereClause: any = {};
    if (userId) {
      whereClause.userId = userId;
    }
    if (agentName) {
      whereClause.agentName = { equals: agentName, mode: 'insensitive' };
    }

    const stats = await prisma.agentAbilityStat.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 300,
    });

    // Agréger par agent et par abilitySlot
    const aggregated: Record<string, Record<string, any>> = {};

    stats.forEach((s: any) => {
      const agKey = s.agentName.toLowerCase();
      if (!aggregated[agKey]) {
        aggregated[agKey] = {};
      }
      const slot = s.abilitySlot.toUpperCase();
      if (!aggregated[agKey][slot]) {
        aggregated[agKey][slot] = {
          slot,
          name: s.abilityName,
          totalCasts: 0,
          totalEnemiesFlashed: 0,
          totalTeammatesFlashed: 0,
          totalDamageDealt: 0,
          totalAssists: 0,
          totalKills: 0,
          matchCount: 0,
        };
      }

      const slotObj = aggregated[agKey][slot];
      slotObj.totalCasts += s.casts;
      slotObj.totalEnemiesFlashed += s.enemiesFlashed;
      slotObj.totalTeammatesFlashed += s.teammatesFlashed;
      slotObj.totalDamageDealt += s.damageDealt;
      slotObj.totalAssists += s.assistsWithAbility;
      slotObj.totalKills += s.killsWithAbility;
      slotObj.matchCount += 1;
    });

    return NextResponse.json({
      success: true,
      rawStats: stats,
      aggregated,
    });
  } catch (error) {
    console.error('Erreur récupération ability stats:', error);
    return NextResponse.json(
      { error: 'Erreur interne lors de la récupération des statistiques de compétences' },
      { status: 500 }
    );
  }
}

// POST : Enregistrer les statistiques de sorts/compétences d'un match
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const guestId = request.headers.get('x-guest-id') || body?.guestId;

    let userId = (session?.user as any)?.id;
    if (!userId && session?.user?.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      if (dbUser) userId = dbUser.id;
    }

    if (!userId && guestId) {
      userId = guestId;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { abilities } = body; // Array de { matchId, agentName, abilitySlot, abilityName, casts, ... }
    const list = Array.isArray(abilities) ? abilities : [body];

    const created = await Promise.all(
      list.map((ab: any) =>
        prisma.agentAbilityStat.create({
          data: {
            userId,
            matchId: ab.matchId || `match_${Date.now()}`,
            agentName: ab.agentName || 'Jett',
            abilitySlot: ab.abilitySlot || 'E',
            abilityName: ab.abilityName || 'Compétence',
            casts: typeof ab.casts === 'number' ? ab.casts : 0,
            enemiesFlashed: typeof ab.enemiesFlashed === 'number' ? ab.enemiesFlashed : 0,
            teammatesFlashed: typeof ab.teammatesFlashed === 'number' ? ab.teammatesFlashed : 0,
            damageDealt: typeof ab.damageDealt === 'number' ? ab.damageDealt : 0,
            assistsWithAbility: typeof ab.assistsWithAbility === 'number' ? ab.assistsWithAbility : 0,
            killsWithAbility: typeof ab.killsWithAbility === 'number' ? ab.killsWithAbility : 0,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      createdCount: created.length,
    });
  } catch (error) {
    console.error('Erreur enregistrement ability stats:', error);
    return NextResponse.json(
      { error: "Erreur interne lors de l'enregistrement des statistiques de compétences" },
      { status: 500 }
    );
  }
}
