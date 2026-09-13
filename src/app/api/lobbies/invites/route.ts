import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLobbyByIdFromNeon, updateLobbyInNeon } from "@/lib/lobbyDb";
import { LobbyMember, ChatMessage, getTierName } from "@/app/api/lobbies/route";
import { triggerPusherEvent } from "@/lib/pusherServer";

export const dynamic = "force-dynamic";

async function getAuthenticatedUser(request?: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    const user = await (prisma.user as any).findUnique({
      where: { email: session.user.email },
    });
    if (user) return user;
  }

  // Fallback guest user via header
  if (request) {
    const guestId = request.headers.get("x-guest-id");
    if (guestId) {
      const guest = await (prisma.user as any).findFirst({
        where: { id: guestId, email: { endsWith: "@temp.spycam.gg" } },
      });
      if (guest) return guest;
    }
  }

  return null;
}

// ==========================================
// GET /api/lobbies/invites : Récupère les invitations en attente
// ==========================================
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getAuthenticatedUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const myId = currentUser.id;
    const myRiot = (currentUser.riotGameName || "").trim();
    const myName = (currentUser.name || "").trim();

    const invites = await (prisma as any).lobbyInvite.findMany({
      where: {
        status: "pending",
        OR: [
          { targetUserId: myId },
          ...(myRiot
            ? [
                { targetRiotId: { equals: myRiot, mode: "insensitive" } },
                { targetRiotId: { startsWith: myRiot.split("#")[0], mode: "insensitive" } },
              ]
            : []),
          ...(myName
            ? [
                { targetRiotId: { equals: myName, mode: "insensitive" } },
                { targetRiotId: { startsWith: myName.split("#")[0], mode: "insensitive" } },
              ]
            : []),
        ],
      },
      include: {
        lobby: true,
        sender: {
          select: {
            id: true,
            name: true,
            riotGameName: true,
            avatarUrl: true,
            badge: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Nettoyer les invitations pour les salons qui n'existent plus ou sont pleins
    const validInvites = invites.map((inv: any) => {
      let members: any[] = [];
      try {
        members = typeof inv.lobby?.membersData === "string" ? JSON.parse(inv.lobby.membersData) : inv.lobby?.membersData || [];
      } catch {}

      return {
        id: inv.id,
        lobbyId: inv.lobbyId,
        senderId: inv.senderId,
        senderName: inv.senderName,
        senderTag: inv.senderTag,
        senderAvatar: inv.senderAvatar,
        targetRiotId: inv.targetRiotId,
        status: inv.status,
        createdAt: inv.createdAt,
        lobby: inv.lobby
          ? {
              id: inv.lobby.id,
              leaderName: inv.lobby.leaderName,
              leaderTag: inv.lobby.leaderTag,
              leaderRank: inv.lobby.leaderRank,
              leaderRankUrl: inv.lobby.leaderRankUrl,
              mode: inv.lobby.mode,
              region: inv.lobby.region,
              lobbyLevel: inv.lobby.lobbyLevel,
              currentSlots: members.length + 1,
              maxSlots: inv.lobby.maxSlots,
              note: inv.lobby.note,
            }
          : null,
      };
    });

    return NextResponse.json({ success: true, invites: validInvites });
  } catch (err: any) {
    console.error("[API Lobby Invites GET Error]:", err);
    return NextResponse.json({ error: "Erreur récupération invitations", details: err.message }, { status: 500 });
  }
}

// ==========================================
// POST /api/lobbies/invites : Actions (send, accept, decline)
// ==========================================
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getAuthenticatedUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action;

    // ----------------------------------------------------
    // ACTION 1 : ENVOYER UNE INVITATION DE SALON
    // ----------------------------------------------------
    if (action === "send") {
      const { lobbyId, targetRiotId, targetUserId } = body;

      if (!lobbyId || (!targetRiotId && !targetUserId)) {
        return NextResponse.json({ error: "Informations d'invitation manquantes." }, { status: 400 });
      }

      // Récupérer le salon
      const lobby = await getLobbyByIdFromNeon(lobbyId);
      if (!lobby) {
        return NextResponse.json({ error: "Salon introuvable ou expiré." }, { status: 404 });
      }

      // Vérifier que le salon n'est pas plein
      if (lobby.members.length >= lobby.maxSlots) {
        return NextResponse.json({ error: "Ce salon est déjà complet." }, { status: 400 });
      }

      // Vérifier le joueur cible
      let targetUser = null;
      if (targetUserId) {
        targetUser = await (prisma.user as any).findUnique({ where: { id: targetUserId } });
      }
      if (!targetUser && targetRiotId) {
        targetUser = await (prisma.user as any).findFirst({
          where: {
            OR: [
              { riotGameName: { equals: targetRiotId.trim(), mode: "insensitive" } },
              { name: { equals: targetRiotId.trim(), mode: "insensitive" } },
              { riotGameName: { startsWith: targetRiotId.trim().split("#")[0], mode: "insensitive" } },
            ],
          },
        });
      }

      // Règle Ne Pas Déranger (DND) : Si le joueur bloque les invitations de salon
      if (targetUser) {
        const isBlocked = targetUser.dndBlockLobbyInvites || (targetUser.dndEnabled && targetUser.dndBlockLobbyInvites);
        if (isBlocked) {
          return NextResponse.json(
            { error: "Ce joueur a activé le mode 'Ne pas déranger' et refuse les invitations de salon." },
            { status: 403 }
          );
        }
      }

      const cleanTargetRiot = (targetUser?.riotGameName || targetRiotId || "").trim();

      // Vérifier si le joueur est déjà dans le salon
      const isAlreadyInLobby =
        (lobby.leaderName.toLowerCase() === cleanTargetRiot.toLowerCase().split("#")[0] &&
         lobby.leaderTag.toLowerCase() === (cleanTargetRiot.split("#")[1] || "").toLowerCase()) ||
        lobby.members.some((m) => {
          const mRiot = `${m.gameName}#${m.tagLine}`.toLowerCase();
          return mRiot === cleanTargetRiot.toLowerCase() || m.gameName.toLowerCase() === cleanTargetRiot.split("#")[0].toLowerCase();
        });

      if (isAlreadyInLobby) {
        return NextResponse.json({ error: "Ce joueur fait déjà partie du salon." }, { status: 400 });
      }

      // Vérifier s'il y a déjà une invitation pending
      const existingInvite = await (prisma as any).lobbyInvite.findFirst({
        where: {
          lobbyId,
          status: "pending",
          OR: [
            ...(targetUser ? [{ targetUserId: targetUser.id }] : []),
            { targetRiotId: { equals: cleanTargetRiot, mode: "insensitive" } },
          ],
        },
      });

      if (existingInvite) {
        return NextResponse.json({ error: "Une invitation a déjà été envoyée à ce joueur." }, { status: 400 });
      }

      const senderName = currentUser.riotGameName
        ? currentUser.riotGameName.split("#")[0]
        : currentUser.name || "Joueur";
      const senderTag = currentUser.riotGameName && currentUser.riotGameName.includes("#")
        ? currentUser.riotGameName.split("#")[1]
        : "EUW";

      // Création de l'invitation en base
      const createdInvite = await (prisma as any).lobbyInvite.create({
        data: {
          lobbyId,
          senderId: currentUser.id,
          senderName,
          senderTag,
          senderAvatar: currentUser.avatarUrl || null,
          targetUserId: targetUser ? targetUser.id : null,
          targetRiotId: cleanTargetRiot,
          status: "pending",
        },
      });

      // Notification en temps réel via Pusher sur plusieurs canaux cibles
      const invitePayload = {
        id: createdInvite.id,
        lobbyId: lobby.id,
        senderName,
        senderTag,
        senderAvatar: currentUser.avatarUrl || null,
        targetRiotId: cleanTargetRiot,
        mode: lobby.mode,
        lobbyLevel: lobby.lobbyLevel,
        createdAt: createdInvite.createdAt,
      };

      if (targetUser?.id) {
        await triggerPusherEvent(`user-${targetUser.id}`, "lobby-invite", invitePayload);
      }
      if (cleanTargetRiot) {
        const cleanChannel = `user-riot-${cleanTargetRiot.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
        await triggerPusherEvent(cleanChannel, "lobby-invite", invitePayload);
        const nameOnly = cleanTargetRiot.split("#")[0].toLowerCase().replace(/[^a-z0-9]/g, "-");
        if (`user-riot-${nameOnly}` !== cleanChannel) {
          await triggerPusherEvent(`user-riot-${nameOnly}`, "lobby-invite", invitePayload);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Invitation envoyée à ${cleanTargetRiot} !`,
        invite: createdInvite,
      });
    }

    // ----------------------------------------------------
    // ACTION 2 : ACCEPTER UNE INVITATION DE SALON
    // ----------------------------------------------------
    if (action === "accept") {
      const { inviteId } = body;
      if (!inviteId) {
        return NextResponse.json({ error: "ID d'invitation manquant." }, { status: 400 });
      }

      const invite = await (prisma as any).lobbyInvite.findUnique({
        where: { id: inviteId },
        include: { lobby: true },
      });

      if (!invite || invite.status !== "pending") {
        return NextResponse.json({ error: "Invitation invalide ou déjà traitée." }, { status: 404 });
      }

      const lobby = await getLobbyByIdFromNeon(invite.lobbyId);
      if (!lobby) {
        await (prisma as any).lobbyInvite.update({
          where: { id: inviteId },
          data: { status: "expired" },
        });
        return NextResponse.json({ error: "Ce salon n'est plus actif." }, { status: 404 });
      }

      if (lobby.members.length >= lobby.maxSlots) {
        return NextResponse.json({ error: "Le salon est désormais complet." }, { status: 400 });
      }

      // Mettre à jour l'invitation en "accepted"
      await (prisma as any).lobbyInvite.update({
        where: { id: inviteId },
        data: { status: "accepted" },
      });

      // Intégrer l'utilisateur dans le salon
      const gName = currentUser.riotGameName
        ? currentUser.riotGameName.split("#")[0]
        : currentUser.name || "Joueur";
      const tLine = currentUser.riotGameName && currentUser.riotGameName.includes("#")
        ? currentUser.riotGameName.split("#")[1]
        : "EUW";

      const existingMember = lobby.members.find(
        (m: any) => m.gameName.toLowerCase() === gName.toLowerCase() && m.tagLine.toLowerCase() === tLine.toLowerCase()
      );

      if (!existingMember) {
        const newMember: LobbyMember = {
          id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          gameName: gName,
          tagLine: tLine,
          rank: "Non-classé",
          rankTier: 12,
          isPrivateRank: !currentUser.isPublic,
          roles: ["Tous Rôles"],
          isLeader: false,
          avatarUrl: currentUser.avatarUrl || null,
        };

        lobby.members.push(newMember);
        lobby.currentSlots = lobby.members.length;

        const avgTier = Math.round(
          lobby.members.reduce((acc: number, m: any) => acc + (m.rankTier ?? 12), 0) / lobby.members.length
        );
        lobby.lobbyLevelTier = avgTier;
        lobby.lobbyLevel = getTierName(avgTier);

        await updateLobbyInNeon(lobby.id, {
          members: lobby.members,
          lobbyLevel: lobby.lobbyLevel,
          lobbyLevelTier: avgTier,
        });

        const joinMsg: ChatMessage = {
          id: `msg_${Date.now()}`,
          senderName: "Système",
          senderTag: "SPYCAM",
          content: `${gName}#${tLine} a accepté l'invitation et rejoint le salon !`,
          timestamp: Date.now(),
        };
        lobby.chat.push(joinMsg);

        await triggerPusherEvent(`private-lobby-${lobby.id}`, "member-join", { member: newMember, lobby });
        await triggerPusherEvent(`lobby-${lobby.id}`, "member-join", { member: newMember, lobby });
      }

      return NextResponse.json({
        success: true,
        message: "Invitation acceptée ! Vous rejoignez le salon.",
        lobbyId: lobby.id,
        lobby,
      });
    }

    // ----------------------------------------------------
    // ACTION 3 : REFUSER UNE INVITATION DE SALON
    // ----------------------------------------------------
    if (action === "decline") {
      const { inviteId } = body;
      if (!inviteId) {
        return NextResponse.json({ error: "ID d'invitation manquant." }, { status: 400 });
      }

      await (prisma as any).lobbyInvite.update({
        where: { id: inviteId },
        data: { status: "declined" },
      });

      return NextResponse.json({ success: true, message: "Invitation refusée." });
    }

    return NextResponse.json({ error: "Action non reconnue." }, { status: 400 });
  } catch (err: any) {
    console.error("[API Lobby Invites POST Error]:", err);
    return NextResponse.json({ error: "Erreur traitement invitation", details: err.message }, { status: 500 });
  }
}
