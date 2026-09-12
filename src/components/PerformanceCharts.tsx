"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { calculateSingleMatchSPI, PerformanceGrade } from "@/lib/valorant/performanceScore";
import { sounds } from "@/lib/soundEffects";
import { IconChart } from "./icons/SpyIcons";

export type MetricType = "kd" | "acs" | "hs" | "spi";

export interface PerformanceChartsProps {
  matchHistory: any[];
  chartId?: string;
  title?: string;
  allowedMetrics?: MetricType[];
  initialMetric?: MetricType;
  onActiveMetricChange?: (metric: MetricType) => void;
  canDetach?: boolean;
  onDetachMetric?: (metric: MetricType) => void;
  availableTargetCharts?: { id: string; label: string }[];
  onAttachMetric?: (metric: MetricType, targetChartId: string) => void;
  isDetached?: boolean;
  isEditing?: boolean;
  spiDynamicColors?: boolean;
}

function getCubicBezierPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    // Catmull-Rom to Cubic Bezier conversion
    const tension = 0.22;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

function PerformanceChartsComponent({
  matchHistory,
  chartId = "chart",
  title = "Progression",
  allowedMetrics = ["kd", "acs", "hs", "spi"],
  initialMetric,
  onActiveMetricChange,
  canDetach = true,
  onDetachMetric,
  availableTargetCharts,
  onAttachMetric,
  isDetached = false,
  isEditing = false,
  spiDynamicColors,
}: PerformanceChartsProps) {
  // Garantit que si ce graphique est unique, SPI est toujours présent dans la liste autorisée
  const validAllowedMetrics = useMemo(() => {
    let list = allowedMetrics && allowedMetrics.length > 0 ? allowedMetrics : (["kd", "acs", "hs", "spi"] as MetricType[]);
    if (chartId === "chart" && (!availableTargetCharts || availableTargetCharts.length === 0)) {
      if (!list.includes("spi")) {
        list = [...list, "spi"];
      }
    }
    return list;
  }, [allowedMetrics, chartId, availableTargetCharts]);

  const [internalMetric, setInternalMetric] = useState<MetricType>(() => {
    if (initialMetric && validAllowedMetrics.includes(initialMetric)) return initialMetric;
    return validAllowedMetrics[0] || "kd";
  });

  const activeMetric = validAllowedMetrics.includes(internalMetric) ? internalMetric : validAllowedMetrics[0] || "kd";

  const handleSelectMetric = (m: MetricType) => {
    sounds.playTabSwitch();
    setInternalMetric(m);
    if (onActiveMetricChange) onActiveMetricChange(m);
  };

  // État et animation de la pilule rouge glissante pour les onglets de métriques
  const metricContainerRef = useRef<HTMLDivElement>(null);
  const metricBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [metricPillStyle, setMetricPillStyle] = useState({ left: 0, width: 0, opacity: 0 });

  const updateMetricPill = useCallback(() => {
    if (!metricContainerRef.current) return;
    const btn = metricBtnRefs.current[activeMetric];
    const container = metricContainerRef.current;
    if (!btn || !container) {
      setMetricPillStyle((prev) => ({ ...prev, opacity: 0 }));
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    if (btnRect.width > 0) {
      setMetricPillStyle({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
        opacity: 1,
      });
    }
  }, [activeMetric]);

  useLayoutEffect(() => {
    updateMetricPill();
    const t = setTimeout(updateMetricPill, 40);
    return () => clearTimeout(t);
  }, [activeMetric, validAllowedMetrics, updateMetricPill]);

  // Option SPI multi-couleurs dynamique (activée par défaut dans les paramètres Fonctionnalités)
  const [spiDynamicEnabled, setSpiDynamicEnabled] = useState<boolean>(() => {
    if (spiDynamicColors !== undefined) return spiDynamicColors;
    if (typeof window !== "undefined") {
      return localStorage.getItem("spycam_spi_dynamic_chart_color") !== "false";
    }
    return true;
  });

  useEffect(() => {
    if (spiDynamicColors !== undefined) {
      setSpiDynamicEnabled(spiDynamicColors);
      return;
    }
    const handleSettingsUpdated = (e: any) => {
      const stored = typeof window !== "undefined" ? localStorage.getItem("spycam_spi_dynamic_chart_color") !== "false" : true;
      setSpiDynamicEnabled(stored);
    };
    window.addEventListener("spycam_settings_updated", handleSettingsUpdated);
    return () => window.removeEventListener("spycam_settings_updated", handleSettingsUpdated);
  }, [spiDynamicColors]);

  // État pour le détachement/glisser-déposer interactif d'onglets (style onglet Chrome)
  const [draggedTabMetric, setDraggedTabMetric] = useState<{
    metric: MetricType;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    label: string;
    isTorn: boolean;
  } | null>(null);

  const handleTabPointerDown = (e: React.PointerEvent, m: { id: MetricType; label: string }) => {
    if (!isEditing) return;
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;

    const onPointerMove = (moveEvt: PointerEvent) => {
      moveEvt.preventDefault();
      const deltaX = moveEvt.clientX - startX;
      const deltaY = moveEvt.clientY - startY;
      const dist = Math.hypot(deltaX, deltaY);
      if (dist > 8) {
        setDraggedTabMetric({
          metric: m.id,
          startX,
          startY,
          currentX: moveEvt.clientX,
          currentY: moveEvt.clientY,
          label: m.label,
          isTorn: true,
        });
      }
    };

    const onPointerUp = (upEvt: PointerEvent) => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);

      const deltaX = upEvt.clientX - startX;
      const deltaY = upEvt.clientY - startY;
      const dist = Math.hypot(deltaX, deltaY);

      if (dist > 20) {
        const elemBelow = document.elementFromPoint(upEvt.clientX, upEvt.clientY);
        const targetChartCard = elemBelow?.closest("[data-chart-id]") as HTMLElement | null;
        const targetChartId = targetChartCard?.getAttribute("data-chart-id");

        if (targetChartId && targetChartId !== chartId && onAttachMetric) {
          sounds.playLockIn();
          onAttachMetric(m.id, targetChartId);
        } else if ((!targetChartCard || targetChartId !== chartId) && canDetach) {
          sounds.playGrabWidget();
          if (onDetachMetric) onDetachMetric(m.id);
        }
      }
      setDraggedTabMetric(null);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  };

  const handleDragStart = (e: React.DragEvent, mId: MetricType) => {
    if (!isEditing) return;
    e.dataTransfer.setData("application/spycam-metric", JSON.stringify({ chartId, metric: mId }));
    e.dataTransfer.effectAllowed = "move";
    sounds.playGrabWidget();
  };

  const handleChartDrop = (e: React.DragEvent) => {
    if (!isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      const raw = e.dataTransfer.getData("application/spycam-metric");
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.chartId && data.chartId !== chartId && data.metric && onAttachMetric) {
        sounds.playLockIn();
        onAttachMetric(data.metric, chartId);
      }
    } catch {}
  };

  const [matchLimit, setMatchLimit] = useState<number | "all">(20);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgDimensions, setSvgDimensions] = useState<{ width: number; height: number }>({
    width: 900,
    height: 220,
  });

  useEffect(() => {
    if (!svgRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 100 && h > 60) {
          setSvgDimensions({ width: Math.round(w), height: Math.round(h) });
        }
      }
    });
    observer.observe(svgRef.current);
    return () => observer.disconnect();
  }, []);

  const totalAvailable = matchHistory?.length || 0;

  // Format matches in chronological order (oldest to newest)
  const chartData = useMemo(() => {
    if (!matchHistory || matchHistory.length === 0) return [];
    const sliceCount = matchLimit === "all" ? matchHistory.length : matchLimit;
    const reversed = [...matchHistory].slice(0, sliceCount).reverse();

    return reversed.map((m, idx) => {
      const kd = m.deaths > 0 ? Number((m.kills / m.deaths).toFixed(2)) : m.kills;
      const hs =
        m.headshots && m.kills
          ? Math.round((m.headshots / (m.kills + m.assists || 1)) * 100)
          : m.headshotPct || 20;
      const matchSpi = calculateSingleMatchSPI(m, m.role);
      return {
        index: idx + 1,
        matchId: m.matchId,
        date: m.date ? new Date(m.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : `M${idx + 1}`,
        map: m.map || "Map",
        agent: m.agent || "Agent",
        agentIcon: m.agentIcon,
        won: m.won,
        score: m.score || "",
        kd,
        acs: m.acs || 0,
        hs,
        spi: matchSpi.score,
        spiGrade: matchSpi.grade,
        spiColor: matchSpi.gradeColor,
      };
    });
  }, [matchHistory, matchLimit]);

  if (chartData.length < 2) {
    return (
      <div className="glass-panel rounded-2xl p-4 w-full h-full flex flex-col items-center justify-center text-center">
        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[var(--color-text-secondary)] mb-1.5 text-sm">
          <IconChart size={16} />
        </div>
        <p className="text-[11px] font-bold text-[var(--color-text-primary)]">{title}</p>
        <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">
          {totalAvailable === 1 ? "1 seul match trouvé. Au moins 2 matchs requis pour tracer la courbe." : "Historique de parties insuffisant pour tracer la courbe."}
        </p>
      </div>
    );
  }

  // Dynamic 1:1 pixel coordinate system matching physical element size - prevents text compression/stretching
  const width = Math.max(320, svgDimensions.width);
  const height = Math.max(120, svgDimensions.height);

  const padding = {
    top: 25,
    right: 25,
    bottom: 35,
    left: 25,
  };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  let values: number[] = [];
  let formatVal = (v: number) => String(v);
  let threshold: number | null = null;

  if (activeMetric === "kd") {
    values = chartData.map((d) => d.kd);
    formatVal = (v: number) => v.toFixed(2);
    threshold = 1.0;
  } else if (activeMetric === "acs") {
    values = chartData.map((d) => d.acs);
    formatVal = (v: number) => `${Math.round(v)}`;
    threshold = 200;
  } else if (activeMetric === "spi") {
    values = chartData.map((d) => d.spi);
    formatVal = (v: number) => `${Math.round(v)} pts`;
    threshold = 500;
  } else {
    values = chartData.map((d) => d.hs);
    formatVal = (v: number) => `${Math.round(v)}%`;
    threshold = 20;
  }

  const minVal = Math.max(0, Math.min(...values) * 0.85);
  const maxVal = Math.max(...values, threshold || 0) * 1.15 || 10;
  const valRange = maxVal - minVal || 1;

  const points = chartData.map((d, i) => {
    const x = padding.left + (i / Math.max(1, chartData.length - 1)) * graphWidth;
    const val = activeMetric === "kd" ? d.kd : activeMetric === "acs" ? d.acs : activeMetric === "spi" ? d.spi : d.hs;
    const y = padding.top + graphHeight - ((val - minVal) / valRange) * graphHeight;
    return { ...d, x: Number.isFinite(x) ? x : 0, y: Number.isFinite(y) ? y : 0, currentVal: val };
  });

  const pathD = getCubicBezierPath(points);

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${(padding.top + graphHeight).toFixed(
        1
      )} L ${points[0].x.toFixed(1)} ${(padding.top + graphHeight).toFixed(1)} Z`
    : "";

  const thresholdY =
    threshold !== null
      ? padding.top + graphHeight - ((threshold - minVal) / valRange) * graphHeight
      : null;

  const average = values.reduce((a, b) => a + b, 0) / (values.length || 1);

  // Smooth mouse move handler mapping directly to SVG viewBox
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;

    let closest = 0;
    let minDistance = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - mouseX);
      if (dist < minDistance) {
        minDistance = dist;
        closest = i;
      }
    });
    setHoveredIdx(closest);
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
  };

  const activePoint = hoveredIdx !== null && points[hoveredIdx] ? points[hoveredIdx] : null;

  const isSpi = activeMetric === "spi";
  const spiCurveGradientId = `spiCurveGradient-${chartId}`;
  const strokeColor = isSpi
    ? spiDynamicEnabled
      ? `url(#${spiCurveGradientId})`
      : "var(--color-val-red, #ff4655)"
    : "var(--color-val-red, #ff4655)";
  const gradientColor = isSpi
    ? spiDynamicEnabled
      ? "#f59e0b"
      : "var(--color-val-red, #ff4655)"
    : "var(--color-val-red, #ff4655)";
  const gradientId = `chartGradient-${chartId}`;
  const glowId = `chartGlow-${chartId}`;

  return (
    <div
      data-chart-id={chartId}
      onDragOver={(e) => {
        if (isEditing) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }
      }}
      onDrop={handleChartDrop}
      className={`glass-panel rounded-2xl p-2 sm:p-3 mb-0 animate-in fade-in duration-500 w-full h-full flex flex-col justify-between overflow-hidden relative ${
        isEditing ? "ring-1 ring-white/10" : ""
      }`}
    >
      {/* Floating Ghost Tab during pointer drag (Chrome-tab tear-off style) */}
      {draggedTabMetric?.isTorn && (
        <div
          className="fixed z-50 pointer-events-none px-3 py-1.5 rounded-xl bg-gradient-to-r from-[var(--color-val-red)] to-amber-500 text-white font-black text-xs shadow-2xl border border-white/30 flex items-center gap-1.5 animate-pulse"
          style={{
            left: draggedTabMetric.currentX + 12,
            top: draggedTabMetric.currentY + 12,
          }}
        >
          <span>↗</span>
          <span>Détacher {draggedTabMetric.label}</span>
        </div>
      )}

      {/* Header controls */}
      <div className="flex flex-row items-center justify-between gap-1 mb-1 flex-nowrap flex-shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-[var(--color-text-primary)] truncate">
            {title}
          </span>

          {/* Range Selector: 10, 20, Tous */}
          <div
            data-no-card-drag="true"
            onMouseDown={(e) => e.stopPropagation()}
            className="hidden xs:flex items-center gap-0.5 bg-[var(--color-background)]/80 p-0.5 rounded-lg border border-[var(--color-border)]"
          >
            {[
              { id: 10, label: "10" },
              { id: 20, label: "20" },
              { id: "all", label: `Tous` },
            ].map((r) => (
              <button
                key={String(r.id)}
                data-no-card-drag="true"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => setMatchLimit(r.id as any)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition-all cursor-pointer ${
                  matchLimit === r.id
                    ? "bg-[var(--color-val-red)] text-[var(--color-accent-contrast,#ffffff)] shadow-accent-sm font-bold"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Selector (K/D, ACS, Headshot %, SPI) + Action Rattacher */}
        <div className="flex items-center gap-1.5 flex-shrink-0" data-no-card-drag="true" onMouseDown={(e) => e.stopPropagation()}>
          <div
            ref={metricContainerRef}
            data-no-card-drag="true"
            onMouseDown={(e) => e.stopPropagation()}
            className="relative flex items-center gap-0.5 bg-[var(--color-surface)] p-0.5 rounded-lg border border-[var(--color-border)]"
          >
            {/* Pilule rouge animée glissante (comme sur les onglets de page) */}
            <div
              className={`absolute top-0.5 bottom-0.5 rounded-md pointer-events-none z-0 transition-all ${
                activeMetric === "spi" && spiDynamicEnabled
                  ? "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                  : "bg-[var(--color-val-red)] shadow-accent-md"
              }`}
              style={{
                transform: `translateX(${metricPillStyle.left}px)`,
                width: `${metricPillStyle.width}px`,
                opacity: metricPillStyle.opacity,
                transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />

            {[
              { id: "kd" as MetricType, label: "K/D" },
              { id: "acs" as MetricType, label: "ACS" },
              { id: "hs" as MetricType, label: "HS%" },
              { id: "spi" as MetricType, label: "SPI" },
            ]
              .filter((m) => validAllowedMetrics.includes(m.id))
              .map((m) => {
                const isActive = activeMetric === m.id;
                return (
                  <button
                    key={m.id}
                    ref={(el) => {
                      metricBtnRefs.current[m.id] = el;
                    }}
                    data-no-card-drag="true"
                    onClick={() => handleSelectMetric(m.id)}
                    draggable={isEditing}
                    onDragStart={(e) => handleDragStart(e, m.id)}
                    onPointerDown={(e) => handleTabPointerDown(e, m)}
                    onMouseDown={(e) => e.stopPropagation()}
                    title={
                      isEditing
                        ? `Glisser pour détacher l'onglet ${m.label} (style Chrome) ou fusionner avec un autre graphique`
                        : m.label
                    }
                    className={`relative z-10 px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold transition-colors duration-200 flex items-center gap-1 active:scale-95 select-none ${
                      isEditing ? "cursor-grab active:cursor-grabbing hover:ring-1 hover:ring-white/40" : "cursor-pointer"
                    } ${
                      isActive
                        ? m.id === "spi" && spiDynamicEnabled
                          ? "text-black font-black"
                          : "text-[var(--color-accent-contrast,#ffffff)] font-black"
                        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                    }`}
                  >
                    {isEditing && (
                      <span className="opacity-40 text-[8px] font-mono select-none" title="Glisser pour détacher">
                        ⋮⋮
                      </span>
                    )}
                    <span>{m.label}</span>
                  </button>
                );
              })}
          </div>

          {/* Bouton Rattacher la courbe au graphique principal (visible uniquement en mode modification) */}
          {isEditing && isDetached && availableTargetCharts && availableTargetCharts.length > 0 && onAttachMetric && (
            <button
              type="button"
              data-no-card-drag="true"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => onAttachMetric(activeMetric, availableTargetCharts[0].id)}
              title={`Rattacher cette courbe à ${availableTargetCharts[0].label}`}
              className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 border border-emerald-500/30 hover:border-emerald-500 text-emerald-300 hover:text-white transition-all text-[10px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              <span>Rattacher</span>
            </button>
          )}
        </div>
      </div>

      <div className="text-[9px] sm:text-[10px] text-[var(--color-text-secondary)] mb-0.5 flex-shrink-0">
        Moyenne : <strong className="text-[var(--color-text-primary)]">{formatVal(average)}</strong>
      </div>

      {/* Full-width SVG Chart with smooth mouse tracking */}
      <div className="w-full flex-1 min-h-[40px] relative overflow-hidden flex items-center justify-center">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full select-none cursor-crosshair block"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {isSpi && spiDynamicEnabled && (
              <linearGradient
                id={spiCurveGradientId}
                gradientUnits="userSpaceOnUse"
                x1={padding.left}
                y1={0}
                x2={width - padding.right}
                y2={0}
              >
                {points.map((p, idx) => {
                  const pct = points.length > 1 ? ((idx / (points.length - 1)) * 100).toFixed(1) : "0";
                  return <stop key={idx} offset={`${pct}%`} stopColor={p.spiColor || "#f59e0b"} />;
                })}
              </linearGradient>
            )}
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={gradientColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor={gradientColor} stopOpacity="0.0" />
            </linearGradient>
            <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={width - padding.right}
            y2={padding.top}
            stroke="var(--color-border)"
            strokeDasharray="4 4"
            opacity="0.4"
          />
          <line
            x1={padding.left}
            y1={padding.top + graphHeight / 2}
            x2={width - padding.right}
            y2={padding.top + graphHeight / 2}
            stroke="var(--color-border)"
            strokeDasharray="4 4"
            opacity="0.4"
          />
          <line
            x1={padding.left}
            y1={padding.top + graphHeight}
            x2={width - padding.right}
            y2={padding.top + graphHeight}
            stroke="var(--color-border)"
            strokeDasharray="4 4"
            opacity="0.4"
          />

          {/* Target Threshold Line */}
          {thresholdY !== null && thresholdY >= padding.top && thresholdY <= padding.top + graphHeight && (
            <g>
              <line
                x1={padding.left}
                y1={thresholdY}
                x2={width - padding.right}
                y2={thresholdY}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.7"
              />
              <text
                x={width - padding.right - 5}
                y={thresholdY - 4}
                textAnchor="end"
                fill="#38bdf8"
                fontSize="10"
                fontFamily="sans-serif"
                fontWeight="bold"
              >
                Seuil ({threshold})
              </text>
            </g>
          )}

          {/* Area Fill */}
          <path d={areaD} fill={`url(#${gradientId})`} />

          {/* Subtle Glow underlay */}
          <path
            d={pathD}
            fill="none"
            stroke={isSpi ? (spiDynamicEnabled ? "#f59e0b" : "var(--color-val-red, #ff4655)") : "var(--color-val-red, #ff4655)"}
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.2"
          />

          {/* Main Smooth Curved Trend Line */}
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {points.map((p, i) => {
            const isSelected = hoveredIdx === i;
            const pointFill = isSpi
              ? spiDynamicEnabled
                ? p.spiColor
                : "var(--color-val-red, #ff4655)"
              : p.won
              ? "#10b981"
              : "#ef4444";

            return (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={isSelected ? 6 : 4}
                fill={pointFill}
                stroke="#0a0e13"
                strokeWidth="2"
                className="transition-all duration-150"
              />
            );
          })}

          {/* Vertical Guide Line on Hover */}
          {activePoint && (
            <g pointerEvents="none">
              <line
                x1={activePoint.x}
                y1={padding.top}
                x2={activePoint.x}
                y2={padding.top + graphHeight}
                stroke="rgba(255, 255, 255, 0.35)"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {/* Smooth Floating Tooltip Box */}
              <g transform={`translate(${Math.max(10, Math.min(width - 130, activePoint.x - 60))}, ${Math.max(5, activePoint.y - 45)})`}>
                <rect
                  width="120"
                  height="34"
                  rx="8"
                  fill="#121824"
                  stroke={isSpi ? (spiDynamicEnabled ? (activePoint.spiColor || "#f59e0b") : "var(--color-val-red)") : "var(--color-val-red)"}
                  strokeWidth="1.5"
                  className="shadow-2xl"
                />
                <text
                  x="60"
                  y="14"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="900"
                  fontFamily="sans-serif"
                >
                  {isSpi ? `${activePoint.spi} pts (${activePoint.spiGrade})` : formatVal(activePoint.currentVal)} • {activePoint.won ? "Victoire" : "Défaite"}
                </text>
                <text
                  x="60"
                  y="27"
                  textAnchor="middle"
                  fill="var(--color-text-secondary)"
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {activePoint.map} ({activePoint.agent})
                </text>
              </g>
            </g>
          )}

          {/* Bottom Date Labels */}
          {points.map((p, i) => {
            const step = Math.max(1, Math.floor(points.length / 5));
            const showLabel = i === 0 || i === points.length - 1 || i % step === 0;
            if (!showLabel) return null;

            return (
              <text
                key={i}
                x={p.x}
                y={height - 8}
                textAnchor="middle"
                fill="var(--color-text-secondary)"
                fontSize="11"
                fontWeight="bold"
                fontFamily="sans-serif"
                pointerEvents="none"
              >
                {p.date}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Legend & Summary */}
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between pt-1.5 mt-0.5 border-t border-[var(--color-border)] text-[9px] sm:text-[10px] text-[var(--color-text-secondary)] gap-1.5 flex-shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Victoire
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span> Défaite
          </span>
          {threshold !== null && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-0.5 bg-[#38bdf8]"></span> Seuil ({threshold})
            </span>
          )}
        </div>
        <span className="font-mono opacity-60 hidden sm:inline-block">Survolez pour inspecter</span>
      </div>
    </div>
  );
}

export default React.memo(PerformanceChartsComponent);
