"use client";

import React, { useRef, useEffect } from "react";
import type { CrosshairSettings } from "./types";

interface Props {
  crosshair: CrosshairSettings;
  onChange: (ch: CrosshairSettings) => void;
}

const PRESET_COLORS = ["#00ff80", "#00ffff", "#ffffff", "#ff4655", "#ffaa00", "#aa44ff"];

export default function CrosshairEditor({ crosshair, onChange }: Props) {
  const previewRef = useRef<HTMLCanvasElement>(null);

  const update = (partial: Partial<CrosshairSettings>) => {
    onChange({ ...crosshair, ...partial });
  };

  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, w, h);

    // Subtle Grid
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const ch = crosshair;
    ctx.strokeStyle = ch.color;
    ctx.fillStyle = ch.color;

    if (ch.showCenterDot) {
      ctx.beginPath();
      ctx.arc(cx, cy, ch.centerDotSize * 1.5, 0, Math.PI * 2);
      ctx.globalAlpha = ch.innerLinesOpacity;
      ctx.fill();
    }

    ctx.lineWidth = ch.innerLinesThickness * 1.5;
    ctx.globalAlpha = ch.innerLinesOpacity;
    const off = ch.innerLinesOffset * 1.5;
    const len = ch.innerLinesLength * 1.5;

    ctx.beginPath();
    ctx.moveTo(cx, cy - off);
    ctx.lineTo(cx, cy - off - len);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy + off);
    ctx.lineTo(cx, cy + off + len);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - off, cy);
    ctx.lineTo(cx - off - len, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + off, cy);
    ctx.lineTo(cx + off + len, cy);
    ctx.stroke();

    if (ch.outerLines) {
      ctx.lineWidth = ch.outerLinesThickness * 1.5;
      ctx.globalAlpha = ch.outerLinesOpacity;
      const oOff = ch.outerLinesOffset * 1.5;
      const oLen = ch.outerLinesLength * 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy - oOff);
      ctx.lineTo(cx, cy - oOff - oLen);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy + oOff);
      ctx.lineTo(cx, cy + oOff + oLen);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - oOff, cy);
      ctx.lineTo(cx - oOff - oLen, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + oOff, cy);
      ctx.lineTo(cx + oOff + oLen, cy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, [crosshair]);

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in border border-white/10">
      <h2 className="font-black text-lg text-white flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-val-red)" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="22" y1="12" x2="18" y2="12" />
          <line x1="6" y1="12" x2="2" y2="12" />
          <line x1="12" y1="6" x2="12" y2="2" />
          <line x1="12" y1="22" x2="12" y2="18" />
        </svg>
        <span>Personnalisation du Réticule</span>
      </h2>

      {/* Preview */}
      <div className="flex justify-center">
        <canvas ref={previewRef} width={220} height={220} className="rounded-2xl border border-white/10 shadow-lg" />
      </div>

      {/* Colors */}
      <div>
        <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-secondary)] block mb-2">
          Couleur du Viseur
        </label>
        <div className="flex gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => update({ color: c })}
              className={`w-9 h-9 rounded-xl border-2 transition-all cursor-pointer ${
                crosshair.color === c ? "border-white scale-110 shadow-md" : "border-white/20 hover:border-white/50"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            type="color"
            value={crosshair.color}
            onChange={(e) => update({ color: e.target.value })}
            className="w-9 h-9 rounded-xl cursor-pointer bg-transparent border-0"
          />
        </div>
      </div>

      {/* Center Dot */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
        <span className="text-xs font-bold text-white">Point central (Center Dot)</span>
        <button
          onClick={() => update({ showCenterDot: !crosshair.showCenterDot })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
            crosshair.showCenterDot ? "bg-[var(--color-val-red)]" : "bg-white/10"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
              crosshair.showCenterDot ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        {[
          { label: "Écartement intérieur", key: "innerLinesOffset" as const, min: 0, max: 20 },
          { label: "Longueur intérieure", key: "innerLinesLength" as const, min: 2, max: 30 },
          { label: "Épaisseur intérieure", key: "innerLinesThickness" as const, min: 1, max: 6 },
          { label: "Opacité intérieure", key: "innerLinesOpacity" as const, min: 0.1, max: 1, step: 0.05 },
        ].map(({ label, key, min, max, step }) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[var(--color-text-secondary)]">{label}</span>
              <span className="text-xs font-mono font-bold text-white">{crosshair[key]}</span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              step={step || 1}
              value={crosshair[key] as number}
              onChange={(e) => update({ [key]: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[var(--color-val-red)]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
