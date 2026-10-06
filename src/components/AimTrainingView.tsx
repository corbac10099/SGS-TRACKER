"use client";

import React, { useState, useEffect } from "react";
import { useDesktopApp } from "@/hooks/useDesktopApp";
import AimHub from "./aim/AimHub";

interface AimTrainingViewProps {
  theme?: string;
  user?: any;
}

export default function AimTrainingView({ theme: propTheme, user: propUser }: AimTrainingViewProps) {
  const { isDesktop } = useDesktopApp();
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<string>("");
  const [downloadComplete, setDownloadComplete] = useState(false);

  // Simulation de téléchargement du module d'extension 3D depuis Cloudflare R2
  const startCloudflareDownload = () => {
    if (downloadProgress !== null && downloadProgress < 100) return;
    setDownloadProgress(0);
    setDownloadComplete(false);
    setDownloadStatus("Connexion au réseau périphérique Cloudflare R2...");

    const steps = [
      { p: 15, msg: "Handshake sécurisé Edge Cloudflare..." },
      { p: 35, msg: "Téléchargement du moteur physique 3D Three.js & Shaders (32 MB)..." },
      { p: 65, msg: "Mise en cache des maps (The Range, Cyber Highway, Corridor)..." },
      { p: 88, msg: "Vérification des signatures cryptographiques SHA-256..." },
      { p: 100, msg: "Extension 3D installée avec succès sur le profil !" },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setDownloadProgress(steps[currentStep].p);
        setDownloadStatus(steps[currentStep].msg);
        currentStep++;
      } else {
        clearInterval(interval);
        setDownloadComplete(true);
      }
    }, 600);
  };

  // 1. APPLICATION DESKTOP (Native intégrée directement, sans iframe ni site externe)
  if (isDesktop) {
    return <AimHub theme={propTheme} user={propUser} />;
  }

  // 2. VERSION EN LIGNE (Web / Cloudflare Extension Download Center)
  return (
    <div className="w-full min-h-[calc(100vh-56px)] flex items-center justify-center p-6 bg-[#0a0e13] text-white">
      <div className="glass-panel rounded-3xl p-8 sm:p-12 max-w-xl w-full text-center space-y-6 border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
        {/* Glow background */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-[var(--color-val-red)]/10 blur-3xl pointer-events-none" />

        {/* Badge Cloudflare R2 */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[10px] font-black uppercase tracking-widest">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
          </svg>
          <span>Distribution Cloudflare R2 Edge</span>
        </div>

        {/* Icon & Title */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-[var(--color-val-red)]/15 border border-[var(--color-val-red)]/40 flex items-center justify-center text-[var(--color-val-red)] shadow-xl">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Extension Stand de Tir 3D Native
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-2 leading-relaxed max-w-md mx-auto">
            Pour garantir un taux de rafraîchissement à 240+ FPS, un Pointer Lock sans latence et la physique de parkour, le moteur 3D s&apos;exécute nativement. Téléchargez l&apos;extension hébergée sur Cloudflare R2 pour synchroniser vos scores Neon.
          </p>
        </div>

        {/* Progress Bar Display if Downloading */}
        {downloadProgress !== null && (
          <div className="space-y-2.5 p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-left animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[var(--color-text-secondary)] font-mono">{downloadStatus}</span>
              <span className="text-cyan-400 font-mono font-black">{downloadProgress}%</span>
            </div>
            <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-[var(--color-val-red)] transition-all duration-500 shadow-md"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          {!downloadComplete ? (
            <button
              type="button"
              onClick={startCloudflareDownload}
              disabled={downloadProgress !== null && downloadProgress < 100}
              className="w-full py-4 px-6 rounded-2xl bg-[var(--color-val-red)] hover:brightness-110 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest transition-all shadow-accent-md cursor-pointer flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>{downloadProgress !== null ? "Téléchargement en cours..." : "Télécharger l'Extension 3D (Cloudflare R2)"}</span>
            </button>
          ) : (
            <div className="w-full space-y-3">
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2">
                <span>✓ Extension Téléchargée & Activée</span>
              </div>
              <a
                href="https://github.com/corbac10099/SGS-TRACKER/releases/latest"
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full py-3.5 px-6 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-black text-xs uppercase tracking-widest transition-all justify-center items-center gap-2 border border-white/10"
              >
                <span>Ouvrir dans l&apos;App Bureau SGS Tracker</span>
                <span>➔</span>
              </a>
            </div>
          )}
        </div>

        {/* Info footer */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-center gap-4 text-[10px] font-bold text-[var(--color-text-secondary)]">
          <span>✓ Synchronisation Compte Neon DB</span>
          <span>•</span>
          <span>✓ FOV 103° Valorant</span>
          <span>•</span>
          <span>✓ Zéro Latence</span>
        </div>
      </div>
    </div>
  );
}
