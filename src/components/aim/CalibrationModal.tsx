"use client";

import React, { useState, useCallback, useRef } from "react";
import type {
  CrosshairSettings,
  ValorantSensSettings,
  CalibrationResult,
  AdaptiveConfig,
  PlayerProfile,
} from "./types";
import { AIM_RANKS, calculateRankFromScore } from "./ranks";
import Range3DCanvas from "./Range3DCanvas";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  crosshair: CrosshairSettings;
  sensitivity: ValorantSensSettings;
  themeAccent?: string;
  onCalibrationComplete: (result: CalibrationResult) => void;
}

const CALIBRATION_STEPS = [
  {
    step: 1,
    scenarioId: "spider_3d" as const,
    title: "Épreuve 1/4 : Flicking Grand Angle 3D",
    desc: "Cibles apparaissant à 180° autour de vous. La vitesse et la taille s'ajustent en temps réel à votre régularité.",
    duration: 25,
    categoryName: "Flicking & Réflexes",
  },
  {
    step: 2,
    scenarioId: "microflick_3d" as const,
    title: "Épreuve 2/4 : Micro-Ajustement Headshot 3D",
    desc: "Têtes d'agents à distances variées (10m à 50m). Précision chirurgicale requise pour calibrer le one-tap.",
    duration: 25,
    categoryName: "Micro-Précision",
  },
  {
    step: 3,
    scenarioId: "tracking_strafe" as const,
    title: "Épreuve 3/4 : Suivi Dynamique (Tracking 3D)",
    desc: "Mannequin en counter-strafe continu. Maintenez le viseur sur la tête pour évaluer votre stabilité.",
    duration: 25,
    categoryName: "Smooth Tracking",
  },
  {
    step: 4,
    scenarioId: "reaction_3d" as const,
    title: "Épreuve 4/4 : Temps de Réaction Pur 3D",
    desc: "Orbe apparaissant subitement dans l'espace 3D. 10 essais pour chronométrer votre temps de réaction moteur.",
    duration: 0,
    categoryName: "Réactivité Pure",
  },
];

