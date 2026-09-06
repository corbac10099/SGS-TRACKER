"use client";

import React, { useState, useEffect } from "react";
import { IconShield, IconFileText, IconInfo, IconLock, IconX } from "@/components/icons/SpyIcons";
import { sounds } from "@/lib/soundEffects";

interface SgsLegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "cgu" | "mentions" | "privacy" | "riot";
}

function parseInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-black text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={i} className="italic text-gray-200">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

function renderLegalContent(content?: string) {
  if (!content) return null;
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={`sp-${idx}`} className="h-2" />);
      return;
    }

    if (trimmed.startsWith("## ")) {
      const title = trimmed.replace(/^##\s+/, "");
      elements.push(
        <h3
          key={`h2-${idx}`}
          className="text-xs sm:text-sm font-black text-white uppercase tracking-wider mt-4 mb-2 flex items-center gap-2 border-b border-white/10 pb-1.5 text-[var(--color-val-red)]"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-val-red)] flex-shrink-0"></span>
          <span>{title}</span>
        </h3>
      );
      return;
    }

    if (trimmed.startsWith("### ")) {
      const title = trimmed.replace(/^###\s+/, "");
      elements.push(
        <h4
          key={`h3-${idx}`}
          className="text-xs sm:text-sm font-bold text-white uppercase tracking-wide mt-3 mb-1"
        >
          {title}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      const bullet = trimmed.replace(/^[-•]\s+/, "");
      elements.push(
        <div key={`li-${idx}`} className="flex items-start gap-2 my-1 pl-1 text-xs sm:text-sm text-gray-300">
          <span className="text-[var(--color-val-red)] font-black text-xs leading-5 select-none">•</span>
          <div className="flex-1 leading-relaxed">
            {parseInlineMarkdown(bullet)}
          </div>
        </div>
      );
      return;
    }

    elements.push(
      <p key={`p-${idx}`} className="text-xs sm:text-sm text-gray-300 leading-relaxed my-1">
        {parseInlineMarkdown(trimmed)}
      </p>
    );
  });

  return elements;
}

export default function SgsLegalModal({ isOpen, onClose, defaultTab = "cgu" }: SgsLegalModalProps) {
  const [activeTab, setActiveTab] = useState<"cgu" | "mentions" | "privacy" | "riot">(defaultTab);
  const [legalData, setLegalData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      fetchLegal();
    }
  }, [isOpen, defaultTab]);

  const fetchLegal = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/legal");
      const data = await res.json();
      if (data.success && data.legal) {
        setLegalData(data.legal);
      }
    } catch (err) {
      console.warn("Erreur chargement mentions légales:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0b0e14]/95 border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--color-val-red)]/15 border border-[var(--color-val-red)]/40 flex items-center justify-center text-[var(--color-val-red)]">
              <IconShield size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[var(--color-val-red)] text-white">SGS Ecosystem</span>
                <span className="text-xs text-[var(--color-text-secondary)] font-medium">Informations Légales & Conformité</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                {legalData?.companyName || "SGS (Smart Gaming Suite)"}
              </h2>
            </div>
          </div>

          <button
            onClick={() => { sounds.playCancel(); onClose(); }}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* TABS SELECTOR */}
        <div className="px-6 py-3 border-b border-white/10 flex items-center gap-2 overflow-x-auto custom-scrollbar bg-black/30">
          <button
            onClick={() => { sounds.playTabSwitch(); setActiveTab("cgu"); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "cgu"
                ? "bg-[var(--color-val-red)] text-white shadow-lg shadow-[rgba(255,70,85,0.3)]"
                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <IconFileText size={14} />
            <span>Conditions d&apos;Utilisation (CGU)</span>
          </button>

          <button
            onClick={() => { sounds.playTabSwitch(); setActiveTab("mentions"); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "mentions"
                ? "bg-[var(--color-val-red)] text-white shadow-lg shadow-[rgba(255,70,85,0.3)]"
                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <IconInfo size={14} />
            <span>Mentions Légales & Hébergeur</span>
          </button>

          <button
            onClick={() => { sounds.playTabSwitch(); setActiveTab("privacy"); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "privacy"
                ? "bg-[var(--color-val-red)] text-white shadow-lg shadow-[rgba(255,70,85,0.3)]"
                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <IconLock size={14} />
            <span>Confidentialité & RGPD</span>
          </button>

          <button
            onClick={() => { sounds.playTabSwitch(); setActiveTab("riot"); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "riot"
                ? "bg-red-600/30 border border-red-500/50 text-red-300"
                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <span>⚔️ Règles Riot Games</span>
          </button>
        </div>

        {/* CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar text-gray-300 text-xs sm:text-sm leading-relaxed">
          {loading ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-2 border-[var(--color-val-red)] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-gray-400 uppercase font-bold">Chargement des mentions légales...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTab === "cgu" && (
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                  <h3 className="text-sm font-black text-white uppercase mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-val-red)]"></span>
                    <span>Conditions Générales d&apos;Utilisation</span>
                  </h3>
                  <div>{renderLegalContent(legalData?.cguText)}</div>
                </div>
              )}

              {activeTab === "mentions" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Éditeur</span>
                      <p className="text-xs font-black text-white">{legalData?.companyName}</p>
                      <p className="text-[11px] text-[var(--color-val-red)]">{legalData?.contactEmail}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Hébergeur Web & Edge</span>
                      <p className="text-xs font-black text-white">{legalData?.hostName}</p>
                      <p className="text-[11px] text-gray-400">{legalData?.hostAddress}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Base de données</span>
                      <p className="text-xs font-black text-white">{legalData?.dbHost}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Stockage & CDN</span>
                      <p className="text-xs font-black text-white">{legalData?.storageHost}</p>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                    {renderLegalContent(legalData?.mentionsLegales)}
                  </div>
                </div>
              )}

              {activeTab === "privacy" && (
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                  {renderLegalContent(legalData?.privacyPolicy)}
                </div>
              )}

              {activeTab === "riot" && (
                <div className="space-y-4">
                  <div className="p-4 sm:p-5 rounded-2xl bg-red-950/30 border border-red-500/30 text-red-200">
                    <h3 className="text-sm font-black text-white uppercase mb-3 flex items-center gap-2">
                      <span className="text-red-400">⚔️</span>
                      <span>Clause Officielle Riot Games</span>
                    </h3>
                    <div className="leading-relaxed">
                      {renderLegalContent(legalData?.riotDisclaimer)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between bg-black/40 text-[11px] text-gray-400">
          <span>Contact support & conformité : <a href={`mailto:${legalData?.contactEmail || "contact@sgs.gg"}`} className="text-[var(--color-val-red)] hover:underline">{legalData?.contactEmail || "contact@sgs.gg"}</a></span>
          <button
            onClick={() => { sounds.playClick(); onClose(); }}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
}
