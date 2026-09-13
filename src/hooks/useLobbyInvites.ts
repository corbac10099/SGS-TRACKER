"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { sounds } from "@/lib/soundEffects";
import { getPusherClient } from "@/lib/pusherClient";
import { sendLocalNotification } from "@/lib/pushNotifications";

export interface LobbyInviteItem {
  id: string;
  lobbyId: string;
  senderId: string;
  senderName: string;
  senderTag: string;
  senderAvatar: string | null;
  targetRiotId: string;
  status: string;
  createdAt: string;
  lobby: {
    id: string;
    leaderName: string;
    leaderTag: string;
    leaderRank: string;
    leaderRankUrl?: string;
    mode: string;
    region: string;
    lobbyLevel: string;
    currentSlots: number;
    maxSlots: number;
    note?: string;
  } | null;
}

export function useLobbyInvites(onJoinedLobby?: (lobbyId: string, lobby: any) => void) {
  const { data: session } = useSession();
  const [invites, setInvites] = useState<LobbyInviteItem[]>([]);
  const [activeBannerInvite, setActiveBannerInvite] = useState<LobbyInviteItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const myUser = session?.user as any;
  const myId = myUser?.id;
  const myRiot = myUser?.riotGameName || "";

  // Récupérer les invitations
  const fetchInvites = useCallback(async () => {
    if (!myId && !myRiot) return;
    try {
      const res = await fetch("/api/lobbies/invites", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const list: LobbyInviteItem[] = data.invites || [];
        setInvites(list);
        // Si nouvelle invitation reçue récemment, l'afficher en banner si pas déjà active
        if (list.length > 0) {
          const latest = list[0];
          setActiveBannerInvite((prev) => {
            if (!prev || prev.id !== latest.id) return latest;
            return prev;
          });
        }
      }
    } catch (err) {
      console.warn("[useLobbyInvites] fetch error:", err);
    }
  }, [myId, myRiot]);

  // Écoute Pusher en temps réel
  useEffect(() => {
    if (!myId && !myRiot) return;

    fetchInvites();

    const pusher = getPusherClient();
    if (!pusher) return;

    const channels: string[] = [];

    const handleNewInvite = (data: any) => {
      sounds.playLockIn();

      const inviteItem: LobbyInviteItem = {
        id: data.id,
        lobbyId: data.lobbyId,
        senderId: data.senderId || "",
        senderName: data.senderName,
        senderTag: data.senderTag,
        senderAvatar: data.senderAvatar || null,
        targetRiotId: data.targetRiotId,
        status: "pending",
        createdAt: data.createdAt || new Date().toISOString(),
        lobby: {
          id: data.lobbyId,
          leaderName: data.senderName,
          leaderTag: data.senderTag,
          leaderRank: data.lobbyLevel || "Compétitif",
          mode: data.mode || "Compétitif",
          region: "EU / Paris",
          lobbyLevel: data.lobbyLevel || "Compétitif",
          currentSlots: 1,
          maxSlots: 5,
        },
      };

      setInvites((prev) => [inviteItem, ...prev.filter((i) => i.id !== inviteItem.id)]);
      setActiveBannerInvite(inviteItem);

      // Notification Web Push native navigateur
      sendLocalNotification(
        "🎮 Invitation de Salon Valorant",
        `${data.senderName}#${data.senderTag} vous invite à rejoindre son salon (${data.mode || "Compétitif"}) !`
      );
    };

    if (myId) {
      const userChan = pusher.subscribe(`user-${myId}`);
      userChan.bind("lobby-invite", handleNewInvite);
      channels.push(`user-${myId}`);
    }

    if (myRiot) {
      const cleanRiot = myRiot.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const riotChan = pusher.subscribe(`user-riot-${cleanRiot}`);
      riotChan.bind("lobby-invite", handleNewInvite);
      channels.push(`user-riot-${cleanRiot}`);
    }

    // Polling régulier de secours toutes les 10 secondes
    const interval = setInterval(fetchInvites, 10000);

    return () => {
      clearInterval(interval);
      channels.forEach((c) => {
        try {
          pusher.unsubscribe(c);
        } catch {}
      });
    };
  }, [myId, myRiot, fetchInvites]);

  // Envoyer une invitation
  const sendInvite = useCallback(
    async (lobbyId: string, targetRiotId: string, targetUserId?: string) => {
      setActionLoading(true);
      try {
        const res = await fetch("/api/lobbies/invites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "send", lobbyId, targetRiotId, targetUserId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur lors de l'envoi de l'invitation");
        return { success: true, message: data.message };
      } catch (err: any) {
        return { success: false, error: err.message };
      } finally {
        setActionLoading(false);
      }
    },
    []
  );

  // Accepter une invitation
  const acceptInvite = useCallback(
    async (inviteId: string) => {
      setActionLoading(true);
      try {
        sounds.playClick();
        const res = await fetch("/api/lobbies/invites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "accept", inviteId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur lors de l'acceptation");

        setInvites((prev) => prev.filter((i) => i.id !== inviteId));
        setActiveBannerInvite(null);

        if (onJoinedLobby && data.lobbyId) {
          onJoinedLobby(data.lobbyId, data.lobby);
        }

        return { success: true, lobbyId: data.lobbyId, lobby: data.lobby };
      } catch (err: any) {
        return { success: false, error: err.message };
      } finally {
        setActionLoading(false);
      }
    },
    [onJoinedLobby]
  );

  // Refuser une invitation
  const declineInvite = useCallback(async (inviteId: string) => {
    setActionLoading(true);
    try {
      sounds.playCancel();
      const res = await fetch("/api/lobbies/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline", inviteId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors du refus");

      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      setActiveBannerInvite((prev) => (prev?.id === inviteId ? null : prev));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, []);

  return {
    invites,
    activeBannerInvite,
    setActiveBannerInvite,
    sendInvite,
    acceptInvite,
    declineInvite,
    fetchInvites,
    loading,
    actionLoading,
  };
}
