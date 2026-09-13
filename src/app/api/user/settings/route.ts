import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const guestId = req.headers.get("x-guest-id") || body?.guestId;

    let userId = (session?.user as any)?.id;

    if (!userId && guestId) {
      // Vérifier que c'est bien un compte invité temporaire
      const guestUser = await prisma.user.findFirst({
        where: {
          id: guestId,
          email: { endsWith: "@temp.spycam.gg" },
        },
      });
      if (guestUser) {
        userId = guestUser.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const {
      theme,
      bannerUrl,
      bannerOffsetY,
      smartRating,
      isPublic,
      videoLoop,
      videoLoopDelay,
      hiddenStats,
      enforcePublicStats,
      language,
      dashboardGrid,
      voiceSettings,
      dndEnabled,
      dndBlockLobbyInvites,
      notificationPreferences,
    } = body;
    const updateData: any = {};

    if (theme !== undefined) updateData.theme = theme;
    if (bannerUrl !== undefined) updateData.bannerUrl = bannerUrl;
    if (bannerOffsetY !== undefined) updateData.bannerOffsetY = bannerOffsetY;
    if (smartRating !== undefined) updateData.smartRating = smartRating;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (videoLoop !== undefined) updateData.videoLoop = videoLoop;
    if (videoLoopDelay !== undefined) updateData.videoLoopDelay = videoLoopDelay;
    if (hiddenStats !== undefined) updateData.hiddenStats = hiddenStats;
    if (enforcePublicStats !== undefined) updateData.enforcePublicStats = enforcePublicStats;
    if (language !== undefined) updateData.language = language;
    if (dndEnabled !== undefined) updateData.dndEnabled = Boolean(dndEnabled);
    if (dndBlockLobbyInvites !== undefined) updateData.dndBlockLobbyInvites = Boolean(dndBlockLobbyInvites);
    if (notificationPreferences !== undefined) {
      updateData.notificationPreferences = typeof notificationPreferences === 'string'
        ? notificationPreferences
        : JSON.stringify(notificationPreferences);
    }
    if (dashboardGrid !== undefined) {
      updateData.dashboardGrid = typeof dashboardGrid === 'string' ? dashboardGrid : JSON.stringify(dashboardGrid);
    }
    if (voiceSettings !== undefined) {
      updateData.voiceSettings = typeof voiceSettings === 'string' ? voiceSettings : JSON.stringify(voiceSettings);
    }

    // S'il n'y a rien à mettre à jour
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: true });
    }

    // Mettre à jour l'utilisateur en base de données
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Erreur API user/settings:', error);
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde des paramètres' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const guestId = req.headers.get("x-guest-id") || searchParams.get("guestId");

    let userId = (session?.user as any)?.id;

    if (!userId && guestId) {
      const guestUser = await prisma.user.findFirst({
        where: {
          id: guestId,
          email: { endsWith: "@temp.spycam.gg" },
        },
      });
      if (guestUser) {
        userId = guestUser.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        riotGameName: true,
        theme: true,
        bannerUrl: true,
        bannerOffsetY: true,
        smartRating: true,
        isPublic: true,
        videoLoop: true,
        videoLoopDelay: true,
        hiddenStats: true,
        enforcePublicStats: true,
        language: true,
        dndEnabled: true,
        dndBlockLobbyInvites: true,
        notificationPreferences: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Erreur API user/settings GET:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des paramètres' }, { status: 500 });
  }
}

