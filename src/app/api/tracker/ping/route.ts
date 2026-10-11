import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET : Récupérer l'historique et l'analyse groupée par tranche de ping
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
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

    const whereClause: any = userId ? { userId } : {};

    const records = await prisma.matchPingMetric.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Agrégation par tranches de ping : <20ms, 20-35ms, 35-50ms, 50-70ms, >70ms
    const brackets = [
      { key: 'under_20', label: '< 20 ms', count: 0, wins: 0, totalKd: 0 },
      { key: '20_35', label: '20 - 35 ms', count: 0, wins: 0, totalKd: 0 },
      { key: '35_50', label: '35 - 50 ms', count: 0, wins: 0, totalKd: 0 },
      { key: '50_70', label: '50 - 70 ms', count: 0, wins: 0, totalKd: 0 },
      { key: 'over_70', label: '> 70 ms', count: 0, wins: 0, totalKd: 0 },
    ];

    records.forEach((r: any) => {
      let b = brackets[4];
      if (r.avgPingMs < 20) b = brackets[0];
      else if (r.avgPingMs < 35) b = brackets[1];
      else if (r.avgPingMs < 50) b = brackets[2];
      else if (r.avgPingMs < 70) b = brackets[3];

      b.count += 1;
      if (r.matchWon) b.wins += 1;
      b.totalKd += r.kdRatio;
    });

    const analysis = brackets.map((b) => ({
      bracket: b.label,
      key: b.key,
      matchesCount: b.count,
      winRate: b.count > 0 ? Math.round((b.wins / b.count) * 100) : 0,
      avgKd: b.count > 0 ? parseFloat((b.totalKd / b.count).toFixed(2)) : 0,
    }));

    return NextResponse.json({
      success: true,
      records,
      analysis,
    });
  } catch (error) {
    console.error('Erreur récupération ping metrics:', error);
    return NextResponse.json(
      { error: 'Erreur interne lors de la récupération des métriques de ping' },
      { status: 500 }
    );
  }
}

// POST : Enregistrer les métriques de ping d'un match
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

    const { matchId, avgPingMs, maxPingMs, packetLoss, matchWon, kdRatio, serverRegion } = body;

    const record = await prisma.matchPingMetric.create({
      data: {
        userId,
        matchId: matchId || `match_${Date.now()}`,
        avgPingMs: typeof avgPingMs === 'number' ? avgPingMs : 25,
        maxPingMs: typeof maxPingMs === 'number' ? maxPingMs : avgPingMs || 30,
        packetLoss: typeof packetLoss === 'number' ? packetLoss : 0,
        matchWon: matchWon === true,
        kdRatio: typeof kdRatio === 'number' ? kdRatio : 1.0,
        serverRegion: serverRegion || 'Paris',
      },
    });

    return NextResponse.json({
      success: true,
      record,
    });
  } catch (error) {
    console.error('Erreur enregistrement ping metric:', error);
    return NextResponse.json(
      { error: "Erreur interne lors de l'enregistrement de la métrique de ping" },
      { status: 500 }
    );
  }
}
