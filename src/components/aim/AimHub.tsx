"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import type {
  AimScenarioId,
  CrosshairSettings,
  ValorantSensSettings,
  AimScoreRecord,
  AimRankId,
  CalibrationResult,
  AimLevelInfo,
} from "./types";
import { AIM_RANKS, getAimLevelInfo, getNextRank } from "./ranks";
import { aimSounds } from "./sounds";
import ScenarioSelector from "./ScenarioSelector";
import CrosshairEditor from "./CrosshairEditor";
import SensitivityPanel from "./SensitivityPanel";
import CalibrationModal from "./CalibrationModal";
import AimLeaderboard from "./AimLeaderboard";

const Range3DCanvas = dynamic(() => import("./Range3DCanvas"), { ssr: false });

const DEFAULT_CROSSHAIR: CrosshairSettings = {
  color: "#00ff80",
  showCenterDot: true,
  centerDotSize: 2,
  innerLinesLength: 6,
  innerLinesThickness: 2,
  innerLinesOffset: 3,
  innerLinesOpacity: 1,
  outerLines: false,
  outerLinesLength: 4,
  outerLinesThickness: 2,
  outerLinesOffset: 10,
  outerLinesOpacity: 0.5,
};

const DEFAULT_SENS: ValorantSensSettings = {
  sens: 0.35,
  dpi: 800,
  fov: 103,
};

type HubView = "menu" | "training" | "settings" | "leaderboard";

interface Props {
  theme?: string;
  user?: any;
}

