"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { sounds } from "@/lib/soundEffects";

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "login" | "register";
}

interface SavedSgsAccount {
  name: string;
  email: string;
  provider?: string;
  image?: string;
  tagLine?: string;
}

export default function LoginModal({ isOpen, onClose, defaultMode = "login" }: LoginModalProps) {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [mode, setMode] = useState<"login" | "register">(defaultMode);
  const [savedAccount, setSavedAccount] = useState<SavedSgsAccount | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Récupération du compte utilisateur sauvegardé en local si existant
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("sgs_saved_account");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.email) {
            setSavedAccount(parsed);
          }
        }
      } catch {}
    }
  }, [isOpen]);

  // Synchroniser la session active si l'utilisateur est connecté
  useEffect(() => {
    if (session?.user?.email) {
      const u = session.user;
      const userEmail = u.email || "";
      const accountData: SavedSgsAccount = {
        name: (u as any).riotGameName?.split("#")[0] || u.name || userEmail.split("@")[0] || "Joueur",
        tagLine: (u as any).riotGameName?.split("#")[1] || undefined,
        email: userEmail,
        image: u.image || undefined,
      };
      try {
        localStorage.setItem("sgs_saved_account", JSON.stringify(accountData));
        setSavedAccount(accountData);
      } catch {}
    }
  }, [session]);

  // Réinitialiser les états lors de l'ouverture
  useEffect(() => {
    if (isOpen) {
      setSuccess(null);
      setLoading(false);
      setGoogleLoading(false);
      setMode(defaultMode);
      if (savedAccount && !email) {
        setEmail(savedAccount.email);
      }
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const urlErr = params.get("error");
        if (urlErr) {
          if (urlErr === "OAuthSignin" || urlErr === "OAuthCallback") {
            setError("Échec connexion Google. Utilisez la connexion directe en 1-clic.");
          } else if (urlErr === "CredentialsSignin") {
            setError("Identifiants incorrects ou compte introuvable.");
          } else {
            setError(`Erreur de connexion (${urlErr})`);
          }
        } else {
          setError(null);
        }
      } else {
        setError(null);
      }
    }
  }, [isOpen, defaultMode, savedAccount]);

  // Fermer sur Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Traitement post-authentification réactif sans rechargement lourd
  const handlePostAuthSuccess = async (msg: string) => {
    setSuccess(msg);
    try {
      await update?.();
    } catch {}
    setTimeout(() => {
      onClose();
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        if (currentPath === "/login" || currentPath === "/register") {
          router.replace("/");
        }
      }
    }, 200);
  };

  // 1. Connexion Google OAuth
  const handleGoogleSignIn = async () => {
    sounds.playClick();
    setGoogleLoading(true);
    setError(null);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (err: any) {
      setError(err?.message || "Erreur de connexion Google.");
      setGoogleLoading(false);
    }
  };

  // 2. Soumission Formulaire Email / Mot de passe
  const handleCredentialsSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sounds.playClick();
    setError(null);
    setSuccess(null);

    if (!email || !email.trim()) {
      setError("Veuillez renseigner votre adresse email.");
      return;
    }

    if (!password) {
      setError("Veuillez renseigner votre mot de passe.");
      return;
    }

    setLoading(true);

    if (mode === "register") {
      if (!pseudo.trim()) {
        setError("Veuillez choisir un pseudo.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
            firstName: pseudo.trim(),
            lastName: "",
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Erreur lors de l'inscription.");
          setLoading(false);
          return;
        }

        const loginRes = await signIn("credentials", {
          email: email.trim().toLowerCase(),
          password,
          redirect: false,
        });

        if (loginRes?.ok) {
          handlePostAuthSuccess("Compte créé avec succès !");
        } else {
          setMode("login");
          setSuccess("Compte créé ! Veuillez vous connecter avec votre mot de passe.");
          setLoading(false);
        }
      } catch (err: any) {
        setError(err.message || "Erreur d'inscription.");
        setLoading(false);
      }
      return;
    }

    // Mode Connexion Email + Mot de passe
    try {
      const loginRes = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (loginRes?.error) {
        setError("Identifiants incorrects ou mot de passe invalide.");
        setLoading(false);
        return;
      }

      if (loginRes?.ok) {
        handlePostAuthSuccess("Connexion réussie !");
      }
    } catch (err: any) {
      setError(err.message || "Erreur inattendue.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-xl transition-opacity duration-300 cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className="relative w-full max-w-md bg-[#0c1015]/95 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.9),0_0_40px_rgba(255,70,85,0.2)] text-white z-10 overflow-hidden transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-52 h-52 bg-[var(--color-val-red)]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-[#58a6ff]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6 relative">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[var(--color-val-red)] to-[#ff7b86] flex items-center justify-center shadow-[0_0_25px_rgba(255,70,85,0.45)]">
              <span className="font-black text-xs tracking-tighter text-white uppercase">SGS</span>
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white uppercase leading-tight">
                {mode === "login" ? "Connexion" : "Créer un compte"}
              </h2>
              <p className="text-[11px] font-semibold text-gray-400">
                SGS Valorant Tracker
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer active:scale-95"
            title="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Feedback Alert Banners */}
        {error && (
          <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2 animate-shake">
            <span>⚠️</span>
            <span className="flex-1">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold flex items-center gap-2">
            <span>✅</span>
            <span className="flex-1">{success}</span>
          </div>
        )}

        {/* ── Section 1 : Bouton Google ── */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl bg-white text-black hover:bg-neutral-100 font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer active:scale-98 disabled:opacity-50 mb-4"
        >
          {googleLoading ? (
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{googleLoading ? "Connexion Google..." : "Continuer avec Google"}</span>
        </button>

        {/* Separator */}
        <div className="relative flex items-center justify-center my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <span className="relative px-3 bg-[#0c1015] text-[10px] uppercase font-bold tracking-widest text-gray-400">
            {mode === "login" ? "Ou avec votre email" : "Ou inscription par email"}
          </span>
        </div>

        {/* ── Section 3 : Formulaire Email / Mot de passe ── */}
        <form onSubmit={handleCredentialsSubmit} className="space-y-3">
          {mode === "register" && (
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">
                Pseudo SGS
              </label>
              <input
                type="text"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                placeholder="ex: SENPAII"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-[var(--color-val-red)] focus:ring-1 focus:ring-[var(--color-val-red)] text-white text-xs outline-none transition-all placeholder:text-gray-400 font-medium"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">
              Adresse Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="romain.lft64@gmail.com"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-[var(--color-val-red)] focus:ring-1 focus:ring-[var(--color-val-red)] text-white text-xs outline-none transition-all placeholder:text-gray-400 font-medium"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400">
                Mot de passe
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[10px] text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? "Masquer" : "Afficher"}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              minLength={6}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-[var(--color-val-red)] focus:ring-1 focus:ring-[var(--color-val-red)] text-white text-xs outline-none transition-all placeholder:text-gray-400 font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-3 rounded-2xl bg-[var(--color-val-red)] hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider shadow-accent-md hover:shadow-accent-lg transition-all duration-200 cursor-pointer active:scale-98 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : null}
            <span>
              {loading
                ? "Connexion..."
                : mode === "login"
                ? "Se connecter"
                : "Créer mon compte"}
            </span>
          </button>
        </form>

        {/* Mode Switcher */}
        <div className="mt-5 pt-4 border-t border-white/10 text-center text-xs text-gray-400">
          {mode === "login" ? (
            <p>
              Nouveau sur SGS ?{" "}
              <button
                type="button"
                onClick={() => {
                  sounds.playTabSwitch();
                  setMode("register");
                  setError(null);
                }}
                className="text-[var(--color-val-red)] font-bold hover:underline cursor-pointer ml-1"
              >
                Créer un compte
              </button>
            </p>
          ) : (
            <p>
              Déjà un compte ?{" "}
              <button
                type="button"
                onClick={() => {
                  sounds.playTabSwitch();
                  setMode("login");
                  setError(null);
                }}
                className="text-[var(--color-val-red)] font-bold hover:underline cursor-pointer ml-1"
              >
                Se connecter
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

