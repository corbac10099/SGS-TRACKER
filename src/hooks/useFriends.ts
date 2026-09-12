"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

export interface FriendItem {
  friendId: string | null;
  name: string;
  riotId: string;
  avatarUrl: string | null;
  badge: string | null;
  isPublic: boolean;
  theme: string | null;
  canViewStats: boolean;
  theyAllowMe: boolean;
  friendshipId: string;
  since: string;
}

export interface FriendRequestItem {
  friendshipId: string;
  requesterId?: string;
  targetId?: string;
  name: string;
  riotId: string;
  avatarUrl: string | null;
  badge?: string | null;
  receivedAt?: string;
  sentAt?: string;
}

export interface BlockedUserItem {
  friendshipId: string;
  targetId: string;
  name: string;
  riotId: string;
  avatarUrl: string | null;
  blockedAt: string;
}

export interface FriendComparisonStatItem {
  friendId: string | null;
  name: string;
  riotId: string;
  avatarUrl: string | null;
  badge: string | null;
  rank: string;
  rankUrl: string;
  isPublic: boolean;
  canViewStats: boolean;
  stats: {
    kills: number;
    deaths: number;
    assists: number;
    kd: number;
    adr: number;
    hs: number;
    wr: number;
    acs: number;
    clutches: number;
    aces: number;
    firstBloods: number;
  };
}

export function useFriends() {
  const { data: session } = useSession();
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [incoming, setIncoming] = useState<FriendRequestItem[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequestItem[]>([]);
  const [blocked, setBlocked] = useState<BlockedUserItem[]>([]);
  const [friendsStats, setFriendsStats] = useState<FriendComparisonStatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/friends", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
        setIncoming(data.incoming || []);
        setOutgoing(data.outgoing || []);
        setBlocked(data.blocked || []);
      }
    } catch (err: any) {
      console.warn("[useFriends] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  const fetchFriendsStats = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch("/api/friends/stats", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setFriendsStats(data.friendsStats || []);
      }
    } catch (err) {
      console.warn("[useFriendsStats] fetch error:", err);
    }
  }, [session?.user]);

  useEffect(() => {
    if (session?.user) {
      fetchFriends();
      fetchFriendsStats();
    } else {
      setFriends([]);
      setIncoming([]);
      setOutgoing([]);
      setBlocked([]);
      setFriendsStats([]);
    }
  }, [session?.user, fetchFriends, fetchFriendsStats]);

  const sendRequest = useCallback(async (riotId: string) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", riotId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi de la demande");
      }
      await fetchFriends();
      return { success: true, message: data.message };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [fetchFriends]);

  const acceptRequest = useCallback(async (friendshipId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", friendshipId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchFriends();
      await fetchFriendsStats();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [fetchFriends, fetchFriendsStats]);

  const declineRequest = useCallback(async (friendshipId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline", friendshipId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchFriends();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [fetchFriends]);

  const blockUser = useCallback(async (opts: { friendshipId?: string; targetUserId?: string; targetRiotId?: string }) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "block", ...opts }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchFriends();
      await fetchFriendsStats();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [fetchFriends, fetchFriendsStats]);

  const unblockUser = useCallback(async (friendshipId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unblock", friendshipId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchFriends();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [fetchFriends]);

  const removeFriend = useCallback(async (friendId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", friendId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchFriends();
      await fetchFriendsStats();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [fetchFriends, fetchFriendsStats]);

  const updatePermission = useCallback(async (friendId: string, canViewStats: boolean) => {
    // Optimistic update
    setFriends((prev) =>
      prev.map((f) => (f.friendId === friendId ? { ...f, canViewStats } : f))
    );

    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_permission", friendId, canViewStats }),
      });
      const data = await res.json();
      if (!res.ok) {
        await fetchFriends();
        throw new Error(data.error);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [fetchFriends]);

  return {
    friends,
    incoming,
    outgoing,
    blocked,
    friendsStats,
    loading,
    actionLoading,
    error,
    pendingIncomingCount: incoming.length,
    fetchFriends,
    fetchFriendsStats,
    sendRequest,
    acceptRequest,
    declineRequest,
    blockUser,
    unblockUser,
    removeFriend,
    updatePermission,
  };
}
