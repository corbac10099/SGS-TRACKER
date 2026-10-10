"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { AimRankId, AimScenarioId, MonthlyLeaderboardEntry } from "./types";
import { AIM_RANKS, RANK_ORDER, getNextRank, getCurrentMonthlySeason, getAimLevelInfo } from "./ranks";
import { SCENARIOS } from "./scenarios";

interface Props {
  userRank?: AimRankId;
  userName?: string;
  userAvatar?: string;
  themeAccent?: string;
}

export default function AimLeaderboard({
  userRank = "gold",
  userName = "Agent",
  themeAccent = "#ff4655",
}: Props) {
  const [selectedRank, setSelectedRank] = useState<AimRankId>(userRank);
  const [selectedScenario, setSelectedScenario] = useState<AimScenarioId | "all">("all");
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<MonthlyLeaderboardEntry[]>([]);

  const seasonInfo = useMemo(() => getCurrentMonthlySeason(), []);
  const activeRankTier = AIM_RANKS[selectedRank] || AIM_RANKS.gold;
  const nextRankTier = getNextRank(selectedRank);

  // Génération d'un classement mensuel par rang compétitif réaliste combiné aux données réelles Neon
  useEffect(() => {
    const fetchScores = async () => {
      setLoading(true);
      try {
        const url = selectedScenario === "all" ? "/api/aim/profile" : `/api/aim/profile?scenario=${selectedScenario}`;
        const res = await fetch(url);
        const data = await res.json();

        const dbSessions = (data.success && Array.isArray(data.recentSessions)) ? data.recentSessions : [];

        // Base de compétiteurs mensuels simulés par rang
        const SEED_PLAYERS: Record<AimRankId, { name: string; score: number; acc: number; hs: number; time: number; level: number }[]> = {
          iron: [
            { name: "Recrue_Viper", score: 28400, acc: 68.4, hs: 42.0, time: 290, level: 3 },
            { name: "ShadowBrim", score: 24200, acc: 64.0, hs: 38.5, time: 310, level: 2 },
            { name: "NeonBeginner", score: 21500, acc: 61.2, hs: 35.0, time: 325, level: 2 },
            { name: "FragNewbie", score: 18900, acc: 58.0, hs: 30.0, time: 340, level: 1 },
          ],
          bronze: [
            { name: "Phoenix_Flame", score: 43200, acc: 74.2, hs: 51.0, time: 270, level: 6 },
            { name: "CypherCam", score: 38900, acc: 71.5, hs: 48.0, time: 282, level: 5 },
            { name: "SovaDart", score: 34200, acc: 68.0, hs: 44.0, time: 295, level: 4 },
            { name: "BreachStun", score: 31000, acc: 65.4, hs: 41.2, time: 305, level: 4 },
          ],
          silver: [
            { name: "SilverSheriff", score: 58900, acc: 81.0, hs: 62.5, time: 245, level: 11 },
            { name: "FadeProwler", score: 54100, acc: 78.4, hs: 58.0, time: 255, level: 9 },
            { name: "ChamberTour", score: 49800, acc: 75.0, hs: 55.2, time: 265, level: 8 },
            { name: "SpectreUser", score: 45600, acc: 72.8, hs: 52.0, time: 275, level: 7 },
          ],
          gold: [
            { name: "GoldVandalGod", score: 74500, acc: 86.4, hs: 72.0, time: 215, level: 18 },
            { name: "RazeRocket", score: 69800, acc: 83.2, hs: 68.0, time: 228, level: 15 },
            { name: "SkyeDoggy", score: 65400, acc: 80.5, hs: 64.5, time: 238, level: 14 },
            { name: "HarborTide", score: 61200, acc: 78.0, hs: 61.0, time: 248, level: 13 },
          ],
          platinum: [
            { name: "PlatFlicker", score: 89600, acc: 90.2, hs: 79.5, time: 195, level: 27 },
            { name: "KAYO_EMP", score: 84200, acc: 88.0, hs: 76.0, time: 205, level: 24 },
            { name: "OmenSmokes", score: 79800, acc: 85.4, hs: 72.5, time: 212, level: 22 },
            { name: "DeadlockNet", score: 75200, acc: 82.8, hs: 69.0, time: 220, level: 20 },
          ],
          diamond: [
            { name: "DiamondDemon", score: 104200, acc: 93.5, hs: 85.0, time: 175, level: 38 },
            { name: "JettDashes", score: 99400, acc: 91.2, hs: 82.4, time: 184, level: 34 },
            { name: "YoruClone", score: 94800, acc: 89.0, hs: 79.0, time: 192, level: 31 },
            { name: "IsoShield", score: 90100, acc: 87.2, hs: 76.5, time: 199, level: 29 },
          ],
          ascendant: [
            { name: "AscendantAce", score: 118900, acc: 95.8, hs: 89.4, time: 160, level: 49 },
            { name: "ReynaLeer", score: 113400, acc: 94.0, hs: 86.8, time: 168, level: 46 },
            { name: "GekkoDizzy", score: 108900, acc: 92.4, hs: 84.0, time: 174, level: 43 },
            { name: "KilljoyTurret", score: 104500, acc: 91.0, hs: 81.5, time: 180, level: 40 },
          ],
          immortal: [
            { name: "Gr4phØ#0001", score: 132400, acc: 97.4, hs: 93.0, time: 148, level: 62 },
            { name: "Derke_Fan", score: 127800, acc: 96.2, hs: 91.0, time: 154, level: 58 },
            { name: "ScreaM_OneTap", score: 123500, acc: 95.0, hs: 90.2, time: 158, level: 55 },
            { name: "ClutchKing99", score: 119200, acc: 94.2, hs: 88.0, time: 164, level: 52 },
          ],
          radiant_aim: [
            { name: "TenZ", score: 146800, acc: 99.2, hs: 97.5, time: 132, level: 85 },
            { name: "Aspas", score: 143500, acc: 98.8, hs: 96.8, time: 136, level: 82 },
            { name: "Demon1", score: 140200, acc: 98.4, hs: 95.9, time: 140, level: 79 },
            { name: "Chronicle", score: 137400, acc: 97.9, hs: 94.5, time: 144, level: 76 },
          ],
        };

        const rankPlayers = SEED_PLAYERS[selectedRank] || SEED_PLAYERS.gold;

        // Convertir en MonthlyLeaderboardEntry
        const formattedEntries: MonthlyLeaderboardEntry[] = rankPlayers.map((p, idx) => ({
          id: `seed_${selectedRank}_${idx}`,
          userId: `user_${p.name}`,
          userName: p.name,
          userRank: selectedRank,
          score: p.score,
          accuracy: p.acc,
          headshotRate: p.hs,
          avgTimeToHitMs: p.time,
          aimLevel: p.level,
          aimXp: p.level * 750 + 350,
          rankPosition: idx + 1,
          isFirstInRank: idx === 0,
          eligibleForPromotion: idx === 0 && selectedRank !== "radiant_aim",
          scenarioId: selectedScenario === "all" ? "gridshot_3d" : selectedScenario,
          timestamp: Date.now() - idx * 14400000,
        }));

        // Insérer les vraies sessions de l'utilisateur si elles correspondent au rang
        if (dbSessions.length > 0 && selectedRank === userRank) {
          const topUserSession = dbSessions[0];
          formattedEntries.push({
            id: topUserSession.id,
            userId: topUserSession.userId,
            userName: userName,
            userRank: userRank,
            score: topUserSession.score,
            accuracy: topUserSession.accuracy,
            headshotRate: topUserSession.headshotRate,
            avgTimeToHitMs: topUserSession.avgTimeToHitMs,
            aimLevel: 14,
            aimXp: 10500,
            rankPosition: 0,
            isFirstInRank: false,
            eligibleForPromotion: false,
            scenarioId: topUserSession.scenarioId || "gridshot_3d",
            timestamp: new Date(topUserSession.createdAt).getTime(),
          });
        }

        // Trier par score décroissant et recalculer les positions
        formattedEntries.sort((a, b) => b.score - a.score);
        formattedEntries.forEach((entry, i) => {
          entry.rankPosition = i + 1;
          entry.isFirstInRank = i === 0;
          entry.eligibleForPromotion = i === 0 && selectedRank !== "radiant_aim";
        });

        setEntries(formattedEntries);
      } catch (err) {
        console.warn("Leaderboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, [selectedRank, selectedScenario, userRank, userName]);

  const championEntry = entries[0];
  const userEntry = entries.find((e) => e.userName === userName);
  const pointsToBeat = championEntry ? Math.max(0, championEntry.score - (userEntry?.score || 0) + 100) : 0;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in pb-16">
      {/* ─── Hero Banner Mensuelle avec décompte & Règle de Promotion ─── */}
      <div
        className="relative rounded-3xl p-6 sm:p-9 bg-gradient-to-r from-black/85 via-white/[0.04] to-black/85 border shadow-2xl backdrop-blur-2xl overflow-hidden"
        style={{ borderColor: `${themeAccent}50` }}
      >
        <div
          className="absolute -top-24 -left-24 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: activeRankTier.color }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border"
                style={{
                  backgroundColor: `${themeAccent}20`,
                  borderColor: `${themeAccent}50`,
                  color: themeAccent,
                }}
              >
                {seasonInfo.seasonName}
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                <span>Fin dans {seasonInfo.daysRemaining} jours</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Classement Mensuel & Promotions de Rang
            </h1>

            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
              Pour monter d&apos;un rang, vous devez conquérir la{" "}
              <strong className="text-white font-black underline decoration-amber-400 decoration-2">
                1ère place du mois
              </strong>{" "}
              de votre rang actuel. Dès que vous dépassez le score du leader, votre profil est immédiatement promu au rang supérieur !
            </p>
          </div>

          {/* Badge Mon Rang Actuel */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex-shrink-0">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl border shadow-lg"
              style={{
                backgroundColor: AIM_RANKS[userRank].bgColor,
                borderColor: AIM_RANKS[userRank].borderColor,
                color: AIM_RANKS[userRank].color,
              }}
            >
              {AIM_RANKS[userRank].name.charAt(0)}
            </div>
            <div>
              <div className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">
                Votre Rang Actuel
              </div>
              <div className="text-base font-black text-white">
                {AIM_RANKS[userRank].name}
              </div>
              <div className="text-[10px] text-amber-400 font-bold">
                {getNextRank(userRank) ? `Objectif : 1er pour passer ${getNextRank(userRank)?.name}` : "Rang Maximum Atteint"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Sélecteur de Rangs (Fer -> Radiant) ─── */}
      <div className="space-y-2">
        <div className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-secondary)] px-1">
          Sélectionner une division de rang :
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
          {RANK_ORDER.map((rk) => {
            const tier = AIM_RANKS[rk];
            const isSelected = selectedRank === rk;
            const isMyRank = userRank === rk;

            return (
              <button
                key={rk}
                type="button"
                onClick={() => setSelectedRank(rk)}
                className={`relative p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  isSelected
                    ? "scale-105 shadow-xl"
                    : "bg-white/[0.02] hover:bg-white/[0.06] border-white/10 opacity-75 hover:opacity-100"
                }`}
                style={{
                  borderColor: isSelected ? tier.color : undefined,
                  backgroundColor: isSelected ? tier.bgColor : undefined,
                }}
              >
                {/* Indicateur "Mon Rang" */}
                {isMyRank && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-emerald-500 text-black text-[8px] font-black uppercase tracking-wider shadow-sm">
                    Moi
                  </span>
                )}

                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black border"
                  style={{
                    backgroundColor: tier.bgColor,
                    borderColor: tier.borderColor,
                    color: tier.color,
                  }}
                >
                  {tier.name.charAt(0)}
                </div>

                <span
                  className="text-xs font-black uppercase tracking-wider"
                  style={{ color: isSelected ? tier.color : "white" }}
                >
                  {tier.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Carte Boss du Rang (#1 - Place Qualificative Promotion) ─── */}
      {championEntry && (
        <div
          className="relative rounded-3xl p-6 sm:p-8 border shadow-2xl backdrop-blur-xl overflow-hidden"
          style={{
            backgroundColor: `${activeRankTier.bgColor}`,
            borderColor: `${activeRankTier.borderColor}`,
          }}
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl font-black border shadow-2xl"
                  style={{
                    backgroundColor: "rgba(0,0,0,0.6)",
                    borderColor: activeRankTier.color,
                    color: activeRankTier.color,
                  }}
                >
                  👑
                </div>
                <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-amber-400 text-black text-[9px] font-black uppercase tracking-wider shadow-md">
                  #1
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                    Leader du Mois — Place Qualificative
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border"
                    style={{
                      color: activeRankTier.color,
                      borderColor: activeRankTier.borderColor,
                      backgroundColor: activeRankTier.bgColor,
                    }}
                  >
                    Rang {activeRankTier.name}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white mt-0.5 flex items-center gap-3">
                  <span>{championEntry.userName}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-white/10 text-gray-300">
                    Lv. {championEntry.aimLevel}
                  </span>
                </h2>

                <div className="text-xs text-[var(--color-text-secondary)] mt-1 flex items-center gap-3">
                  <span>
                    Précision: <strong className="text-emerald-400 font-bold">{championEntry.accuracy}%</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Headshots: <strong className="text-white font-bold">{championEntry.headshotRate}%</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Vitesse: <strong className="text-sky-400 font-bold">{championEntry.avgTimeToHitMs}ms</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Score & Défi Promotion */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-black/50 p-4 rounded-2xl border border-white/10 w-full lg:w-auto">
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase">
                  Score Qualificatif à Battre
                </div>
                <div className="text-3xl font-black text-amber-300 font-mono">
                  {championEntry.score.toLocaleString()}
                </div>
              </div>

              <div className="h-px sm:h-10 w-full sm:w-px bg-white/10" />

              <div className="text-left sm:text-right">
                <div className="text-[10px] font-bold text-gray-400 uppercase">
                  Statut de Promotion
                </div>
                {nextRankTier ? (
                  <div className="text-sm font-black text-emerald-400">
                    ➔ Promu en {nextRankTier.name}
                  </div>
                ) : (
                  <div className="text-sm font-black text-amber-400">
                    🏆 Maître du Monde
                  </div>
                )}
                {selectedRank === userRank && (
                  <div className="text-[10px] text-gray-300 font-bold mt-0.5">
                    {championEntry.userName === userName ? (
                      <span className="text-amber-300">👑 Vous êtes actuellement 1er !</span>
                    ) : (
                      <span>+ {pointsToBeat.toLocaleString()} pts pour passer 1er !</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Filtres par Scénario & Tableau des Prétendants ─── */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-white uppercase tracking-wider">
              Prétendants au Rang {activeRankTier.name} ({entries.length})
            </span>
          </div>

          {/* Filtre Scénario */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-text-secondary)] font-bold">Scénario :</span>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/15 text-xs font-bold text-white focus:outline-none focus:border-[var(--color-val-red)] transition-colors cursor-pointer"
            >
              <option value="all">Tous les Scénarios</option>
              {SCENARIOS.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tableau Haute Fidélité */}
        <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.03] text-[10px] font-black uppercase tracking-wider text-[var(--color-text-secondary)] border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4">Rang</th>
                  <th className="py-3.5 px-4">Joueur & Niveau Aim</th>
                  <th className="py-3.5 px-4 text-center">Statut Promotion</th>
                  <th className="py-3.5 px-4 text-right">Score du Mois</th>
                  <th className="py-3.5 px-4 text-center">Précision</th>
                  <th className="py-3.5 px-4 text-center">Headshots</th>
                  <th className="py-3.5 px-4 text-center">Vitesse</th>
                  <th className="py-3.5 px-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {entries.map((entry) => {
                  const isMe = entry.userName === userName;
                  const isTop1 = entry.rankPosition === 1;
                  const isTop2 = entry.rankPosition === 2;
                  const isTop3 = entry.rankPosition === 3;

                  return (
                    <tr
                      key={entry.id}
                      className={`transition-colors ${
                        isMe
                          ? "bg-[var(--color-val-red)]/15 border-l-4 border-l-[var(--color-val-red)]"
                          : isTop1
                          ? "bg-amber-500/10 hover:bg-amber-500/15"
                          : "hover:bg-white/[0.02]"
                      }`}
                    >
                      {/* Position */}
                      <td className="py-3 px-4 font-black">
                        {isTop1 ? (
                          <span className="flex items-center gap-1 text-amber-300">
                            <span>👑</span>
                            <span>#1</span>
                          </span>
                        ) : isTop2 ? (
                          <span className="text-gray-300 font-bold">#2</span>
                        ) : isTop3 ? (
                          <span className="text-amber-600 font-bold">#3</span>
                        ) : (
                          <span className="text-gray-500 font-bold">#{entry.rankPosition}</span>
                        )}
                      </td>

                      {/* Joueur */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black border"
                            style={{
                              backgroundColor: activeRankTier.bgColor,
                              borderColor: activeRankTier.borderColor,
                              color: activeRankTier.color,
                            }}
                          >
                            {entry.userName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-black text-white flex items-center gap-1.5">
                              <span>{entry.userName}</span>
                              {isMe && (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase">
                                  VOUS
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-400 flex items-center gap-1">
                              <span className="text-sky-400 font-bold">Lv. {entry.aimLevel}</span>
                              <span>•</span>
                              <span>{getAimLevelInfo(entry.aimXp).title}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Statut Promotion */}
                      <td className="py-3 px-4 text-center">
                        {isTop1 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-black uppercase tracking-wider">
                            <span>👑</span>
                            <span>Promouvable</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-bold uppercase">
                            Prétendant
                          </span>
                        )}
                      </td>

                      {/* Score */}
                      <td className="py-3 px-4 text-right font-black font-mono text-sm text-white">
                        {entry.score.toLocaleString()}
                      </td>

                      {/* Précision */}
                      <td className="py-3 px-4 text-center font-bold font-mono">
                        <span className={entry.accuracy >= 85 ? "text-emerald-400" : "text-amber-400"}>
                          {entry.accuracy}%
                        </span>
                      </td>

                      {/* Headshots */}
                      <td className="py-3 px-4 text-center font-bold font-mono text-gray-200">
                        {entry.headshotRate}%
                      </td>

                      {/* Vitesse */}
                      <td className="py-3 px-4 text-center font-bold font-mono text-sky-400">
                        {entry.avgTimeToHitMs}ms
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-right text-[10px] text-gray-400">
                        {new Date(entry.timestamp).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
