"use client";

import React, { useState, useRef, useEffect } from "react";
import { useFriends } from "@/hooks/useFriends";
import { sounds } from "@/lib/soundEffects";
import {
  IconUsers,
  IconSearch,
  IconCheck,
  IconClose,
  IconEye,
  IconEyeOff,
  IconTrash,
  IconPlus,
} from "@/components/icons/SpyIcons";

export interface FriendsDropdownProps {
  onSelectPlayer?: (riotId: string) => void;
  compact?: boolean;
}

export default function FriendsDropdown({
  onSelectPlayer,
  compact = false,
}: FriendsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"friends" | "incoming" | "add">("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [addRiotId, setAddRiotId] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const {
    friends,
    incoming,
    actionLoading,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    updatePermission,
  } = useFriends();

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addRiotId.trim()) return;
    sounds.playClick();
    setFeedback(null);
    const res = await sendRequest(addRiotId.trim());
    if (res.success) {
      setFeedback({ type: "success", text: res.message || "Demande envoyée avec succès !" });
      setAddRiotId("");
    } else {
      setFeedback({ type: "error", text: res.error || "Impossible d'envoyer la demande." });
    }
  };

  const filteredFriends = friends.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.riotId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button in Header Capsule */}
      <button
        type="button"
        onClick={() => {
          sounds.playClick();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => sounds.playHover()}
        title="Amis SGS & Invitations"
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
          isOpen
            ? "bg-sky-500/20 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.25)]"
            : "text-neutral-300 hover:text-white hover:bg-white/[0.08]"
        }`}
      >
        <IconUsers size={14} className="text-sky-400" />
        <span className="hidden xl:inline">Amis</span>
        {incoming.length > 0 && (
          <span className="px-1.5 py-0.2 rounded-full bg-[var(--color-val-red)] text-white text-[9px] font-black animate-pulse">
            {incoming.length}
          </span>
        )}
      </button>

      {/* Unfolding Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 max-h-[540px] bg-[#0c1218]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_25px_rgba(56,189,248,0.08)] z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
          {/* Sky Cyber Strip */}
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-80" />

          {/* Header */}
          <div className="p-3.5 border-b border-white/10 bg-black/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
              <span className="text-xs font-black uppercase tracking-widest text-white/90">
                Amis SGS
              </span>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 bg-white/[0.05] p-0.5 rounded-lg border border-white/5">
              <button
                type="button"
                onClick={() => {
                  sounds.playTabSwitch();
                  setActiveTab("friends");
                }}
                className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "friends"
                    ? "bg-sky-500/30 text-sky-300 border border-sky-500/30"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Amis ({friends.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playTabSwitch();
                  setActiveTab("incoming");
                }}
                className={`relative px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "incoming"
                    ? "bg-sky-500/30 text-sky-300 border border-sky-500/30"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Demandes
                {incoming.length > 0 && (
                  <span className="ml-1 px-1 rounded-full bg-[var(--color-val-red)] text-white text-[8px] font-bold">
                    {incoming.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playTabSwitch();
                  setActiveTab("add");
                }}
                className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "add"
                    ? "bg-sky-500/30 text-sky-300 border border-sky-500/30"
                    : "text-neutral-400 hover:text-white"
                }`}
                title="Ajouter un ami"
              >
                <IconPlus size={11} />
              </button>
            </div>
          </div>

          {/* TAB 1: FRIENDS LIST */}
          {activeTab === "friends" && (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Search Bar */}
              <div className="p-2.5 border-b border-white/5 bg-white/[0.02]">
                <div className="relative">
                  <IconSearch
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrer mes amis..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-400/50 transition-colors"
                  />
                </div>
              </div>

              {/* Friends Scrollable List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar max-h-[360px]">
                {filteredFriends.length === 0 ? (
                  <div className="py-10 text-center text-neutral-500 text-xs">
                    {searchQuery ? "Aucun ami correspondant." : "Aucun ami pour le moment."}
                  </div>
                ) : (
                  filteredFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className="group flex items-center justify-between p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-sky-500/30 transition-all"
                    >
                      {/* Left: Avatar & Info */}
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setIsOpen(false);
                          onSelectPlayer?.(friend.riotId);
                        }}
                        className="flex items-center gap-2.5 min-w-0 text-left flex-1 cursor-pointer"
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={friend.avatarUrl || "https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/smallart.png"}
                            alt={friend.name}
                            className="w-8 h-8 rounded-lg object-cover border border-white/10"
                          />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0c1218] ${
                              friend.isOnline ? "bg-emerald-400" : "bg-neutral-600"
                            }`}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-white truncate group-hover:text-sky-300 transition-colors">
                            {friend.name}
                          </div>
                          <div className="text-[10px] text-neutral-400 flex items-center gap-1.5">
                            <span className="truncate">{friend.rank || "Non-classé"}</span>
                            {friend.spiScore !== undefined && (
                              <span className="text-amber-400/90 font-mono">
                                • {friend.spiScore} SPI
                              </span>
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        {/* Stat Visibility Toggle */}
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            updatePermission(friend.id, !friend.canViewStats);
                          }}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                            friend.canViewStats
                              ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                              : "bg-white/5 text-neutral-500 hover:text-neutral-300"
                          }`}
                          title={
                            friend.canViewStats
                              ? "Peut voir mes stats privées (Cliquer pour révoquer)"
                              : "Ne peut pas voir mes stats privées (Cliquer pour autoriser)"
                          }
                        >
                          {friend.canViewStats ? <IconEye size={12} /> : <IconEyeOff size={12} />}
                        </button>

                        {/* Remove Friend */}
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => {
                            sounds.playCancel();
                            removeFriend(friend.id);
                          }}
                          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/20 text-neutral-500 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                          title="Supprimer de mes amis"
                        >
                          <IconTrash size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: INCOMING REQUESTS */}
          {activeTab === "incoming" && (
            <div className="p-3 overflow-y-auto max-h-[360px] custom-scrollbar space-y-2">
              {incoming.length === 0 ? (
                <div className="py-10 text-center text-neutral-500 text-xs">
                  Aucune demande d'ami reçue.
                </div>
              ) : (
                incoming.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] border border-white/5 gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={req.senderAvatar || "https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/smallart.png"}
                        alt={req.senderName}
                        className="w-8 h-8 rounded-lg object-cover border border-white/10 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {req.senderName}
                        </div>
                        <div className="text-[10px] text-neutral-400 truncate">
                          #{req.senderTag}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => {
                          sounds.playLockIn();
                          acceptRequest(req.id);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <IconCheck size={11} />
                        <span>Accepter</span>
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => {
                          sounds.playCancel();
                          declineRequest(req.id);
                        }}
                        className="w-6 h-6 rounded-lg bg-white/5 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 flex items-center justify-center text-xs transition-colors cursor-pointer"
                        title="Refuser"
                      >
                        <IconClose size={11} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: ADD FRIEND */}
          {activeTab === "add" && (
            <div className="p-4 space-y-3">
              <form onSubmit={handleSendRequest} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1.5">
                    Riot ID de votre ami
                  </label>
                  <input
                    type="text"
                    value={addRiotId}
                    onChange={(e) => setAddRiotId(e.target.value)}
                    placeholder="Ex: TenZ#NA1 ou Shroud#0001"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-400/50 transition-colors"
                  />
                </div>

                {feedback && (
                  <div
                    className={`p-2 rounded-xl text-xs font-bold ${
                      feedback.type === "success"
                        ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                        : "bg-red-500/15 border border-red-500/30 text-red-300"
                    }`}
                  >
                    {feedback.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={actionLoading || !addRiotId.trim()}
                  className="w-full py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-black text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.3)]"
                >
                  {actionLoading ? "Envoi..." : "Envoyer la demande"}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
