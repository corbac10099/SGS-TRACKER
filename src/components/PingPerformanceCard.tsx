"use client";

import React, { useState, useEffect, useMemo } from "react";
import { sounds } from "@/lib/soundEffects";
import {
  IconGlobe,
  IconShield,
  IconCheck,
  IconRefresh,
  IconRadio,
  IconAlertTriangle,
} from "./icons/SpyIcons";

export interface PingBracketData {
  bracket: string;
  key: string;
  matchesCount: number;
  winRate: number;
  avgKd: number;
}



export default function PingPerformanceCard({ matches = [] }: { matches?: any[] }) {
  const [pingData, setPingData] = useState<PingBracketData[]>([]);
  const [recordsCount, setRecordsCount] = useState<number>(0);
  const [selectedBracket, setSelectedBracket] = useState<string>("20_35");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRetentionRefused, setIsRetentionRefused] = useState<boolean>(false);

  // Vérifier la conformité RGPD / persistance des données
  useEffect(() => {
    if (typeof window !== "undefined") {
      const localRetention = localStorage.getItem("sgs_desktop_retention_accepted");
      if (localRetention === "refused") {
        setIsRetentionRefused(true);
        setIsLoading(false);
        return;
      }
    }
    fetchPingTelemetry();
  }, []);

  const fetchPingTelemetry = async () => {
    setIsLoading(true);
    try {
      const guestId = typeof window !== "undefined" ? sessionStorage.getItem("spycam_guest_id") : null;
      const headers: Record<string, string> = {};
      if (guestId) headers["x-guest-id"] = guestId;

      const res = await fetch("/api/tracker/ping", { headers });
      const data = await res.json();

      if (data.success && Array.isArray(data.analysis)) {
        const total = (data.records || []).length;
        setRecordsCount(total);

        const hasRealMatches = data.analysis.some((b: any) => b.matchesCount > 0);
        if (hasRealMatches) {
          setPingData(data.analysis);
          const topBracket = [...data.analysis].sort((a, b) => b.matchesCount - a.matchesCount)[0];
          if (topBracket) setSelectedBracket(topBracket.key);
        } else {
          setPingData([]);
        }
      }
    } catch (err) {
      console.warn("Telemetry ping non disponible:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const activeData = useMemo(() => {
    return pingData;
  }, [pingData]);

  const totalAnalyzed = useMemo(() => {
    return activeData.reduce((acc, b) => acc + b.matchesCount, 0);
  }, [activeData]);

  const activeBracketInfo = useMemo(() => {
    if (activeData.length === 0) return null;
    return activeData.find((b) => b.key === selectedBracket) || activeData[0];
  }, [activeData, selectedBracket]);

  const avgGlobalPing = useMemo(() => {
    if (activeData.length === 0) return 0;
    const weightedSum = activeData.reduce((acc, b) => {
      let mid = 25;
      if (b.key === "under_20") mid = 15;
      else if (b.key === "20_35") mid = 27;
      else if (b.key === "35_50") mid = 42;
      else if (b.key === "50_70") mid = 60;
      else if (b.key === "over_70") mid = 80;
      return acc + mid * b.matchesCount;
    }, 0);
    return Math.round(weightedSum / Math.max(totalAnalyzed, 1));
  }, [activeData, totalAnalyzed]);

  // ── Cas 1 : La persistance de données est explicitement refusée par l'utilisateur (RGPD) ──
  if (isRetentionRefused) {
    return (
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between gap-5 h-full">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">
              SGS Network Lab // Confidentialité
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
            RGPD Actif
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-black/30 border border-white/5 text-center flex flex-col items-center gap-3 my-auto">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <IconShield size={22} />
          </div>
          <h4 className="text-sm font-black uppercase text-white tracking-wider">
            Télémétrie Réseau Désactivée
          </h4>
          <p className="text-xs text-[var(--color-text-secondary)] max-w-md leading-relaxed">
            Conformément à vos préférences de confidentialité, vos mesures de latence et statistiques de ping ne sont pas stockées sur nos serveurs.
          </p>
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                localStorage.removeItem("sgs_desktop_retention_accepted");
                window.location.reload();
              }
            }}
            className="mt-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 transition-colors cursor-pointer"
          >
            Modifier mes préférences de conservation
          </button>
        </div>
      </div>
    );
  }

  // ── Cas 2 : Chargement initial ──
  if (isLoading) {
    return (
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center min-h-[320px] gap-3">
        <div className="w-7 h-7 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          Synchronisation de la télémétrie réseau...
        </span>
      </div>
    );
  }

  // ── Cas 3 : Aucune donnée d'overlay envoyée pour l'instant ──
  if (activeData.length === 0) {
    return (
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between gap-5 h-full">
        {/* Glow cyan discret */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-3xl pointer-events-none" />

        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">
                SGS Network Lab // Latence & Winrate
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
              Impact du Ping en Match
            </h3>
          </div>

          <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
            En Attente de Session
          </span>
        </div>

        {/* Centre : Invitation à l'overlay et simulation */}
        <div className="p-6 rounded-2xl bg-black/30 border border-white/5 text-center flex flex-col items-center gap-3 my-auto relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <IconRadio size={22} className="animate-pulse" />
          </div>

          <h4 className="text-sm font-black uppercase text-white tracking-wider">
            En Attente de Télémétrie Overlay
          </h4>
          <p className="text-xs text-[var(--color-text-secondary)] max-w-md leading-relaxed">
            Vos statistiques de ping se calculent automatiquement lorsque vous jouez avec l&apos;<strong>Application Desktop SGS</strong> et l&apos;<strong>Overlay en jeu</strong>.
          </p>

          <div className="pt-2">
            <span className="text-[11px] font-bold text-cyan-300/80 bg-cyan-950/40 border border-cyan-500/20 px-3.5 py-1.5 rounded-xl inline-block">
              📡 Démarrez l&apos;Overlay en jeu pour enregistrer votre latence réelle
            </span>
          </div>
        </div>

        {/* Pied : Statut de connexion */}
        <div className="text-[11px] text-[var(--color-text-secondary)] flex items-center justify-between border-t border-white/5 pt-3 relative z-10">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Capteur télémétrique prêt
          </span>
          <span className="text-[10px] text-gray-400">Précision : 1 ms</span>
        </div>
      </div>
    );
  }

  // ── Cas 4 : Données réelles présentes (ou aperçu activé) ──
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between gap-5 h-full">
      {/* Halo d'ambiance cyan subtil */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-3xl pointer-events-none" />

      {/* En-tête */}
      <div className="flex items-center justify-between gap-3 relative z-10 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">
              SGS Network Lab // Latence & Winrate
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
            Impact du Ping en Match
          </h3>
        </div>

        <div className="flex items-center gap-2">


          <div className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-right">
            <div className="text-[9px] font-black uppercase text-[var(--color-text-secondary)]">
              Parties
            </div>
            <div className="text-xs sm:text-sm font-black text-white">{totalAnalyzed} matchs</div>
          </div>
        </div>
      </div>

      {/* Barres interactives par tranche de ping */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 w-full relative z-10">
        {activeData.map((bracket) => {
          const isSelected = selectedBracket === bracket.key;
          const isGoodWinrate = bracket.winRate >= 50;

          return (
            <button
              key={bracket.key}
              type="button"
              onClick={() => {
                sounds.playClick();
                setSelectedBracket(bracket.key);
              }}
              className={`flex flex-col items-center gap-2 p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer text-center relative ${
                isSelected
                  ? "border-cyan-400 bg-cyan-400/10 shadow-[0_0_15px_rgba(34,211,238,0.25)] scale-102"
                  : "border-white/5 bg-black/20 hover:border-white/20"
              }`}
            >
              {/* Conteneur de jauge verticale */}
              <div className="w-full h-20 sm:h-24 bg-white/5 rounded-lg p-1 flex flex-col justify-end relative overflow-hidden">
                <div
                  className={`w-full rounded-md transition-all duration-500 ${
                    isGoodWinrate
                      ? "bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]"
                      : "bg-gradient-to-t from-red-600 to-[var(--color-val-red)]"
                  }`}
                  style={{ height: `${Math.max(15, bracket.winRate)}%` }}
                />
                <span className="absolute inset-x-0 bottom-1.5 text-center text-[10px] font-black text-white drop-shadow">
                  {bracket.winRate}%
                </span>
              </div>

              {/* Label de la tranche */}
              <span className="text-[10px] font-black text-white tracking-tight whitespace-nowrap">
                {bracket.bracket}
              </span>

              {/* Détail frags & KD */}
              <div className="flex flex-col text-[9px] text-[var(--color-text-secondary)]">
                <span>{bracket.matchesCount} m</span>
                <span className="font-bold text-gray-300">KD {bracket.avgKd}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Cadre de diagnostic analytique */}
      {activeBracketInfo && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-cyan-950/30 via-black/40 to-black/40 border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-start gap-2.5">
            <span className="text-base flex-shrink-0">💡</span>
            <div>
              <h4 className="text-[11px] font-black uppercase text-cyan-300 tracking-wider">
                Verdict de l&apos;Analyseur
              </h4>
              <p className="text-[11px] text-gray-300 mt-0.5 leading-relaxed">
                Votre efficacité reste maximale sous <strong>35 ms</strong> (KD {activeBracketInfo.avgKd}, Winrate {activeBracketInfo.winRate}%). Les retards d&apos;affichage apparaissent au-delà de 50 ms.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
            <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-right">
              <span className="text-[9px] uppercase font-bold text-gray-400 block">Tranche active</span>
              <span className="text-xs font-black text-cyan-400">{activeBracketInfo.bracket}</span>
            </div>

            <button
              onClick={() => {
                sounds.playClick();
                fetchPingTelemetry();
              }}
              title="Actualiser les métriques télémétriques"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-400 hover:text-white transition-all cursor-pointer"
            >
              <IconRefresh size={14} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
