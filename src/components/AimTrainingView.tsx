"use client";

import React, { useState, useEffect, useRef } from "react";
import { useDesktopApp } from "@/hooks/useDesktopApp";
import { useSession } from "next-auth/react";

interface AimTrainingViewProps {
  theme?: string;
  user?: any;
}

const LOCAL_AIM_URL = "http://localhost:3005";
const ONLINE_AIM_URL = "https://sgs-aim-three.vercel.app";

export default function AimTrainingView({ theme: propTheme, user: propUser }: AimTrainingViewProps) {
  const { isDesktop } = useDesktopApp();
  const { data: session } = useSession();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [aimUrl, setAimUrl] = useState<string>(ONLINE_AIM_URL);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [activeTheme, setActiveTheme] = useState(propTheme || "dark");

  const currentUser = propUser || session?.user || {
    id: "guest",
    name: "Agent",
  };

  // Sync active theme
  useEffect(() => {
    if (propTheme) {
      setActiveTheme(propTheme);
      return;
    }
    if (typeof window !== "undefined") {
      const stored =
        localStorage.getItem("tracker_theme") ||
        localStorage.getItem("spycam_theme") ||
        document.documentElement.getAttribute("data-theme") ||
        "dark";
      setActiveTheme(stored);
    }
  }, [propTheme]);

  // Check if local dev server on 3005 is alive
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
      } catch {}
      if (active) {
        setAimUrl(ONLINE_AIM_URL);
      }
    };
    checkLocal();
    return () => {
      active = false;
    };
  }, []);

  // Handle bidirectional postMessage communication with SGS-AIM
  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      if (!e.data || typeof e.data !== "object") return;

      // 1. SGS-AIM announces it is ready -> send initial context sync
      if (e.data.type === "SGS_AIM_READY") {
        if (iframeRef.current?.contentWindow) {
          // Fetch existing Neon DB aim profile if available
          let aimProfile = null;
          if (currentUser?.id && currentUser.id !== "guest") {
            try {
              const res = await fetch(`/api/aim/profile?userId=${encodeURIComponent(currentUser.id)}`);
              if (res.ok) {
                const data = await res.json();
                aimProfile = data.profile;
              }
            } catch {}
          }

          iframeRef.current.contentWindow.postMessage(
            {
              type: "SGS_USER_SYNC",
              user: {
                id: currentUser.id || "guest",
                name: currentUser.name || "Agent",
                email: currentUser.email,
                trackerLevel: currentUser.trackerLevel || 1,
              },
              theme: activeTheme,
              aimRank: aimProfile?.userRank,
              adaptiveDifficulty: aimProfile?.adaptiveDifficulty,
            },
            "*"
          );
        }
      }

      // 2. SGS-AIM completed a session -> save to Neon DB and reward XP
      if (e.data.type === "SGS_AIM_SAVE_SCORE" && e.data.record) {
        try {
          await fetch("/api/aim/save-score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...e.data.record,
              userId: currentUser?.id,
              userName: currentUser?.name,
            }),
          });
        } catch (err) {
          console.warn("Failed to persist aim score to Neon DB:", err);
        }
      }

      // 3. SGS-AIM completed calibration test -> save to Neon DB
      if (e.data.type === "SGS_AIM_CALIBRATION_SAVED" && e.data.calibration) {
        try {
          await fetch("/api/aim/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: currentUser?.id,
              calibration: e.data.calibration,
            }),
          });
        } catch (err) {
          console.warn("Failed to persist calibration to Neon DB:", err);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [currentUser, activeTheme]);

  // Live propagate theme changes to iframe
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "SGS_THEME_CHANGE",
          theme: activeTheme,
        },
        "*"
      );
    }
  }, [activeTheme]);

  // Desktop check
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
            <h2 className="text-xl font-black text-[var(--color-text-primary)]">SGS AIM Training 3D</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-2 leading-relaxed">
              L&apos;entra&icirc;nement de tir 3D calibré pour Valorant est disponible exclusivement sur l&apos;application bureau SGS Tracker.
              Téléchargez l&apos;application pour accéder aux arènes 3D, au stand The Range et à la calibration adaptative.
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

  const iframeSrc = `${aimUrl}?theme=${encodeURIComponent(activeTheme)}&userId=${encodeURIComponent(
    currentUser?.id || ""
  )}&userName=${encodeURIComponent(currentUser?.name || "Agent")}&app=tracker_desktop`;

  return (
    <div className="w-full h-[calc(100vh-56px)] relative bg-[#0a0e13]">
      {/* Loading overlay while iframe initializes */}
      {!iframeLoaded && !iframeError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[#0a0e13]">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-val-red)]/20 border border-[var(--color-val-red)]/40 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-[var(--color-val-red)] border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">
            Connexion &agrave; SGS AIM ({aimUrl === LOCAL_AIM_URL ? "Serveur Local :3005" : "Serveur Dédié 3D"})...
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
                Impossible de charger le stand de tir 3D ({aimUrl}). V&eacute;rifiez votre connexion ou relancez l&apos;application.
              </p>
            </div>
            <button
              onClick={() => {
                setIframeError(false);
                setIframeLoaded(false);
              }}
              className="px-6 py-2.5 rounded-xl bg-[var(--color-val-red)] text-white text-xs font-bold cursor-pointer hover:brightness-110 transition-all"
            >
              R&eacute;essayer
            </button>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={iframeSrc}
        className="w-full h-full border-0"
        allow="pointer-lock; fullscreen; autoplay"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-pointer-lock"
        title="SGS AIM Training 3D"
        onLoad={() => setIframeLoaded(true)}
        onError={() => setIframeError(true)}
      />
    </div>
  );
}
