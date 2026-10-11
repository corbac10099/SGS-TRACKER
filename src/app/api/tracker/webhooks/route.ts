import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { webhookUrl, eventType, matchData } = body;

    if (!webhookUrl || typeof webhookUrl !== 'string') {
      return NextResponse.json({ error: 'Webhook URL invalide ou manquante' }, { status: 400 });
    }

    // Préparation de l'embed Discord
    const discordPayload = {
      username: "SGS Tracker Match Bot",
      avatar_url: "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/27/largeicon.png",
      embeds: [
        {
          title: `🎯 Rapport de Match SGS : ${matchData?.mapName || 'Partie Valorant'} (${matchData?.result === 'VICTOIRE' ? '🏆 VICTOIRE' : '💔 DÉFAITE'})`,
          color: matchData?.result === 'VICTOIRE' ? 0x10b981 : 0xef4444,
          fields: [
            {
              name: "Agent Joué",
              value: matchData?.agentName || "Non spécifié",
              inline: true
            },
            {
              name: "Score Round",
              value: `${matchData?.roundsWon ?? 13} - ${matchData?.roundsLost ?? 10}`,
              inline: true
            },
            {
              name: "K / D / A",
              value: `${matchData?.kills ?? 22} / ${matchData?.deaths ?? 12} / ${matchData?.assists ?? 5}`,
              inline: true
            },
            {
              name: "Ping Moyen",
              value: `${matchData?.avgPingMs ?? 24} ms`,
              inline: true
            },
            {
              name: "Tirs à la tête (%HS)",
              value: `${matchData?.headshotPct ?? 32}%`,
              inline: true
            },
            {
              name: "Impact Spike",
              value: `${matchData?.spikesPlanted ?? 3} posés (${matchData?.spikeWins ?? 3} convertis)`,
              inline: true
            }
          ],
          footer: {
            text: "SGS Tracker & Aim Ecosystem • Synchronisation Neon DB",
            icon_url: "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/27/largeicon.png"
          },
          timestamp: new Date().toISOString()
        }
      ]
    };

    // Envoi réel vers le Webhook Discord
    const discordRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload)
    });

    if (!discordRes.ok) {
      return NextResponse.json({
        error: `Erreur webhook Discord (${discordRes.status})`,
        status: discordRes.status
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Match exporté et diffusé avec succès sur le webhook Discord !'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erreur interne' }, { status: 500 });
  }
}
