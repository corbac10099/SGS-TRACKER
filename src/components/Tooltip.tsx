"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export default function Tooltip({ message }: { message: string }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({
      top: rect.top - 8,
      left: Math.max(135, Math.min(window.innerWidth - 135, rect.left + rect.width / 2)),
    });
  };

  const handleMouseEnter = () => {
    updatePosition();
    setVisible(true);
  };

  if (!message) return null;

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setVisible(false)}
        className="inline-flex ml-1.5 cursor-help select-none"
      >
        <div className="w-4 h-4 rounded-full bg-[var(--color-val-red)]/15 border border-[var(--color-val-red)]/50 flex items-center justify-center text-[10px] font-black text-[var(--color-val-red)] hover:bg-[var(--color-val-red)] hover:text-white transition-colors shadow-sm">
          !
        </div>
      </div>

      {visible && mounted && typeof document !== "undefined" && createPortal(
        <div
          style={{
            position: "fixed",
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            transform: "translate(-50%, -100%)",
            zIndex: 999999,
          }}
          className="pointer-events-none w-64 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="bg-[#121824] border border-[var(--color-val-red)]/50 rounded-xl px-3.5 py-2.5 text-xs text-white leading-relaxed shadow-[0_12px_36px_rgba(0,0,0,0.95)] backdrop-blur-xl ring-1 ring-[var(--color-val-red)]/30">
            {message}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#121824] border-r border-b border-[var(--color-val-red)]/50 rotate-45 -mt-1" />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
