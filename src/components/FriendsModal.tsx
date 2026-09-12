"use client";

import React, { useState } from "react";
import {
  useFriends,
  FriendItem,
  FriendRequestItem,
  BlockedUserItem,
} from "@/hooks/useFriends";
import { sounds } from "@/lib/soundEffects";
import {
  IconUsers,
  IconClose,
  IconSearch,
  IconCheck,
  IconEye,
  IconEyeOff,
  IconShield,
  IconTrash,
} from "@/components/icons/SpyIcons";

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlayer?: (riotId: string) => void;
}

export default function FriendsModal({
  isOpen,
  onClose,
  onSelectPlayer,
}: FriendsModalProps) {
  const {
    friends,
    incoming,
    outgoing,
    blocked,
    actionLoading,
    sendRequest,
    acceptRequest,
    declineRequest,
    blockUser,
    unblockUser,
    removeFriend,
    updatePermission,
  } = useFriends();

  const [activeTab, setActiveTab] = useState<"friends" | "incoming" | "outgoing" | "blocked">("friends");
  const [riotIdInput, setRiotIdInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!riotIdInput.trim()) return;
    sounds.playClick();
    setFeedbackMsg(null);

    const res = await sendRequest(riotIdInput.trim());
    if (res.success) {
      setFeedbackMsg({ type: "success", text: res.message || "Demande envoyée !" });
      setRiotIdInput("");
    } else {
      setFeedbackMsg({ type: "error", text: res.error || "Erreur d'envoi" });
    }
  };

  const filteredFriends = friends.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.riotId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 animate-in fade-in-0 duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={() => {
          sounds.playClick();
          onClose();
        }}
      />

      {/* Modal Dialog */}
      <div
        className="glass-panel relative w-full max-w-2xl max-h-[85vh] rounded-3xl border border-[var(--color-border)] shadow-2xl flex flex-col z-10 overflow-hidden animate-in zoom-in-95 duration-200"
        style={{
          background: "linear-gradient(135deg, rgba(14, 18, 25, 0.95) 0%, rgba(8, 10, 15, 0.98) 100%)",
        }}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[var(--color-border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--color-val-red)]/15 border border-[var(--color-val-red)]/40 flex items-center justify-center text-[var(--color-val-red)] shadow-accent-sm">
              <IconUsers size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                <span>Amis SGS</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-bold">
                  {friends.length}
                </span>
              </h2>
              <p className="text-[11px] text-[var(--color-text-secondary)] font-medium">
                Gérez vos coéquipiers, invitations et permissions de profil privé
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer"
          >
            <IconClose size={16} />
          </button>
        </div>

        {/* Formulaire d'ajout rapide par Riot ID */}
        <div className="p-4 sm:px-6 bg-white/[0.02] border-b border-[var(--color-border)]">
          <form onSubmit={handleSend} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Ajouter un joueur par Riot ID (ex: Gr4phØ#0001)..."
                value={riotIdInput}
                onChange={(e) => setRiotIdInput(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-val-red)] transition-all font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={actionLoading || !riotIdInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-[var(--color-val-red)] hover:brightness-110 text-white font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-accent-sm shrink-0 cursor-pointer"
            >
              Ajouter
            </button>
          </form>

          {feedbackMsg && (
            <div
              className={`mt-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between ${
                feedbackMsg.type === "success"
                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                  : "bg-red-500/20 border border-red-500/40 text-red-300"
              }`}
            >
              <span>{feedbackMsg.text}</span>
              <button
                type="button"
                onClick={() => setFeedbackMsg(null)}
                className="text-xs opacity-70 hover:opacity-100 ml-2"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[var(--color-border)] px-4 sm:px-6 gap-2 sm:gap-4 overflow-x-auto select-none">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("friends");
            }}
            className={`py-3 text-xs uppercase font-black tracking-wider transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "friends"
                ? "border-[var(--color-val-red)] text-white"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            Mes Amis ({friends.length})
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("incoming");
            }}
            className={`py-3 text-xs uppercase font-black tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "incoming"
                ? "border-[var(--color-val-red)] text-white"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <span>Demandes reçues</span>
            {incoming.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[var(--color-val-red)] text-white text-[10px] font-black animate-pulse">
                {incoming.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("outgoing");
            }}
            className={`py-3 text-xs uppercase font-black tracking-wider transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "outgoing"
                ? "border-[var(--color-val-red)] text-white"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            En attente ({outgoing.length})
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("blocked");
            }}
            className={`py-3 text-xs uppercase font-black tracking-wider transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "blocked"
                ? "border-[var(--color-val-red)] text-white"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            Bloqués ({blocked.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 min-h-[260px]">
          {/* TAB 1: MES AMIS */}
          {activeTab === "friends" && (
            <>
              {friends.length > 3 && (
                <div className="relative mb-3">
                  <IconSearch size={14} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Rechercher parmi mes amis..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
                  />
                </div>
              )}

              {filteredFriends.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs">
                  {friends.length === 0
                    ? "Vous n'avez pas encore d'ami ajouté. Utilisez le champ ci-dessus pour inviter un Riot ID !"
                    : "Aucun ami ne correspond à votre recherche."}
                </div>
              ) : (
                filteredFriends.map((f) => (
                  <div
                    key={f.friendshipId}
                    className="glass-panel p-3 sm:p-4 rounded-2xl border border-white/10 flex items-center justify-between gap-3 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {f.avatarUrl ? (
                        <img src={f.avatarUrl} alt={f.name} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/10" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-black text-sm shrink-0 border border-white/10">
                          {f.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs sm:text-sm font-black text-white truncate">{f.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{f.riotId}</span>
                          {!f.isPublic && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold">
                              Privé
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {/* Toggle Permission : peut voir mes stats */}
                          <button
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              if (f.friendId) {
                                updatePermission(f.friendId, !f.canViewStats);
                              }
                            }}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                              f.canViewStats
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                                : "bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30"
                            }`}
                            title="Régler l'autorisation de voir mes statistiques si je passe en profil privé"
                          >
                            {f.canViewStats ? <IconEye size={12} /> : <IconEyeOff size={12} />}
                            <span>{f.canViewStats ? "Stats autorisées" : "Stats bloquées"}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {onSelectPlayer && f.riotId && (
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            onSelectPlayer(f.riotId);
                            onClose();
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
                        >
                          Voir Profil
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          if (confirm(`Retirer ${f.name} de vos amis ?`)) {
                            if (f.friendId) removeFriend(f.friendId);
                          }
                        }}
                        className="w-8 h-8 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-gray-400 hover:text-red-300 flex items-center justify-center transition-all cursor-pointer"
                        title="Retirer cet ami"
                      >
                        <IconTrash size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          if (confirm(`Bloquer ${f.name} ?`)) {
                            blockUser({ friendshipId: f.friendshipId });
                          }
                        }}
                        className="w-8 h-8 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30 text-gray-400 hover:text-amber-300 flex items-center justify-center transition-all cursor-pointer"
                        title="Bloquer cet utilisateur"
                      >
                        <IconShield size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* TAB 2: DEMANDES REÇUES */}
          {activeTab === "incoming" && (
            <>
              {incoming.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs">
                  Aucune demande d&apos;ami en attente.
                </div>
              ) : (
                incoming.map((req) => (
                  <div
                    key={req.friendshipId}
                    className="glass-panel p-3 sm:p-4 rounded-2xl border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {req.avatarUrl ? (
                        <img src={req.avatarUrl} alt={req.name} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/10" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-[var(--color-val-red)]/20 text-[var(--color-val-red)] font-black text-sm flex items-center justify-center shrink-0 border border-[var(--color-val-red)]/30">
                          {req.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-black text-white truncate">{req.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{req.riotId}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          acceptRequest(req.friendshipId);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-black text-xs uppercase tracking-wide transition-all cursor-pointer"
                      >
                        Accepter
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          declineRequest(req.friendshipId);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 font-bold text-xs uppercase tracking-wide transition-all cursor-pointer"
                      >
                        Refuser
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          blockUser({ friendshipId: req.friendshipId });
                        }}
                        className="w-8 h-8 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-gray-400 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer"
                        title="Bloquer"
                      >
                        <IconShield size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* TAB 3: DEMANDES ENVOYÉES */}
          {activeTab === "outgoing" && (
            <>
              {outgoing.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs">
                  Aucune demande envoyée en attente.
                </div>
              ) : (
                outgoing.map((req) => (
                  <div
                    key={req.friendshipId}
                    className="glass-panel p-3 sm:p-4 rounded-2xl border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-gray-400 font-black text-sm shrink-0 border border-white/10">
                        {req.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-black text-white truncate">{req.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{req.riotId}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        declineRequest(req.friendshipId);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-gray-400 hover:text-red-300 font-bold text-xs uppercase tracking-wide transition-all cursor-pointer"
                    >
                      Annuler
                    </button>
                  </div>
                ))
              )}
            </>
          )}

          {/* TAB 4: BLOQUÉS */}
          {activeTab === "blocked" && (
            <>
              {blocked.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs">
                  Aucun joueur bloqué.
                </div>
              ) : (
                blocked.map((b) => (
                  <div
                    key={b.friendshipId}
                    className="glass-panel p-3 sm:p-4 rounded-2xl border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400 shrink-0">
                        <IconShield size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-black text-white truncate">{b.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{b.riotId}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        unblockUser(b.friendshipId);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wide transition-all cursor-pointer"
                    >
                      Débloquer
                    </button>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
