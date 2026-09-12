import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return await (prisma.user as any).findUnique({
    where: { email: session.user.email },
  });
}

// ==========================================
// GET /api/friends : Récupère la liste des amis et demandes
// ==========================================
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const myId = currentUser.id;
    const myRiot = currentUser.riotGameName ? currentUser.riotGameName.toLowerCase() : "";

    // Récupérer toutes les relations concernant l'utilisateur connecté
    const friendships = await (prisma as any).friendship.findMany({
      where: {
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
      orderBy: { updatedAt: "desc" },
    });

    const acceptedFriendsMap = new Map<string, any>();
    const incomingRequests: any[] = [];
    const outgoingRequests: any[] = [];
    const blockedUsers: any[] = [];

    for (const f of friendships) {
      const isSender = f.userId === myId;
      const otherUser = isSender ? f.friend : f.user;
      const otherId = isSender ? (f.friendId || f.targetRiotId) : f.userId;

      if (f.status === "blocked") {
        if (isSender) {
          blockedUsers.push({
            friendshipId: f.id,
            targetId: otherId,
            name: otherUser?.name || otherUser?.riotGameName || f.targetRiotId || "Joueur bloqué",
            riotId: otherUser?.riotGameName || f.targetRiotId || "",
            avatarUrl: otherUser?.avatarUrl || null,
            blockedAt: f.updatedAt,
          });
        }
        continue;
      }

      if (f.status === "pending") {
        if (isSender) {
          outgoingRequests.push({
            friendshipId: f.id,
            targetId: otherId,
            name: otherUser?.name || otherUser?.riotGameName || f.targetRiotId || "En attente",
            riotId: otherUser?.riotGameName || f.targetRiotId || "",
            avatarUrl: otherUser?.avatarUrl || null,
            sentAt: f.createdAt,
          });
        } else {
          incomingRequests.push({
            friendshipId: f.id,
            requesterId: f.userId,
            name: f.user?.name || f.user?.riotGameName || "Joueur SGS",
            riotId: f.user?.riotGameName || "",
            avatarUrl: f.user?.avatarUrl || null,
            badge: f.user?.badge || null,
            receivedAt: f.createdAt,
          });
        }
        continue;
      }

      if (f.status === "accepted") {
        const friendKey = otherUser?.id || otherId;
        if (!friendKey) continue;

        if (!acceptedFriendsMap.has(friendKey)) {
          acceptedFriendsMap.set(friendKey, {
            friendId: otherUser?.id || null,
            name: otherUser?.name || otherUser?.riotGameName || f.targetRiotId || "Ami SGS",
            riotId: otherUser?.riotGameName || f.targetRiotId || "",
            avatarUrl: otherUser?.avatarUrl || null,
            badge: otherUser?.badge || null,
            isPublic: otherUser?.isPublic ?? true,
            theme: otherUser?.theme || null,
            canViewStats: isSender ? f.canViewStats : true,
            theyAllowMe: isSender ? true : f.canViewStats,
            friendshipId: f.id,
            since: f.createdAt,
          });
        } else {
          const existing = acceptedFriendsMap.get(friendKey);
          if (isSender) {
            existing.canViewStats = f.canViewStats;
          } else {
            existing.theyAllowMe = f.canViewStats;
          }
        }
      }
    }

    return NextResponse.json({
      friends: Array.from(acceptedFriendsMap.values()),
      incoming: incomingRequests,
      outgoing: outgoingRequests,
      blocked: blockedUsers,
      totalFriends: acceptedFriendsMap.size,
      pendingIncomingCount: incomingRequests.length,
    });
  } catch (err: any) {
    console.error("[API Friends GET Error]:", err);
    return NextResponse.json({ error: "Erreur récupération amis", details: err.message }, { status: 500 });
  }
}

