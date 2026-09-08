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

const CLOSE_THRESHOLD = 100;
const RESISTANCE = 0.3;

export default function MobileAppDrawer({
  isOpen,
  onClose,
  onOpenSettings,
  onOpenLeaderboard,
  onToggleFullscreen,
  onSignOut,
}: MobileAppDrawerProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [, forceRender] = useState(0);

  // Tout en refs pour éviter les closures périmées
  const dragging = useRef(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const drawerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const rafId = useRef(0);
  const entryDone = useRef(false);

  // Reset quand le drawer s'ouvre
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      currentY.current = 0;
      dragging.current = false;
      entryDone.current = false;
      // Marquer l'animation d'entrée comme finie après sa durée
      const t = setTimeout(() => { entryDone.current = true; }, 350);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // ─── Appliquer le transform directement sur le DOM (pas de re-render) ───
  const applyTransform = useCallback(() => {
    const y = currentY.current;
    if (drawerRef.current) {
      drawerRef.current.style.transform = `translateY(${y}px)`;
      drawerRef.current.style.transition = "none";
      // Supprimer l'animation CSS si elle tourne encore
      if (entryDone.current || y !== 0) {
        drawerRef.current.style.animation = "none";
        drawerRef.current.classList.remove("animate-drawer-content");
      }
    }
    if (backdropRef.current) {
      const progress = Math.max(0, Math.min(y / 300, 1));
      const opacity = 1 - progress * 0.85;
      const blur = Math.max(0, 12 - progress * 12);
      backdropRef.current.style.backgroundColor = `rgba(0, 0, 0, ${opacity * 0.75})`;
      backdropRef.current.style.backdropFilter = `blur(${blur}px)`;
      (backdropRef.current.style as any).WebkitBackdropFilter = `blur(${blur}px)`;
    }
  }, []);

  // ─── Fermeture animée depuis la position actuelle ───
  const animateClose = useCallback(() => {
    if (drawerRef.current) {
      drawerRef.current.style.transition = "transform 0.28s cubic-bezier(0.4, 0, 1, 1)";
      drawerRef.current.style.transform = "translateY(100%)";
    }
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      currentY.current = 0;
      onClose();
    }, 280);
  }, [onClose]);

  // ─── Snap back à la position 0 depuis la position actuelle ───
  const snapBack = useCallback(() => {
    if (drawerRef.current) {
      drawerRef.current.style.transition = "transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)";
      drawerRef.current.style.transform = "translateY(0px)";
    }
    if (backdropRef.current) {
      backdropRef.current.style.transition = "background-color 0.3s, backdrop-filter 0.3s";
      backdropRef.current.style.backgroundColor = "rgba(0, 0, 0, 0.75)";
      backdropRef.current.style.backdropFilter = "blur(12px)";
      (backdropRef.current.style as any).WebkitBackdropFilter = "blur(12px)";
    }
    currentY.current = 0;
  }, []);

  // ─── Drag start ───
  const onDragStart = useCallback((clientY: number) => {
    startY.current = clientY;
    dragging.current = true;
    cancelAnimationFrame(rafId.current);
  }, []);

  // ─── Drag move ───
  const onDragMove = useCallback((clientY: number) => {
    if (!dragging.current) return;
    const delta = clientY - startY.current;
    // Vers le bas : libre — vers le haut : résistance
    currentY.current = delta > 0 ? delta : delta * RESISTANCE;
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(applyTransform);
  }, [applyTransform]);

  // ─── Drag end ───
  const onDragEnd = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    cancelAnimationFrame(rafId.current);
    if (currentY.current > CLOSE_THRESHOLD) {
      animateClose();
    } else {
      snapBack();
    }
  }, [animateClose, snapBack]);

  // ─── Touch handlers (avec preventDefault pour bloquer pull-to-refresh) ───
  const handleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = handleRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      onDragStart(e.touches[0].clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // ← empêche le pull-to-refresh
      onDragMove(e.touches[0].clientY);
    };
    const onTouchEnd = () => {
      onDragEnd();
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [onDragStart, onDragMove, onDragEnd]);

  // ─── Mouse handlers (PC / DevTools) ───
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onDragStart(e.clientY);

    const onMouseMove = (ev: MouseEvent) => onDragMove(ev.clientY);
    const onMouseUp = () => {
      onDragEnd();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [onDragStart, onDragMove, onDragEnd]);

  const handleBackdropClick = useCallback(() => {
    sounds.playClick();
    animateClose();
  }, [animateClose]);

  if (!isOpen && !isClosing) return null;

  return (
    <div
      ref={backdropRef}
      className={`fixed inset-0 z-50 flex flex-col justify-end ${
        isClosing ? "animate-drawer-backdrop-out" : "animate-drawer-backdrop"
      }`}
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
      onClick={handleBackdropClick}
    >
      <div
        ref={drawerRef}
        className={`relative w-full bg-[var(--color-surface)]/95 backdrop-blur-2xl border-t border-[var(--color-border)] rounded-t-3xl p-5 shadow-[0_-15px_50px_rgba(0,0,0,0.8)] flex flex-col gap-4 max-h-[85vh] overflow-visible ${
          isClosing ? "animate-drawer-content-out" : "animate-drawer-content"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Extension de fond pour éviter le vide lors du drag vers le haut */}
        <div className="absolute left-0 right-0 top-full h-[200px] bg-[var(--color-surface)] pointer-events-none" />

        {/* Grab Handle — zone tactile/souris élargie */}
        <div
          ref={handleRef}
          className="flex items-center justify-center py-3 -mt-2 mb-1 cursor-grab active:cursor-grabbing select-none"
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

