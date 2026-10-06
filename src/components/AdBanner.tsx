"use client";

import React, { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

export interface AdBannerProps {
  /** Google AdSense Ad Slot ID (optional, defaults to auto responsive ad) */
  slot?: string;
  /** Format of the ad: horizontal banner, responsive, or card rectangle */
  format?: "auto" | "horizontal" | "rectangle";
  /** Custom CSS classes for the container */
  className?: string;
  /** Label displayed on the ad badge */
  label?: string;
  /** Minimum height in pixels to avoid layout shifts while maintaining dark background */
  minHeight?: number;
}

export default function AdBanner({
  slot,
  format = "auto",
  className = "",
  label = "Sponsorisé",
  minHeight = 100,
}: AdBannerProps) {
  const adRef = useRef<HTMLModElement | null>(null);
  const isLoadedRef = useRef(false);
  const [adError, setAdError] = useState(false);

  useEffect(() => {
    if (isLoadedRef.current) return;

    try {
      if (typeof window !== "undefined" && adRef.current) {
        // Push ad to Google AdSense queue
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        isLoadedRef.current = true;
      }
    } catch (err) {
      console.debug("AdSense init notice:", err);
      setAdError(true);
    }
  }, []);

  const formatStyles: Record<string, { heightClass: string; adLayout?: string }> = {
    horizontal: {
      heightClass: "min-h-[90px] max-h-[140px]",
      adLayout: "in-article",
    },
    rectangle: {
      heightClass: "min-h-[250px] max-h-[300px]",
    },
    auto: {
      heightClass: "min-h-[100px]",
    },
  };

  const selectedFormat = formatStyles[format] || formatStyles.auto;

  return (
    <div
      className={`ad-card-wrapper relative w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0e13]/85 backdrop-blur-md transition-all duration-300 hover:border-white/15 my-6 ${selectedFormat.heightClass} ${className}`}
      style={{
        minHeight: `${minHeight}px`,
        backgroundColor: "#0a0e13",
        colorScheme: "dark",
      }}
    >
      {/* Header bar / Discreet Badge */}
      <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-white/[0.06] bg-white/[0.02]">
        <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]/70">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-val-red)]/60" />
          {label}
        </span>
        <span className="text-[8px] font-mono text-white/30 uppercase tracking-wider">
          SGS Ad Engine
        </span>
      </div>

      {/* Ad Container with Anti-Flash Dark Background */}
      <div
        className="relative w-full flex items-center justify-center p-2 sm:p-3 overflow-hidden bg-[#0a0e13]"
        style={{
          backgroundColor: "#0a0e13",
          minHeight: `${minHeight - 32}px`,
        }}
      >
        <ins
          ref={adRef}
          className="adsbygoogle block w-full text-center"
          style={{
            display: "block",
            backgroundColor: "#0a0e13",
            colorScheme: "dark",
            overflow: "hidden",
          }}
          data-ad-client="ca-pub-3408630373286016"
          data-ad-slot={slot || undefined}
          data-ad-format={format === "rectangle" ? "rectangle" : "auto"}
          data-full-width-responsive="true"
        />

        {/* Fallback subtle placeholder when blocked or initializing */}
        {adError && (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/20 font-bold uppercase tracking-widest pointer-events-none">
            Espace Sponsorisé SGS Tracker
          </div>
        )}
      </div>
    </div>
  );
}
