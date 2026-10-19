"use client";

import React, { useState, useEffect, useRef } from "react";

import { isTauriEnvironment, startDragWindow } from "@/lib/desktop";

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
  noFrame?: boolean;
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
  noFrame = false,
}: MiniOverlayWrapperProps) {
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: defaultX, y: defaultY });
  const [isTauri, setIsTauri] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: defaultX,
    startY: defaultY,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsTauri(isTauriEnvironment());

    try {
      const saved = localStorage.getItem(`sgs_mini_overlay_pos_${id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          const clampedX = Math.max(0, Math.min(window.innerWidth - 40, parsed.x));
          const clampedY = Math.max(0, Math.min(window.innerHeight - 40, parsed.y));
          setPos({ x: clampedX, y: clampedY });
        }
      }
    } catch {}
  }, [id]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isInteractive || e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button, input, select, textarea")) return;

    e.preventDefault();

    // En environnement Tauri natif, déclenche le glissement natif instantané de la fenêtre
    if (isTauri) {
      startDragWindow();
      return;
    }

    // Fallback navigateur web classique (CSS fixed coordinates)
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
      const newX = Math.max(0, Math.min(window.innerWidth - 40, dragStartRef.current.startX + dx));
      const newY = Math.max(0, Math.min(window.innerHeight - 40, dragStartRef.current.startY + dy));
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

  // En mode Tauri natif, la fenêtre OS elle-même est le conteneur (pas d'offset CSS absolu supplémentaire)
  const wrapperStyle: React.CSSProperties = isTauri
    ? {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: isInteractive ? "auto" : "none",
        background: "transparent",
      }
    : {
        position: "fixed",
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        minWidth: noFrame ? undefined : `${minWidth}px`,
        pointerEvents: isInteractive ? "auto" : "none",
        zIndex: 9999,
        background: "transparent",
      };

  return (
    <div
      style={wrapperStyle}
      data-tauri-drag-region={isTauri && isInteractive ? "" : undefined}
      className={`select-none ${noFrame ? "bg-transparent p-0 m-0" : ""} ${className}`}
    >
      {noFrame ? (
        <div
          onPointerDown={handlePointerDown}
          data-tauri-drag-region={isTauri && isInteractive ? "" : undefined}
          className={`w-full h-full flex items-center justify-center bg-transparent ${
            isInteractive ? "cursor-grab active:cursor-grabbing" : "cursor-default"
          }`}
        >
          {children}
        </div>
      ) : (
        <div
          className="rounded-[20px] bg-[#0c1015]/90 backdrop-blur-xl border border-white/15 shadow-2xl overflow-hidden flex flex-col text-white"
          style={{
            boxShadow: isInteractive
              ? `0 12px 35px rgba(0,0,0,0.85), 0 0 15px ${accentColor}33`
              : "0 10px 25px rgba(0,0,0,0.75)",
          }}
        >
          {/* Entête miniature */}
          <div
            onPointerDown={handlePointerDown}
            data-tauri-drag-region={isTauri && isInteractive ? "" : undefined}
            className={`flex items-center justify-between px-3 py-1.5 text-[10px] font-black uppercase tracking-wider border-b border-white/10 ${
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
                <span className="text-[9px] text-white/40 font-mono">F9</span>
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
          <div className={`p-3 ${isInteractive ? "pointer-events-auto" : "pointer-events-none"}`}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
