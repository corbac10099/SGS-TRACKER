"use client";

import React from "react";
import "./landing.css";

export interface LandingPageProps {
  onEnterBeta: () => void;
  onOpenLogin: () => void;
}

export default function LandingPage({ onEnterBeta, onOpenLogin }: LandingPageProps) {
  return (
    <div className="spycam-landing">
      {/* Background Soft Glow */}
      <div className="sp-bg-glow" />

      {/* Top Navbar */}
      <header className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-3 select-none">
          <img
            src="/sgs-icon.jpg"
            alt="SGS-Tracker"
            className="h-10 sm:h-12 w-auto object-contain rounded-xl"
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={onEnterBeta}
            className="sp-btn-primary px-3.5 sm:px-4 py-2 text-xs flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>Accéder à la Bêta</span>
          </button>

          <button
            onClick={onOpenLogin}
            className="sp-btn-secondary px-3.5 sm:px-4 py-2 text-xs"
          >
            Se connecter
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-12 sm:pt-20 pb-16 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[11px] font-black uppercase tracking-widest text-[#ff4655] mb-6">
          <span>●</span>
          <span className="text-white/90">Tracker Tactique & Hub Stratégique</span>
        </div>

        {/* Main Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-tight text-white mb-5">
          Analysez, personnalisez et{" "}
          <span className="text-[#ff4655]">dominez vos parties.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-white/70 max-w-2xl mx-auto mb-8 leading-relaxed">
          Suivez votre Smart Rating, personnalisez votre profil avec vos thèmes et bannières, protégez vos données et explorez l'encyclopédie des agents VALORANT.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-sm mx-auto mb-16">
          <button
            onClick={onEnterBeta}
            className="sp-btn-primary w-full sm:w-auto px-6 py-3 text-xs sm:text-sm flex items-center justify-center gap-2"
          >
            <span>⚡</span>
            <span>Tester la Bêta Démo</span>
          </button>

          <button
            onClick={onOpenLogin}
            className="sp-btn-secondary w-full sm:w-auto px-6 py-3 text-xs sm:text-sm flex items-center justify-center gap-2"
          >
            <span>Mon Compte</span>
          </button>
        </div>

        {/* 4 Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          {/* Card 1: Performance & Smart Rating */}
          <div className="sp-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-[#ff4655]/15 border border-[#ff4655]/30 flex items-center justify-center text-lg">
                📊
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-white">
                  Smart Rating & Précision
                </h3>
                <span className="text-[10px] uppercase font-bold text-white/40">Analyse de Performance</span>
              </div>
            </div>
            <p className="text-xs text-white/60 leading-relaxed mb-4">
              Algorithme exclusif d'évaluation de votre impact : K/D, Headshot %, KAST, différentiel de dégâts (DDΔ) et progression par saison et mode de jeu.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center">
              <div className="bg-white/5 rounded-lg p-2">
                <div className="text-[9px] text-white/40 uppercase font-bold">K/D</div>
                <div className="text-sm font-black text-white">1.48</div>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <div className="text-[9px] text-white/40 uppercase font-bold">Headshot</div>
                <div className="text-sm font-black text-[#ff4655]">36%</div>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <div className="text-[9px] text-white/40 uppercase font-bold">Rating</div>
                <div className="text-sm font-black text-emerald-400">88.4</div>
              </div>
            </div>
          </div>

          {/* Card 2: Customization */}
          <div className="sp-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-[#ff4655]/15 border border-[#ff4655]/30 flex items-center justify-center text-lg">
                🎨
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-white">
                  Personnalisation Intégrale
                </h3>
                <span className="text-[10px] uppercase font-bold text-white/40">Profil sur-mesure</span>
              </div>
            </div>
            <p className="text-xs text-white/60 leading-relaxed mb-4">
              Importez votre bannière avec réglage de hauteur en direct, choisissez votre thème visuel (Crimson, Midnight, Ocean) et configurez les modules à afficher.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
              <span className="text-[10px] font-bold bg-white/5 px-2.5 py-1 rounded-md text-white/70">Bannières Custom</span>
              <span className="text-[10px] font-bold bg-white/5 px-2.5 py-1 rounded-md text-white/70">4 Thèmes Visuels</span>
              <span className="text-[10px] font-bold bg-white/5 px-2.5 py-1 rounded-md text-white/70">Stats Masquables</span>
            </div>
          </div>

          {/* Card 3: Privacy & Sharing */}
          <div className="sp-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-[#ff4655]/15 border border-[#ff4655]/30 flex items-center justify-center text-lg">
                🔒
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-white">
                  Confidentialité & Partage
                </h3>
                <span className="text-[10px] uppercase font-bold text-white/40">Contrôle des données</span>
              </div>
            </div>
            <p className="text-xs text-white/60 leading-relaxed mb-4">
              Partagez votre profil avec une URL personnalisée en 1 clic (sgs-tracker.gg/pseudo/home) ou basculez en mode 100% privé pour protéger votre historique.
            </p>
            <div className="bg-white/5 rounded-lg p-2.5 border border-white/5 flex items-center justify-between text-xs font-mono">
              <span className="text-white/80 truncate">sgs-tracker.gg/Gr4phØ/home</span>
              <span className="text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                Partage 1-Clic
              </span>
            </div>
          </div>

          {/* Card 4: Agents & News */}
          <div className="sp-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-[#ff4655]/15 border border-[#ff4655]/30 flex items-center justify-center text-lg">
                📖
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-white">
                  Encyclopédie & Actualités
                </h3>
                <span className="text-[10px] uppercase font-bold text-white/40">Hub Stratégique</span>
              </div>
            </div>
            <p className="text-xs text-white/60 leading-relaxed mb-4">
              Consultez les fiches détaillées de chaque agent avec leurs compétences et synergies, et suivez les notes de patch et équilibrages officiels en direct.
            </p>
            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
              <span className="text-[10px] font-bold bg-[#ff4655]/15 text-[#ff4655] px-2.5 py-1 rounded-md">Wiki 25+ Agents</span>
              <span className="text-[10px] font-bold bg-white/5 text-white/70 px-2.5 py-1 rounded-md">Patch Notes en Direct</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Card */}
      <section className="relative z-10 py-12 px-4 sm:px-6 max-w-3xl mx-auto text-center">
        <div className="sp-card-static p-8 border border-white/10 text-center">
          <h2 className="text-xl sm:text-2xl font-black uppercase text-white mb-2">
            Prêt à tester SGS-Tracker ?
          </h2>
          <p className="text-xs sm:text-sm text-white/60 max-w-md mx-auto mb-6">
            Accédez à toutes les fonctionnalités immédiatement avec un profil démo sans inscription requise.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onEnterBeta}
              className="sp-btn-primary px-6 py-2.5 text-xs uppercase"
            >
              ⚡ Lancer la Bêta Démo
            </button>
            <button
              onClick={onOpenLogin}
              className="sp-btn-secondary px-6 py-2.5 text-xs uppercase"
            >
              Se Connecter
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-6 px-4 text-center text-xs text-white/40">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="font-bold text-white/60">
            SGS-TRACKER — Tracker & Hub Stratégique VALORANT
          </div>
          <div>
            Non affilié à Riot Games. VALORANT est une marque de Riot Games, Inc.
          </div>
        </div>
      </footer>
    </div>
  );
}
