"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  IconTrophy,
  IconSearch,
  IconCrown,
  IconTarget,
  IconUsers,
  IconEye,
  IconFlame,
  IconSparkles,
  IconRefresh,
  IconShield,
} from "./icons/SpyIcons";
import { LeaderboardPlayerEntry } from "@/lib/valorant/types";
import { getPlayerAvatar } from "./LobbiesView";
import { sounds } from "@/lib/soundEffects";

export interface LeaderboardViewProps {
  onSelectPlayer?: (riotId: string) => void;
}

const REGIONS = [
  { id: "eu", label: "Europe", code: "EU", flag: "🇪🇺" },
  { id: "na", label: "North America", code: "NA", flag: "🇺🇸" },
  { id: "ap", label: "Asia Pacific", code: "AP", flag: "🌏" },
  { id: "kr", label: "Korea", code: "KR", flag: "🇰🇷" },
  { id: "br", label: "Brazil", code: "BR", flag: "🇧🇷" },
  { id: "latam", label: "Latin America", code: "LAT", flag: "🇲🇽" },
];

type SortMode = "rank" | "rr" | "wins";
type FilterScope = "all" | "top10" | "top25";

export default function LeaderboardViewComponent({ onSelectPlayer }: LeaderboardViewProps) {
  const [region, setRegion] = useState<string>("eu");
  const [search, setSearch] = useState<string>("");
  const [players, setPlayers] = useState<LeaderboardPlayerEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [sortMode, setSortMode] = useState<SortMode>("rank");
  const [filterScope, setFilterScope] = useState<FilterScope>("all");

  const loadLeaderboard = (showRefreshAnim = false) => {
    if (showRefreshAnim) setRefreshing(true);
    else setLoading(true);

    fetch(`/api/valorant/leaderboard?region=${region}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && Array.isArray(data.players)) {
          setPlayers(data.players);
        } else {
          setPlayers([]);
        }
      })
      .catch(() => setPlayers([]))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    loadLeaderboard(false);
  }, [region]);

  // Filtrage et Tri
  const processedPlayers = useMemo(() => {
    let list = [...players];

    // Recherche texte (pseudo ou tag)
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          (p.gameName || "").toLowerCase().includes(q) ||
          (p.tagLine || "").toLowerCase().includes(q)
      );
    }

    // Filtre de scope (Top 10 / Top 25 / All)
    if (filterScope === "top10") {
      list = list.slice(0, 10);
    } else if (filterScope === "top25") {
      list = list.slice(0, 25);
    }

    // Tri
    if (sortMode === "rr") {
      list.sort((a, b) => (b.rankedRating || 0) - (a.rankedRating || 0));
    } else if (sortMode === "wins") {
      list.sort((a, b) => (b.numberOfWins || 0) - (a.numberOfWins || 0));
    } else {
      list.sort((a, b) => a.leaderboardRank - b.leaderboardRank);
    }

    return list;
  }, [players, search, filterScope, sortMode]);

  // Top 3 officiels pour le podium (non filtrés par recherche)
  const top1 = players.find((p) => p.leaderboardRank === 1) || players[0];
  const top2 = players.find((p) => p.leaderboardRank === 2) || players[1];
  const top3 = players.find((p) => p.leaderboardRank === 3) || players[2];

  // Calculs KPI
  const statsSummary = useMemo(() => {
    if (players.length === 0) return null;
    const maxRR = Math.max(...players.map((p) => p.rankedRating || 0));
    const minRR = Math.min(...players.map((p) => p.rankedRating || 0));
    const top10 = players.slice(0, 10);
    const avgRRTop10 =
      top10.length > 0
        ? Math.round(
            top10.reduce((acc, p) => acc + (p.rankedRating || 0), 0) / top10.length
          )
        : 0;
    const mostWinsPlayer = [...players].sort(
      (a, b) => (b.numberOfWins || 0) - (a.numberOfWins || 0)
    )[0];

    return { maxRR, minRR, avgRRTop10, mostWinsPlayer };
  }, [players]);

  const maxLeaderRR = top1?.rankedRating || 1200;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-in fade-in duration-300 pb-24">
      {/* ═══ HERO BANNER ESPORTS ═══ */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#131b26]/95 via-[#0b0e14]/98 to-[#181119]/95 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl">
        {/* Glows d'ambiance */}
        <div className="absolute -top-10 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-96 h-96 bg-[var(--color-val-red)]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-wider">
                <IconTrophy size={13} className="text-amber-400" />
                <span>Officiel Riot Games • Radiant Tier</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-mono font-bold uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live API Riot
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              LEADERBOARD <span className="text-[var(--color-val-red)]">RÉGIONAL</span>
            </h1>

            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
              Consultez en direct les meilleurs joueurs Radiant et Immortal de la scène compétitive Valorant officielle.
            </p>
          </div>

          {/* SÉLECTEUR DE RÉGION & BOUTON REFRESH */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-md">
              {REGIONS.map((r) => {
                const isActive = region === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      sounds.playTabSwitch();
                      setRegion(r.id);
                    }}
                    onMouseEnter={() => sounds.playHover()}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none active:scale-95 ${
                      isActive
                        ? "bg-[var(--color-val-red)] text-white shadow-[0_0_20px_rgba(255,70,85,0.4)]"
                        : "text-neutral-400 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    <span>{r.flag}</span>
                    <span>{r.code}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                loadLeaderboard(true);
              }}
              title="Rafraîchir les données en direct"
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-all cursor-pointer flex items-center justify-center self-end sm:self-auto"
            >
              <IconRefresh size={16} className={refreshing ? "animate-spin text-[var(--color-val-red)]" : ""} />
            </button>
          </div>
        </div>

        {/* KPI CARDS BAR */}
        {statsSummary && !loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 mt-6 border-t border-white/10 relative z-10">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block mb-1">
                👑 Top 1 Actuel
              </span>
              <div className="text-sm sm:text-base font-black text-white truncate">
                {top1?.gameName || "Inconnu"}
              </div>
              <span className="text-xs font-bold text-amber-300 font-mono">
                {top1?.rankedRating} RR
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-secondary)] block mb-1">
                ⚡ Seuil Radiant
              </span>
              <div className="text-sm sm:text-base font-black text-white font-mono">
                {statsSummary.minRR} RR
              </div>
              <span className="text-[10px] text-neutral-400">Palier minimum</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-secondary)] block mb-1">
                🔥 Record de Victoires
              </span>
              <div className="text-sm sm:text-base font-black text-white truncate">
                {statsSummary.mostWinsPlayer?.gameName}
              </div>
              <span className="text-xs font-bold text-emerald-400 font-mono">
                {statsSummary.mostWinsPlayer?.numberOfWins} wins
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-secondary)] block mb-1">
                📊 Moyenne Top 10
              </span>
              <div className="text-sm sm:text-base font-black text-white font-mono">
                {statsSummary.avgRRTop10} RR
              </div>
              <span className="text-[10px] text-neutral-400">Niveau d'élite</span>
            </div>
          </div>
        )}
      </div>

      {/* ═══ PODIUM DES CHAMPIONS (#1, #2, #3) ═══ */}
      {!loading && top1 && top2 && top3 && !search && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-end pt-2">
          {/* #2 SILVER (Left) */}
          <div className="order-2 md:order-1 rounded-3xl p-6 border border-slate-400/30 bg-gradient-to-b from-[#18202c]/80 via-[#10141c]/90 to-black/90 backdrop-blur-xl space-y-4 shadow-xl hover:border-slate-300/60 transition-all group relative overflow-hidden">
            <div className="absolute -top-12 -left-12 w-36 h-36 bg-slate-300/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-400 to-slate-200 text-black font-black text-sm flex items-center justify-center shadow-lg">
                #2
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-400/15 border border-slate-400/30 text-slate-200 text-[10px] font-black uppercase tracking-wider">
                Vice-Champion
              </span>
            </div>

            <div className="flex items-center gap-3.5 relative z-10">
              <img
                src={getPlayerAvatar(top2.gameName)}
                alt={top2.gameName}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-300 shadow-md group-hover:scale-105 transition-transform"
              />
              <div className="min-w-0">
                <div className="text-base sm:text-lg font-black text-white truncate">
                  {top2.gameName}
                </div>
                <div className="text-xs text-slate-400 font-mono font-bold">
                  #{top2.tagLine}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-3 border-t border-white/10 relative z-10">
              <span className="text-amber-400 font-black text-sm font-mono">
                {top2.rankedRating} <span className="text-[10px] text-amber-400/70">RR</span>
              </span>
              <span className="text-slate-300 font-bold flex items-center gap-1">
                <IconFlame size={12} className="text-orange-400" />
                {top2.numberOfWins} wins
              </span>
            </div>

            {onSelectPlayer && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onSelectPlayer(`${top2.gameName}#${top2.tagLine}`);
                }}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-black uppercase tracking-wider text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
              >
                <IconEye size={13} />
                <span>Inspecter</span>
              </button>
            )}
          </div>

          {/* #1 GOLD CHAMPION (Center, Elevated) */}
          <div className="order-1 md:order-2 rounded-3xl p-7 border-2 border-amber-400/60 bg-gradient-to-b from-amber-500/25 via-[#1b1509]/95 to-black/95 backdrop-blur-2xl space-y-5 shadow-[0_0_40px_rgba(245,158,11,0.25)] hover:border-amber-300 transition-all md:-translate-y-4 group relative overflow-hidden">
            {/* Lueur dorée divine */}
            <div className="absolute -top-16 inset-x-0 h-40 bg-gradient-to-b from-amber-400/20 to-transparent blur-xl pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              <span className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.7)] animate-pulse">
                <IconCrown size={14} className="text-black" />
                <span>CHAMPION #1</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                Radiant Suprême
              </span>
            </div>

            <div className="flex items-center gap-4 relative z-10">
              <div className="relative">
                <img
                  src={getPlayerAvatar(top1.gameName)}
                  alt={top1.gameName}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.5)] group-hover:scale-105 transition-transform"
                />
                <span className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-amber-400 border-2 border-black flex items-center justify-center text-black text-xs font-black">
                  👑
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-black text-white truncate drop-shadow-md">
                  {top1.gameName}
                </div>
                <div className="text-xs font-mono font-bold text-amber-300">
                  #{top1.tagLine}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-amber-500/20 relative z-10">
              <div>
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-200 font-mono">
                  {top1.rankedRating}
                </span>
                <span className="text-xs text-amber-400/80 font-black ml-1">RR</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-white flex items-center gap-1">
                  <IconFlame size={14} className="text-amber-400" />
                  {top1.numberOfWins} Victoires
                </span>
                <span className="text-[10px] text-amber-400/70 font-semibold">Taux d'élite</span>
              </div>
            </div>

            {onSelectPlayer && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onSelectPlayer(`${top1.gameName}#${top1.tagLine}`);
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 active:scale-98"
              >
                <IconEye size={15} className="text-black" />
                <span>Inspecter le Leader</span>
              </button>
            )}
          </div>

          {/* #3 BRONZE (Right) */}
          <div className="order-3 rounded-3xl p-6 border border-amber-700/40 bg-gradient-to-b from-[#21160d]/80 via-[#140e08]/90 to-black/90 backdrop-blur-xl space-y-4 shadow-xl hover:border-amber-600/60 transition-all group relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-700/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-700 to-amber-500 text-white font-black text-sm flex items-center justify-center shadow-lg">
                #3
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-700/20 border border-amber-700/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                Challenger
              </span>
            </div>

            <div className="flex items-center gap-3.5 relative z-10">
              <img
                src={getPlayerAvatar(top3.gameName)}
                alt={top3.gameName}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-600/70 shadow-md group-hover:scale-105 transition-transform"
              />
              <div className="min-w-0">
                <div className="text-base sm:text-lg font-black text-white truncate">
                  {top3.gameName}
                </div>
                <div className="text-xs text-amber-400/80 font-mono font-bold">
                  #{top3.tagLine}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-3 border-t border-white/10 relative z-10">
              <span className="text-amber-400 font-black text-sm font-mono">
                {top3.rankedRating} <span className="text-[10px] text-amber-400/70">RR</span>
              </span>
              <span className="text-slate-300 font-bold flex items-center gap-1">
                <IconFlame size={12} className="text-amber-500" />
                {top3.numberOfWins} wins
              </span>
            </div>

            {onSelectPlayer && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onSelectPlayer(`${top3.gameName}#${top3.tagLine}`);
                }}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-black uppercase tracking-wider text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
              >
                <IconEye size={13} />
                <span>Inspecter</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ═══ BARRE D'OUTILS : SCOPES, TRI & RECHERCHE ═══ */}
      <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-4 sm:p-6 space-y-5 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Scopes Tabs (Tous, Top 10, Top 25) */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/10 w-fit">
            <button
              type="button"
              onClick={() => {
                sounds.playTabSwitch();
                setFilterScope("all");
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                filterScope === "all"
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Tous ({players.length})
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playTabSwitch();
                setFilterScope("top10");
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                filterScope === "top10"
                  ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Top 10 Élite
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playTabSwitch();
                setFilterScope("top25");
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                filterScope === "top25"
                  ? "bg-white/15 text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Top 25
            </button>
          </div>

          {/* Tri & Recherche */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Boutons de Tri */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mr-1">
                Trier par :
              </span>
              <button
                type="button"
                onClick={() => setSortMode("rank")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  sortMode === "rank"
                    ? "bg-[var(--color-val-red)] text-white"
                    : "bg-white/5 text-neutral-400 hover:text-white"
                }`}
              >
                Rang
              </button>
              <button
                type="button"
                onClick={() => setSortMode("rr")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  sortMode === "rr"
                    ? "bg-[var(--color-val-red)] text-white"
                    : "bg-white/5 text-neutral-400 hover:text-white"
                }`}
              >
                RR
              </button>
              <button
                type="button"
                onClick={() => setSortMode("wins")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  sortMode === "wins"
                    ? "bg-[var(--color-val-red)] text-white"
                    : "bg-white/5 text-neutral-400 hover:text-white"
                }`}
              >
                Wins
              </button>
            </div>

            {/* Input Recherche */}
            <div className="relative min-w-[220px]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrer par pseudo ou #tag..."
                className="w-full px-4 py-2 pl-9 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[var(--color-val-red)] transition-all"
              />
              <span className="absolute left-3 top-2.5 text-neutral-500">
                <IconSearch size={14} />
              </span>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-2 text-xs text-neutral-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ═══ TABLEAU CLASSEMENT OFFICIEL ═══ */}
        {loading ? (
          <div className="text-center py-24 space-y-4">
            <div className="w-12 h-12 border-2 border-[var(--color-val-red)] border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-xs font-black text-white uppercase tracking-widest">
              Synchronisation avec l'API officielle Riot Games...
            </div>
          </div>
        ) : processedPlayers.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="text-4xl">🔍</div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              Aucun joueur trouvé
            </h3>
            <p className="text-xs text-neutral-400">
              Aucun joueur ne correspond à vos critères de recherche dans cette région.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-black uppercase tracking-wider text-[var(--color-text-secondary)]">
                  <th className="py-3 px-4">Rang</th>
                  <th className="py-3 px-4">Joueur & Équipe</th>
                  <th className="py-3 px-4">Palier Compétitif</th>
                  <th className="py-3 px-4 text-right">Points RR</th>
                  <th className="py-3 px-4 text-right">Victoires</th>
                  <th className="py-3 px-4 text-center">Profil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {processedPlayers.map((player) => {
                  const isTop1 = player.leaderboardRank === 1;
                  const isTop2 = player.leaderboardRank === 2;
                  const isTop3 = player.leaderboardRank === 3;
                  const isTop10 = player.leaderboardRank <= 10;
                  const rrRatio = Math.min(100, Math.max(10, Math.round(((player.rankedRating || 0) / maxLeaderRR) * 100)));

                  return (
                    <tr
                      key={player.puuid || `${player.gameName}_${player.tagLine}_${player.leaderboardRank}`}
                      className="hover:bg-white/[0.04] transition-colors group"
                    >
                      {/* RANG */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center justify-center font-black text-xs px-2.5 py-1 rounded-lg ${
                            isTop1
                              ? "bg-amber-400 text-black shadow-md shadow-amber-400/40"
                              : isTop2
                              ? "bg-slate-300 text-black"
                              : isTop3
                              ? "bg-amber-700 text-white"
                              : isTop10
                              ? "bg-[var(--color-val-red)]/20 text-[var(--color-val-red)] border border-[var(--color-val-red)]/40 font-bold"
                              : "bg-white/5 text-white/80 border border-white/10 font-medium"
                          }`}
                        >
                          #{player.leaderboardRank}
                        </span>
                      </td>

                      {/* JOUEUR & AVATAR */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getPlayerAvatar(player.gameName)}
                            alt={player.gameName}
                            className="w-9 h-9 rounded-xl object-cover border border-white/15 flex-shrink-0 group-hover:scale-105 transition-transform"
                          />
                          <div className="min-w-0">
                            <span className="font-black text-sm text-white truncate block group-hover:text-[var(--color-val-red)] transition-colors">
                              {player.gameName}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono font-semibold">
                              #{player.tagLine}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* TIER */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {player.tierIcon ? (
                            <img
                              src={player.tierIcon}
                              alt={player.tierName}
                              className="w-6 h-6 object-contain filter drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]"
                            />
                          ) : (
                            <IconShield size={16} className="text-amber-400" />
                          )}
                          <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                            {player.tierName || "Radiant"}
                          </span>
                        </div>
                      </td>

                      {/* POINTS RR AVEC PROGRESSION RELATIVE */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-black text-sm text-amber-400 font-mono">
                            {player.rankedRating}{" "}
                            <span className="text-[10px] text-amber-400/70">RR</span>
                          </span>
                          <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden mt-1">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-300"
                              style={{ width: `${rrRatio}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* VICTOIRES */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-xs text-white/90 flex items-center justify-end gap-1 font-mono">
                          <IconFlame size={13} className="text-orange-400" />
                          {player.numberOfWins}
                        </span>
                      </td>

                      {/* ACTION / ANALYSER */}
                      <td className="py-3.5 px-4 text-center">
                        {onSelectPlayer && (
                          <button
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              onSelectPlayer(`${player.gameName}#${player.tagLine}`);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-[var(--color-val-red)] hover:text-white text-neutral-300 border border-white/10 hover:border-transparent transition-all text-xs font-bold cursor-pointer inline-flex items-center gap-1 active:scale-95 shadow-sm"
                          >
                            <IconEye size={12} />
                            <span>Analyser</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