export default function AimHub({ theme: propTheme, user: propUser }: Props) {
  const [, startTransition] = useTransition();
  const { data: session } = useSession();

  const currentUser = propUser || session?.user || {
    id: "guest",
    name: "Agent",
  };

  const [view, setView] = useState<HubView>("menu");
  const [activeScenario, setActiveScenario] = useState<AimScenarioId>("assault_runner_3d");
  const [showCalibration, setShowCalibration] = useState(false);
  const [calibrationDone, setCalibrationDone] = useState(false);
  const [userRank, setUserRank] = useState<AimRankId>("gold");
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState<number>(1.0);
  const [themeAccent, setThemeAccent] = useState<string>("#ff4655");
  const [themeBg, setThemeBg] = useState<string>("#0a0e13");
  const [recentScores, setRecentScores] = useState<any[]>([]);
  const [aimLevelInfo, setAimLevelInfo] = useState<AimLevelInfo>(() => getAimLevelInfo(4500));
  const [promotionModal, setPromotionModal] = useState<{ previousRank: AimRankId; newRank: AimRankId } | null>(null);

  // Crosshair state
  const [crosshair, setCrosshair] = useState<CrosshairSettings>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("sgs_aim_crosshair");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_CROSSHAIR;
  });

  // Sensitivity state
  const [sensitivity, setSensitivity] = useState<ValorantSensSettings>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("sgs_aim_sensitivity");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_SENS;
  });

  const [settingsTab, setSettingsTab] = useState<"crosshair" | "sensitivity">("crosshair");

  // Derive theme accent & background from active tracker theme
  useEffect(() => {
    const th = propTheme || "dark";
    if (th === "crimson" || th === "red") {
      setThemeAccent("#ff2a44");
      setThemeBg("#12080a");
    } else if (th === "midnight" || th === "blue") {
      setThemeAccent("#8c64ff");
      setThemeBg("#0b0820");
    } else if (th === "ocean" || th === "cyan") {
      setThemeAccent("#32c8b4");
      setThemeBg("#041316");
    } else if (th.startsWith("custom:")) {
      const matchAccent = th.match(/accent=([^,]+)/);
      const matchBg = th.match(/bg=([^,]+)/);
      if (matchAccent) setThemeAccent(matchAccent[1]);
      if (matchBg) setThemeBg(matchBg[1]);
    } else {
      setThemeAccent("#ff4655");
      setThemeBg("#0a0e13");
    }
  }, [propTheme]);

  // Load user's aim profile and calibration from Neon DB on mount
  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      // 1. Check local storage first for instant load
      if (typeof window !== "undefined") {
        try {
          const savedCal = localStorage.getItem("sgs_aim_calibration");
          const savedRank = localStorage.getItem("sgs_aim_rank") as AimRankId;
          const savedDiff = localStorage.getItem("sgs_aim_adaptive_diff");
          if (savedCal && savedRank) {
            setCalibrationDone(true);
            setUserRank(savedRank);
            if (savedDiff) setAdaptiveDifficulty(parseFloat(savedDiff) || 1.0);
          }
        } catch {}
      }

      // 2. Fetch official profile from Neon DB
      if (currentUser?.id && currentUser.id !== "guest") {
        try {
          const res = await fetch(`/api/aim/profile?userId=${encodeURIComponent(currentUser.id)}`);
          if (res.ok && active) {
            const data = await res.json();
            if (data.profile) {
              setCalibrationDone(Boolean(data.profile.calibrationDone));
              if (data.profile.userRank) setUserRank(data.profile.userRank as AimRankId);
              if (data.profile.adaptiveDifficulty) setAdaptiveDifficulty(data.profile.adaptiveDifficulty);
              if (data.profile.recommendedSens) {
                setSensitivity((prev) => ({
                  ...prev,
                  sens: data.profile.recommendedSens,
                  dpi: data.profile.recommendedDpi || prev.dpi,
                }));
              }
            }
            if (data.aimLevelInfo) {
              setAimLevelInfo(data.aimLevelInfo);
            }
            if (Array.isArray(data.recentSessions)) {
              setRecentScores(data.recentSessions);
            }
          }
        } catch (e) {
          console.warn("Neon DB profile load fallback:", e);
        }
      }
    };

    loadProfile();
    return () => {
      active = false;
    };
  }, [currentUser?.id]);

  const handleCrosshairChange = useCallback((ch: CrosshairSettings) => {
    setCrosshair(ch);
    if (typeof window !== "undefined") {
      localStorage.setItem("sgs_aim_crosshair", JSON.stringify(ch));
    }
  }, []);

  const handleSensChange = useCallback((s: ValorantSensSettings) => {
    setSensitivity(s);
    if (typeof window !== "undefined") {
      localStorage.setItem("sgs_aim_sensitivity", JSON.stringify(s));
    }
  }, []);

  const handleSelectScenario = useCallback(
    (id: AimScenarioId) => {
      if (!calibrationDone) {
        setShowCalibration(true);
        return;
      }
      setActiveScenario(id);
      startTransition(() => {
        setView("training");
      });
    },
    [calibrationDone]
  );

  const handleFinish = useCallback(
    async (record: Omit<AimScoreRecord, "id" | "userId" | "userName" | "verified">) => {
      setRecentScores((prev) => [record, ...prev].slice(0, 15));

      const payload = {
        ...record,
        userId: currentUser?.id || "guest",
        userName: currentUser?.name || "Agent",
        userRank,
        difficulty: adaptiveDifficulty,
        calibrationDone,
      };

      try {
        const res = await fetch("/api/aim/save-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const result = await res.json();
          if (result.aimLevelInfo) {
            setAimLevelInfo(result.aimLevelInfo);
          } else if (result.currentXp) {
            setAimLevelInfo(getAimLevelInfo(result.currentXp));
          }
          if (result.promoted && result.newRank) {
            setUserRank(result.newRank);
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem("sgs_aim_rank", result.newRank);
              } catch {}
            }
            setPromotionModal({
              previousRank: result.previousRank || userRank,
              newRank: result.newRank,
            });
            aimSounds.playCountdownGo();
          }
        }
      } catch (err) {
        console.warn("Neon DB score save error:", err);
      }
    },
    [currentUser, userRank, adaptiveDifficulty, calibrationDone]
  );

  const handleCalibrationComplete = useCallback(
    async (cal: CalibrationResult) => {
      setUserRank(cal.rankId);
      setCalibrationDone(true);
      setAdaptiveDifficulty(cal.adaptiveDifficulty);
      setShowCalibration(false);
      setSensitivity((prev) => ({
        ...prev,
        sens: cal.recommendedSens,
        dpi: cal.recommendedDpi,
      }));

      // Persist directly to Neon DB
      try {
        await fetch("/api/aim/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser?.id,
            calibration: cal,
          }),
        });
      } catch (e) {
        console.warn("Neon DB calibration save error:", e);
      }
    },
    [currentUser?.id]
  );

  return (
    <div
      className="w-full min-h-[calc(100vh-56px)] flex flex-col text-[var(--color-text-primary)] transition-colors duration-300"
      style={{ backgroundColor: themeBg }}
    >
      {/* Top Navigation Bar */}
      {view !== "training" && (
        <header className="flex-shrink-0 h-16 border-b border-white/[0.08] bg-black/40 backdrop-blur-xl flex items-center justify-between px-6 sm:px-10 z-30">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: `${themeAccent}20`,
                borderColor: `${themeAccent}50`,
                color: themeAccent,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-white uppercase tracking-wider">STAND DE TIR 3D</span>
                <span
                  className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest text-white"
                  style={{ backgroundColor: themeAccent }}
                >
                  NATIF
                </span>
              </div>
              <span className="text-[10px] text-[var(--color-text-secondary)] font-bold">
                Moteur 3D Valorant Intégré
              </span>
            </div>
          </div>

          {/* Aim XP & Level Pill in Hub Header */}
          <div className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-2xl bg-white/[0.04] border border-white/10">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs border shadow-sm"
              style={{
                backgroundColor: AIM_RANKS[userRank]?.bgColor || "rgba(255,255,255,0.05)",
                borderColor: AIM_RANKS[userRank]?.borderColor || "rgba(255,255,255,0.15)",
                color: AIM_RANKS[userRank]?.color || "#fff",
              }}
            >
              {AIM_RANKS[userRank]?.name.charAt(0) || "G"}
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-black text-white">
                <span>Niveau {aimLevelInfo.level}</span>
                <span className="text-[10px] text-gray-400 font-bold">• {aimLevelInfo.title}</span>
              </div>
              <div className="w-28 h-1.5 rounded-full bg-white/10 overflow-hidden mt-1">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${aimLevelInfo.progressPercent}%`,
                    backgroundColor: themeAccent,
                  }}
                />
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setView("menu")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                view === "menu"
                  ? "bg-[var(--color-val-red)] text-white shadow-md"
                  : "text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5"
              }`}
            >
              Scénarios 3D
            </button>
            <button
              type="button"
              onClick={() => setView("leaderboard")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                view === "leaderboard"
                  ? "bg-[var(--color-val-red)] text-white shadow-md"
                  : "text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5"
              }`}
            >
              Classement
            </button>
            <button
              type="button"
              onClick={() => setView("settings")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                view === "settings"
                  ? "bg-[var(--color-val-red)] text-white shadow-md"
                  : "text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5"
              }`}
            >
              Réglages
            </button>
          </nav>
        </header>
      )}

      {/* Main View Area */}
      <main className="flex-1 overflow-auto">
        {view === "menu" && (
          <div className="p-6 sm:p-10">
            <ScenarioSelector
              onSelect={handleSelectScenario}
              onOpenCalibration={() => setShowCalibration(true)}
              userRank={userRank}
              calibrationDone={calibrationDone}
              adaptiveMultiplier={adaptiveDifficulty}
              userName={currentUser?.name || "Agent"}
              themeAccent={themeAccent}
              aimLevelInfo={aimLevelInfo}
            />

            {/* Recent Sessions */}
            {recentScores.length > 0 && (
              <div className="max-w-7xl mx-auto mt-10 space-y-4 animate-in fade-in">
                <h2 className="font-black text-lg text-white flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-val-red)" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                  <span>Dernières Performances Sauvegardées sur Neon</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {recentScores.slice(0, 6).map((s, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between hover:border-white/20 transition-colors"
                    >
                      <div>
                        <div className="text-xs font-bold text-white uppercase">{s.scenarioId}</div>
                        <div className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">
                          Préc. {s.accuracy}% • {s.avgTimeToHitMs}ms • 3D
                        </div>
                      </div>
                      <div className="text-xl font-black text-[var(--color-val-red)]">
                        {Number(s.score).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {view === "training" && (
          <div className="w-full h-[calc(100vh-56px)] relative">
            <Range3DCanvas
              scenarioId={activeScenario}
              crosshair={crosshair}
              sensitivity={sensitivity}
              themeAccent={themeAccent}
              themeBg={themeBg}
              adaptiveConfig={{
                targetScale: Math.max(0.7, 1.3 - adaptiveDifficulty * 0.25),
                spawnRateMs: 800,
                targetSpeed: adaptiveDifficulty,
                targetDistance: [10, 45],
                angleSpread: 1.0,
              }}
              onFinish={handleFinish}
              onBack={() => setView("menu")}
            />
          </div>
        )}

        {view === "leaderboard" && (
          <div className="p-6 sm:p-10">
            <AimLeaderboard
              userRank={userRank}
              userName={currentUser?.name || "Agent"}
              themeAccent={themeAccent}
            />
          </div>
        )}

        {view === "settings" && (
          <div className="p-6 sm:p-10 max-w-3xl mx-auto space-y-6 animate-in fade-in">
            <div className="flex gap-2 border-b border-white/10 pb-4">
              <button
                type="button"
                onClick={() => setSettingsTab("crosshair")}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  settingsTab === "crosshair"
                    ? "bg-[var(--color-val-red)] text-white shadow-md"
                    : "text-[var(--color-text-secondary)] hover:text-white bg-white/[0.03] border border-white/10"
                }`}
              >
                Réticule & Viseur
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab("sensitivity")}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  settingsTab === "sensitivity"
                    ? "bg-[var(--color-val-red)] text-white shadow-md"
                    : "text-[var(--color-text-secondary)] hover:text-white bg-white/[0.03] border border-white/10"
                }`}
              >
                Sensibilité & DPI Valorant
              </button>
            </div>

            {settingsTab === "crosshair" && (
              <CrosshairEditor crosshair={crosshair} onChange={handleCrosshairChange} />
            )}
            {settingsTab === "sensitivity" && (
              <SensitivityPanel settings={sensitivity} onChange={handleSensChange} />
            )}

            <button
              type="button"
              onClick={() => setView("menu")}
              className="w-full py-4 rounded-2xl bg-[var(--color-val-red)] hover:brightness-110 text-white font-black text-xs uppercase tracking-widest transition-all shadow-md cursor-pointer"
            >
              Sauvegarder & Retour au Menu
            </button>
          </div>
        )}
      </main>

      {/* Non-intrusive Calibration Modal (Closable at will!) */}
      <CalibrationModal
        isOpen={showCalibration}
        onClose={() => setShowCalibration(false)}
        crosshair={crosshair}
        sensitivity={sensitivity}
        themeAccent={themeAccent}
        themeBg={themeBg}
        onCalibrationComplete={handleCalibrationComplete}
      />

      {/* Promotion Modal Celebration */}
      {promotionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md p-8 rounded-3xl bg-gradient-to-b from-[#162130] to-[#0a0e13] border-2 border-amber-400/60 shadow-[0_0_50px_rgba(251,191,36,0.3)] text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-amber-400/20 border-2 border-amber-400/50 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(251,191,36,0.4)] animate-bounce">
              👑
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-400/20 text-amber-300 border border-amber-400/40">
                PROMOTION MENSUELLE #1 !
              </span>
              <h2 className="text-3xl font-black text-white tracking-tight">FÉLICITATIONS !</h2>
              <p className="text-xs text-[#8b97a3]">
                Vous avez pris la 1ère place du mois de votre rang ! Vous êtes immédiatement promu au rang supérieur.
              </p>
            </div>

            {/* Transition ranks */}
            <div className="flex items-center justify-center gap-4 py-3 px-4 rounded-2xl bg-white/[0.04] border border-white/10">
              <div className="text-center">
                <div className="text-[10px] uppercase font-bold text-[#8b97a3]">Ancien Rang</div>
                <div
                  className="text-base font-black uppercase mt-0.5"
                  style={{ color: AIM_RANKS[promotionModal.previousRank]?.color || "#8b97a3" }}
                >
                  {AIM_RANKS[promotionModal.previousRank]?.name || promotionModal.previousRank}
                </div>
              </div>

              <div className="text-amber-400 font-black text-2xl">➔</div>

              <div className="text-center">
                <div className="text-[10px] uppercase font-bold text-amber-300">Nouveau Rang</div>
                <div
                  className="text-xl font-black uppercase mt-0.5 tracking-wide drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                  style={{ color: AIM_RANKS[promotionModal.newRank]?.color || "#ffd700" }}
                >
                  {AIM_RANKS[promotionModal.newRank]?.name || promotionModal.newRank}
                </div>
              </div>
            </div>

            <div className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl py-2 px-3">
              🎉 Bonus promotion : +500 EXP accordé sur votre profil !
            </div>

            <button
              type="button"
              onClick={() => setPromotionModal(null)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-black font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] cursor-pointer"
            >
              C&apos;est parti pour le rang supérieur !
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
