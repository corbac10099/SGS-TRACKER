import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET ou POST : Supprime automatiquement les données expirées sur Neon DB
export async function GET(request: Request) {
  return handleRetentionCleanup(request);
}

export async function POST(request: Request) {
  return handleRetentionCleanup(request);
}

async function handleRetentionCleanup(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Si un secret est configuré en prod, vérifier le Bearer token
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Autoriser quand même les requêtes locales (127.0.0.1 ou localhost)
      const host = request.headers.get('host') || '';
      if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
      }
    }

    const now = new Date();
    let totalSpikesDeleted = 0;
    let totalPingsDeleted = 0;
    let totalAbilitiesDeleted = 0;

    // 1. Récupérer tous les utilisateurs enregistrés sur Neon
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        dataRetentionDays: true,
        dataRetentionPolicy: true,
      },
    });

    for (const user of allUsers) {
      // Si "forever" (ou >= 9000 jours), aucune suppression
      if (user.dataRetentionPolicy === 'forever' || (user.dataRetentionDays && user.dataRetentionDays >= 9000)) {
        continue;
      }

      // Par défaut 90 jours si non spécifié, sinon le choix de l'utilisateur
      const days = user.dataRetentionDays && user.dataRetentionDays > 0 ? user.dataRetentionDays : 90;
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      // Suppression automatique des spikes expirés pour cet utilisateur
      const spikesRes = await prisma.matchSpikeEvent.deleteMany({
        where: {
          userId: user.id,
          createdAt: { lt: cutoffDate },
        },
      });
      totalSpikesDeleted += spikesRes.count;

      // Suppression automatique des métriques de ping expirées
      const pingsRes = await prisma.matchPingMetric.deleteMany({
        where: {
          userId: user.id,
          createdAt: { lt: cutoffDate },
        },
      });
      totalPingsDeleted += pingsRes.count;

      // Suppression automatique des statistiques de spells expirées
      const abilitiesRes = await prisma.agentAbilityStat.deleteMany({
        where: {
          userId: user.id,
          createdAt: { lt: cutoffDate },
        },
      });
      totalAbilitiesDeleted += abilitiesRes.count;
    }

    return NextResponse.json({
      success: true,
      cleanedAt: now.toISOString(),
      usersProcessed: allUsers.length,
      deleted: {
        spikes: totalSpikesDeleted,
        pings: totalPingsDeleted,
        abilities: totalAbilitiesDeleted,
        total: totalSpikesDeleted + totalPingsDeleted + totalAbilitiesDeleted,
      },
      message: `Nettoyage automatique Neon exécuté avec succès (${totalSpikesDeleted + totalPingsDeleted + totalAbilitiesDeleted} enregistrements supprimés).`,
    });
  } catch (error: any) {
    console.error('Erreur lors du nettoyage de rétention Neon:', error);
    return NextResponse.json({ error: error?.message || 'Erreur interne' }, { status: 500 });
  }
}
