"use client";

import React, { useState, useEffect } from "react";
import {
  IconCrosshair,
  IconShield,
  IconFlame,
  IconDownload,
  IconCheck,
  IconSparkles,
  IconUsers,
  IconInfo,
  IconFileText,
  IconGamepad,
} from "@/components/icons/SpyIcons";
import AdBanner from "./AdBanner";

interface AppReleaseInfo {
  version: string;
  releaseName: string;
  releaseDate: string;
  filename: string;
  fileSize: string;
  downloadUrl: string;
  r2Url?: string;
  isPublished: boolean;
  minWindowsVersion: string;
  changelog: string[];
}

interface DownloadAppViewProps {
  onClose?: () => void;
}

export default function DownloadAppViewComponent({ onClose }: DownloadAppViewProps) {
  const [release, setRelease] = useState<AppReleaseInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadStarted, setDownloadStarted] = useState<boolean>(false);

  useEffect(() => {
    async function fetchRelease() {
      try {
        const res = await fetch("/api/app-release");
        if (res.ok) {
          const data = await res.json();
          setRelease(data);
        }
      } catch (err) {
        console.error("Erreur récupération release desktop:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRelease();
  }, []);

  const handleDownload = () => {
    setDownloadStarted(true);
    const targetUrl = release?.downloadUrl || "/installers/SGS-Tracker-Setup.exe";

    const link = document.createElement("a");
    link.href = targetUrl;
    link.download = release?.filename || "SGS-Tracker-Setup.exe";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => setDownloadStarted(false), 5000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 animate-fade-in text-white select-none">
      {/* ─── Banner Header ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#141b28]/95 via-[#0a0f18]/98 to-black p-8 md:p-12 mb-10 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 rounded-full bg-[var(--color-val-red)]/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider text-[var(--color-val-red)] mb-4">
              <span className="w-2 h-2 rounded-full bg-[var(--color-val-red)] animate-ping" />
              <span>Application Desktop Officielle pour Windows</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase leading-tight mb-4">
              SGS Tracker{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-val-red)] to-[#ff7b86]">
                Desktop
              </span>
            </h1>

            <p className="text-sm md:text-base text-white/70 max-w-xl leading-relaxed mb-6">
              L&apos;expérience Valorant ultime avec un overlay in-game temps réel, le mode clics traversants (F10), l&apos;intégration Discord Rich Presence et un suivi des statistiques ultra-précis.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <button
                onClick={handleDownload}
                disabled={release?.isPublished === false}
                className={`relative group px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all duration-300 transform active:scale-95 shadow-xl flex items-center gap-3 cursor-pointer ${
                  release?.isPublished === false
                    ? "bg-gray-700 text-white/50 cursor-not-allowed"
                    : "bg-[var(--color-val-red)] hover:bg-[#ff5565] text-white shadow-[0_0_25px_rgba(255,70,85,0.45)] hover:shadow-[0_0_35px_rgba(255,70,85,0.65)]"
                }`}
              >
                <IconDownload size={20} className="transition-transform group-hover:-translate-y-0.5" />
                <span>{downloadStarted ? "Téléchargement en cours..." : "Télécharger pour Windows"}</span>
              </button>

              {onClose && (
                <button
                  onClick={onClose}
                  className="px-5 py-4 rounded-2xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-white/80 transition-colors cursor-pointer"
                >
                  Retour au Tracker
                </button>
              )}
            </div>

            {/* Version Metadata */}
            <div className="flex items-center justify-center md:justify-start gap-4 mt-5 text-xs text-white/50 font-mono">
              <span>Version {release?.version || "1.0.0"}</span>
              <span>•</span>
              <span>{release?.fileSize || "16.1 MB"}</span>
              <span>•</span>
              <span>{release?.minWindowsVersion || "Windows 10 / 11 (64-bit)"}</span>
            </div>
          </div>

          {/* Graphic Badge */}
          <div className="relative flex items-center justify-center w-48 h-48 md:w-64 md:h-64 rounded-3xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 p-4 flex-shrink-0">
            <div className="w-full h-full rounded-2xl bg-black/50 border border-white/10 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-val-red)]/15 border border-[var(--color-val-red)]/30 flex items-center justify-center text-[var(--color-val-red)] mb-3 shadow-inner">
                <IconCrosshair size={32} />
              </div>
              <div className="font-black text-sm uppercase tracking-wider text-white">
                SGS Client v{release?.version || "1.0.0"}
              </div>
              <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                <IconCheck size={12} />
                <span>100% Conforme Riot Games</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Features Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md hover:border-[var(--color-val-red)]/40 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-val-red)]/10 border border-[var(--color-val-red)]/20 flex items-center justify-center text-[var(--color-val-red)] mb-4 group-hover:scale-110 transition-transform">
            <IconCrosshair size={22} />
          </div>
          <h3 className="font-bold text-base uppercase tracking-wider mb-2 text-white">
            Overlay In-Game Intel
          </h3>
          <p className="text-xs text-white/60 leading-relaxed">
            Affichez les compositions et rangs en direct. Basculez en mode combat avec la touche <kbd className="px-1 py-0.5 rounded bg-white/10 font-mono text-amber-300">F10</kbd> pour des clics 100% traversants sans gêner vos tirs.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md hover:border-indigo-500/40 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
            <IconGamepad size={22} />
          </div>
          <h3 className="font-bold text-base uppercase tracking-wider mb-2 text-white">
            Discord Rich Presence
          </h3>
          <p className="text-xs text-white/60 leading-relaxed">
            Partagez automatiquement votre agent, la carte et le score en direct sur votre statut Discord pour vos amis et votre communauté.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md hover:border-cyan-500/40 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
            <IconSparkles size={22} />
          </div>
          <h3 className="font-bold text-base uppercase tracking-wider mb-2 text-white">
            Moteur Ultra-Léger
          </h3>
          <p className="text-xs text-white/60 leading-relaxed">
            Développé en Rust avec Tauri 2.0 : consomme moins de 30 Mo de RAM et &lt;1% CPU. Aucun ralentissement sur vos fréquences d&apos;images.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md hover:border-emerald-500/40 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
            <IconShield size={22} />
          </div>
          <h3 className="font-bold text-base uppercase tracking-wider mb-2 text-white">
            Sécurisé & Conforme
          </h3>
          <p className="text-xs text-white/60 leading-relaxed">
            Interroge uniquement le client local Valorant et les APIs officielles Riot Games. Aucun fichier de jeu n&apos;est altéré.
          </p>
        </div>
      </div>

      {/* ─── Notes de mise à jour & Configuration requise ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Changelog */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md">
          <h3 className="text-base font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-white">
            <IconFileText size={18} className="text-[var(--color-val-red)]" />
            <span>Notes de Mise à Jour ({release?.releaseName || "v1.0.0"})</span>
          </h3>
          <ul className="space-y-2.5">
            {(release?.changelog || [
              "Overlay in-game avec mode clics traversants (F10) et bascule d'onglets",
              "Suppression complète des émojis et refonte des icônes SVG natives",
              "Prise en charge des parties personnalisées et sélection des équipes",
              "Synchronisation de la couleur d'accentuation du profil SGS",
              "Intégration du Discord Rich Presence avec choix du mode d'affichage"
            ]).map((note, index) => (
              <li key={index} className="flex items-start gap-3 text-xs text-white/80 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-val-red)] mt-1.5 shrink-0" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Configuration requise */}
        <div className="p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md">
          <h3 className="text-base font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-white">
            <IconInfo size={18} className="text-cyan-400" />
            <span>Configuration Requise</span>
          </h3>
          <div className="space-y-3 text-xs text-white/70">
            <div className="flex justify-between pb-2 border-b border-white/5">
              <span>Système :</span>
              <strong className="text-white font-mono">Windows 10 / 11 (64-bit)</strong>
            </div>
            <div className="flex justify-between pb-2 border-b border-white/5">
              <span>Processeur :</span>
              <strong className="text-white font-mono">Intel i3 / AMD Ryzen 3</strong>
            </div>
            <div className="flex justify-between pb-2 border-b border-white/5">
              <span>Mémoire vive :</span>
              <strong className="text-white font-mono">4 Go de RAM</strong>
            </div>
            <div className="flex justify-between">
              <span>Espace disque :</span>
              <strong className="text-white font-mono">50 Mo disponibles</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Discreet bottom Ad Banner */}
      <div className="mt-8">
        <AdBanner format="horizontal" minHeight={110} />
      </div>
    </div>
  );
}
