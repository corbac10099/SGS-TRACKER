"use client";

import React, { useRef, useState } from "react";
import { IconTrophy, IconShare } from "./icons/SpyIcons";
import { sounds } from "@/lib/soundEffects";
import { UserBadges, parseBadges, BADGES_REGISTRY } from "./UserBadges";
import { PerformanceScoreResult } from "@/lib/valorant/performanceScore";
import PerformanceStarBadge from "./PerformanceStarBadge";

export interface PlayerCardModalProps {
  playerData: any;
  onClose: () => void;
  performanceScoreResult?: PerformanceScoreResult | null;
  isPublicSPI?: boolean;
}

export default function PlayerCardModal({
  playerData,
  onClose,
  performanceScoreResult,
  isPublicSPI = true,
}: PlayerCardModalProps) {
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const [sheenStyle, setSheenStyle] = useState<React.CSSProperties>({ opacity: 0 });

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -9;
    const rotateY = ((x - centerX) / centerX) * 9;
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: "transform 0.08s ease-out",
    });

    setSheenStyle({
      opacity: 0.6,
      background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.35) 0%, rgba(255, 70, 85, 0.15) 40%, transparent 70%)`,
      transition: "opacity 0.15s ease",
    });
  };

  const handleCardMouseLeave = () => {
    setTiltStyle({
      transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      transition: "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
    });
    setSheenStyle({
      opacity: 0,
      transition: "opacity 0.4s ease",
    });
  };

  const player = playerData?.player || {};
  const stats = playerData?.stats || player.stats || {};
  const rank = playerData?.rank || player.rank || "Ascendant 3";
  const rankUrl =
    playerData?.rankUrl ||
    player.rankUrl ||
    "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/24/largeicon.png";
  const mainAgent = playerData?.mainAgent ||
    player.mainAgent || {
      name: "Jett",
      icon: "https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png",
    };
  const bannerUrl =
    player.bannerUrl ||
    player.customBannerUrl ||
    player.cardWideUrl ||
    "https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/wideart.png";
  const topWeapon = playerData?.weapons?.[0] || {
    name: "Vandal",
    icon: "https://media.valorant-api.com/weapons/9c82e19d-4575-0200-1a81-3eacf00cf872/displayicon.png",
  };

  // Badge preferences
  const rawBadge = player.badge || playerData?.badge || null;
  const showBadge = playerData?.showBadge ?? player.showBadge ?? true;
  const hiddenBadges: string[] =
    typeof window !== "undefined"
      ? (() => {
          try {
            return JSON.parse(localStorage.getItem("spycam_hidden_badges") || "[]");
          } catch {
            return [];
          }
        })()
      : [];

  const activeBadges = showBadge ? parseBadges(rawBadge).filter((b) => !hiddenBadges.includes(b)) : [];
  const customBadgeUrl = player.customBadgeUrl || playerData?.customBadgeUrl;

  const getRankColor = (rankName: string) => {
    const r = (rankName || "").toLowerCase();
    if (r.includes("radiant")) return "#ffffaa";
    if (r.includes("immortal")) return "#ec4899";
    if (r.includes("ascendant")) return "#10b981";
    if (r.includes("diamond")) return "#c084fc";
    if (r.includes("platinum")) return "#38bdf8";
    if (r.includes("gold")) return "#fbbf24";
    if (r.includes("silver")) return "#94a3b8";
    return "#a8a29e";
  };

  const rankColor = getRankColor(rank);

  const handleDownload = async () => {
    sounds.playLockIn();
    setDownloading(true);
    try {
      const width = 1000;
      const height = 560;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Helper to load image
      const loadImage = (src: string): Promise<HTMLImageElement | null> => {
        return new Promise((resolve) => {
          if (!src) return resolve(null);
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = src;
        });
      };

      // 1. Draw Background Banner
      const bgImg = await loadImage(bannerUrl);
      if (bgImg) {
        ctx.drawImage(bgImg, 0, 0, width, height);
      } else {
        ctx.fillStyle = "#0c141d";
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Dark Overlay Gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "rgba(8, 12, 18, 0.75)");
      grad.addColorStop(0.5, "rgba(10, 15, 24, 0.85)");
      grad.addColorStop(1, "rgba(5, 7, 10, 0.95)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Red Top/Border Accent glow
      ctx.strokeStyle = "rgba(255, 70, 85, 0.35)";
      ctx.lineWidth = 3;
      ctx.strokeRect(1, 1, width - 2, height - 2);

      // 3. Top Left Section
      ctx.fillStyle = "#ff4655";
      ctx.font = "900 16px sans-serif";
      ctx.fillText("SPYCAM // CARD", 50, 65);

      // Player Name
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 44px sans-serif";
      const nameText = player.gameName || "Player";
      ctx.fillText(nameText, 50, 125);

      const nameWidth = ctx.measureText(nameText).width;
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 24px monospace";
      const tagText = `#${player.tagLine || "EU1"}`;
      ctx.fillText(tagText, 50 + nameWidth + 12, 122);
      const tagWidth = ctx.measureText(tagText).width;

      // Draw Badges if enabled and present
      if (showBadge && activeBadges.length > 0) {
        let badgeStartX = 50 + nameWidth + 12 + tagWidth + 16;
        for (const badgeId of activeBadges) {
          const badgeDef = BADGES_REGISTRY[badgeId];
          if (badgeDef) {
            ctx.save();
            ctx.font = "bold 13px sans-serif";
            const badgeLabel = badgeDef.label;
            const badgeTextWidth = ctx.measureText(badgeLabel).width;
            const pillW = badgeTextWidth + 24;
            const pillH = 26;
            const pillY = 100;

            // Pill Background
            ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
            ctx.beginPath();
            ctx.roundRect(badgeStartX, pillY, pillW, pillH, 13);
            ctx.fill();

            // Pill Border
            ctx.strokeStyle = badgeDef.colorClass.includes("sky")
              ? "#38bdf8"
              : badgeDef.colorClass.includes("amber")
              ? "#fbbf24"
              : badgeDef.colorClass.includes("pink")
              ? "#f472b6"
              : badgeDef.colorClass.includes("purple")
              ? "#c084fc"
              : badgeDef.colorClass.includes("emerald")
              ? "#34d399"
              : badgeDef.colorClass.includes("red")
              ? "#f87171"
              : "#fb923c";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Badge text
            ctx.fillStyle = ctx.strokeStyle;
            ctx.fillText(`★ ${badgeLabel}`, badgeStartX + 10, pillY + 18);
            ctx.restore();

            badgeStartX += pillW + 8;
          }
        }
      }

      // Rank Name under player name
      ctx.fillStyle = rankColor;
      ctx.font = "900 24px sans-serif";
      ctx.fillText(rank, 50, 168);

      // 4. Top Right: SPI Star Badge & Rank Emblem
      if (isPublicSPI && performanceScoreResult) {
        ctx.save();
        const cx = 675;
        const cy = 115;
        const sqSize = 66;

        // Subtle aura glow behind SPI star
        const starAura = ctx.createRadialGradient(cx, cy, 5, cx, cy, 65);
        starAura.addColorStop(0, performanceScoreResult.gradeBg || "rgba(255, 255, 255, 0.15)");
        starAura.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = starAura;
        ctx.beginPath();
        ctx.arc(cx, cy, 65, 0, Math.PI * 2);
        ctx.fill();

        ctx.translate(cx, cy);

        // 3 concentric rotated squares
        [0, 22.5, 45].forEach((deg) => {
          ctx.save();
          ctx.rotate((deg * Math.PI) / 180);
          ctx.fillStyle = performanceScoreResult.gradeBg || "rgba(255, 255, 255, 0.1)";
          ctx.strokeStyle = performanceScoreResult.gradeColor || "#ffffff";
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.roundRect(-sqSize / 2, -sqSize / 2, sqSize, sqSize, 4);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        });

        // Solid dark circular core for high readability
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.fillStyle = "#0b0f14";
        ctx.fill();
        ctx.strokeStyle = performanceScoreResult.gradeBorder || "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Grade letter inside star - large, bold and crystal clear
        ctx.fillStyle = performanceScoreResult.gradeColor || "#ffffff";
        ctx.font = performanceScoreResult.grade.length > 2 ? "900 20px sans-serif" : performanceScoreResult.grade.length === 2 ? "900 24px sans-serif" : "900 30px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
        ctx.shadowBlur = 4;
        ctx.fillText(performanceScoreResult.grade, 0, 1);

        ctx.restore();
      }

      // Rank Emblem with glow
      const rankImg = await loadImage(rankUrl);
      if (rankImg) {
        ctx.save();
        const auraGrad = ctx.createRadialGradient(850, 115, 10, 850, 115, 90);
        auraGrad.addColorStop(0, "rgba(255, 70, 85, 0.35)");
        auraGrad.addColorStop(1, "rgba(255, 70, 85, 0)");
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(850, 115, 90, 0, Math.PI * 2);
        ctx.fill();
        ctx.drawImage(rankImg, 780, 45, 140, 140);
        ctx.restore();
      }

      // 5. Center Floating Black Stats Box
      const boxX = 50;
      const boxY = 220;
      const boxW = 900;
      const boxH = 210;

      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 20);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Column 1: K/D
      ctx.fillStyle = "#94a3b8";
      ctx.font = "900 18px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("K/D", boxX + 180, boxY + 60);

      ctx.fillStyle = "#ffffff";
      ctx.font = "900 48px monospace";
      ctx.fillText(`${stats.kdRatio ?? "1.18"}`, boxX + 180, boxY + 125);

      // Column 2: HS %
      ctx.fillStyle = "#94a3b8";
      ctx.font = "900 18px sans-serif";
      ctx.fillText("HS %", boxX + 450, boxY + 60);

      ctx.fillStyle = "#ff4655";
      ctx.font = "900 48px monospace";
      ctx.fillText(`${stats.headshotPct ?? "28.1"}%`, boxX + 450, boxY + 125);

      // Column 3: WIN RATE
      ctx.fillStyle = "#94a3b8";
      ctx.font = "900 18px sans-serif";
      ctx.fillText("WIN RATE", boxX + 720, boxY + 60);

      ctx.fillStyle = "#10b981";
      ctx.font = "900 48px monospace";
      ctx.fillText(`${stats.winRate ?? "70"}%`, boxX + 720, boxY + 125);

      // 6. Bottom Row
      ctx.textAlign = "left";
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText("Agent :", 55, 495);
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 18px sans-serif";
      ctx.fillText(`${mainAgent.name || "Jett"}`, 125, 495);

      // Bottom Right: Weapon + ACS
      ctx.textAlign = "right";
      const weaponImg = await loadImage(topWeapon.icon);
      if (weaponImg) {
        ctx.drawImage(weaponImg, 730, 470, 75, 28);
      }
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 18px sans-serif";
      ctx.fillText(`ACS : ${stats.acs ?? "221"}`, 945, 495);

      // Export Download
      const link = document.createElement("a");
      link.download = `spycam-${player.gameName || "player"}-card.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.warn("Erreur export carte:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl glass-modal rounded-3xl p-5 sm:p-6 overflow-hidden flex flex-col gap-4 animate-player-card-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <IconTrophy size={18} className="text-[var(--color-val-red)]" />
            <h3 className="text-sm font-black text-[var(--color-text-primary)] uppercase tracking-wider">
              Exporter ma Carte Joueur
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              sounds.playCancel();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer border border-[var(--color-border)]"
          >
            ✕
          </button>
        </div>

        {/* Exact Landscape Player Card Live Preview with 3D Holographic Tilt */}
        <div
          ref={cardRef}
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
          style={tiltStyle}
          className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-white/20 shadow-2xl p-5 sm:p-7 flex flex-col justify-between select-none bg-black animate-card-glow cursor-crosshair transform-gpu"
        >
          {/* Holographic Sheen Reflection Overlay */}
          <div
            className="absolute inset-0 z-30 pointer-events-none rounded-2xl mix-blend-color-dodge"
            style={sheenStyle}
          />
          {/* Background Image Banner */}
          <img
            src={bannerUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/90 via-black/70 to-black/85"></div>

          {/* Top Section */}
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[var(--color-val-red)] mb-1">
                SPYCAM // CARD
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
                  {player.gameName || "Player"}
                </h2>
                <span className="text-xs sm:text-sm font-bold text-gray-400 font-mono">
                  #{player.tagLine || "EU1"}
                </span>

                {/* Unlocked Badges (if enabled) */}
                {showBadge && (
                  <UserBadges
                    badges={rawBadge}
                    showBadge={showBadge}
                    hiddenBadges={hiddenBadges}
                    size={16}
                  />
                )}

                {mainAgent?.icon && (
                  <img
                    src={mainAgent.icon}
                    alt=""
                    className="w-6 h-6 rounded-full border border-white/20 shadow-sm"
                  />
                )}
              </div>
              <span
                className="text-xs sm:text-sm font-black mt-1 uppercase tracking-wider drop-shadow-sm"
                style={{ color: rankColor }}
              >
                {rank}
              </span>
            </div>

            {/* Top Right: SPI Star & Rank Emblem */}
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              {isPublicSPI && performanceScoreResult && (
                <div
                  className="flex items-center justify-center transition-transform hover:scale-105"
                  title={`Score SPI : Grade ${performanceScoreResult.grade} (${performanceScoreResult.totalScore} pts)`}
                >
                  <PerformanceStarBadge
                    grade={performanceScoreResult.grade}
                    score={performanceScoreResult.totalScore}
                    gradeColor={performanceScoreResult.gradeColor}
                    gradeBg={performanceScoreResult.gradeBg}
                    gradeBorder={performanceScoreResult.gradeBorder}
                    gradeGlow={performanceScoreResult.gradeGlow}
                    size="md"
                    layout="icon-only"
                  />
                </div>
              )}

              <div className="relative flex items-center justify-center flex-shrink-0">
                <div className="absolute inset-0 bg-[var(--color-val-red)]/30 rounded-full blur-xl animate-pulse" />
                <img
                  src={rankUrl}
                  alt={rank}
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_0_20px_rgba(255,70,85,0.6)] relative z-10"
                />
              </div>
            </div>
          </div>

          {/* Center Floating Glass Box */}
          <div className="relative z-10 w-full bg-black/75 backdrop-blur-xl border border-white/15 rounded-xl sm:rounded-2xl p-3 sm:p-4 grid grid-cols-3 gap-2 text-center shadow-lg">
            <div className="flex flex-col items-center justify-center">
              <span className="text-[9px] sm:text-xs font-black uppercase tracking-wider text-gray-400">
                K/D
              </span>
              <span className="text-base sm:text-2xl font-black text-white font-mono mt-0.5">
                {stats.kdRatio ?? "1.18"}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center border-x border-white/10">
              <span className="text-[9px] sm:text-xs font-black uppercase tracking-wider text-gray-400">
                HS %
              </span>
              <span className="text-base sm:text-2xl font-black text-[var(--color-val-red)] font-mono mt-0.5">
                {stats.headshotPct ?? "28.1"}%
              </span>
            </div>

            <div className="flex flex-col items-center justify-center">
              <span className="text-[9px] sm:text-xs font-black uppercase tracking-wider text-gray-400">
                WIN RATE
              </span>
              <span className="text-base sm:text-2xl font-black text-emerald-400 font-mono mt-0.5">
                {stats.winRate ?? "70"}%
              </span>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="relative z-10 flex items-center justify-between text-xs sm:text-sm font-bold text-gray-300">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider">Agent :</span>
              <span className="text-white font-black">{mainAgent?.name || "Jett"}</span>
            </div>

            <div className="flex items-center gap-3">
              {topWeapon?.icon && (
                <img src={topWeapon.icon} alt="" className="h-4 sm:h-5 object-contain brightness-125" />
              )}
              <span className="text-white font-black">ACS : {stats.acs ?? "221"}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="w-full py-3.5 bg-[var(--color-val-red)] hover:bg-[#ff5865] active:scale-[0.99] text-white font-black uppercase tracking-wider text-xs sm:text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(255,70,85,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {downloading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <IconShare size={16} />
              <span>Télécharger l&apos;image PNG Haute Résolution</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
