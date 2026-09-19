"use client";

import { useState, useEffect, useRef } from "react";
import { sounds } from "@/lib/soundEffects";
import type { LobbyInviteItem } from "@/hooks/useLobbyInvites";
import { getPlayerAvatar } from "@/components/LobbiesView";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "news" | "perf" | "system" | "tip";
  read: boolean;
  actionView?: string;
  newsId?: string;
}

export interface NotificationsDropdownProps {
  onNavigateToNews?: (newsId?: string) => void;
  onNavigateToAgents?: () => void;
  playerStats?: any;
  compact?: boolean;
  lobbyInvites?: LobbyInviteItem[];
  onAcceptInvite?: (inviteId: string) => void;
  onDeclineInvite?: (inviteId: string) => void;
  actionLoading?: boolean;
}

export default function NotificationsDropdown({
  onNavigateToNews,
  onNavigateToAgents,
  playerStats,
  compact = false,
  lobbyInvites = [],
  onAcceptInvite,
  onDeclineInvite,
  actionLoading = false,
}: NotificationsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  
  // Safe initial read from localStorage
  const [readIds, setReadIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("spycam_read_notifications");
        return stored ? JSON.parse(stored) : [];
      } catch {}
    }
    return [];
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch news and build initial notification list with stable IDs
  useEffect(() => {
    const items: NotificationItem[] = [
      {
        id: "sys-charts",
        title: "Nouveauté : Graphiques Lissés",
        message: "Les courbes de progression K/D, ACS et Headshot % sont désormais fluides et interactives !",
        time: "Récemment",
        type: "system",
        read: false,
      },
      {
        id: "tip-shortcut",
        title: "Astuce Navigation",
        message: "Utilisez le raccourci Ctrl + K pour rechercher un joueur ou naviguer instantanément.",
        time: "Astuce",
        type: "tip",
        read: false,
      },
      {
        id: "sys-badges",
        title: "Badges & Rangs Débloqués",
        message: "Consultez vos badges Riot exclusifs directement sur votre profil utilisateur !",
        time: "Système",
        type: "system",
        read: false,
      },
    ];

    // Add player stats alert with stable ID
    if (playerStats) {
      if (playerStats.kdRatio >= 1.2) {
        items.unshift({
          id: "perf-kd-high",
          title: "Excellente performance K/D !",
          message: `Votre ratio K/D moyen est de ${playerStats.kdRatio.toFixed(2)}. Continuez sur cette lancée !`,
          time: "Statut",
          type: "perf",
          read: false,
        });
      } else if (playerStats.kdRatio < 1.0) {
        items.unshift({
          id: "perf-kd-low",
          title: "Axe d'amélioration : Positionnement",
          message: "Votre K/D est sous 1.0. Consultez le Smart Rating pour ajuster vos prises de duels.",
          time: "Conseil",
          type: "perf",
          read: false,
        });
      }
    }

    // Try fetching recent Valorant news to add to notifications
    fetch("/api/translate-news")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.news)) {
          const topNews = data.news.slice(0, 3).map((n: any) => ({
            id: `news-${n.id || n.title}`,
            title: n.title,
            message: n.description || "Découvrez les dernières nouveautés et notes de patch officielles.",
            time: n.date ? new Date(n.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "Récemment",
            type: "news" as const,
            read: false,
            actionView: "news",
            newsId: n.id,
          }));
          items.unshift(...topNews);
        }
        setNotifications(items);
      })
      .catch(() => {
        setNotifications(items);
      });
  }, [playerStats]);

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length + (lobbyInvites?.length || 0);

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds((prev) => {
      const merged = Array.from(new Set([...prev, ...allIds]));
      try {
        localStorage.setItem("spycam_read_notifications", JSON.stringify(merged));
      } catch {}
      return merged;
    });
  };

  const markAsRead = (id: string) => {
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const merged = [...prev, id];
      try {
        localStorage.setItem("spycam_read_notifications", JSON.stringify(merged));
      } catch {}
      return merged;
    });
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = (n: NotificationItem) => {
    markAsRead(n.id);
    if (n.actionView === "news" && onNavigateToNews) {
      onNavigateToNews(n.newsId);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        className={
          compact
            ? `relative flex items-center justify-center p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.07] transition-all cursor-pointer select-none active:scale-95 ${
                isOpen ? "text-white bg-white/[0.1]" : ""
              }`
            : `w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 border relative cursor-pointer ${
                isOpen
                  ? "bg-[var(--color-val-red)] border-[var(--color-val-red)] text-white shadow-[0_0_15px_rgba(255,70,85,0.4)]"
                  : "bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border-[var(--color-border)] text-[var(--color-text-primary)] hover:text-[var(--color-val-red)]"
              }`
        }
      >
        <svg xmlns="http://www.w3.org/2000/svg" width={compact ? 15 : 18} height={compact ? 15 : 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className={`absolute ${compact ? "-top-0.5 -right-0.5 min-w-[14px] h-[14px] text-[8px]" : "-top-1 -right-1 min-w-[18px] h-[18px] text-[10px]"} px-0.5 rounded-full bg-[var(--color-val-red)] text-white font-black flex items-center justify-center shadow-[0_0_8px_rgba(255,70,85,0.8)] border border-[#0a0e13] animate-pulse`}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 max-h-[520px] bg-[#0c1218]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_25px_rgba(255,70,85,0.08)] z-50 flex flex-col overflow-hidden animate-dropdown-spring">
          {/* Top Cyber Accent Strip */}
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[var(--color-val-red)] to-transparent opacity-80" />

          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40 text-white">
            <div className="flex items-center gap-2.5">
              <span className="font-black text-xs uppercase tracking-widest text-white/90 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-val-red)] shadow-[0_0_8px_var(--color-val-red)]" />
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-black bg-[var(--color-val-red)] text-white px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(255,70,85,0.5)]">
                  {unreadCount}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-secondary)] hover:text-white transition-colors cursor-pointer"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {/* Section 1 : INVITATIONS DE SALON EN DIRECT (SI PRÉSENTES) */}
          {lobbyInvites.length > 0 && (
            <div className="p-3 border-b border-[var(--color-border)] bg-[var(--color-val-red)]/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-val-red)] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-val-red)] animate-ping" />
                  <span>Invitations de Salon ({lobbyInvites.length})</span>
                </span>
              </div>
              <div className="space-y-2">
                {lobbyInvites.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-2.5 rounded-xl bg-black/50 border border-[var(--color-val-red)]/30 hover:border-[var(--color-val-red)]/60 transition-all flex items-center justify-between gap-3 shadow-md"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={inv.senderAvatar || getPlayerAvatar(inv.senderName)}
                        alt={inv.senderName}
                        className="w-9 h-9 rounded-xl object-cover border border-white/20 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {inv.senderName}#{inv.senderTag}
                        </div>
                        <div className="text-[10px] text-[var(--color-text-secondary)] truncate">
                          Vous invite • <span className="text-white font-bold">{inv.lobby?.mode || "Compétitif"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => {
                          sounds.playLockIn();
                          setIsOpen(false);
                          onAcceptInvite?.(inv.id);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[var(--color-val-red)] hover:brightness-110 text-white text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        Rejoindre
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => {
                          sounds.playCancel();
                          onDeclineInvite?.(inv.id);
                        }}
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white flex items-center justify-center text-xs cursor-pointer"
                        title="Refuser"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* List of Notifications */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar max-h-[350px]">
            {notifications.length === 0 && lobbyInvites.length === 0 ? (
              <div className="p-8 text-center text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider">
                Aucune notification
              </div>
            ) : (
              notifications.map((n) => {
                const isRead = readIds.includes(n.id);
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3 rounded-xl transition-all duration-200 border cursor-pointer flex gap-3 items-start ${
                      isRead
                        ? "bg-transparent border-transparent hover:bg-[var(--color-surface-hover)] opacity-70"
                        : "bg-[var(--color-surface-hover)] border-[var(--color-border)] hover:border-[var(--color-val-red)]/50 shadow-sm"
                    }`}
                  >
                    {/* Status Dot */}
                    <span
                      className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        isRead ? "bg-transparent" : "bg-[var(--color-val-red)] shadow-[0_0_6px_rgba(255,70,85,0.8)]"
                      }`}
                    ></span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-bold text-xs text-[var(--color-text-primary)] truncate">{n.title}</span>
                        <span className="text-[9px] text-[var(--color-text-secondary)] uppercase flex-shrink-0 font-semibold">
                          {n.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">{n.message}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