export default function CalibrationModal({
  isOpen,
  onClose,
  crosshair,
  sensitivity,
  themeAccent = "#ff4655",
  onCalibrationComplete,
}: Props) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [inGame, setInGame] = useState(false);
  const [scores, setScores] = useState<number[]>([]);
  const [accuracies, setAccuracies] = useState<number[]>([]);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [result, setResult] = useState<CalibrationResult | null>(null);

  const liveAdaptiveConfigRef = useRef<AdaptiveConfig>({
    targetScale: 1.0,
    spawnRateMs: 800,
    targetSpeed: 1.0,
    targetDistance: [10, 30],
    angleSpread: 1.0,
  });

  const step = CALIBRATION_STEPS[currentStepIdx];

  const handleAdaptiveUpdate = useCallback((newConfig: AdaptiveConfig) => {
    liveAdaptiveConfigRef.current = newConfig;
  }, []);

  const handleStepFinish = useCallback(
    (record: any) => {
      setInGame(false);
      setScores((prev) => [...prev, record.score || 0]);
      setAccuracies((prev) => [...prev, record.accuracy || 0]);

      if (record.scenarioId === "reaction_3d") {
        setReactionTimes((prev) => [...prev, record.avgTimeToHitMs || 215]);
      }

      if (currentStepIdx < CALIBRATION_STEPS.length - 1) {
        setCurrentStepIdx((prev) => prev + 1);
      } else {
        const allScores = [...scores, record.score || 0];
        const allAcc = [...accuracies, record.accuracy || 0];
        const flick = allScores[0] || 45000;
        const micro = allScores[1] || 40000;
        const tracking = allScores[2] || 35000;
        const reactionMs = record.avgTimeToHitMs || 215;

        const compositeScore = Math.round(
          flick * 0.35 +
            micro * 0.35 +
            tracking * 0.2 +
            (1000000 / Math.max(120, reactionMs)) * 0.1
        );

        const rankTier = calculateRankFromScore(compositeScore);
        const avgAcc =
          allAcc.length > 0
            ? Math.round(allAcc.reduce((a, b) => a + b, 0) / allAcc.length)
            : 85;

        let playerProfile: PlayerProfile = "balanced";
        if (micro > flick * 1.15 && micro > tracking * 1.15) {
          playerProfile = "sniper";
        } else if (flick > micro * 1.15 && reactionMs < 200) {
          playerProfile = "duelist";
        } else if (tracking > flick * 1.1) {
          playerProfile = "tracker";
        }

        const adaptiveDifficulty =
          Math.round(Math.min(2.5, Math.max(0.7, compositeScore / 50000)) * 100) / 100;

        let recSens = sensitivity.sens;
        if (avgAcc < 65) {
          recSens = Math.max(0.18, Math.round(sensitivity.sens * 0.88 * 100) / 100);
        } else if (reactionMs > 270 && avgAcc >= 85) {
          recSens = Math.min(0.75, Math.round(sensitivity.sens * 1.08 * 100) / 100);
        }

        const calResult: CalibrationResult = {
          completedAt: Date.now(),
          overallScore: compositeScore,
          rankId: rankTier.id,
          flickScore: flick,
          microScore: micro,
          trackingScore: tracking,
          reactionTimeMs: reactionMs,
          accuracyAvg: avgAcc,
          playerProfile,
          adaptiveDifficulty,
          recommendedSens: recSens,
          recommendedDpi: sensitivity.dpi,
        };

        setResult(calResult);

        try {
          localStorage.setItem("sgs_aim_calibration", JSON.stringify(calResult));
          localStorage.setItem("sgs_aim_rank", rankTier.id);
          localStorage.setItem("sgs_aim_adaptive_diff", String(adaptiveDifficulty));
        } catch {}

        onCalibrationComplete(calResult);
      }
    },
    [currentStepIdx, scores, accuracies, sensitivity, onCalibrationComplete]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      {inGame && (
        <div className="w-full h-full max-w-6xl max-h-[88vh] bg-[#0a0e13] rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
          <Range3DCanvas
            scenarioId={step.scenarioId}
            crosshair={crosshair}
            sensitivity={sensitivity}
            themeAccent={themeAccent}
            isCalibrationMode={true}
            adaptiveConfig={liveAdaptiveConfigRef.current}
            onAdaptiveUpdate={handleAdaptiveUpdate}
            onFinish={handleStepFinish}
            onBack={() => setInGame(false)}
          />
        </div>
      )}

      {!inGame && !result && (
        <div className="glass-panel rounded-3xl p-6 sm:p-9 max-w-xl w-full space-y-6 text-center border border-[#ff4655]/40 shadow-2xl animate-in zoom-in-95 relative">
          {/* Close button so user is never trapped */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-[#8b97a3] hover:text-white transition-all cursor-pointer"
            title="Fermer et explorer le menu"
          >
            ✕
          </button>

          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#ff4655]/15 border border-[#ff4655]/40 flex items-center justify-center text-[#ff4655]">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff4655]/20 text-[#ff4655] text-[10px] font-black uppercase tracking-widest border border-[#ff4655]/30">
              <span className="w-2 h-2 rounded-full bg-[#ff4655] animate-ping" />
              <span>Test de Calibration 3D</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-3">{step.title}</h2>
            <p className="text-xs text-[#8b97a3] mt-2 leading-relaxed max-w-md mx-auto">
              {step.desc}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-left">
            <div>
              <div className="text-[10px] font-black uppercase text-[#ff4655] tracking-wider">
                Ajustement Dynamique en Direct
              </div>
              <div className="text-xs font-bold text-gray-300 mt-0.5">
                La vitesse et la taille s&apos;ajustent en direct selon votre précision.
              </div>
            </div>
            <span className="px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase font-mono">
              IA ACTIVE
            </span>
          </div>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2 pt-1">
            {CALIBRATION_STEPS.map((s, idx) => (
              <div
                key={s.step}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  idx === currentStepIdx
                    ? "w-10 bg-[#ff4655]"
                    : idx < currentStepIdx
                    ? "w-2.5 bg-emerald-400"
                    : "w-2.5 bg-white/20"
                }`}
              />
            ))}
          </div>

          {/* Buttons: Start test + Explorer d'abord */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#8b97a3] hover:text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Explorer les Menus d&apos;abord
            </button>
            <button
              type="button"
              onClick={() => setInGame(true)}
              className="flex-1 py-3.5 px-6 rounded-xl bg-[#ff4655] hover:brightness-110 text-white font-black text-xs uppercase tracking-widest transition-all shadow-accent-md cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Lancer l&apos;Épreuve {step.step}/4</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      )}

      {/* Results screen */}
      {!inGame && result && (
        <div className="glass-panel rounded-3xl p-6 sm:p-9 max-w-xl w-full space-y-6 text-center border border-[#ff4655]/40 shadow-2xl animate-in zoom-in-95">
          <div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
              Calibration Réussie avec Succès
            </span>
            <h2 className="text-3xl font-black text-white mt-3">Votre Rang Compétitif</h2>
          </div>

          {(() => {
            const rankTier = AIM_RANKS[result.rankId] || AIM_RANKS.gold;
            return (
              <div
                className="p-6 rounded-2xl border flex flex-col items-center justify-center gap-2 relative overflow-hidden"
                style={{
                  backgroundColor: rankTier.bgColor,
                  borderColor: rankTier.borderColor,
                }}
              >
                <div className="text-4xl sm:text-5xl font-black tracking-tight" style={{ color: rankTier.color }}>
                  {rankTier.name.toUpperCase()}
                </div>
                <div className="text-xs font-bold text-[#8b97a3]">{rankTier.description}</div>
                <div className="text-sm font-black text-white mt-1">
                  Score Composite :{" "}
                  <span style={{ color: rankTier.color }}>
                    {result.overallScore.toLocaleString()} pts
                  </span>
                </div>
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-black/50 border border-white/10 text-xs text-white font-bold">
                  <span>Profil :</span>
                  <span className="text-[#ff4655] uppercase font-black">{result.playerProfile}</span>
                  <span>• Facteur IA : x{result.adaptiveDifficulty}</span>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="text-[10px] font-bold text-[#8b97a3] uppercase">Précision Moyenne</div>
              <div className="text-xl font-black text-white">{result.accuracyAvg}%</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="text-[10px] font-bold text-[#8b97a3] uppercase">Temps Réaction Pur</div>
              <div className="text-xl font-black text-sky-400">{result.reactionTimeMs}ms</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 col-span-2">
              <div className="text-[10px] font-bold text-[#8b97a3] uppercase">Sensibilité Optimale Valorant</div>
              <div className="text-sm font-black text-[#ffaa00]">
                {result.recommendedSens} Sens • {result.recommendedDpi} DPI (eDPI :{" "}
                {Math.round(result.recommendedSens * result.recommendedDpi)})
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-4 rounded-2xl bg-[#ff4655] hover:brightness-110 text-white font-black text-xs uppercase tracking-widest transition-all shadow-accent-md cursor-pointer"
          >
            Débloquer Tous les Scénarios
          </button>
        </div>
      )}
    </div>
  );
}
