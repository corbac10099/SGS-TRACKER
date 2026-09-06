"use client";

import React, { useState, useEffect } from "react";
import { IconTrophy, IconCrosshair } from "./icons/SpyIcons";
import { LeaderboardPlayerEntry } from "@/lib/valorant/types";

export interface LeaderboardModalProps {
  onClose: () => void;
}

export default function LeaderboardModal({ onClose }: LeaderboardModalProps) {
  const [region, setRegion] = useState<string>("eu");
  const [search, setSearch] = useState<string>("");
  const [players, setPlayers] = useState<LeaderboardPlayerEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/valorant/leaderboard?region=${region}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && Array.isArray(data.players)) {
          setPlayers(data.players);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [region]);

  const filteredPlayers = players.filter((p) =>
    p.gameName.toLowerCase().includes(search.toLowerCase()) ||
    p.tagLine.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-full max-w-2xl bg-[#0c141d] border border-white/15 rounded-3xl p-4 sm:p-6 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <IconTrophy size={20} className="text-amber-400" />
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wider">Classement Officiel Riot</h3>
              <span className="text-[10px] text-gray-400">Top Radiants & Immortels</span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white flex items-center justify-center font-bold text-sm transition-colors cursor-pointer">
            ✕
          </button>
        </div>

        {/* Region Selector & Search */}
        <div className="py-3 flex items-center justify-between gap-2 flex-wrap flex-shrink-0">
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
            {["eu", "na", "ap", "kr", "br", "latam"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRegion(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                  region === r ? "bg-[var(--color-val-red)] text-white shadow-md" : "text-gray-400 hover:text-white"
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Rechercher un joueur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-gray-500 focus:border-[var(--color-val-red)] focus:outline-none flex-1 min-w-[160px]"
          />
        </div>

        {/* Player List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
          {loading ? (
            <div className="py-12 text-center text-gray-400 text-xs font-bold animate-pulse">
              Chargement du classement Riot...
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              Aucun joueur trouvé
            </div>
          ) : (
            filteredPlayers.map((p) => (
              <div key={p.puuid} className="p-2.5 sm:p-3 rounded-xl bg-black/30 border border-white/5 hover:border-white/20 transition-all flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-6 text-xs font-black font-mono ${p.leaderboardRank <= 3 ? "text-amber-400 font-bold" : "text-gray-500"}`}>
                    #{p.leaderboardRank}
                  </span>
                  {p.tierIcon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.tierIcon} alt={p.tierName} className="w-7 h-7 object-contain flex-shrink-0 drop-shadow" />
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-white truncate">
                      {p.gameName} <span className="text-[10px] text-gray-500 font-mono">#{p.tagLine}</span>
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">{p.tierName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0 text-right">
                  <div>
                    <span className="text-xs sm:text-sm font-black text-amber-400 font-mono">{p.rankedRating}</span>
                    <span className="text-[10px] text-gray-500 block">RR</span>
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-xs font-bold text-emerald-400 font-mono">{p.numberOfWins}</span>
                    <span className="text-[10px] text-gray-500 block">Victoires</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
