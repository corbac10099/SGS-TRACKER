"use client";

import React, { useState, useEffect } from "react";
import { IconShield, IconLock, IconCheck, IconTrash, IconX } from "@/components/icons/SpyIcons";
import { sounds } from "@/lib/soundEffects";

export default function SgsAccountSettings() {
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form states
  const [displayName, setDisplayName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [riotInput, setRiotInput] = useState("");
  const [discordInput, setDiscordInput] = useState("");
  const [twitchInput, setTwitchInput] = useState("");
  const [linkedDiscord, setLinkedDiscord] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("spycam_linked_discord") || "";
    }
    return "";
  });
  const [linkedTwitch, setLinkedTwitch] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("spycam_linked_twitch") || "";
    }
    return "";
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleLinkDiscord = () => {
    if (!discordInput.trim()) return;
    sounds.playLockIn();
    const clean = discordInput.trim();
    setLinkedDiscord(clean);
    if (typeof window !== "undefined") {
      localStorage.setItem("spycam_linked_discord", clean);
    }
    setDiscordInput("");
    setMsg({ text: `Compte Discord (${clean}) lié avec succès !`, type: "success" });
  };

  const handleUnlinkDiscord = () => {
    sounds.playCancel();
    setLinkedDiscord("");
    if (typeof window !== "undefined") {
      localStorage.removeItem("spycam_linked_discord");
    }
    setMsg({ text: "Compte Discord délié.", type: "success" });
  };

  const handleLinkTwitch = () => {
    if (!twitchInput.trim()) return;
    sounds.playLockIn();
    const clean = twitchInput.trim().replace(/^https?:\/\/(www\.)?twitch\.tv\//i, "");
    setLinkedTwitch(clean);
    if (typeof window !== "undefined") {
      localStorage.setItem("spycam_linked_twitch", clean);
    }
    setTwitchInput("");
    setMsg({ text: `Chaîne Twitch (${clean}) associée avec succès !`, type: "success" });
  };

  const handleUnlinkTwitch = () => {
    sounds.playCancel();
    setLinkedTwitch("");
    if (typeof window !== "undefined") {
      localStorage.removeItem("spycam_linked_twitch");
    }
    setMsg({ text: "Chaîne Twitch dissociée.", type: "success" });
  };

  const fetchAccount = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/account");
      const data = await res.json();
      if (data.success && data.user) {
        setAccount(data.user);
        setDisplayName(data.user.name || "");
        setNewEmail(data.user.email || "");
      }
    } catch (e) {
      console.error("Erreur chargement compte:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccount();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMsg(null);
    try {
      sounds.playClick();
      if (newPassword && newPassword !== confirmPassword) {
        setMsg({ text: "Les nouveaux mots de passe ne correspondent pas.", type: "error" });
        setActionLoading(false);
        return;
      }

      const payload: any = { name: displayName };
      if (newEmail !== account?.email) payload.newEmail = newEmail;
      if (newPassword) {
        payload.newPassword = newPassword;
        payload.currentPassword = currentPassword;
      }

      const res = await fetch("/api/user/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ text: "Profil SGS mis à jour avec succès !", type: "success" });
        setCurrentPassword("");
        newPassword && setNewPassword("");
        confirmPassword && setConfirmPassword("");
        fetchAccount();
      } else {
        setMsg({ text: data.error || "Erreur lors de la mise à jour.", type: "error" });
      }
    } catch (err: any) {
      setMsg({ text: err.message, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLinkRiot = async () => {
    if (!riotInput.trim()) return;
    setActionLoading(true);
    try {
      sounds.playClick();
      const res = await fetch("/api/user/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "link-riot",
          data: { riotGameName: riotInput.trim() },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ text: "Compte Riot Games lié !", type: "success" });
        setRiotInput("");
        fetchAccount();
      } else {
        setMsg({ text: data.error || "Erreur lors de la liaison Riot.", type: "error" });
      }
    } catch (err: any) {
      setMsg({ text: err.message, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlinkRiot = async () => {
    if (!confirm("Voulez-vous vraiment délier votre compte Riot Games de SGS ?")) return;
    setActionLoading(true);
    try {
      sounds.playCancel();
      const res = await fetch("/api/user/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unlink-riot" }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ text: "Compte Riot Games délié.", type: "success" });
        fetchAccount();
      }
    } catch (err: any) {
      setMsg({ text: err.message, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setActionLoading(true);
    try {
      sounds.playCancel();
      const res = await fetch("/api/user/account", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        alert("Votre compte SGS et toutes vos données ont été définitivement supprimés.");
        window.location.href = "/";
      } else {
        alert(data.error || "Erreur lors de la suppression.");
      }
    } catch (err: any) {
      alert("Erreur: " + err.message);
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center">
        <div className="w-8 h-8 border-2 border-[var(--color-val-red)] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-xs text-gray-400 font-bold uppercase">Chargement de votre compte SGS...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-red-950/20 via-black/40 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-val-red)]/20 border border-[var(--color-val-red)]/40 flex items-center justify-center text-[var(--color-val-red)] font-black text-lg">
            {account?.name?.charAt(0)?.toUpperCase() || "S"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[var(--color-val-red)] text-white">
                SGS Passport
              </span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Rôle : <strong className="text-white">{account?.sgsRole || "Membre"}</strong>
              </span>
            </div>
            <h3 className="text-base font-black text-white">{account?.name || "Utilisateur SGS"}</h3>
            <p className="text-xs text-[var(--color-text-secondary)]">{account?.email}</p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-[10px] font-bold text-gray-400 uppercase block">Compte Multi-Services</span>
          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Actif sur Spycam & SGS Hub
          </span>
        </div>
      </div>

      {msg && (
        <div className={`p-3.5 rounded-xl text-xs font-bold ${msg.type === "success" ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300" : "bg-red-500/15 border border-red-500/30 text-red-300"}`}>
          {msg.text}
        </div>
      )}

      {/* LINKED ACCOUNTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* RIOT GAMES */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 font-black text-xs">
                VAL
              </span>
              <div>
                <h4 className="text-xs font-bold text-white uppercase">Compte Riot Games</h4>
                <p className="text-[10px] text-gray-400">Pour le suivi et les salons Valorant</p>
              </div>
            </div>
            {account?.isRiotLinked ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                Lié
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-500/20 text-gray-400">
                Non lié
              </span>
            )}
          </div>

          {account?.isRiotLinked ? (
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
              <span className="text-xs font-bold text-white">{account?.riotGameName}</span>
              <button
                onClick={handleUnlinkRiot}
                disabled={actionLoading}
                className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase underline cursor-pointer"
              >
                Délier
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={riotInput}
                onChange={(e) => setRiotInput(e.target.value)}
                placeholder="ex: Joueur#EUW"
                className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-val-red)]"
              />
              <button
                onClick={handleLinkRiot}
                disabled={actionLoading || !riotInput.trim()}
                className="px-3 py-2 rounded-xl bg-[var(--color-val-red)] hover:bg-[#ff5a67] text-white text-xs font-bold uppercase transition-all disabled:opacity-50 cursor-pointer"
              >
                Lier
              </button>
            </div>
          )}
        </div>

        {/* GOOGLE OAUTH */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400 font-black text-xs">
                G
              </span>
              <div>
                <h4 className="text-xs font-bold text-white uppercase">Connexion Google</h4>
                <p className="text-[10px] text-gray-400">Connexion rapide en 1 clic</p>
              </div>
            </div>
            {account?.isGoogleLinked ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                Lié
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-500/20 text-gray-400">
                Non lié
              </span>
            )}
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-300">
              {account?.googleEmail || account?.email}
            </span>
            <span className="text-[10px] text-gray-500 font-medium">Synchronisé</span>
          </div>
        </div>

        {/* DISCORD */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/30 flex items-center justify-center text-[#5865F2] font-black text-xs">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </span>
              <div>
                <h4 className="text-xs font-bold text-white uppercase">Discord</h4>
                <p className="text-[10px] text-gray-400">Notifications & communauté SGS</p>
              </div>
            </div>
            {linkedDiscord ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                Lié
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-500/20 text-gray-400">
                Non lié
              </span>
            )}
          </div>

          {linkedDiscord ? (
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="text-[#5865F2]">@</span>{linkedDiscord}
              </span>
              <button
                onClick={handleUnlinkDiscord}
                className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase underline cursor-pointer"
              >
                Délier
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={discordInput}
                onChange={(e) => setDiscordInput(e.target.value)}
                placeholder="ex: pseudo#1234 ou pseudo"
                className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#5865F2]"
              />
              <button
                onClick={handleLinkDiscord}
                disabled={!discordInput.trim()}
                className="px-3 py-2 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold uppercase transition-all disabled:opacity-50 cursor-pointer"
              >
                Lier
              </button>
            </div>
          )}
        </div>

        {/* TWITCH */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-[#9146FF]/20 border border-[#9146FF]/30 flex items-center justify-center text-[#9146FF] font-black text-xs">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                </svg>
              </span>
              <div>
                <h4 className="text-xs font-bold text-white uppercase">Twitch</h4>
                <p className="text-[10px] text-gray-400">Diffusion & intégration live</p>
              </div>
            </div>
            {linkedTwitch ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                Lié
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-500/20 text-gray-400">
                Non lié
              </span>
            )}
          </div>

          {linkedTwitch ? (
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="text-[#9146FF]">twitch.tv/</span>{linkedTwitch}
              </span>
              <button
                onClick={handleUnlinkTwitch}
                className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase underline cursor-pointer"
              >
                Délier
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={twitchInput}
                onChange={(e) => setTwitchInput(e.target.value)}
                placeholder="ex: nom_de_chaine"
                className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#9146FF]"
              />
              <button
                onClick={handleLinkTwitch}
                disabled={!twitchInput.trim()}
                className="px-3 py-2 rounded-xl bg-[#9146FF] hover:bg-[#772ce8] text-white text-xs font-bold uppercase transition-all disabled:opacity-50 cursor-pointer"
              >
                Lier
              </button>
            </div>
          )}
        </div>
      </div>

      {/* EDIT PROFILE & PASSWORD */}
      <form onSubmit={handleUpdateProfile} className="glass-panel rounded-2xl p-4 sm:p-6 border border-white/10 space-y-4">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <IconLock size={14} className="text-[var(--color-val-red)]" />
          <span>Informations & Sécurité du Compte</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Nom d&apos;affichage</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-val-red)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Adresse Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-val-red)]"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-white/5">
          <span className="text-[11px] font-bold text-gray-400 uppercase block mb-3">Changer le mot de passe (optionnel)</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {account?.hasPassword && (
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-semibold">Mot de passe actuel</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-[var(--color-val-red)]"
                />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-semibold">Nouveau mot de passe</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-[var(--color-val-red)]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-semibold">Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-[var(--color-val-red)]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={actionLoading}
            className="px-5 py-2.5 rounded-xl bg-[var(--color-val-red)] hover:bg-[#ff5a67] text-white text-xs font-bold uppercase transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {actionLoading ? "Enregistrement..." : "Mettre à jour mon compte"}
          </button>
        </div>
      </form>

      {/* DANGER ZONE (RGPD RIGHT TO ERASURE) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-red-950/20 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-black text-red-300 uppercase tracking-wider flex items-center gap-1.5">
            <IconTrash size={14} className="text-red-400" />
            <span>Zone de Danger (Conformité RGPD)</span>
          </h4>
          <p className="text-[11px] text-gray-400 mt-1">
            Supprimez définitivement votre compte SGS, vos salons, vos préférences et l&apos;intégralité de vos données de jeu.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600 border border-red-500/40 text-red-300 hover:text-white text-xs font-bold uppercase transition-all cursor-pointer whitespace-nowrap"
        >
          Supprimer mon compte
        </button>
      </div>

      {/* CONFIRM DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#0d1117] border border-red-500/40 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-400 flex items-center justify-center mx-auto">
              <IconTrash size={24} />
            </div>
            <h3 className="text-base font-black text-white text-center uppercase">Suppression Définitive</h3>
            <p className="text-xs text-gray-300 text-center leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement votre compte <strong>{account?.email}</strong> ? Cette action est irréversible et supprimera toutes vos données.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 rounded-xl bg-white/10 text-gray-300 text-xs font-bold uppercase"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
