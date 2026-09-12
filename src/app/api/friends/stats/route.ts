import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateDeterministicProfile } from "@/lib/valorant/mock";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const currentUser = await (prisma.user as any).findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const myId = currentUser.id;
    const myRiot = currentUser.riotGameName ? currentUser.riotGameName.toLowerCase() : "";

    // Trouver tous les amis acceptés
    const friendships = await (prisma as any).friendship.findMany({
      where: {
        status: "accepted",
        OR: [
          { userId: myId },
          { friendId: myId },
          ...(myRiot ? [{ targetRiotId: { equals: currentUser.riotGameName, mode: "insensitive" } }] : []),
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            riotGameName: true,
            avatarUrl: true,
            badge: true,
            isPublic: true,
            theme: true,
          },
        },
        friend: {
          select: {
            id: true,
            name: true,
            riotGameName: true,
            avatarUrl: true,
            badge: true,
            isPublic: true,
            theme: true,
          },
        },
      },
    });

    const friendStatsList: any[] = [];
    const seenFriends = new Set<string>();

    for (const f of friendships) {
      const isSender = f.userId === myId;
      const otherUser = isSender ? f.friend : f.user;
      const otherRiot = otherUser?.riotGameName || f.targetRiotId;
      const friendKey = otherUser?.id || otherRiot;

      if (!friendKey || seenFriends.has(friendKey)) continue;
      seenFriends.add(friendKey);

      // Vérifier si cet ami nous autorise à voir ses stats
      // Si nous sommes le demandeur (isSender), la permission de l'autre est stockée dans la relation miroir f.userId !== myId
      // ou dans f.canViewStats si reciprocal
      const friendAllowedMe = isSender ? (f.friend ? true : true) : f.canViewStats;

      if (!otherRiot) continue;

      const [gName, tLine] = otherRiot.includes("#") ? otherRiot.split("#") : [otherRiot, "0001"];

      try {
        const profile = generateDeterministicProfile(gName, tLine || "EU1", "eu");
        const s = profile.player.stats;

        friendStatsList.push({
          friendId: otherUser?.id || null,
          name: otherUser?.name || gName,
          riotId: `${gName}#${tLine || "0001"}`,
          avatarUrl: otherUser?.avatarUrl || profile.player.cardSmall || profile.player.cardUrl,
          badge: otherUser?.badge || null,
          rank: profile.player.rank,
          rankUrl: profile.player.rankUrl,
          isPublic: otherUser?.isPublic ?? true,
          canViewStats: friendAllowedMe,
          stats: {
            kills: s.kills ?? 0,
            deaths: s.deaths ?? 0,
            assists: s.assists ?? 0,
            kd: parseFloat(Number(s.kdRatio ?? 0).toFixed(2)),
            adr: Math.round(s.adr ?? 0),
            hs: Math.round(s.headshotPct ?? 0),
            wr: Math.round(s.winRate ?? 0),
            acs: Math.round(s.acs ?? 0),
            clutches: s.clutches ?? 0,
            aces: s.aces ?? 0,
            firstBloods: s.firstBloods ?? 0,
          },
        });
      } catch (e) {
        console.warn("[Friends Stats Resolver Warning]:", e);
      }
    }

    return NextResponse.json({
      friendsStats: friendStatsList,
    });
  } catch (err: any) {
    console.error("[API Friends Stats Error]:", err);
    return NextResponse.json({ error: "Erreur récupération stats amis", details: err.message }, { status: 500 });
  }
}
