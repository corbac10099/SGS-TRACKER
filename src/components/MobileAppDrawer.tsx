"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  IconAppGrid,
  IconSettings,
  IconTrophy,
  IconExpand,
  IconLogOut,
} from "./icons/SpyIcons";
import { sounds } from "@/lib/soundEffects";

export interface MobileAppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenLeaderboard: () => void;
  onToggleFullscreen: () => void;
  onSignOut?: () => void;
}

const CLOSE_THRESHOLD = 120;
const RESISTANCE_FACTOR = 0.35;

export default function MobileAppDrawer({
  isOpen,
  onClose,
  onOpenSettings,
  onOpenLeaderboard,
  onToggleFullscreen,
  onSignOut,
}: MobileAppDrawerProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setDragY(0);
      setIsDragging(false);
    }
  }, [isOpen]);

  const animateClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setDragY(0);
      onClose();
    }, 280);
  }, [onClose]);

  // ─── Unified pointer helpers ───
  const startDrag = useCallback((clientY: number) => {
    touchStartY.current = clientY;
    setIsDragging(true);
  }, []);

  const moveDrag = useCallback((clientY: number) => {
    if (!isDragging) return;
    const delta = clientY - touchStartY.current;
    setDragY(delta > 0 ? delta : delta * RESISTANCE_FACTOR);
  }, [isDragging]);

  const endDrag = useCallback(() => {
    setIsDragging(false);
    if (dragY > CLOSE_THRESHOLD) {
      animateClose();
    } else {
      setDragY(0);
    }
  }, [dragY, animateClose]);

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startDrag(e.touches[0].clientY);
  }, [startDrag]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    moveDrag(e.touches[0].clientY);
  }, [moveDrag]);

  const handleTouchEnd = useCallback(() => {
    endDrag();
  }, [endDrag]);

  // Mouse events (for PC / DevTools mobile emulation)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startDrag(e.clientY);
  }, [startDrag]);

  // Global mouse listeners so drag continues outside the handle
  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: MouseEvent) => moveDrag(e.clientY);
    const onMouseUp = () => endDrag();
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, moveDrag, endDrag]);

  const handleBackdropClick = useCallback(() => {
    sounds.playClick();
    animateClose();
  }, [animateClose]);

  if (!isOpen && !isClosing) return null;

  const dragProgress = Math.max(0, Math.min(dragY / 300, 1));
  const backdropOpacity = isClosing ? 0 : 1 - dragProgress * 0.85;
  const backdropBlur = isClosing ? 0 : Math.max(0, 12 - dragProgress * 12);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-end ${
        isClosing ? "animate-drawer-backdrop-out" : "animate-drawer-backdrop"
      }`}
      style={{
        backgroundColor: `rgba(0, 0, 0, ${backdropOpacity * 0.75})`,
        backdropFilter: `blur(${backdropBlur}px)`,
        WebkitBackdropFilter: `blur(${backdropBlur}px)`,
      }}
      onClick={handleBackdropClick}
    >
      <div
        className={`relative w-full bg-[var(--color-surface)]/95 backdrop-blur-2xl border-t border-[var(--color-border)] rounded-t-3xl p-5 shadow-[0_-15px_50px_rgba(0,0,0,0.8)] flex flex-col gap-4 max-h-[85vh] overflow-visible ${
          isClosing ? "animate-drawer-content-out" : (isDragging || dragY !== 0) ? "" : "animate-drawer-content"
        }`}
        style={{
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? "none" : "transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)",
          animation: (isDragging || dragY !== 0) ? "none" : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Extension de fond pour éviter le vide lors du drag vers le haut */}
        <div className="absolute left-0 right-0 top-full h-[200px] bg-[var(--color-surface)] pointer-events-none" />
        {/* Grab Handle — zone tactile/souris élargie */}
        <div
          className="flex items-center justify-center py-3 -mt-2 mb-1 cursor-grab active:cursor-grabbing select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <div className="w-10 h-1 rounded-full bg-[var(--color-border)]" />
        </div>

        <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <IconAppGrid size={18} className="text-[var(--color-val-red)]" />
            <h3 className="text-sm font-black text-[var(--color-text-primary)] uppercase tracking-wider">
              Outils & Menu
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              animateClose();
            }}
            onMouseEnter={() => sounds.playHover()}
            className="w-7 h-7 rounded-full bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-white flex items-center justify-center font-bold text-xs cursor-pointer border border-[var(--color-border)]"
          >
            ✕
          </button>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onMouseEnter={() => sounds.playHover()}
            onClick={() => {
              sounds.playTabSwitch();
              animateClose();
              setTimeout(onOpenSettings, 300);
            }}
            className="p-3.5 rounded-2xl bg-[var(--color-surface-hover)] hover:border-[var(--color-val-red)]/40 border border-[var(--color-border)] flex flex-col items-start gap-1.5 transition-all text-left cursor-pointer"
          >
            <div className="p-2 rounded-xl bg-[var(--color-val-red)]/10 text-[var(--color-val-red)]">
              <IconSettings size={18} />
            </div>
            <span className="text-xs font-bold text-[var(--color-text-primary)]">Paramètres</span>
            <span className="text-[10px] text-[var(--color-text-secondary)]">Profil, Thèmes & Sons</span>
          </button>

          <button
            type="button"
            onMouseEnter={() => sounds.playHover()}
            onClick={() => {
              sounds.playTabSwitch();
              animateClose();
              setTimeout(onOpenLeaderboard, 300);
            }}
            className="p-3.5 rounded-2xl bg-[var(--color-surface-hover)] hover:border-[var(--color-val-red)]/40 border border-[var(--color-border)] flex flex-col items-start gap-1.5 transition-all text-left cursor-pointer"
          >
            <div className="p-2 rounded-xl bg-[var(--color-val-red)]/10 text-[var(--color-val-red)]">
              <IconTrophy size={18} />
            </div>
            <span className="text-xs font-bold text-[var(--color-text-primary)]">Classement</span>
            <span className="text-[10px] text-[var(--color-text-secondary)]">Top Radiants Région</span>
          </button>
        </div>

        <button
          type="button"
          onMouseEnter={() => sounds.playHover()}
          onClick={() => {
            sounds.playClick();
            animateClose();
            setTimeout(onToggleFullscreen, 300);
          }}
          className="w-full py-3 px-4 rounded-2xl bg-[var(--color-surface-hover)] hover:border-[var(--color-val-red)]/40 border border-[var(--color-border)] text-xs font-bold text-[var(--color-text-primary)] flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <IconExpand size={16} />
          <span>Plein Écran</span>
        </button>

        {onSignOut && (
          <button
            type="button"
            onMouseEnter={() => sounds.playHover()}
            onClick={() => {
              sounds.playClick();
              animateClose();
              setTimeout(onSignOut, 300);
            }}
            className="w-full py-3 px-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-bold text-red-400 hover:text-red-300 flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <IconLogOut size={16} />
            <span>Déconnexion</span>
          </button>
        )}
      </div>
    </div>
  );
}

