"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SpycamAccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [riotInput, setRiotInput] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddPasswordModal, setShowAddPasswordModal] = useState(false);
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);
  const [addPasswordInput, setAddPasswordInput] = useState("");
  const [addPasswordConfirm, setAddPasswordConfirm] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const sgsUrl = process.env.NEXT_PUBLIC_SGS_URL || "https://sgs-brown.vercel.app";

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
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/compte");
    } else if (status === "authenticated") {
      fetchAccount();
    }
  }, [status, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMsg(null);
    try {
      if (newPassword && newPassword !== confirmPassword) {
        setMsg({ text: "Les mots de passe ne correspondent pas.", type: "error" });
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
        setMsg({ text: "Informations mises à jour avec succès !", type: "success" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowChangePasswordForm(false);
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
    setMsg(null);
    try {
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
        setMsg({ text: "Compte Riot Games associé avec succès !", type: "success" });
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
    if (!confirm("Voulez-vous vraiment dissocier votre compte Riot Games ?")) return;
    setActionLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/user/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unlink-riot" }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ text: "Compte Riot Games dissocié.", type: "success" });
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
      const res = await fetch("/api/user/account", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        alert("Votre compte et toutes vos données ont été définitivement supprimés.");
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

  const handleAddPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addPasswordInput || addPasswordInput.length < 6) {
      setMsg({ text: "Le mot de passe doit contenir au moins 6 caractères.", type: "error" });
      return;
    }
    if (addPasswordInput !== addPasswordConfirm) {
      setMsg({ text: "Les mots de passe ne correspondent pas.", type: "error" });
      return;
    }
    setActionLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/user/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add-password",
          data: { newPassword: addPasswordInput },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ text: data.message || "Mot de passe configuré avec succès !", type: "success" });
        setAddPasswordInput("");
        setAddPasswordConfirm("");
        setShowAddPasswordModal(false);
        fetchAccount();
      } else {
        setMsg({ text: data.error || "Erreur lors de la configuration du mot de passe.", type: "error" });
      }
    } catch (err: any) {
      setMsg({ text: err.message, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!account?.hasPassword) {
      alert("Impossible de dissocier Google : vous devez d'abord configurer un mot de passe pour conserver au moins un moyen de connexion.");
      return;
    }
    if (!confirm("Voulez-vous vraiment dissocier votre compte Google ? Vous devrez vous connecter avec votre email et mot de passe.")) return;
    setActionLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/user/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unlink-google" }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ text: data.message || "Compte Google dissocié avec succès.", type: "success" });
        fetchAccount();
      } else {
        setMsg({ text: data.error || "Erreur lors de la dissociation.", type: "error" });
      }
    } catch (err: any) {
      setMsg({ text: err.message, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemovePassword = async () => {
    if (!account?.isGoogleLinked) {
      alert("Impossible de supprimer le mot de passe : vous devez conserver au moins un moyen de connexion actif (liez un compte Google au préalable).");
      return;
    }
    if (!confirm("Voulez-vous vraiment supprimer votre mot de passe ? Vous vous connecterez désormais exclusivement via Google.")) return;
    setActionLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/user/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove-password" }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ text: data.message || "Mot de passe supprimé avec succès.", type: "success" });
        setShowChangePasswordForm(false);
        fetchAccount();
      } else {
        setMsg({ text: data.error || "Erreur lors de la suppression du mot de passe.", type: "error" });
      }
    } catch (err: any) {
      setMsg({ text: err.message, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const userInitial = (account?.name || account?.email || "S").charAt(0).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 animate-in fade-in duration-200">
      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-black uppercase text-[var(--color-val-red,#ff4655)] tracking-widest">
            Identité SGS & Tracker
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase">
            Gestion du Compte
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs uppercase transition-all flex items-center gap-1.5"
          >
            <span>← SGS-Tracker</span>
          </Link>
          <a
            href={sgsUrl}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs uppercase transition-all flex items-center gap-1.5"
          >
            <span>🏠 Hub SGS</span>
          </a>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="px-3.5 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 hover:text-white font-bold text-xs uppercase transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold ${
            msg.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
              : "bg-red-500/15 border border-red-500/30 text-red-300"
          }`}
        >
          {msg.text}
        </div>
      )}

      {loading ? (
        <div className="glass-panel rounded-3xl p-12 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[var(--color-val-red,#ff4655)] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
            Chargement de votre profil...
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* USER PROFILE CARD */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-white/10 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neutral-700 to-neutral-900 border border-white/20 flex items-center justify-center font-black text-white text-2xl shadow-lg">
                {userInitial}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black text-white">{account?.name || "Joueur"}</h2>
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[var(--color-val-red,#ff4655)] text-white">
                    {account?.sgsRole || "Membre"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-medium">{account?.email}</p>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Statut Écosystème
              </span>
              <span className="text-xs text-emerald-400 font-bold flex items-center sm:justify-end gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Synchronisé sur Neon DB
              </span>
            </div>
          </div>

          {/* SECTION 1 : MOYENS DE CONNEXION PRINCIPAUX */}
          <div className="space-y-4">
            <div className="border-b border-white/10 pb-2">
              <span className="text-[10px] font-black uppercase text-[var(--color-val-red,#ff4655)] tracking-widest">
                Sécurité & Accès
              </span>
              <h3 className="text-lg font-black text-white uppercase">
                1. Moyens de Connexion Principaux (Identité SGS)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* GOOGLE STATUS */}
              <div className="glass-panel rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase">Connexion Google</h4>
                        <p className="text-[10px] text-gray-400">Authentification rapide OAuth</p>
                      </div>
                    </div>
                    {account?.isGoogleLinked ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Connecté
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-700 text-gray-400">
                        Non lié
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-300">
                    {account?.googleEmail || (account?.isGoogleLinked ? account?.email : "Aucun compte Google associé.")}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  {account?.isGoogleLinked ? (
                    account?.hasPassword ? (
                      <button
                        type="button"
                        onClick={handleUnlinkGoogle}
                        disabled={actionLoading}
                        className="text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer"
                      >
                        Dissocier Google
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-400 font-medium">
                        🔒 Seul moyen de connexion actif
                      </span>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => signIn("google", { callbackUrl: "/compte" })}
                      className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>+</span> Lier mon compte Google
                    </button>
                  )}
                </div>
              </div>

              {/* EMAIL & PASSWORD STATUS */}
              <div className="glass-panel rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold text-xs">
                        ✉️
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase">Email & Mot de passe</h4>
                        <p className="text-[10px] text-gray-400">Identifiants directs SGS</p>
                      </div>
                    </div>
                    {account?.hasPassword ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Configuré
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Non configuré
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-300">{account?.email}</p>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2 flex-wrap">
                  {account?.hasPassword ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowChangePasswordForm(!showChangePasswordForm)}
                        className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer"
                      >
                        {showChangePasswordForm ? "Fermer" : "Modifier le mot de passe"}
                      </button>

                      {account?.isGoogleLinked ? (
                        <button
                          type="button"
                          onClick={handleRemovePassword}
                          disabled={actionLoading}
                          className="text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer"
                        >
                          Supprimer le mot de passe
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-medium">
                          🔒 Seul moyen de connexion actif
                        </span>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddPasswordModal(true)}
                      className="bg-[var(--color-val-red,#ff4655)] hover:bg-[#ff5e6c] text-white px-3.5 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 shadow-md shadow-red-500/20"
                    >
                      <span>+</span> Configurer un mot de passe
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* EDIT PROFILE FORM */}
            <form onSubmit={handleUpdateProfile} className="glass-panel rounded-3xl p-6 sm:p-8 space-y-5">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Modifier mes informations de profil
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">
                    Pseudo
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-val-red,#ff4655)] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">
                    Adresse Email
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-val-red,#ff4655)] transition-all"
                  />
                </div>
              </div>

              {/* SECTION OPTIONNELLE : CHANGER DE MOT DE PASSE (Uniquement si déclenchée) */}
              {showChangePasswordForm && account?.hasPassword && (
                <div className="pt-4 border-t border-white/5 space-y-3 animate-in fade-in duration-200">
                  <span className="text-xs font-bold text-gray-300 uppercase block">
                    Changer de mot de passe
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-semibold">
                        Mot de passe actuel
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-[var(--color-val-red,#ff4655)]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-semibold">
                        Nouveau mot de passe
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-[var(--color-val-red,#ff4655)]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-semibold">
                        Confirmer le mot de passe
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-[var(--color-val-red,#ff4655)]"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-3 rounded-xl bg-[var(--color-val-red,#ff4655)] hover:brightness-110 text-[var(--color-accent-contrast,#ffffff)] text-xs font-bold uppercase tracking-wider transition-all shadow-accent-md hover:shadow-accent-lg cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? "Enregistrement..." : "Enregistrer les modifications"}
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 2 : COMPTES DE JEUX & INTÉGRATIONS TIERS */}
          <div className="space-y-4">
            <div className="border-b border-white/10 pb-2">
              <span className="text-[10px] font-black uppercase text-[var(--color-val-red,#ff4655)] tracking-widest">
                Écosystème Gaming
              </span>
              <h3 className="text-lg font-black text-white uppercase">
                2. Comptes de Jeux & Intégrations Associées
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Associez vos profils de jeux à votre compte SGS pour synchroniser vos statistiques et vos salons sur SGS-Tracker.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* RIOT GAMES CARD */}
              <div className="glass-panel rounded-3xl p-6 space-y-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center font-black text-red-400 text-xs">
                      VAL
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase">Riot Games (VALORANT)</h4>
                      <p className="text-[10px] text-gray-400">SGS-Tracker & Salons Vocaux</p>
                    </div>
                  </div>

                  {account?.isRiotLinked ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Lié
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-700 text-gray-400">
                      Non lié
                    </span>
                  )}
                </div>

                {account?.isRiotLinked ? (
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 font-semibold block">Riot ID Actif</span>
                      <span className="text-sm font-black text-white">{account?.riotGameName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleUnlinkRiot}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-xl bg-red-600/10 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white text-xs font-bold uppercase transition-all cursor-pointer"
                    >
                      Dissocier
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] text-gray-400">
                      Entrez votre <strong>Riot ID</strong> complet avec votre tag pour synchroniser votre rang et vos replays.
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={riotInput}
                        onChange={(e) => setRiotInput(e.target.value)}
                        placeholder="ex: Joueur#EUW"
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-val-red,#ff4655)]"
                      />
                      <button
                        type="button"
                        onClick={handleLinkRiot}
                        disabled={actionLoading || !riotInput.trim()}
                        className="px-4 py-2.5 rounded-xl bg-[var(--color-val-red,#ff4655)] hover:bg-[#ff5e6c] text-white text-xs font-bold uppercase transition-all disabled:opacity-50 cursor-pointer"
                      >
                        Associer
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* STEAM PLACEHOLDER */}
              <div className="glass-panel rounded-3xl p-6 space-y-4 border border-white/5 opacity-70">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-sky-600/20 border border-sky-500/30 flex items-center justify-center font-black text-sky-400 text-xs">
                      STM
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase">Steam Gaming</h4>
                      <p className="text-[10px] text-gray-400">CS2 & SGS Aim Sync</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-800 text-gray-400 border border-white/5">
                    Bientôt
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">
                  L&apos;intégration Steam permettra la synchronisation cross-game de vos sensibilités et statistiques de tir.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 3 : ZONE DE DANGER / RGPD */}
          <div className="p-6 rounded-3xl bg-red-950/20 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xs font-black text-red-300 uppercase tracking-wider">
                Zone de Danger (Conformité RGPD)
              </h3>
              <p className="text-xs text-gray-400 max-w-xl">
                Supprimez définitivement votre compte, vos préférences et l&apos;intégralité de vos données associées à toutes les applications de la suite.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600 border border-red-500/40 text-red-300 hover:text-white text-xs font-bold uppercase transition-all cursor-pointer flex-shrink-0"
            >
              Supprimer mon compte
            </button>
          </div>

          {/* DELETE MODAL */}
          {showDeleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <div className="w-full max-w-md p-6 rounded-3xl bg-[#0d1117] border border-red-500/40 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
                <h3 className="text-base font-black text-white text-center uppercase">
                  Suppression Définitive
                </h3>
                <p className="text-xs text-gray-300 text-center leading-relaxed">
                  Êtes-vous sûr de vouloir supprimer définitivement votre compte (
                  <strong>{account?.email}</strong>) ? Cette action est immédiate et irréversible.
                </p>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/10 text-gray-300 text-xs font-bold uppercase cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={actionLoading}
                    className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase cursor-pointer"
                  >
                    Confirmer la suppression
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ADD PASSWORD MODAL */}
          {showAddPasswordModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <div className="w-full max-w-md p-6 rounded-3xl bg-[#0d1117] border border-white/10 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
                <div className="text-center space-y-1">
                  <span className="text-[10px] font-black uppercase text-[var(--color-val-red,#ff4655)] tracking-widest">
                    Sécurité SGS
                  </span>
                  <h3 className="text-base font-black text-white uppercase">
                    Configurer un mot de passe
                  </h3>
                  <p className="text-xs text-gray-400">
                    Vous pourrez ainsi vous connecter soit avec Google, soit avec votre email et ce mot de passe.
                  </p>
                </div>

                <form onSubmit={handleAddPassword} className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-semibold uppercase">
                      Nouveau mot de passe (min 6 car.)
                    </label>
                    <input
                      type="password"
                      value={addPasswordInput}
                      onChange={(e) => setAddPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-[var(--color-val-red,#ff4655)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-semibold uppercase">
                      Confirmer le mot de passe
                    </label>
                    <input
                      type="password"
                      value={addPasswordConfirm}
                      onChange={(e) => setAddPasswordConfirm(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-[var(--color-val-red,#ff4655)]"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-3">
                    <button
                      type="button"
                      onClick={() => setShowAddPasswordModal(false)}
                      className="px-4 py-2.5 rounded-xl bg-white/10 text-gray-300 text-xs font-bold uppercase cursor-pointer hover:bg-white/15"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading || !addPasswordInput}
                      className="px-4 py-2.5 rounded-xl bg-[var(--color-val-red,#ff4655)] hover:bg-[#ff5e6c] text-white text-xs font-black uppercase cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading ? "Enregistrement..." : "Valider le mot de passe"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