// ==========================================
// POST /api/friends : Actions sur les amis
// ==========================================
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action;

    // ----------------------------------------------------
    // 1. Envoyer une demande d'ami par Riot ID (Name#Tag)
    // ----------------------------------------------------
    if (action === "send") {
      const rawRiotId = (body.riotId || "").trim();
      if (!rawRiotId || !rawRiotId.includes("#")) {
        return NextResponse.json(
          { error: "Veuillez renseigner un Riot ID valide sous la forme Nom#TAG (ex: Gr4phØ#0001)." },
          { status: 400 }
        );
      }

      // Interdire d'envoyer une demande à soi-même
      if (
        currentUser.riotGameName &&
        currentUser.riotGameName.toLowerCase() === rawRiotId.toLowerCase()
      ) {
        return NextResponse.json(
          { error: "Vous ne pouvez pas vous ajouter vous-même en ami." },
          { status: 400 }
        );
      }

      // Chercher si le joueur possède déjà un compte enregistré sur SGS Tracker
      const targetUser = await (prisma.user as any).findFirst({
        where: {
          riotGameName: { equals: rawRiotId, mode: "insensitive" },
        },
      });

      const targetUserId = targetUser ? targetUser.id : null;

      // Vérifier les doublons de relations existantes
      const existing = await (prisma as any).friendship.findFirst({
        where: {
          OR: [
            {
              userId: currentUser.id,
              OR: [
                ...(targetUserId ? [{ friendId: targetUserId }] : []),
                { targetRiotId: { equals: rawRiotId, mode: "insensitive" } },
              ],
            },
            ...(targetUserId
              ? [
                  {
                    userId: targetUserId,
                    friendId: currentUser.id,
                  },
                ]
              : []),
          ],
        },
      });

      if (existing) {
        if (existing.status === "accepted") {
          return NextResponse.json({ error: "Vous êtes déjà amis avec ce joueur." }, { status: 400 });
        }
        if (existing.status === "pending") {
          // Si c'est l'autre qui nous a déjà invité, acceptons directement la demande !
          if (existing.userId !== currentUser.id) {
            await (prisma as any).friendship.update({
              where: { id: existing.id },
              data: { status: "accepted", friendId: currentUser.id },
            });
            return NextResponse.json({
              success: true,
              message: "Demande acceptée mutuellement ! Vous êtes désormais amis.",
            });
          }
          return NextResponse.json({ error: "Une demande d'ami est déjà en attente pour ce joueur." }, { status: 400 });
        }
        if (existing.status === "blocked") {
          return NextResponse.json({ error: "Action impossible pour cet utilisateur." }, { status: 403 });
        }
      }

      // Créer la nouvelle demande d'ami
      const created = await (prisma as any).friendship.create({
        data: {
          userId: currentUser.id,
          friendId: targetUserId,
          targetRiotId: rawRiotId,
          status: "pending",
          canViewStats: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Demande d'ami envoyée à ${rawRiotId} !`,
        friendshipId: created.id,
      });
    }

    // ----------------------------------------------------
    // 2. Accepter une demande d'ami
    // ----------------------------------------------------
    if (action === "accept") {
      const friendshipId = body.friendshipId;
      if (!friendshipId) {
        return NextResponse.json({ error: "ID de demande requis." }, { status: 400 });
      }

      const reqToAccept = await (prisma as any).friendship.findUnique({
        where: { id: friendshipId },
      });

      if (!reqToAccept) {
        return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
      }

      // Vérifier que la demande m'est bien destinée
      const isTarget =
        reqToAccept.friendId === currentUser.id ||
        (currentUser.riotGameName &&
          reqToAccept.targetRiotId?.toLowerCase() === currentUser.riotGameName.toLowerCase());

      if (!isTarget) {
        return NextResponse.json({ error: "Vous n'êtes pas le destinataire de cette demande." }, { status: 403 });
      }

      // Mettre à jour la relation en accepted
      await (prisma as any).friendship.update({
        where: { id: friendshipId },
        data: { status: "accepted", friendId: currentUser.id },
      });

      // Créer ou assurer la relation miroir réciproque pour permettre à l'utilisateur courant de régler son propre canViewStats
      const reciprocal = await (prisma as any).friendship.findFirst({
        where: {
          userId: currentUser.id,
          friendId: reqToAccept.userId,
        },
      });

      if (!reciprocal) {
        const requester = await (prisma.user as any).findUnique({ where: { id: reqToAccept.userId } });
        await (prisma as any).friendship.create({
          data: {
            userId: currentUser.id,
            friendId: reqToAccept.userId,
            targetRiotId: requester?.riotGameName || null,
            status: "accepted",
            canViewStats: true,
          },
        });
      } else {
        await (prisma as any).friendship.update({
          where: { id: reciprocal.id },
          data: { status: "accepted" },
        });
      }

      return NextResponse.json({ success: true, message: "Demande d'ami acceptée !" });
    }

    // ----------------------------------------------------
    // 3. Refuser une demande d'ami
    // ----------------------------------------------------
    if (action === "decline") {
      const friendshipId = body.friendshipId;
      if (!friendshipId) {
        return NextResponse.json({ error: "ID de demande requis." }, { status: 400 });
      }

      await (prisma as any).friendship.deleteMany({
        where: {
          id: friendshipId,
          OR: [
            { friendId: currentUser.id },
            ...(currentUser.riotGameName
              ? [{ targetRiotId: { equals: currentUser.riotGameName, mode: "insensitive" } }]
              : []),
          ],
        },
      });

      return NextResponse.json({ success: true, message: "Demande d'ami refusée." });
    }

    // ----------------------------------------------------
    // 4. Bloquer un utilisateur
    // ----------------------------------------------------
    if (action === "block") {
      const friendshipId = body.friendshipId;
      const targetUserId = body.targetUserId;
      const targetRiotId = (body.targetRiotId || "").trim();

      if (friendshipId) {
        const f = await (prisma as any).friendship.findUnique({ where: { id: friendshipId } });
        if (f) {
          const otherId = f.userId === currentUser.id ? f.friendId : f.userId;
          const otherRiot = f.userId === currentUser.id ? f.targetRiotId : null;
          // Supprimer les relations existantes
          await (prisma as any).friendship.deleteMany({
            where: {
              OR: [
                { userId: currentUser.id, friendId: otherId },
                { userId: otherId, friendId: currentUser.id },
              ],
            },
          });
          // Créer un blocage
          await (prisma as any).friendship.create({
            data: {
              userId: currentUser.id,
              friendId: otherId || null,
              targetRiotId: otherRiot,
              status: "blocked",
              canViewStats: false,
            },
          });
          return NextResponse.json({ success: true, message: "Utilisateur bloqué." });
        }
      }

      if (targetUserId || targetRiotId) {
        await (prisma as any).friendship.create({
          data: {
            userId: currentUser.id,
            friendId: targetUserId || null,
            targetRiotId: targetRiotId || null,
            status: "blocked",
            canViewStats: false,
          },
        });
        return NextResponse.json({ success: true, message: "Utilisateur bloqué." });
      }

      return NextResponse.json({ error: "Informations insuffisantes pour bloquer." }, { status: 400 });
    }

    // ----------------------------------------------------
    // 5. Débloquer un utilisateur
    // ----------------------------------------------------
    if (action === "unblock") {
      const friendshipId = body.friendshipId;
      if (!friendshipId) {
        return NextResponse.json({ error: "ID de relation requis." }, { status: 400 });
      }

      await (prisma as any).friendship.deleteMany({
        where: {
          id: friendshipId,
          userId: currentUser.id,
          status: "blocked",
        },
      });

      return NextResponse.json({ success: true, message: "Utilisateur débloqué." });
    }

    // ----------------------------------------------------
    // 6. Supprimer un ami
    // ----------------------------------------------------
    if (action === "remove") {
      const friendId = body.friendId;
      if (!friendId) {
        return NextResponse.json({ error: "ID d'ami requis." }, { status: 400 });
      }

      await (prisma as any).friendship.deleteMany({
        where: {
          OR: [
            { userId: currentUser.id, friendId },
            { userId: friendId, friendId: currentUser.id },
          ],
        },
      });

      return NextResponse.json({ success: true, message: "Ami retiré de votre liste." });
    }

    // ----------------------------------------------------
    // 7. Mettre à jour la permission canViewStats
    // ----------------------------------------------------
    if (action === "update_permission") {
      const friendId = body.friendId;
      const canViewStats = body.canViewStats === true;

      if (!friendId) {
        return NextResponse.json({ error: "ID d'ami requis." }, { status: 400 });
      }

      await (prisma as any).friendship.updateMany({
        where: {
          userId: currentUser.id,
          friendId: friendId,
          status: "accepted",
        },
        data: {
          canViewStats,
        },
      });

      return NextResponse.json({
        success: true,
        canViewStats,
        message: canViewStats
          ? "Cet ami est autorisé à voir vos statistiques privées."
          : "Cet ami n'a plus accès à vos statistiques privées.",
      });
    }

    return NextResponse.json({ error: "Action non reconnue." }, { status: 400 });
  } catch (err: any) {
    console.error("[API Friends POST Error]:", err);
    return NextResponse.json({ error: "Erreur action amis", details: err.message }, { status: 500 });
  }
}
