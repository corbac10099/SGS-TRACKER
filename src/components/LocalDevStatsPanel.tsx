"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  calculatePerformanceScore,
  PerformanceGrade,
  AgentRole,
} from "@/lib/valorant/performanceScore";
import PerformanceStarBadge from "./PerformanceStarBadge";

export interface DevStatOverrides {
  enabled: boolean;
  kd: number;
  acs: number;
  hs: number;
  winRate: number;
  kast: number;
  adr: number;
  dd: number;
  firstBloods: number;
  firstDeaths: number;
  clutches: number;
  role: "Auto" | AgentRole;
  matchesCount: number;
}

export const DEFAULT_DEV_STATS: DevStatOverrides = {
  enabled: false,
  kd: 1.40,
  acs: 348,
  hs: 33,
  winRate: 60,
  kast: 77,
  adr: 164,
  dd: 25,
  firstBloods: 3.8,
  firstDeaths: 2.5,
  clutches: 8,
  role: "Auto",
  matchesCount: 20,
};

const PRESETS: Record<string, Partial<DevStatOverrides> & { label: string; icon: string }> = {
  sss: {
    label: "SSS",
    icon: "👑",
    kd: 1.95,
    acs: 345,
    hs: 42,
    winRate: 74,
    kast: 85,
    adr: 195,
    dd: 48,
    firstBloods: 6.5,
    firstDeaths: 1.8,
    clutches: 16,
    role: "Duelist",
  },
  ss: {
    label: "SS",
    icon: "⚡",
    kd: 1.48,
    acs: 285,
    hs: 33,
    winRate: 63,
    kast: 79,
    adr: 168,
    dd: 28,
    firstBloods: 4.8,
    firstDeaths: 2.4,
    clutches: 12,
    role: "Initiator",
  },
  s: {
    label: "S",
    icon: "🎯",
    kd: 1.22,
    acs: 245,
    hs: 26,
    winRate: 55,
    kast: 73,
    adr: 152,
    dd: 16,
    firstBloods: 3.5,
    firstDeaths: 2.8,
    clutches: 8,
    role: "Controller",
  },
  a: {
    label: "A",
    icon: "⚔️",
    kd: 1.05,
    acs: 210,
    hs: 21,
    winRate: 50,
    kast: 69,
    adr: 138,
    dd: 4,
    firstBloods: 2.5,
    firstDeaths: 2.9,
    clutches: 5,
    role: "Sentinel",
  },
  b: {
    label: "B",
    icon: "🛡️",
    kd: 0.90,
    acs: 175,
    hs: 16,
    winRate: 46,
    kast: 62,
    adr: 122,
    dd: -12,
    firstBloods: 1.8,
    firstDeaths: 3.2,
    clutches: 3,
    role: "Flex",
  },
  c: {
    label: "C",
    icon: "📉",
    kd: 0.65,
    acs: 120,
    hs: 11,
    winRate: 38,
    kast: 50,
    adr: 95,
    dd: -32,
    firstBloods: 0.8,
    firstDeaths: 4.2,
    clutches: 1,
    role: "Flex",
  },
};

interface LocalDevStatsPanelProps {
  currentRole?: AgentRole;
  onOverridesChange: (overrides: DevStatOverrides | null) => void;
  currentRiotId?: string;
  onRiotKeyChange?: (key: string | null) => void;
  isLiveRiotData?: boolean;
  playerStats?: any;
}

/**
 * Panneau d'Administration Développeur Local
 * Permet de configurer en direct la clé API Riot Games (RGAPI-...)
 * pour désactiver le mock et utiliser les données réelles de votre compte,
 * ainsi que d'ajuster les statistiques en temps réel.
 */
