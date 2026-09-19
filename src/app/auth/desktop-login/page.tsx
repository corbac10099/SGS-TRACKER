"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

function DesktopLoginContent() {
  const searchParams = useSearchParams();
  const ticket = searchParams.get("ticket");
  const { data: session, status } = useSession();

  const [state, setState] = useState<"loading" | "redirecting" | "completing" | "success" | "error">("loading");
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

    // 2. Si l'utilisateur n'est pas encore connecté, lancer le flux Google
    if (status === "unauthenticated") {
      setState("redirecting");
      // Redirige directement vers Google OAuth avec retour sur cette même page
      const currentUrl = typeof window !== "undefined" ? window.location.href : `/auth/desktop-login?ticket=${ticket}`;
      signIn("google", { callbackUrl: currentUrl });
    }
  }, [ticket, status, session]);

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
