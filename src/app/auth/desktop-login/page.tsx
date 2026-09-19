"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

function DesktopLoginContent() {
  const searchParams = useSearchParams();
  const ticket = searchParams.get("ticket");
  const { data: session, status } = useSession();

  const [state, setState] = useState<"loading" | "idle" | "redirecting" | "completing" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    if (!ticket) {
      setState("error");
      setErrorMessage("Identifiant de session manquant dans l'URL.");
      return;
    }

    if (status === "loading") {
      setState("loading");
      return;
    }

    // 1. Si l'utilisateur est déjà connecté dans ce navigateur
    if (status === "authenticated" && session?.user?.email) {
      setState("completing");
      fetch("/api/auth/desktop/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setUserName(data.name || session.user?.name || session.user?.email || "Joueur");
            setState("success");
          } else {
            setState("error");
            setErrorMessage(data.error || "Échec de validation de la session.");
          }
        })
        .catch((err) => {
          setState("error");
          setErrorMessage(err.message || "Erreur réseau.");
        });
      return;
    }

    // 2. Si l'utilisateur n'est pas encore connecté, lui présenter le bouton Google
    if (status === "unauthenticated") {
      setState("idle");
    }
  }, [ticket, status, session]);

  const handleStartGoogleAuth = () => {
    setState("redirecting");
    const currentUrl = typeof window !== "undefined" ? window.location.href : `/auth/desktop-login?ticket=${ticket}`;
    signIn("google", { callbackUrl: currentUrl });
  };

  return (
    <div className="min-h-screen bg-[#0a0e13] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Halo d'ambiance Valorant */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[var(--color-val-red,#ff4655)]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#58a6ff]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Carte centrale */}
      <div className="relative w-full max-w-md bg-[#121820]/95 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl text-center z-10">
        {/* Logo SGS */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff4655] to-[#ff7b86] flex items-center justify-center shadow-[0_0_30px_rgba(255,70,85,0.4)] mb-6">
          <span className="font-black text-lg tracking-tighter text-white uppercase">SGS</span>
        </div>

        {/* État : Chargement */}
        {state === "loading" && (
          <div className="space-y-4">
            <div className="w-10 h-10 border-3 border-[#ff4655] border-t-transparent rounded-full animate-spin mx-auto" />
            <h1 className="text-xl font-bold uppercase tracking-wide">Vérification...</h1>
            <p className="text-xs text-gray-400">Préparation de la connexion avec SGS-Tracker.</p>
          </div>
        )}

        {/* État : Prêt à se connecter (Bouton Google) */}
        {state === "idle" && (
          <div className="space-y-5">
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-white">Connexion Bureau</h1>
              <p className="text-xs text-gray-400 mt-1">
                Autorisez l&apos;application SGS-Tracker à se lier à votre compte Google.
              </p>
            </div>

            <button
              onClick={handleStartGoogleAuth}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl bg-white text-black hover:bg-neutral-100 font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-xl cursor-pointer active:scale-98"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continuer avec Google</span>
            </button>
          </div>
        )}

        {/* État : Redirection vers Google */}
        {state === "redirecting" && (
          <div className="space-y-4">
            <div className="w-10 h-10 border-3 border-[#ff4655] border-t-transparent rounded-full animate-spin mx-auto" />
            <h1 className="text-xl font-bold uppercase tracking-wide">Connexion Google</h1>
            <p className="text-xs text-gray-400">Redirection vers Google en cours...</p>
          </div>
        )}

        {/* État : Validation du ticket */}
        {state === "completing" && (
          <div className="space-y-4">
            <div className="w-10 h-10 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <h1 className="text-xl font-bold uppercase tracking-wide">Synchronisation</h1>
            <p className="text-xs text-gray-400">Liaison avec votre application SGS-Tracker...</p>
          </div>
        )}

        {/* État : Succès */}
        {state === "success" && (
          <div className="space-y-5 animate-scale-up">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto text-2xl font-black">
              ✓
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-white">Connexion Réussie !</h1>
              <p className="text-xs font-semibold text-emerald-400 mt-1">Connecté sous {userName}</p>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed bg-white/[0.03] border border-white/5 p-3.5 rounded-2xl">
              Votre session a été transmise à votre application de bureau. Vous pouvez maintenant fermer cet onglet et retourner sur <strong className="text-white font-bold">SGS-Tracker</strong>.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  try {
                    window.close();
                  } catch {}
                }}
                className="w-full py-3 rounded-xl bg-[#ff4655] hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg"
              >
                Fermer cet onglet
              </button>
            </div>
          </div>
        )}

        {/* État : Erreur */}
        {state === "error" && (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto text-2xl font-black">
              ✕
            </div>
            <h1 className="text-xl font-bold uppercase tracking-wide text-red-400">Erreur de Connexion</h1>
            <p className="text-xs text-gray-400">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider transition-all"
            >
              Réessayer
            </button>
          </div>
        )}
      </div>

      <p className="mt-8 text-[11px] text-gray-400 tracking-wider uppercase font-semibold">
        SGS-Tracker • Système d&apos;authentification externe sécurisé
      </p>
    </div>
  );
}

export default function DesktopLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0e13] text-white flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#ff4655] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DesktopLoginContent />
    </Suspense>
  );
}
