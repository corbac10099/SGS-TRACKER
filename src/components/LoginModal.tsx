"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { sounds } from "@/lib/soundEffects";
import { sanitizeRedirectTarget } from "@/lib/redirectUtils";

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

  // Load saved SGS account from localStorage, URL hints, or SSO probe
  useEffect(() => {
    if (typeof window !== "undefined") {
      // 1. Lire depuis localStorage
      try {
        const raw = localStorage.getItem("sgs_saved_account");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.name && parsed?.email) {
            setSavedAccount(parsed);
          }
        }
      } catch {}

      // 2. Lire depuis l'URL (?sgs_hint=...) si l'utilisateur vient de SGS
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const hint = urlParams.get("sgs_hint");
        if (hint) {
          const parsed = JSON.parse(decodeURIComponent(hint));
          if (parsed?.name && parsed?.email) {
            setSavedAccount(parsed);
            localStorage.setItem("sgs_saved_account", JSON.stringify(parsed));
            urlParams.delete("sgs_hint");
            const newSearch = urlParams.toString();
            const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "");
            window.history.replaceState({}, "", newUrl);
          }
        }
      } catch {}

      // 3. Écouter les messages de l'iframe sso-probe SGS
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === "SGS_ACTIVE_SESSION" && event.data?.user) {
          const u = event.data.user;
          const accountData: SavedSgsAccount = {
            name: u.name || u.email.split("@")[0] || "Joueur",
            email: u.email,
            image: u.image || undefined,
          };
          setSavedAccount(accountData);
          try {
            localStorage.setItem("sgs_saved_account", JSON.stringify(accountData));
          } catch {}
        }
      };

      window.addEventListener("message", handleMessage);
      return () => window.removeEventListener("message", handleMessage);
    }
  }, [isOpen]);

  // Synchronize active session to localStorage if connected
  useEffect(() => {
    if (session?.user?.email) {
      const u = session.user;
      const userEmail = u.email || "";
      const accountData: SavedSgsAccount = {
        name: u.name || (u as any).riotGameName || userEmail.split("@")[0] || "Joueur",
        email: userEmail,
        image: u.image || undefined,
      };
      try {
        localStorage.setItem("sgs_saved_account", JSON.stringify(accountData));
        setSavedAccount(accountData);
      } catch {}
    }
  }, [session]);

  // Reset form when modal opens
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
            setError("Échec de connexion avec Google. Veuillez réessayer.");
          } else if (urlErr === "Callback") {
            setError("Erreur lors de la validation du compte Google.");
          } else if (urlErr === "CredentialsSignin") {
            setError("Identifiants incorrects ou compte inexistant.");
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
  }, [isOpen, defaultMode]);

  // Close on Escape key
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

  // Calcul de l'URL cible de redirection sûre (évite formellement de boucler sur /login ou /register)
  const getSafeRedirectUrl = () => {
    if (typeof window === "undefined") return "/";
    try {
      const params = new URLSearchParams(window.location.search);
      const cb = params.get("callbackUrl");
      if (cb) {
        const sanitized = sanitizeRedirectTarget(cb);
        if (sanitized && sanitized !== "/login" && sanitized !== "/register") {
          return sanitized;
        }
      }
    } catch {}
    return sanitizeRedirectTarget(window.location.pathname + window.location.search);
  };

  const handlePostAuthSuccess = async (msg: string) => {
    setSuccess(msg);
    try {
      await update?.();
    } catch {}
    const target = getSafeRedirectUrl();
    setTimeout(() => {
      onClose();
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        if (currentPath === "/login" || currentPath === "/register") {
          router.replace(target && target !== "/login" && target !== "/register" ? target : "/");
        } else if (target && target !== currentPath && target !== "/") {
          router.push(target);
        }
      }
    }, 350);
  };

  // Handle Google Login
  const handleGoogleSignIn = async () => {
    sounds.playClick();
    setGoogleLoading(true);
    setError(null);
    try {
      const target = getSafeRedirectUrl();
      await signIn("google", { callbackUrl: target });
    } catch (err: any) {
      setError(err?.message || "Erreur de connexion Google.");
      setGoogleLoading(false);
    }
  };

  // Handle Quick Login with Saved SGS Account (1-Click SSO Handshake)
  const handleQuickSgsSignIn = () => {
    sounds.playClick();
    if (!savedAccount) return;
    if (savedAccount.provider === "credentials") {
      setEmail(savedAccount.email);
      setSuccess(`Compte ${savedAccount.name} prérempli. Saisissez votre mot de passe pour continuer.`);
      return;
    }
    setLoading(true);
    const sgsUrl = process.env.NEXT_PUBLIC_SGS_URL || "https://sgs-brown.vercel.app";
    const returnTo = window.location.origin;
    window.location.href = `${sgsUrl}/api/auth/sso?returnTo=${encodeURIComponent(returnTo)}`;
  };

  // Handle Email / Password Login or Register
  const handleCredentialsSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sounds.playClick();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError("Veuillez renseigner votre email et mot de passe.");
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
            email,
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
          email,
          password,
          redirect: false,
        });

        if (loginRes?.ok) {
          try {
            localStorage.setItem(
              "sgs_saved_account",
              JSON.stringify({ name: pseudo.trim(), email, provider: "credentials" })
            );
          } catch {}
          handlePostAuthSuccess("Compte créé avec succès ! Connexion...");
        } else {
          setMode("login");
          setSuccess("Compte créé avec succès ! Veuillez vous connecter.");
          setLoading(false);
        }
      } catch (err: any) {
        setError(err.message || "Erreur de connexion.");
        setLoading(false);
      }
      return;
    }

    // Mode Login
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Identifiants incorrects ou compte inexistant.");
        setLoading(false);
        return;
      }

      if (res?.ok) {
        try {
          localStorage.setItem(
            "sgs_saved_account",
            JSON.stringify({
              name: savedAccount?.name || email.split("@")[0],
              email,
              provider: "credentials",
            })
          );
        } catch {}
        handlePostAuthSuccess("Connexion réussie !");
      }
    } catch (err: any) {
      setError(err.message || "Erreur inattendue.");
      setLoading(false);
    }
  };

  const initialLetter = (savedAccount?.name || "U")[0].toUpperCase();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity duration-300 cursor-pointer"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-md bg-[#0d1117]/95 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_20px_70px_rgba(0,0,0,0.8),0_0_30px_rgba(255,70,85,0.15)] text-white z-10 overflow-hidden transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[var(--color-val-red)]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#58a6ff]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-6 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--color-val-red)] to-[#ff7b86] flex items-center justify-center shadow-[0_0_20px_rgba(255,70,85,0.4)]">
              <span className="font-black text-xs tracking-tighter text-white uppercase">SGS</span>
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white uppercase leading-tight">
                {mode === "login" ? "Connexion SGS" : "Créer un compte"}
              </h2>
              <p className="text-[11px] font-semibold text-gray-400">
                Compte unifié Spycam & Écosystème SGS
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

        {savedAccount && mode === "login" && (
          <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-white/[0.06] to-white/[0.02] border border-white/15 hover:border-[var(--color-val-red)]/50 transition-all duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                Compte SGS Détecté
              </span>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem("sgs_saved_account");
                    setSavedAccount(null);
                  } catch {}
                }}
                className="text-[10px] text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
              >
                Oublier
              </button>
            </div>

            <button
              type="button"
              onClick={handleQuickSgsSignIn}
              disabled={loading || googleLoading}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.05] hover:bg-[var(--color-val-red)]/15 border border-white/10 hover:border-[var(--color-val-red)]/40 transition-all duration-200 cursor-pointer text-left group"
            >
              <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--color-val-red)] to-[#ff7b86] flex items-center justify-center font-black text-sm text-white shadow-[0_0_15px_rgba(255,70,85,0.4)] flex-shrink-0">
                {initialLetter}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0d1117] rounded-full" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white truncate group-hover:text-[var(--color-val-red)] transition-colors">
                    Continuer en tant que {savedAccount.name}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 truncate">{savedAccount.email}</p>
              </div>
              <span className="text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all text-sm font-bold">
                →
              </span>
            </button>
          </div>
        )}

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
          <span>{googleLoading ? "Redirection Google..." : "Continuer avec Google"}</span>
        </button>

        <div className="relative flex items-center justify-center my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <span className="relative px-3 bg-[#0d1117] text-[10px] uppercase font-bold tracking-widest text-gray-400">
            {mode === "login" ? "Ou avec votre email" : "Ou par email"}
          </span>
        </div>

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
                placeholder="ex: Gr4phØ"
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
              placeholder="votre.email@exemple.com"
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
              id="sgs-modal-password"
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
            className="w-full py-3 rounded-2xl bg-[var(--color-val-red)] hover:brightness-110 text-[var(--color-accent-contrast,#ffffff)] font-bold text-xs uppercase tracking-wider shadow-accent-md hover:shadow-accent-lg transition-all duration-200 cursor-pointer active:scale-98 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : null}
            <span>
              {loading
                ? "Connexion..."
                : mode === "login"
                ? "Se connecter"
                : "Créer mon compte SGS"}
            </span>
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-white/10 text-center text-xs text-gray-400">
          {mode === "login" ? (
            <p>
              Pas encore de compte ?{" "}
              <button
                type="button"
                onClick={() => {
                  sounds.playTabSwitch();
                  setMode("register");
                  setError(null);
                }}
                className="text-[var(--color-val-red)] font-bold hover:underline cursor-pointer ml-1"
              >
                Créer un compte SGS
              </button>
            </p>
          ) : (
            <p>
              Vous avez déjà un compte ?{" "}
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

      {/* Hidden SSO Probe Iframe to detect active session on SGS */}
      <iframe
        src={process.env.NEXT_PUBLIC_SGS_URL ? `${process.env.NEXT_PUBLIC_SGS_URL}/sso-probe` : "https://sgs-brown.vercel.app/sso-probe"}
        className="hidden"
        style={{ display: "none", width: 0, height: 0, border: 0 }}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
