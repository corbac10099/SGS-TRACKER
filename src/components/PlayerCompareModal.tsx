"use client";

import React, { useState } from "react";
import { sounds } from "@/lib/soundEffects";
import { IconSword, IconTrophy, IconStar, IconCrosshair, IconFlame } from "./icons/SpyIcons";

export interface PlayerCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  player1Data?: any;
  onSelectPlayer?: (riotId: string) => void;
}

export default function PlayerCompareModal({
  isOpen,
  onClose,
  player1Data,
  onSelectPlayer,
}: PlayerCompareModalProps) {
  const [player2Input, setPlayer2Input] = useState("");
  const [player2Data, setPlayer2Data] = useState<any>(null);
  const [loading2, setLoading2] = useState<boolean>(false);
  const [error2, setError2] = useState<string | null>(null);

  if (!isOpen) return null;

  const p1 = player1Data?.player || player1Data;
  const p2 = player2Data?.player || player2Data;

  const handleSearchPlayer2 = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!player2Input.trim()) return;

    sounds.playClick();
    setLoading2(true);
    setError2(null);

    try {
      const res = await fetch("/api/valorant/player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riotId: player2Input.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError2(data.error || "Joueur introuvable ou erreur de chargement.");
      } else {
        setPlayer2Data(data);
      }
    } catch {
      setError2("Impossible de contacter le serveur.");
    } finally {
      setLoading2(false);
    }
  };

  const getNum = (val: any) => {
    if (typeof val === "number") return val;
    if (typeof val === "string") return parseFloat(val) || 0;
    return 0;
  };

  const compareRow = (
    label: string,
    val1: number,
    val2: number,
    formatter: (v: number) => string,
    higherIsBetter: boolean = true
  ) => {
    const isWinner1 = higherIsBetter ? val1 > val2 : val1 < val2;
    const isWinner2 = higherIsBetter ? val2 > val1 : val2 < val1;
    const isTie = val1 === val2;

    return (
      <div className="py-2.5 px-3 rounded-xl glass-card border border-white/5 flex items-center justify-between gap-2 text-xs">
        {/* Stat Joueur 1 */}
        <div className="flex-1 flex items-center gap-1.5 min-w-0">
          <span
            className={`font-mono font-bold text-sm truncate ${
              isWinner1 && !isTie ? "text-emerald-400 font-black" : "text-white/80"
            }`}
          >
            {formatter(val1)}
          </span>
          {isWinner1 && !isTie && (
            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 uppercase tracking-widest hidden sm:inline">
              +
            </span>
          )}
        </div>

        {/* Libellé au centre */}
        <div className="text-center px-2">
          <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] tracking-wider whitespace-nowrap">
            {label}
          </span>
        </div>

        {/* Stat Joueur 2 */}
        <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0 text-right">
          {isWinner2 && !isTie && (
            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 uppercase tracking-widest hidden sm:inline">
              +
            </span>
          )}
          <span
            className={`font-mono font-bold text-sm truncate ${
              isWinner2 && !isTie ? "text-emerald-400 font-black" : "text-white/80"
            }`}
          >
            {formatter(val2)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="glass-panel rounded-3xl p-5 sm:p-7 max-w-4xl w-full border border-[var(--color-border)] shadow-2xl space-y-6 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[var(--color-val-red)]/20 text-[var(--color-val-red)] border border-[var(--color-val-red)]/30 flex items-center justify-center shadow-lg">
              <IconSword size={22} />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-widest text-white">
                Comparateur de Joueurs
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Confrontation directe des statistiques et métriques compétitives
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Corps du comparateur */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-5">
          {/* Cartes d'identité des 2 joueurs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Joueur 1 (Profil actuel) */}
            <div className="p-4 rounded-2xl glass-card border border-white/10 flex items-center gap-3.5 bg-gradient-to-br from-white/5 to-transparent">
              {p1?.cardUrl ? (
                <img
                  referrerPolicy="no-referrer"
                  src={p1.cardUrl}
                  alt={p1.gameName || "Joueur 1"}
                  className="w-14 h-14 rounded-2xl object-cover border border-white/20 shadow-md flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-[var(--color-val-red)]/20 border border-[var(--color-val-red)]/40 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                  {p1?.gameName?.[0]?.toUpperCase() || "1"}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-black text-white truncate">
                    {p1?.name || `${p1?.gameName}#${p1?.tagLine}` || "Joueur 1"}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {p1?.rankUrl && (
                    <img
                      referrerPolicy="no-referrer"
                      src={p1.rankUrl}
                      alt={p1.rank || "Rang"}
                      className="w-6 h-6 object-contain"
                    />
                  )}
                  <span className="text-xs text-[var(--color-text-secondary)] font-bold">
                    {p1?.rank || "Non classé"}
                  </span>
                </div>
              </div>
            </div>

            {/* Joueur 2 (Recherche) */}
            <div className="p-4 rounded-2xl glass-card border border-white/10 flex flex-col justify-center bg-gradient-to-bl from-white/5 to-transparent">
              {p2 ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {p2?.cardUrl ? (
                      <img
                        referrerPolicy="no-referrer"
                        src={p2.cardUrl}
                        alt={p2.gameName || "Joueur 2"}
                        className="w-14 h-14 rounded-2xl object-cover border border-white/20 shadow-md flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-[#58a6ff]/20 border border-[#58a6ff]/40 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                        {p2?.gameName?.[0]?.toUpperCase() || "2"}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-black text-white truncate block">
                        {p2?.name || `${p2?.gameName}#${p2?.tagLine}` || "Joueur 2"}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        {p2?.rankUrl && (
                          <img
                            referrerPolicy="no-referrer"
                            src={p2.rankUrl}
                            alt={p2.rank || "Rang"}
                            className="w-6 h-6 object-contain"
                          />
                        )}
                        <span className="text-xs text-[var(--color-text-secondary)] font-bold">
                          {p2?.rank || "Non classé"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setPlayer2Data(null)}
                    className="text-[10px] text-[var(--color-text-secondary)] hover:text-white uppercase font-bold cursor-pointer px-2 py-1 bg-white/5 rounded-lg"
                  >
                    Changer ✕
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSearchPlayer2} className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] tracking-wider block">
                    Adversaire / Joueur 2 à comparer :
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: TenZ#0001 ou Corbac#EU1"
                      value={player2Input}
                      onChange={(e) => setPlayer2Input(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:border-[var(--color-val-red)] outline-none"
                    />
                    <button
                      type="submit"
                      disabled={loading2}
                      className="px-4 py-2 rounded-xl bg-[var(--color-val-red)] hover:bg-[#ff5865] text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex-shrink-0 disabled:opacity-50"
                    >
                      {loading2 ? "..." : "Comparer"}
                    </button>
                  </div>
                  {error2 && (
                    <p className="text-[11px] text-red-400 font-medium">⚠️ {error2}</p>
                  )}
                </form>
              )}
            </div>
          </div>

          {/* Tableau comparatif face-à-face si les 2 joueurs sont chargés */}
          {p1 && p2 ? (
            <div className="space-y-2">
              <div className="text-center py-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-val-red)]">
                  Tableau Comparatif Direct
                </span>
              </div>

              {compareRow("Ratio K/D", getNum(p1?.stats?.kdRatio || p1?.stats?.kd), getNum(p2?.stats?.kdRatio || p2?.stats?.kd), (v) => v.toFixed(2))}
              {compareRow("Taux de Victoire", getNum(p1?.stats?.winRate), getNum(p2?.stats?.winRate), (v) => `${v}%`)}
              {compareRow("Combat Moyen (ACS)", getNum(p1?.stats?.acs), getNum(p2?.stats?.acs), (v) => Math.round(v).toString())}
              {compareRow("Tirs à la Tête (HS %)", getNum(p1?.stats?.headshotPct), getNum(p2?.stats?.headshotPct), (v) => `${v}%`)}
              {compareRow("KAST %", getNum(p1?.stats?.kast), getNum(p2?.stats?.kast), (v) => `${v}%`)}
              {compareRow("Dégâts Delta (DDΔ)", getNum(p1?.stats?.ddDelta), getNum(p2?.stats?.ddDelta), (v) => (v > 0 ? `+${v}` : `${v}`))}
              {compareRow("Parties Disputées", getNum(p1?.stats?.matchesPlayed), getNum(p2?.stats?.matchesPlayed), (v) => Math.round(v).toString())}
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--color-text-secondary)] space-y-3">
              <IconCrosshair size={32} className="mx-auto text-white/30" />
              <p className="text-xs">
                Saisissez le Riot ID d&apos;un second joueur ci-dessus pour lancer la confrontation en face-à-face.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
