"use client";

import React, { useState, useEffect } from "react";
import { useDesktopApp } from "@/hooks/useDesktopApp";

/**
 * AimTrainingView - Loads the SGS-AIM platform inside the Tracker Desktop app.
 * In the local version, it attempts to connect to local SGS-AIM (http://localhost:3005)
 * and seamlessly falls back to the online production instance (https://sgs-aim-three.vercel.app).
 * Also passes the current theme dynamically so SGS-AIM matches the Tracker's appearance.
 */

const LOCAL_AIM_URL = "http://localhost:3005";
const ONLINE_AIM_URL = "https://sgs-aim-three.vercel.app";

export default function AimTrainingView() {
  const { isDesktop } = useDesktopApp();
  const [aimUrl, setAimUrl] = useState<string>(ONLINE_AIM_URL);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("dark");

  // Detect active theme
  useEffect(() => {
    if (typeof window !== "undefined") {
      const theme =
        document.documentElement.getAttribute("data-theme") ||
        localStorage.getItem("tracker_theme") ||
        localStorage.getItem("spycam_theme") ||
        "dark";
      setCurrentTheme(theme);
    }
  }, []);

  // In local tracker: check if local dev server (port 3005) is running
  useEffect(() => {
    let active = true;
    const checkLocal = async () => {
      try {
        const res = await fetch(`${LOCAL_AIM_URL}/api/health`, {
          signal: AbortSignal.timeout(1200),
          cache: "no-store",
        });
        if (res.ok && active) {
          const data = await res.json();
          if (data.status === "online" || data.success) {
            setAimUrl(LOCAL_AIM_URL);
            return;
          }
        }
      } catch {
        // Local server not running, use online production instance
      }
      if (active) {
        setAimUrl(ONLINE_AIM_URL);
      }
    };
    checkLocal();
    return () => {
      active = false;
    };
  }, []);

  // Web version: show promo card
  if (!isDesktop) {
    return (
      <div className="w-full min-h-[70vh] flex items-center justify-center p-8">
        <div className="glass-panel rounded-2xl p-8 max-w-md text-center space-y-4 animate-in fade-in duration-300">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--color-val-red)]/15 border border-[var(--color-val-red)]/40 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-val-red)" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-black text-[var(--color-text-primary)]">SGS AIM Training</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-2 leading-relaxed">
              L&apos;entra&icirc;nement de tir int&eacute;gr&eacute; est disponible exclusivement sur l&apos;application bureau SGS Tracker.
              T&eacute;l&eacute;chargez l&apos;application pour acc&eacute;der aux sc&eacute;narios Gridshot, Microshot, Tracking et 3D.
            </p>
          </div>
          <div className="pt-2">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-val-red)]/10 border border-[var(--color-val-red)]/30 text-[var(--color-val-red)] text-xs font-black uppercase tracking-wider">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              Application Desktop Requise
            </span>
          </div>
        </div>
      </div>
    );
  }

  const iframeSrc = `${aimUrl}?theme=${encodeURIComponent(currentTheme)}&app=tracker_desktop`;

  // Desktop: render SGS-AIM iframe
  return (
    <div className="w-full h-[calc(100vh-56px)] relative bg-[#0a0e13]">
      {/* Loading overlay while iframe initializes */}
      {!iframeLoaded && !iframeError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[#0a0e13]">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-val-red)]/20 border border-[var(--color-val-red)]/40 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-[var(--color-val-red)] border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">
            Connexion &agrave; SGS AIM ({aimUrl === LOCAL_AIM_URL ? "Local :3005" : "En Ligne"})...
          </p>
        </div>
      )}

      {/* Error state */}
      {iframeError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[#0a0e13]">
          <div className="glass-panel rounded-2xl p-8 max-w-md text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-black text-white">Service SGS AIM Indisponible</h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                Impossible de charger la plateforme d&apos;entra&icirc;nement ({aimUrl}). V&eacute;rifiez votre connexion ou relancez l&apos;application.
              </p>
            </div>
            <button
              onClick={() => { setIframeError(false); setIframeLoaded(false); }}
              className="px-6 py-2.5 rounded-xl bg-[var(--color-val-red)] text-white text-xs font-bold cursor-pointer hover:brightness-110 transition-all"
            >
              R&eacute;essayer
            </button>
          </div>
        </div>
      )}

      <iframe
        src={iframeSrc}
        className="w-full h-full border-0"
        allow="pointer-lock; fullscreen; autoplay"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-pointer-lock"
        title="SGS AIM Training"
        onLoad={() => setIframeLoaded(true)}
        onError={() => setIframeError(true)}
      />
    </div>
  );
}
