"use client";

import React, { useState, useEffect, useRef } from "react";

export interface MiniOverlayWrapperProps {
  id: string;
  title: string;
  isInteractive: boolean;
  onClose: () => void;
  accentColor?: string;
  children: React.ReactNode;
  defaultX?: number;
  defaultY?: number;
  minWidth?: number;
  className?: string;
}

export default function MiniOverlayWrapper({
  id,
  title,
  isInteractive,
  onClose,
  accentColor = "#ff4655",
  children,
  defaultX = 40,
  defaultY = 40,
  minWidth = 180,
  className = "",
}: MiniOverlayWrapperProps) {
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: defaultX, y: defaultY });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: defaultX,
    startY: defaultY,
  });

  // Charger la position sauvegardée
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(`sgs_mini_overlay_pos_${id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          const clampedX = Math.max(10, Math.min(window.innerWidth - 60, parsed.x));
          const clampedY = Math.max(10, Math.min(window.innerHeight - 60, parsed.y));
          setPos({ x: clampedX, y: clampedY });
        }
      }
    } catch {}
  }, [id]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isInteractive || e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button, input, select, textarea")) return;

    e.preventDefault();
    isDraggingRef.current = true;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: pos.x,
      startY: pos.y,
    };

    const handlePointerMove = (ev: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const dx = ev.clientX - dragStartRef.current.mouseX;
      const dy = ev.clientY - dragStartRef.current.mouseY;
      const newX = Math.max(5, Math.min(window.innerWidth - 60, dragStartRef.current.startX + dx));
      const newY = Math.max(5, Math.min(window.innerHeight - 60, dragStartRef.current.startY + dy));
      setPos({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setPos((currentPos) => {
          try {
            localStorage.setItem(`sgs_mini_overlay_pos_${id}`, JSON.stringify(currentPos));
          } catch {}
          return currentPos;
        });
      }
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  };

  return (
    <div
      style={{
        position: "fixed",
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        minWidth: `${minWidth}px`,
        pointerEvents: isInteractive ? "auto" : "none",
        zIndex: 9999,
      }}
      className={`select-none transition-opacity duration-150 ${
        isInteractive ? "opacity-100 ring-1 ring-white/30" : "opacity-90"
      } ${className}`}
    >
      <div
        className="rounded-xl bg-[#0f1923]/90 backdrop-blur-xl border border-white/15 shadow-2xl overflow-hidden flex flex-col text-white"
        style={{
          boxShadow: isInteractive
            ? `0 10px 30px rgba(0,0,0,0.8), 0 0 15px ${accentColor}33`
            : "0 10px 25px rgba(0,0,0,0.7)",
        }}
      >
        {/* Entête miniature */}
        <div
          onPointerDown={handlePointerDown}
          className={`flex items-center justify-between px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border-b border-white/10 ${
            isInteractive ? "cursor-grab active:cursor-grabbing bg-white/[0.04]" : "cursor-default bg-transparent"
          }`}
          style={{ borderColor: `${accentColor}30` }}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
            <span className="text-white/80">{title}</span>
          </div>

          {isInteractive && (
            <div className="flex items-center gap-1.5 pointer-events-auto">
              <span className="text-[9px] text-white/40 font-mono">F9 déplace</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="w-4 h-4 rounded flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                title="Fermer"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Corps du contenu */}
        <div className={`p-2.5 ${isInteractive ? "pointer-events-auto" : "pointer-events-none"}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