export default function LocalDevStatsPanel({
  currentRole = "Flex",
  onOverridesChange,
  currentRiotId = "Gr4phØ#0001",
  onRiotKeyChange,
  isLiveRiotData = false,
  playerStats,
}: LocalDevStatsPanelProps) {
  const [isLocalEnv, setIsLocalEnv] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Riot Developer Key State
  const [riotApiKey, setRiotApiKey] = useState<string>("");
  const [testPseudo, setTestPseudo] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("spycam_dev_test_pseudo");
      if (saved) return saved;
    }
    return currentRiotId || "Gr4phØ#0001";
  });
  const [selectedRegion, setSelectedRegion] = useState<string>("eu");
  const [keyStatus, setKeyStatus] = useState<"idle" | "testing" | "valid" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);

  const [stats, setStats] = useState<DevStatOverrides>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("spycam_dev_stat_overrides");
        if (saved) {
          return { ...DEFAULT_DEV_STATS, ...JSON.parse(saved) };
        }
      } catch {}
    }
    return DEFAULT_DEV_STATS;
  });

  // Fonction de synchronisation des sliders avec des statistiques données
  const syncSlidersWithStats = useCallback((s: any) => {
    if (!s) return;
    const matches = typeof s.matchesPlayed === "number" ? Math.min(50, Math.max(5, s.matchesPlayed)) : 20;
    const kd = typeof s.kdRatio === "number" ? Math.min(3.5, Math.max(0.2, Number(s.kdRatio.toFixed(2)))) : 1.40;
    const acs = typeof s.acs === "number" ? Math.min(450, Math.max(50, Math.round(s.acs))) : 348;
    const hs = typeof s.headshotPct === "number" ? Math.min(65, Math.max(5, Math.round(s.headshotPct))) : 33;
    const winRate = typeof s.winRate === "number" ? Math.min(95, Math.max(10, Math.round(s.winRate))) : 60;
    const kast = typeof s.kast === "number" ? Math.min(95, Math.max(35, Math.round(s.kast))) : 77;
    const adr = typeof s.adr === "number" ? Math.min(250, Math.max(50, Math.round(s.adr))) : 164;
    const dd = typeof s.ddDelta === "number" ? Math.min(60, Math.max(-50, Math.round(s.ddDelta))) : 25;

    let fb = 3.8;
    if (typeof s.firstBloods === "number") {
      fb = s.firstBloods > 10 ? Number((s.firstBloods / Math.max(matches, 1)).toFixed(1)) : s.firstBloods;
    }

    let clutches = 8;
    if (typeof s.clutches === "number") {
      clutches = Math.min(25, Math.max(0, Math.round(s.clutches)));
    } else if (typeof s.aceCount === "number" && s.aceCount > 0) {
      clutches = s.aceCount * 2 + 5;
    }

    setStats((prev) => ({
      ...prev,
      kd,
      acs,
      hs,
      winRate,
      kast,
      adr,
      dd,
      firstBloods: fb,
      clutches,
      matchesCount: matches,
    }));
  }, []);

  // Synchronisation automatique quand playerStats arrive et que l'utilisateur n'est pas en override
  useEffect(() => {
    if (playerStats && !stats.enabled) {
      syncSlidersWithStats(playerStats);
    }
  }, [playerStats, stats.enabled, syncSlidersWithStats]);

  // Synchroniser le pseudo cible avec currentRiotId si fourni
  useEffect(() => {
    if (currentRiotId && currentRiotId !== "Corbac#EU1" && (!testPseudo || testPseudo === "Corbac#EU1")) {
      setTestPseudo(currentRiotId);
    }
  }, [currentRiotId, testPseudo]);

  // Vérification de sécurité : actif en local ou dev
  useEffect(() => {
    if (typeof window !== "undefined") {
      const h = window.location.hostname;
      if (
        h === "localhost" ||
        h === "127.0.0.1" ||
        h === "0.0.0.0" ||
        process.env.NODE_ENV === "development"
      ) {
        setIsLocalEnv(true);
      }
    }
  }, []);

  // Initialisation de la clé Riot sauvegardée
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("spycam_riot_dev_key");
      if (savedKey) {
        setRiotApiKey(savedKey);
        setKeyStatus("valid");
        setStatusMessage("Clé Riot Dev enregistrée en local.");

        // Synchroniser avec l'API backend au montage
        const parts = (testPseudo || "Gr4phØ#0001").split("#");
        fetch("/api/admin/riot-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey: savedKey,
            testName: parts[0]?.trim() || "Gr4phØ",
            testTag: parts[1]?.trim() || "0001",
            region: selectedRegion,
          }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.success) {
              setKeyStatus("valid");
              if (data.account) setAccountInfo(data.account);
              setStatusMessage(data.message || "Clé Riot Games active !");

              // Synchroniser automatiquement les stats et les sliders
              fetch("/api/valorant/player", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-riot-dev-key": savedKey,
                },
                body: JSON.stringify({
                  riotId: `${parts[0]?.trim() || "Gr4phØ"}#${parts[1]?.trim() || "0001"}`,
                  region: selectedRegion,
                }),
              })
                .then((pr) => pr.json())
                .then((pdata) => {
                  const s = pdata?.player?.stats || pdata?.stats;
                  if (s) {
                    syncSlidersWithStats(s);
                  }
                })
                .catch(() => {});
            } else {
              setKeyStatus("error");
              setStatusMessage(data.error || "Clé expirée ou invalide");
            }
          })
          .catch(() => {});
      }
    }
  }, [testPseudo, selectedRegion, syncSlidersWithStats]);

  // Synchronisation avec le composant parent
  useEffect(() => {
    if (!isLocalEnv) {
      onOverridesChange(null);
      return;
    }

    if (stats.enabled) {
      onOverridesChange(stats);
      try {
        localStorage.setItem("spycam_dev_stat_overrides", JSON.stringify(stats));
      } catch {}
    } else {
      onOverridesChange(null);
      try {
        localStorage.removeItem("spycam_dev_stat_overrides");
      } catch {}
    }
  }, [stats, isLocalEnv, onOverridesChange]);

  // Raccourci clavier Ctrl + Shift + D pour ouvrir/fermer le panel
  useEffect(() => {
    if (!isLocalEnv) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLocalEnv]);

  // Actions Riot API Key
  const handleTestAndSaveKey = async () => {
    const cleanKey = riotApiKey.trim();
    if (!cleanKey) {
      setKeyStatus("error");
      setStatusMessage("Veuillez saisir votre clé API (ex: RGAPI-...)");
      return;
    }

    setKeyStatus("testing");
    setStatusMessage("Validation auprès des serveurs Riot Games...");

    const parts = (testPseudo || "Gr4phØ#0001").split("#");
    const testName = parts[0]?.trim() || "Gr4phØ";
    const testTag = parts[1]?.trim() || "0001";

    try {
      const res = await fetch("/api/admin/riot-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: cleanKey,
          testName,
          testTag,
          region: selectedRegion,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setKeyStatus("valid");
        setAccountInfo(data.account);
        if (typeof window !== "undefined") {
          localStorage.setItem("spycam_riot_dev_key", cleanKey);
          localStorage.setItem("spycam_dev_test_pseudo", `${testName}#${testTag}`);
        }

        // Interroger l'API profil pour caler immédiatement les curseurs sur les statistiques réelles
        try {
          const pRes = await fetch("/api/valorant/player", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-riot-dev-key": cleanKey,
            },
            body: JSON.stringify({
              riotId: `${testName}#${testTag}`,
              region: selectedRegion,
            }),
          });
          const pData = await pRes.json();
          const realStats = pData?.player?.stats || pData?.stats;
          if (realStats) {
            syncSlidersWithStats(realStats);
            setStatusMessage(`Connexion Riot certifiée (${data.account?.gameName || testName}#${data.account?.tagLine || testTag}) ! Les sliders ont été automatiquement calés sur vos statistiques.`);
          } else {
            setStatusMessage(data.message || "Clé Riot Games validée avec succès !");
          }
        } catch {
          setStatusMessage(data.message || "Clé Riot Games validée avec succès !");
        }

        onRiotKeyChange?.(cleanKey);
      } else {
        setKeyStatus("error");
        setStatusMessage(data.error || "Clé rejetée par Riot Games.");
      }
    } catch (err: any) {
      setKeyStatus("error");
      setStatusMessage(err.message || "Erreur de connexion au serveur.");
    }
  };

  const handleClearKey = async () => {
    try {
      await fetch("/api/admin/riot-key", { method: "DELETE" });
    } catch {}

    setRiotApiKey("");
    setKeyStatus("idle");
    setStatusMessage("Clé retirée. Retour au mode simulation mock.");
    setAccountInfo(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("spycam_riot_dev_key");
    }
    onRiotKeyChange?.(null);
  };

  // Calcul du score en direct pour l'aperçu du panel
  const previewScoreResult = useMemo(() => {
    const mockStats = {
      kdRatio: stats.kd,
      kills: Math.round(stats.kd * 200),
      deaths: 200,
      assists: 80,
      acs: stats.acs,
      headshotPct: stats.hs,
      winRate: stats.winRate,
      kast: stats.kast,
      adr: stats.adr,
      ddDelta: stats.dd,
      matchesPlayed: stats.matchesCount,
    };

    const mockMatches = Array.from({ length: stats.matchesCount }).map((_, i) => ({
      firstBloods: stats.firstBloods,
      clutches: i < stats.clutches ? 1 : 0,
      won: i < (stats.matchesCount * (stats.winRate / 100)),
    }));

    const activeRole = stats.role === "Auto" ? currentRole : stats.role;
    const simulatedTier = stats.kd >= 1.35 ? 24 : stats.kd >= 1.15 ? 21 : stats.kd >= 0.95 ? 15 : 7;
    return calculatePerformanceScore(mockStats, mockMatches, activeRole, simulatedTier);
  }, [stats, currentRole]);

  if (!isLocalEnv) {
    return null; // Strictement désactivé en dehors de localhost
  }

  const updateField = (field: keyof DevStatOverrides, value: any) => {
    setStats((prev) => ({
      ...prev,
      [field]: value,
      enabled: true, // Active automatiquement quand on modifie
    }));
  };

  const applyPreset = (presetKey: string) => {
    const p = PRESETS[presetKey];
    if (!p) return;
    setStats((prev) => ({
      ...prev,
      ...p,
      enabled: true,
    }));
  };

  const resetToReal = () => {
    if (playerStats) {
      syncSlidersWithStats(playerStats);
    }
    setStats((prev) => ({
      ...prev,
      enabled: false,
    }));
  };

  return (
    <>
      {/* BOUTON FLOTTANT D'OUVERTURE (Visible seulement en local) */}
      <div className="fixed bottom-20 md:bottom-6 left-6 z-40 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title="Ouvrir le panneau d'administration des statistiques (Ctrl+Shift+D)"
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black shadow-2xl transition-all cursor-pointer backdrop-blur-xl border ${
            stats.enabled
              ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-pulse"
              : "bg-black/80 text-gray-300 border-white/20 hover:border-white/40 hover:text-white"
          }`}
        >
          <span className="text-sm">🛠️</span>
          <span>DEV STATS PANEL</span>
          {stats.enabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          )}
        </button>
      </div>

      {/* PANNEAU D'ADMINISTRATION MODAL */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-[#090d14] border border-amber-500/30 shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* EN-TÊTE DU PANEL */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <span className="text-2xl p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">🛠️</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-white">
                      Panneau Admin Développeur
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Localhost Only
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Modifiez les métriques en direct pour tester le comportement du score SPI et des cartes.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* CORPS DÉFILANT DU PANEL */}
            <div className="p-5 overflow-y-auto space-y-6">
              {/* ══════════════ SECTION RIOT API KEY (MODE RÉEL SANS MOCK) ══════════════ */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3.5 backdrop-blur-md">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
                      🔑
                    </span>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                        <span>Clé API Développeur (Riot ou HenrikDev)</span>
                        {keyStatus === "valid" ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                            Active (Mode Réel)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/10 text-neutral-400 border border-white/10">
                            Mock Actif
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-gray-400">
                        Entrez votre clé Riot (<code className="text-red-400 font-mono">RGAPI-...</code>) ou HenrikDev (<code className="text-emerald-400 font-mono">HDEV-...</code>) pour charger vos vraies statistiques et désactiver le mock.
                      </p>
                    </div>
                  </div>

                  {keyStatus === "valid" && (
                    <button
                      type="button"
                      onClick={handleClearKey}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-all cursor-pointer"
                    >
                      Désactiver la clé
                    </button>
                  )}
                </div>

                {/* Status Message Banner */}
                {statusMessage && (
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
                      keyStatus === "valid"
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                        : keyStatus === "error"
                        ? "bg-red-500/10 text-red-300 border-red-500/30"
                        : keyStatus === "testing"
                        ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                        : "bg-white/5 text-gray-300 border-white/10"
                    }`}
                  >
                    <span>
                      {keyStatus === "valid" ? "✅" : keyStatus === "error" ? "❌" : keyStatus === "testing" ? "⏳" : "ℹ️"}
                    </span>
                    <span className="text-[11px] leading-tight flex-1">{statusMessage}</span>
                  </div>
                )}

                {/* Inputs Grid: Key, Pseudo, Region */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  {/* API Key Input */}
                  <div className="sm:col-span-6 relative">
                    <input
                      type={showKeyInput ? "text" : "password"}
                      value={riotApiKey}
                      onChange={(e) => setRiotApiKey(e.target.value)}
                      placeholder="RGAPI-... ou HDEV-..."
                      className="w-full px-3 py-2 pr-9 rounded-xl bg-black/60 border border-white/10 text-xs text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-red-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeyInput(!showKeyInput)}
                      title={showKeyInput ? "Masquer la clé" : "Afficher la clé"}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs cursor-pointer"
                    >
                      {showKeyInput ? "🙈" : "👁️"}
                    </button>
                  </div>

                  {/* Pseudo Input */}
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      value={testPseudo}
                      onChange={(e) => setTestPseudo(e.target.value)}
                      placeholder="Pseudo#Tag (ex: Gr4phØ#0001)"
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-red-500/50"
                    />
                  </div>

                  {/* Region Select */}
                  <div className="sm:col-span-2">
                    <select
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-red-500/50 cursor-pointer"
                    >
                      <option value="eu">EU</option>
                      <option value="na">NA</option>
                      <option value="ap">AP</option>
                      <option value="kr">KR</option>
                      <option value="latam">LATAM</option>
                      <option value="br">BR</option>
                    </select>
                  </div>
                </div>

                {/* Validation and Info Actions */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span>💡 Obtenez votre clé sur :</span>
                    <a
                      href="https://developer.riotgames.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-red-400 hover:underline font-bold"
                    >
                      developer.riotgames.com ↗
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={keyStatus === "testing" || !riotApiKey.trim()}
                      onClick={handleTestAndSaveKey}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-[var(--color-val-red,#ff4655)] hover:brightness-110 text-white shadow-[0_0_15px_rgba(255,70,85,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer select-none"
                    >
                      <span>⚡</span>
                      <span>{keyStatus === "testing" ? "Validation..." : "Valider & Désactiver le Mock"}</span>
                    </button>
                  </div>
                </div>

                {/* Account Details pill if verified */}
                {accountInfo && (
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 text-gray-300">
                      <span className="text-emerald-400 font-bold">Compte Détecté :</span>
                      <span className="text-white font-black">
                        {accountInfo.gameName}#{accountInfo.tagLine}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono">
                      PUUID : {accountInfo.puuid ? `${accountInfo.puuid.slice(0, 8)}...${accountInfo.puuid.slice(-4)}` : "OK"}
                    </div>
                  </div>
                )}
              </div>
              {/* MASTER SWITCH & LIVE PREVIEW */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stats.enabled}
                      onChange={(e) => updateField("enabled", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-val-red,#ff4655)]"></div>
                  </label>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      {stats.enabled ? "Overrides Actifs ⚡" : "Données Réelles Riot 🔒"}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {stats.enabled
                        ? "Les stats personnalisées ci-dessous s'appliquent sur tout le site."
                        : "Basculez pour écraser les données réelles et tester vos valeurs."}
                    </span>
                  </div>
                </div>

                {/* LIVE STAR PREVIEW BADGE */}
                <div className="flex items-center gap-3 bg-black/60 px-3 py-2 rounded-xl border border-white/10">
                  <PerformanceStarBadge
                    grade={previewScoreResult.grade}
                    score={previewScoreResult.totalScore}
                    gradeColor={previewScoreResult.gradeColor}
                    gradeBg={previewScoreResult.gradeBg}
                    gradeBorder={previewScoreResult.gradeBorder}
                    gradeGlow={previewScoreResult.gradeGlow}
                    gradeTitle={previewScoreResult.gradeTitle}
                    size="sm"
                    layout="beside"
                  />
                </div>
              </div>

              {/* PRESETS RAPIDES */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Préréglages Compétitifs Rapides :
                  </span>
                  <button
                    type="button"
                    onClick={resetToReal}
                    className="text-[10px] text-gray-400 hover:text-white underline cursor-pointer"
                  >
                    Réinitialiser
                  </button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {Object.entries(PRESETS).map(([key, p]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => applyPreset(key)}
                      className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all cursor-pointer text-center"
                    >
                      <span className="text-sm">{p.icon}</span>
                      <span className="text-[10px] font-black text-white mt-0.5">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* STAT CONTROLS GRID */}
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Réglages Fins des Statistiques :
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (playerStats) {
                        syncSlidersWithStats(playerStats);
                        setStatusMessage("Sliders synchronisés avec le profil actuel !");
                      } else {
                        handleTestAndSaveKey();
                      }
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white border border-white/10 transition-all cursor-pointer select-none"
                    title="Caler tous les curseurs sur vos statistiques officielles"
                  >
                    <span>🔄</span>
                    <span>Synchroniser avec le profil</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* K/D RATIO */}
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-300">K/D Ratio</span>
                      <span className="text-[var(--color-val-red,#ff4655)] font-black">{stats.kd.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.20"
                      max="3.50"
                      step="0.05"
                      value={stats.kd}
                      onChange={(e) => updateField("kd", parseFloat(e.target.value))}
                      className="w-full accent-[var(--color-val-red,#ff4655)] cursor-pointer"
                    />
                  </div>

                  {/* ACS */}
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-300">Combat Score (ACS)</span>
                      <span className="text-cyan-400 font-black">{stats.acs}</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="450"
                      step="5"
                      value={stats.acs}
                      onChange={(e) => updateField("acs", parseInt(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  {/* HEADSHOT % */}
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-300">Tirs à la tête (HS %)</span>
                      <span className="text-amber-400 font-black">{stats.hs}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="65"
                      step="1"
                      value={stats.hs}
                      onChange={(e) => updateField("hs", parseInt(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>

                  {/* WIN RATE % */}
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-300">Victoires (Win Rate %)</span>
                      <span className="text-emerald-400 font-black">{stats.winRate}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="95"
                      step="1"
                      value={stats.winRate}
                      onChange={(e) => updateField("winRate", parseInt(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>

                  {/* KAST % */}
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-300">KAST (%)</span>
                      <span className="text-purple-400 font-black">{stats.kast}%</span>
                    </div>
                    <input
                      type="range"
                      min="35"
                      max="95"
                      step="1"
                      value={stats.kast}
                      onChange={(e) => updateField("kast", parseInt(e.target.value))}
                      className="w-full accent-purple-400 cursor-pointer"
                    />
                  </div>

                  {/* ADR */}
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-300">Dégâts / Round (ADR)</span>
                      <span className="text-blue-400 font-black">{stats.adr}</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="250"
                      step="2"
                      value={stats.adr}
                      onChange={(e) => updateField("adr", parseInt(e.target.value))}
                      className="w-full accent-blue-400 cursor-pointer"
                    />
                  </div>

                  {/* FIRST BLOODS PER MATCH */}
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-300">First Bloods / Match</span>
                      <span className="text-rose-400 font-black">{stats.firstBloods.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="12"
                      step="0.2"
                      value={stats.firstBloods}
                      onChange={(e) => updateField("firstBloods", parseFloat(e.target.value))}
                      className="w-full accent-rose-400 cursor-pointer"
                    />
                  </div>

                  {/* CLUTCHES */}
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-300">Clutches Gagnés</span>
                      <span className="text-indigo-400 font-black">{stats.clutches}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      step="1"
                      value={stats.clutches}
                      onChange={(e) => updateField("clutches", parseInt(e.target.value))}
                      className="w-full accent-indigo-400 cursor-pointer"
                    />
                  </div>
                </div>

                {/* ROLE SELECTION */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-300">Pondération par Rôle :</span>
                    <span className="text-[10px] text-gray-400">Règle les coefficients d&apos;évaluation SPI</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(["Auto", "Duelist", "Initiator", "Controller", "Sentinel", "Flex"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => updateField("role", r)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          stats.role === r
                            ? "bg-[var(--color-val-red,#ff4655)] text-white shadow-lg"
                            : "bg-white/5 text-gray-400 hover:text-white"
                        }`}
                      >
                        {r === "Auto" ? `Auto (${currentRole})` : r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER DU PANEL */}
            <div className="p-4 border-t border-white/10 bg-white/[0.01] flex items-center justify-between">
              <span className="text-[10px] text-gray-500">
                ⚡ Ce panneau est injecté dynamiquement sur localhost. Il ne sera jamais déployé sur Vercel.
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
