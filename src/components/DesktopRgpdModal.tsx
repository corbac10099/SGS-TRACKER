"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { isTauriEnvironment } from "@/lib/desktop";
import { sounds } from "@/lib/soundEffects";
import {
  IconShield,
  IconCrosshair,
  IconFlame,
  IconRadio,
  IconCheck,
  IconX,
  IconAlertTriangle,
} from "./icons/SpyIcons";

export default function DesktopRgpdModal() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [dataRetentionPolicy, setDataRetentionPolicy] = useState("1_season");
  const [dataRetentionCustomDays, setDataRetentionCustomDays] = useState(90);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vue de confirmation de refus
  const [isRefusalConfirmOpen, setIsRefusalConfirmOpen] = useState(false);

  // Détection du contexte overlay (fenêtre plus petite, fond transparent)
  const isOverlay = typeof window !== "undefined" && window.location.pathname.startsWith("/overlay");

  useEffect(() => {
    // 1. Uniquement dans l'application bureau PC (Tauri)
    if (!isTauriEnvironment()) {
      return;
    }

    // Attendre que la session soit chargée
    if (status === "loading") return;

    const sessionUser = session?.user as any;

    // 2. Si déjà répondu localement sur ce PC, vérifier la cohérence avec Neon
    const localAccepted = localStorage.getItem("sgs_desktop_retention_accepted");
    if (localAccepted === "true" || localAccepted === "refused") {
      // Auto-correction : si Neon a perdu la donnée (null), on réinitialise
      if (sessionUser && !sessionUser.dataRetentionAcceptedAt) {
        localStorage.removeItem("sgs_desktop_retention_accepted");
        setIsOpen(true);
      }
      return;
    }

    // 3. Vérifier si le compte connecté a déjà répondu sur Neon (session)
    if (sessionUser?.dataRetentionAcceptedAt) {
      localStorage.setItem("sgs_desktop_retention_accepted", "true");
      return;
    }

    // 4. Fallback : vérifier directement via l'API (session JWT peut être en retard)
    // Utile quand l'overlay s'ouvre alors que l'app vient d'accepter
    const guestId = typeof window !== "undefined" ? sessionStorage.getItem("spycam_guest_id") : null;
    const headers: Record<string, string> = {};
    if (guestId) headers["x-guest-id"] = guestId;
    fetch(`/api/user/settings${guestId ? `?guestId=${guestId}` : ""}`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.dataRetentionAcceptedAt) {
          localStorage.setItem("sgs_desktop_retention_accepted", "true");
          setIsOpen(false);
        } else {
          setIsOpen(true);
        }
      })
      .catch(() => {
        // En cas d'erreur réseau, afficher le modal par sécurité
        setIsOpen(true);
      });
  }, [session, status]);

  // Écouter les changements localStorage depuis l'autre fenêtre Tauri (cross-window sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "sgs_desktop_retention_accepted" && (e.newValue === "true" || e.newValue === "refused")) {
        setIsOpen(false);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  if (!isOpen) return null;

  // Soumission de l'acceptation avec politique de conservation choisie
  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);

    const guestId = typeof window !== "undefined" ? sessionStorage.getItem("spycam_guest_id") : null;
    const days =
      dataRetentionPolicy === "custom"
        ? dataRetentionCustomDays
        : dataRetentionPolicy === "1_season"
        ? 90
        : dataRetentionPolicy === "3_seasons"
        ? 270
        : dataRetentionPolicy === "1_year"
        ? 365
        : 9999;

    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(guestId ? { "x-guest-id": guestId } : {}),
        },
        body: JSON.stringify({
          dataRetentionPolicy,
          dataRetentionDays: days,
          guestId: guestId || undefined,
        }),
      });

      if (res.ok) {
        sounds.playClick();
        localStorage.setItem("sgs_desktop_retention_accepted", "true");
        setIsOpen(false);
        // Recharger la page pour que les graphiques et l'historique se mettent à jour
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.error || "Une erreur est survenue lors de l'enregistrement.");
      }
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Traitement du refus explicite
  const handleConfirmRefusal = async () => {
    setIsSubmitting(true);
    setError(null);

    const guestId = typeof window !== "undefined" ? sessionStorage.getItem("spycam_guest_id") : null;

    try {
      // Enregistre 0 jour et politique "refused" sur Neon
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(guestId ? { "x-guest-id": guestId } : {}),
        },
        body: JSON.stringify({
          dataRetentionPolicy: "refused",
          dataRetentionDays: 0,
          guestId: guestId || undefined,
        }),
      });

      sounds.playCancel();
      localStorage.setItem("sgs_desktop_retention_accepted", "refused");
      setIsOpen(false);
      setIsRefusalConfirmOpen(false);
      window.location.reload();
    } catch {
      // En cas d'échec réseau, on mémorise le refus localement
      localStorage.setItem("sgs_desktop_retention_accepted", "refused");
      setIsOpen(false);
      setIsRefusalConfirmOpen(false);
      window.location.reload();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[99999] flex items-center justify-center animate-in fade-in duration-200 ${
      isOverlay
        ? "bg-black/70 backdrop-blur-sm p-2"
        : "bg-black/85 backdrop-blur-md p-4"
    }`}>
      <div className={`w-full bg-[#0e1217] border border-white/10 rounded-2xl shadow-2xl flex flex-col text-left relative ${
        isOverlay
          ? "max-w-md p-4 max-h-full overflow-y-auto"
          : "max-w-xl p-6 sm:p-7"
      }`}>

        {/* MODAL SECONDAIRE : CONFIRMATION DE REFUS */}
        {isRefusalConfirmOpen ? (
          <div className="flex flex-col space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">
                <IconAlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">
                  Confirmer le refus de synchronisation
                </h3>
                <p className="text-xs text-white/50">
                  Cette action limite considérablement les capacités de l&apos;application
                </p>
              </div>
            </div>

            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-xs text-red-200/90 leading-relaxed space-y-2">
              <p className="font-semibold text-red-300">
                En refusant l&apos;enregistrement des métriques de match sur le serveur :
              </p>
              <ul className="list-disc list-inside space-y-1 text-white/70 pl-1">
                <li>L&apos;onglet tactique Spikes et heatmaps d&apos;attaque / défense sera désactivé.</li>
                <li>Le suivi des compétences d&apos;agents (flashes, dégâts, assists) ne sera pas sauvegardé.</li>
                <li>L&apos;analyse de corrélation Ping / Winrate restera vide.</li>
                <li>L&apos;historique de progression et les recommandations IA Coach seront indisponibles.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setIsRefusalConfirmOpen(false);
                }}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-xs font-semibold transition"
              >
                Retourner au choix
              </button>
              <button
                type="button"
                onClick={handleConfirmRefusal}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-red-600/30"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <IconX size={14} />
                    <span>Confirmer le refus</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* VUE PRINCIPALE : CHOIX DE RÉTENTION SOBRE & ÉLÉGANT */
          <div className="flex flex-col space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--color-val-red)]/10 border border-[var(--color-val-red)]/30 flex items-center justify-center text-[var(--color-val-red)] flex-shrink-0">
                  <IconShield size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-wide">
                    Conservation des métriques de match
                  </h2>
                  <p className="text-xs text-white/50">
                    SGS Tracker PC • Rétention des données d&apos;analyse
                  </p>
                </div>
              </div>
            </div>

            {/* Description concise */}
            <p className="text-xs text-white/70 leading-relaxed">
              {isOverlay
                ? "Définissez la durée de conservation de vos métriques tactiques sur le cloud."
                : "Pendant vos parties avec l\u0026apos;overlay actif, l\u0026apos;application enregistre vos métriques tactiques (spikes, utilitaires, latence). Définissez la durée de conservation sur le cloud."
              }
            </p>

            {/* 3 Cartes descriptives — masquées dans l'overlay pour économiser l'espace */}
            {!isOverlay && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-white/80">
                  <IconCrosshair size={14} className="text-[var(--color-val-red)]" />
                  <span className="text-xs font-semibold text-white">Poses de Spike</span>
                </div>
                <p className="text-[11px] text-white/40 leading-snug">
                  Zones de pose pour heatmaps et taux de victoire.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-white/80">
                  <IconFlame size={14} className="text-[var(--color-val-red)]" />
                  <span className="text-xs font-semibold text-white">Compétences</span>
                </div>
                <p className="text-[11px] text-white/40 leading-snug">
                  Flashes réussies, dégâts et assists par agent.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-white/80">
                  <IconRadio size={14} className="text-[var(--color-val-red)]" />
                  <span className="text-xs font-semibold text-white">Métriques Ping</span>
                </div>
                <p className="text-[11px] text-white/40 leading-snug">
                  Corrélation entre votre latence et le ratio K/D.
                </p>
              </div>
            </div>
            )}

            {/* Options de sélection */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50 block">
                Période de rétention :
              </span>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "1_season", label: "1 Saison", sub: "~90 jours", rec: true },
                  { id: "3_seasons", label: "3 Saisons", sub: "~9 mois", rec: false },
                  { id: "1_year", label: "1 An", sub: "365 jours", rec: false },
                  { id: "forever", label: "Illimité", sub: "Sans purge", rec: false },
                ].map((opt) => {
                  const isSelected = dataRetentionPolicy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setDataRetentionPolicy(opt.id);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-[var(--color-val-red)]/15 border-[var(--color-val-red)] text-white shadow-sm"
                          : "bg-white/[0.02] border-white/10 text-white/70 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{opt.label}</span>
                          {opt.rec && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[var(--color-val-red)] text-white">
                              Recommandé
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-white/40">{opt.sub}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${
                          isSelected
                            ? "border-[var(--color-val-red)] bg-[var(--color-val-red)] text-white"
                            : "border-white/20 text-transparent"
                        }`}
                      >
                        <IconCheck size={10} />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Option personnalisée discrète */}
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setDataRetentionPolicy("custom");
                }}
                className={`w-full p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                  dataRetentionPolicy === "custom"
                    ? "bg-[var(--color-val-red)]/15 border-[var(--color-val-red)]"
                    : "bg-white/[0.02] border-white/10 text-white/60 hover:border-white/20"
                }`}
              >
                <span className="text-xs font-medium text-white">Durée personnalisée en jours</span>
                {dataRetentionPolicy === "custom" ? (
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="number"
                      min="7"
                      max="730"
                      value={dataRetentionCustomDays}
                      onChange={(e) =>
                        setDataRetentionCustomDays(Math.max(7, parseInt(e.target.value) || 30))
                      }
                      className="w-16 px-2 py-0.5 rounded bg-black border border-white/20 text-xs font-bold text-center text-white focus:outline-none focus:border-[var(--color-val-red)]"
                    />
                    <span className="text-[11px] text-white/50">jours</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-white/40">Configurer</span>
                )}
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-xl">
                {error}
              </div>
            )}

            {/* Actions : Refuser vs Valider */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setIsRefusalConfirmOpen(true);
                }}
                className="text-xs text-white/50 hover:text-red-400 transition cursor-pointer font-medium px-2 py-1"
              >
                Refuser la synchronisation
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[var(--color-val-red)] hover:brightness-110 text-white rounded-xl text-xs font-bold transition shadow-md shadow-[var(--color-val-red)]/20 flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <IconCheck size={14} />
                    <span>Enregistrer et continuer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
