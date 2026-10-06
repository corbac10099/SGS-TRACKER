"use client";

import React from "react";
import type { ValorantSensSettings } from "./types";

interface Props {
  settings: ValorantSensSettings;
  onChange: (s: ValorantSensSettings) => void;
}

export default function SensitivityPanel({ settings, onChange }: Props) {
  const edpi = Math.round(settings.sens * settings.dpi * 100) / 100;
  const cm360 = edpi > 0 ? Math.round(((2.54 * 360 * 39.37) / (edpi * 3.18)) * 10) / 10 : 0;

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-5 animate-in fade-in border border-white/10">
      <h2 className="font-black text-lg text-white flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-val-red)" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        <span>Sensibilité Valorant Calibrée</span>
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-secondary)] block mb-2">
            Sensibilité dans le Jeu
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max="5"
            value={settings.sens}
            onChange={(e) => onChange({ ...settings, sens: parseFloat(e.target.value) || 0.35 })}
            className="w-full bg-[#0f1923] border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold text-white focus:border-[var(--color-val-red)] focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-secondary)] block mb-2">
            DPI de la Souris
          </label>
          <input
            type="number"
            step="50"
            min="100"
            max="16000"
            value={settings.dpi}
            onChange={(e) => onChange({ ...settings, dpi: parseInt(e.target.value) || 800 })}
            className="w-full bg-[#0f1923] border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold text-white focus:border-[var(--color-val-red)] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
          <div className="text-[9px] font-black uppercase tracking-wider text-[var(--color-text-secondary)]">eDPI Calculé</div>
          <div className="text-2xl font-black text-[var(--color-val-red)] mt-1">{edpi}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
          <div className="text-[9px] font-black uppercase tracking-wider text-[var(--color-text-secondary)]">cm / 360°</div>
          <div className="text-2xl font-black text-sky-400 mt-1">{cm360} cm</div>
        </div>
      </div>

      {/* Pro player presets */}
      <div>
        <div className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-secondary)] mb-2.5">
          Préréglages Joueurs Pro VCT
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: "TenZ", sens: 0.4, dpi: 800 },
            { name: "Aspas", sens: 0.32, dpi: 800 },
            { name: "yay", sens: 0.27, dpi: 800 },
            { name: "Derke", sens: 0.35, dpi: 800 },
          ].map((p) => (
            <button
              key={p.name}
              onClick={() => onChange({ ...settings, sens: p.sens, dpi: p.dpi })}
              className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-xs font-bold text-white transition-all cursor-pointer text-left flex items-center justify-between"
            >
              <span className="text-[var(--color-val-red)] font-black">{p.name}</span>
              <span className="text-[var(--color-text-secondary)] font-mono text-[11px]">{p.sens} / {p.dpi}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
