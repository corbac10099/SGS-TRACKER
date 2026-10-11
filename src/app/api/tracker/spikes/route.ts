import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET : Récupérer les événements de pose de spike pour l'utilisateur
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const mapName = searchParams.get('map');
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
    if (mapName) {
      whereClause.mapName = { equals: mapName, mode: 'insensitive' };
    }

    const spikeEvents = await prisma.matchSpikeEvent.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json({
      success: true,
      spikes: spikeEvents,
    });
  } catch (error) {
    console.error('Erreur récupération spike events:', error);
    return NextResponse.json(
      { error: 'Erreur interne lors de la récupération des poses de spike' },
      { status: 500 }
    );
  }
}

// POST : Enregistrer une ou plusieurs poses de spike récupérées en direct ou après-match
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

    const { events } = body; // Array ou objet unique
    const list = Array.isArray(events) ? events : [body];

    const created = await Promise.all(
      list.map((evt: any) =>
        prisma.matchSpikeEvent.create({
          data: {
            userId,
            matchId: evt.matchId || `match_${Date.now()}`,
            mapName: evt.mapName || 'Ascent',
            site: evt.site || 'A',
            plantType: evt.plantType || 'default',
            x: typeof evt.x === 'number' ? evt.x : 0.5,
            y: typeof evt.y === 'number' ? evt.y : 0.5,
            roundNumber: typeof evt.roundNumber === 'number' ? evt.roundNumber : 1,
            roundWon: evt.roundWon !== false,
            defused: evt.defused === true,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      createdCount: created.length,
    });
  } catch (error) {
    console.error('Erreur enregistrement spike event:', error);
    return NextResponse.json(
      { error: "Erreur interne lors de l'enregistrement du spike" },
      { status: 500 }
    );
  }
}
