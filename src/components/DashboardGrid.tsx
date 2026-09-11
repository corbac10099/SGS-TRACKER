"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import StatCard from "./StatCard";
import PerformanceCharts, { MetricType } from "./PerformanceCharts";
import WeaponHitmap from "./WeaponHitmap";
import PerformanceScoreCard from "./PerformanceScoreCard";
import AiCoachWidget from "./AiCoachWidget";
import { PerformanceScoreResult } from "@/lib/valorant/performanceScore";
import {
  IconCrosshair,
  IconSkull,
  IconChart,
  IconHandshake,
  IconScale,
  IconFlame,
  IconCrown,
  IconShield,
  IconSword,
  IconTrophy,
  IconGamepad,
  IconAppGrid,
  IconSettings,
  IconBrain,
} from "./icons/SpyIcons";
import { sounds } from "@/lib/soundEffects";

export interface GridItemConfig {
  id: string;
  x: number;
  y: number;
  colSpan: number;
  rowSpan: number;
  visible: boolean;
}

export interface ChartConfig {
  id: string;
  title: string;
  metrics: MetricType[];
}

export interface DashboardGridProps {
  stats: any;
  warnings: Record<string, string>;
  smartRating: boolean;
  matchHistory: any[];
  canEdit: boolean;
  hiddenStatsByPrivacy?: string[];
  userStorageKey?: string;
  initialGridData?: string | null;
  performanceScoreResult?: PerformanceScoreResult | null;
  onOpenPerformanceModal?: () => void;
  onOpenCoachModal?: () => void;
  agentStats?: any[];
  playerName?: string;
  onSaveGridData?: (gridJson: string) => void;
}

const DEFAULT_COLS = 29;
const GRID_GAP = 8;

const DEFAULT_LAYOUT: GridItemConfig[] = [
  { id: "chart", x: 0, y: 0, colSpan: 29, rowSpan: 4, visible: true },
  { id: "performanceScore", x: 0, y: 4, colSpan: 9, rowSpan: 2, visible: true },
  { id: "weapons", x: 0, y: 6, colSpan: 9, rowSpan: 4, visible: true },
  { id: "kills", x: 9, y: 4, colSpan: 10, rowSpan: 1, visible: true },
  { id: "deaths", x: 19, y: 4, colSpan: 10, rowSpan: 1, visible: true },
  { id: "assists", x: 9, y: 5, colSpan: 10, rowSpan: 1, visible: true },
  { id: "kd", x: 19, y: 5, colSpan: 10, rowSpan: 1, visible: true },
  { id: "adr", x: 9, y: 6, colSpan: 10, rowSpan: 1, visible: true },
  { id: "hs", x: 19, y: 6, colSpan: 10, rowSpan: 1, visible: true },
  { id: "wr", x: 9, y: 7, colSpan: 10, rowSpan: 1, visible: true },
  { id: "acs", x: 19, y: 7, colSpan: 10, rowSpan: 1, visible: true },
  { id: "fb", x: 9, y: 8, colSpan: 5, rowSpan: 1, visible: true },
  { id: "ace", x: 14, y: 8, colSpan: 5, rowSpan: 1, visible: true },
  { id: "kast", x: 19, y: 8, colSpan: 5, rowSpan: 1, visible: true },
  { id: "dd", x: 24, y: 8, colSpan: 5, rowSpan: 1, visible: true },
  { id: "wins", x: 0, y: 10, colSpan: 14, rowSpan: 1, visible: true },
  { id: "matches", x: 14, y: 10, colSpan: 15, rowSpan: 1, visible: true },
  { id: "coach", x: 0, y: 11, colSpan: 29, rowSpan: 2, visible: true },
];

export const ITEM_ICONS: Record<string, React.ReactNode> = {
  performanceScore: <IconTrophy size={14} />,
  coach: <IconBrain size={14} />,
  chart: <IconChart size={14} />,
  weapons: <IconCrosshair size={14} />,
  kills: <IconCrosshair size={14} />,
  deaths: <IconSkull size={14} />,
  assists: <IconHandshake size={14} />,
  kd: <IconScale size={14} />,
  adr: <IconFlame size={14} />,
  hs: <IconCrosshair size={14} />,
  wr: <IconTrophy size={14} />,
  acs: <IconFlame size={14} />,
  fb: <IconSword size={14} />,
  ace: <IconCrown size={14} />,
  kast: <IconShield size={14} />,
  dd: <IconSword size={14} />,
  wins: <IconTrophy size={14} />,
  matches: <IconGamepad size={14} />,
};

const ITEM_LABELS: Record<string, { label: string; desc: string }> = {
  performanceScore: { label: "Score de Performance (SPI)", desc: "Score intelligent sur 1 000 points" },
  coach: { label: "Coach Tactique SGS", desc: "Diagnostic télémétrique et débriefing en direct" },
  chart: { label: "Graphique de Progression", desc: "Courbe d'évolution K/D, ACS et Headshot" },
  weapons: { label: "Top Armes & Précision", desc: "Top 3 armes et zones de tir" },
  kills: { label: "Éliminations", desc: "Total des éliminations" },
  deaths: { label: "Morts", desc: "Total des morts" },
  assists: { label: "Passes décisives", desc: "Total des assists" },
  kd: { label: "Ratio K/D", desc: "Ratio Kills / Deaths" },
  adr: { label: "Dégâts/Tour (ADR)", desc: "Dégâts moyens par manche" },
  hs: { label: "Headshot %", desc: "Pourcentage de tirs à la tête" },
  wr: { label: "Win Rate", desc: "Pourcentage de victoires" },
  acs: { label: "ACS Moyen", desc: "Combat Score moyen" },
  fb: { label: "Premiers sangs", desc: "First bloods réalisés" },
  ace: { label: "ACE", desc: "Nombre de 1v5 / aces" },
  kast: { label: "KAST", desc: "% manches avec K/A/S/T" },
  dd: { label: "DDΔ / Round", desc: "Différence de dégâts par manche" },
  wins: { label: "Victoires", desc: "Nombre total de victoires" },
  matches: { label: "Parties", desc: "Nombre total de parties" },
};

// Return strictly enforced minimum dimensions according to content needs
export function getMinItemDimensions(itemId: string): { minCol: number; minRow: number } {
  if (itemId === "chart" || itemId.startsWith("chart_")) return { minCol: 8, minRow: 3 };
  if (itemId === "coach") return { minCol: 8, minRow: 2 };
  if (itemId === "weapons") return { minCol: 7, minRow: 3 };
  if (itemId === "performanceScore") return { minCol: 6, minRow: 2 };
  if (["fb", "ace", "kast", "dd"].includes(itemId)) return { minCol: 3, minRow: 1 };
  // Standard stat cards (K/D, ACS, HS %, etc.) need at least 5 cols (~160px) to prevent truncation
  return { minCol: 5, minRow: 1 };
}

// Check if two items overlap in 2D
function itemsOverlap(a: GridItemConfig, b: GridItemConfig): boolean {
  const aRight = a.x + a.colSpan;
  const aBottom = a.y + a.rowSpan;
  const bRight = b.x + b.colSpan;
  const bBottom = b.y + b.rowSpan;
  return a.x < bRight && aRight > b.x && a.y < bBottom && aBottom > b.y;
}

// Find first available slot scanning from top-left
function findFirstAvailableSlot(
  visibleItems: GridItemConfig[],
  colSpan: number,
  rowSpan: number,
  cols: number
): { x: number; y: number } {
  let maxSearchRow = 0;
  visibleItems.forEach((it) => {
    maxSearchRow = Math.max(maxSearchRow, it.y + it.rowSpan);
  });

  for (let y = 0; y <= maxSearchRow + 1; y++) {
    for (let x = 0; x <= cols - colSpan; x++) {
      const candidate: GridItemConfig = { id: "__candidate__", x, y, colSpan, rowSpan, visible: true };
      const hasOverlap = visibleItems.some((it) => itemsOverlap(candidate, it));
      if (!hasOverlap) {
        return { x, y };
      }
    }
  }
  return { x: 0, y: maxSearchRow };
}

// Clean collision resolution on drop (only pushes conflicting items down)
function resolveCollisions(items: GridItemConfig[], movedId: string, cols: number): GridItemConfig[] {
  const result = items.map((i) => ({ ...i }));
  const moved = result.find((i) => i.id === movedId);
  if (!moved || !moved.visible) return result;

  // 1. Push any item colliding with the moved item
  for (const other of result) {
    if (other.id === movedId || !other.visible) continue;
    if (itemsOverlap(moved, other)) {
      other.y = moved.y + moved.rowSpan;
      if (other.x + other.colSpan > cols) {
        other.x = Math.max(0, cols - other.colSpan);
      }
    }
  }

  // 2. Cascade down any secondary overlaps
  for (let pass = 0; pass < 5; pass++) {
    let hadCascade = false;
    for (let i = 0; i < result.length; i++) {
      if (!result[i].visible) continue;
      for (let j = 0; j < result.length; j++) {
        if (i === j || !result[j].visible || result[j].id === movedId) continue;
        if (itemsOverlap(result[i], result[j])) {
          if (result[j].y >= result[i].y) {
            result[j].y = result[i].y + result[i].rowSpan;
            if (result[j].x + result[j].colSpan > cols) {
              result[j].x = Math.max(0, cols - result[j].colSpan);
            }
            hadCascade = true;
          }
        }
      }
    }
    if (!hadCascade) break;
  }

  return result;
}

export default function DashboardGrid({
  stats,
  warnings,
  smartRating,
  matchHistory,
  canEdit,
  hiddenStatsByPrivacy = [],
  userStorageKey = "default",
  initialGridData,
  performanceScoreResult,
  onOpenPerformanceModal,
  onOpenCoachModal,
  agentStats = [],
  playerName = "Joueur",
  onSaveGridData,
}: DashboardGridProps) {
  const storageKey = `spycam_grid_layout_v8_29_${userStorageKey}`;
  const chartsStorageKey = `spycam_charts_config_v1_${userStorageKey}`;
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const gridCols = DEFAULT_COLS;
  const [layout, setLayout] = useState<GridItemConfig[]>(DEFAULT_LAYOUT);

  // Mode édition persistant (ne se coupe pas lors du changement d'onglet ou de page)
  const [isEditing, setIsEditing] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("spycam_dashboard_is_editing") === "true";
    }
    return false;
  });

  const setIsEditingPersistent = (val: boolean) => {
    setIsEditing(val);
    if (typeof window !== "undefined") {
      if (val) {
        sessionStorage.setItem("spycam_dashboard_is_editing", "true");
      } else {
        sessionStorage.removeItem("spycam_dashboard_is_editing");
      }
    }
  };

  // Instantanés pour annuler les modifications non confirmées
  const [snapshotLayout, setSnapshotLayout] = useState<GridItemConfig[] | null>(null);
  const [snapshotChartsConfig, setSnapshotChartsConfig] = useState<ChartConfig[] | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Multi-charts configuration (main chart + any detached charts)
  const [chartsConfig, setChartsConfig] = useState<ChartConfig[]>(() => {
    const defaultConfigs: ChartConfig[] = [
      { id: "chart", title: "Progression", metrics: ["kd", "acs", "hs", "spi"] },
    ];
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`spycam_charts_config_v1_${userStorageKey}`);
        if (stored) {
          const parsed: ChartConfig[] = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Migration automatique : garantir que "spi" est présent dans au moins un graphique
            const allMetrics = parsed.flatMap((c) => c.metrics || []);
            if (!allMetrics.includes("spi")) {
              const main = parsed.find((c) => c.id === "chart") || parsed[0];
              if (main) {
                main.metrics = Array.from(new Set([...(main.metrics || []), "spi" as MetricType]));
              } else {
                parsed.unshift({ id: "chart", title: "Progression", metrics: ["kd", "acs", "hs", "spi"] });
              }
            }
            return parsed;
          }
        }
      } catch {}
    }
    return defaultConfigs;
  });

  // Initialisation de l'instantané dès que le mode édition est actif
  useEffect(() => {
    if (isEditing && !snapshotLayout && layout && layout.length > 0) {
      setSnapshotLayout(JSON.parse(JSON.stringify(layout)));
      setSnapshotChartsConfig(JSON.parse(JSON.stringify(chartsConfig)));
    }
  }, [isEditing, snapshotLayout, layout, chartsConfig]);

  const saveChartsConfig = (newConfigs: ChartConfig[]) => {
    setChartsConfig(newConfigs);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(chartsStorageKey, JSON.stringify(newConfigs));
      } catch {}
    }
  };

  const handleStartEditing = () => {
    sounds.playTabSwitch();
    setSnapshotLayout(JSON.parse(JSON.stringify(layout)));
    setSnapshotChartsConfig(JSON.parse(JSON.stringify(chartsConfig)));
    setHasUnsavedChanges(false);
    setIsEditingPersistent(true);
  };

  const handleCancelEditing = () => {
    sounds.playClick();
    if (snapshotLayout) {
      setLayout(snapshotLayout);
    }
    if (snapshotChartsConfig) {
      setChartsConfig(snapshotChartsConfig);
    }
    setHasUnsavedChanges(false);
    setIsEditingPersistent(false);
    setDrawerOpen(false);
  };

  const handleConfirmEditing = () => {
    sounds.playLockIn();
    saveState(layout, true);
    saveChartsConfig(chartsConfig);
    if (onSaveGridData) {
      onSaveGridData(JSON.stringify({ cols: DEFAULT_COLS, items: layout }));
    }
    setSnapshotLayout(JSON.parse(JSON.stringify(layout)));
    setSnapshotChartsConfig(JSON.parse(JSON.stringify(chartsConfig)));
    setHasUnsavedChanges(false);
    setIsEditingPersistent(false);
    setDrawerOpen(false);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleDetachMetric = (fromChartId: string, metric: MetricType) => {
    sounds.playClick();
    const source = chartsConfig.find((c) => c.id === fromChartId);
    if (!source || source.metrics.length <= 1) return;

    const newMetrics = source.metrics.filter((m) => m !== metric);
    const newChartId = `chart_${metric}`;
    const metricNames: Record<MetricType, string> = {
      kd: "K/D",
      acs: "ACS",
      hs: "Headshot %",
      spi: "Score SPI",
    };
    const newChartConfig: ChartConfig = {
      id: newChartId,
      title: `Progression ${metricNames[metric] || metric.toUpperCase()}`,
      metrics: [metric],
    };

    const updatedCharts = chartsConfig
      .map((c) => (c.id === fromChartId ? { ...c, metrics: newMetrics } : c))
      .filter((c) => c.id !== newChartId)
      .concat(newChartConfig);

    setChartsConfig(updatedCharts);
    setHasUnsavedChanges(true);

    // Insert detached chart into grid layout
    setLayout((prev) => {
      const sourceItem = prev.find((it) => it.id === fromChartId);
      const targetY = sourceItem ? sourceItem.y + sourceItem.rowSpan : 0;
      const newGridItem: GridItemConfig = {
        id: newChartId,
        x: 0,
        y: targetY,
        colSpan: sourceItem ? sourceItem.colSpan : DEFAULT_COLS,
        rowSpan: sourceItem ? sourceItem.rowSpan : 4,
        visible: true,
      };
      const resolved = resolveCollisions(
        [...prev.filter((i) => i.id !== newChartId), newGridItem],
        newChartId,
        gridCols
      );
      if (!isEditing) {
        saveState(resolved);
        saveChartsConfig(updatedCharts);
      }
      return resolved;
    });
  };

  const handleAttachMetric = (fromChartId: string, metric: MetricType, targetChartId: string) => {
    sounds.playClick();
    const source = chartsConfig.find((c) => c.id === fromChartId);
    const target = chartsConfig.find((c) => c.id === targetChartId);
    if (!source || !target) return;

    const updatedSourceMetrics = source.metrics.filter((m) => m !== metric);
    const updatedTargetMetrics = target.metrics.includes(metric)
      ? target.metrics
      : [...target.metrics, metric];

    let updatedCharts = chartsConfig.map((c) => {
      if (c.id === targetChartId) return { ...c, metrics: updatedTargetMetrics };
      if (c.id === fromChartId) return { ...c, metrics: updatedSourceMetrics };
      return c;
    });

    if (updatedSourceMetrics.length === 0 && fromChartId !== "chart") {
      updatedCharts = updatedCharts.filter((c) => c.id !== fromChartId);
      setLayout((prev) => prev.filter((it) => it.id !== fromChartId));
    }

    setChartsConfig(updatedCharts);
    setHasUnsavedChanges(true);
    if (!isEditing) {
      saveChartsConfig(updatedCharts);
    }
  };
  
  // Custom Smooth Mouse Dragging State
  const [draggingItem, setDraggingItem] = useState<{
    id: string;
    deltaX: number;
    deltaY: number;
    targetX: number;
    targetY: number;
  } | null>(null);

  const [resizingItemId, setResizingItemId] = useState<string | null>(null);
  const [resizeHint, setResizeHint] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<boolean>(false);
  const [usableWidth, setUsableWidth] = useState<number>(900);

  // Measure usable width inside grid container accurately
  useEffect(() => {
    if (!gridContainerRef.current) return;
    const updateWidth = () => {
      if (gridContainerRef.current) {
        // Inner width excluding padding (16px on left and right when editing)
        const totalW = gridContainerRef.current.clientWidth;
        if (totalW > 0) {
          const pad = isEditing ? 32 : 0;
          setUsableWidth(Math.max(200, totalW - pad));
        }
      }
    };
    updateWidth();
    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(gridContainerRef.current);
    return () => observer.disconnect();
  }, [isEditing]);

  const isMobile = usableWidth < 768;
  const editCanvasWidth = isEditing && isMobile ? Math.max(780, usableWidth) : usableWidth;

  // Square cell size: 1 column unit = 1 row unit
  const cellSize = useMemo(() => {
    const widthToUse = isEditing ? editCanvasWidth : usableWidth;
    const totalGaps = (gridCols - 1) * GRID_GAP;
    return Math.max(15, (widthToUse - totalGaps) / gridCols);
  }, [usableWidth, isEditing, editCanvasWidth, gridCols]);

  const step = useMemo(() => cellSize + GRID_GAP, [cellSize]);

  // Load layout from Neon DB or localStorage
  useEffect(() => {
    if (isEditing) return;

    // 1. If visiting a profile or have initialGridData from Neon DB:
    if (initialGridData) {
      try {
        const parsed = typeof initialGridData === "string" ? JSON.parse(initialGridData) : initialGridData;
        if (parsed && typeof parsed === "object") {
          if (Array.isArray(parsed.items) && parsed.items.length > 0) {
            const existingIds = new Set(parsed.items.map((item: any) => item.id));
            const normalized = parsed.items.map((item: any) => {
              const { minCol, minRow } = getMinItemDimensions(item.id);
              return {
                id: item.id,
                x: item.x ?? 0,
                y: item.y ?? 0,
                colSpan: Math.max(minCol, item.colSpan || (item.id === "chart" ? DEFAULT_COLS : 5)),
                rowSpan: Math.max(minRow, item.rowSpan || (item.id === "chart" ? 4 : 1)),
                visible: item.visible !== false,
              };
            });
            const missing = DEFAULT_LAYOUT.filter((item) => !existingIds.has(item.id));
            setLayout([...normalized, ...missing]);
            return;
          }
        }
      } catch {}
    }

    // 2. Fallback to localStorage
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          if (Array.isArray(parsed.items) && parsed.items.length > 0) {
            const existingIds = new Set(parsed.items.map((item: any) => item.id));
            const normalized = parsed.items.map((item: any) => {
              const { minCol, minRow } = getMinItemDimensions(item.id);
              return {
                id: item.id,
                x: item.x ?? 0,
                y: item.y ?? 0,
                colSpan: Math.max(minCol, item.colSpan || (item.id === "chart" ? DEFAULT_COLS : 5)),
                rowSpan: Math.max(minRow, item.rowSpan || (item.id === "chart" ? 4 : 1)),
                visible: item.visible !== false,
              };
            });
            const missing = DEFAULT_LAYOUT.filter((item) => !existingIds.has(item.id));
            setLayout([...normalized, ...missing]);
          }
        }
      }
    } catch {}
  }, [storageKey, initialGridData]);

  // Synchronise automatiquement les graphiques détachés (ex: chart_spi) avec layout
  useEffect(() => {
    setLayout((prev) => {
      const existingIds = new Set(prev.map((i) => i.id));
      const detachedCharts = chartsConfig.filter((c) => c.id !== "chart" && !existingIds.has(c.id));
      if (detachedCharts.length === 0) return prev;

      const mainChart = prev.find((i) => i.id === "chart");
      let targetY = mainChart ? mainChart.y + mainChart.rowSpan : 0;
      const baseSpan = mainChart ? mainChart.colSpan : DEFAULT_COLS;
      const baseRow = mainChart ? mainChart.rowSpan : 4;

      const newItems: GridItemConfig[] = detachedCharts.map((c) => {
        const item: GridItemConfig = {
          id: c.id,
          x: 0,
          y: targetY,
          colSpan: baseSpan,
          rowSpan: baseRow,
          visible: true,
        };
        targetY += baseRow;
        return item;
      });

      let updated = [...prev, ...newItems];
      detachedCharts.forEach((c) => {
        updated = resolveCollisions(updated, c.id, gridCols);
      });
      return updated;
    });
  }, [chartsConfig, gridCols]);

  // Save layout locally and sync to Neon DB
  const saveState = useCallback(
    (newLayout: GridItemConfig[], syncToDatabase = false) => {
      setLayout(newLayout);
      const payload = { cols: DEFAULT_COLS, items: newLayout };
      try {
        localStorage.setItem(storageKey, JSON.stringify(payload));
      } catch {}

      if (syncToDatabase && canEdit) {
        fetch("/api/user/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dashboardGrid: JSON.stringify(payload) }),
        }).catch((err) => console.warn("Erreur sauvegarde Neon:", err));
      }
    },
    [storageKey, canEdit]
  );

  const handleResetLayout = () => {
    sounds.playClick();
    // Réinitialise les graphiques à l'état complet unifié avec le SPI
    const defaultCharts: ChartConfig[] = [
      { id: "chart", title: "Progression", metrics: ["kd", "acs", "hs", "spi"] },
    ];
    setChartsConfig(defaultCharts);
    setLayout(DEFAULT_LAYOUT);
    setHasUnsavedChanges(true);
    setDrawerOpen(false);
  };

  // Toggle item visibility with smart minimal-size restoration in top-most slot
  const toggleVisibility = (id: string, makeVisible?: boolean) => {
    const currentItem = layout.find((i) => i.id === id);
    if (!currentItem) return;

    const newVisibility = makeVisible !== undefined ? makeVisible : !currentItem.visible;

    if (!newVisibility) {
      // Hide item
      sounds.playClick();
      const updated = layout.map((item) => (item.id === id ? { ...item, visible: false } : item));
      setLayout(updated);
      setHasUnsavedChanges(true);
      return;
    }

    // Show item: compute minimal size and find best available slot
    sounds.playGrabWidget();
    const isLarge = id === "chart" || id === "weapons";
    const minCol = isLarge ? Math.min(10, gridCols) : 5;
    const minRow = isLarge ? 4 : 1;

    const visibleItems = layout.filter((i) => i.visible && i.id !== id);
    const { x, y } = findFirstAvailableSlot(visibleItems, minCol, minRow, gridCols);

    const updated = layout.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          x,
          y,
          colSpan: minCol,
          rowSpan: minRow,
          visible: true,
        };
      }
      return item;
    });

    const resolved = resolveCollisions(updated, id, gridCols);
    setLayout(resolved);
    setHasUnsavedChanges(true);
  };

  // Custom 60fps Mouse Dragging (RAF Throttled, Zero Lag)
  const handleCardMouseDown = (e: React.MouseEvent, item: GridItemConfig) => {
    if (!isEditing || resizingItemId) return;
    const target = e.target as HTMLElement;
    if (
      target.closest("[data-no-card-drag]") ||
      target.closest("button") ||
      target.closest(".resize-handle")
    ) {
      return;
    }

    e.preventDefault();
    sounds.playGrabWidget();

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startX = item.x;
    const startY = item.y;
    const spanW = Math.min(item.colSpan, gridCols);

    setDraggingItem({
      id: item.id,
      deltaX: 0,
      deltaY: 0,
      targetX: startX,
      targetY: startY,
    });

    let currentTargetX = startX;
    let currentTargetY = startY;
    let rafId: number | null = null;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const deltaX = moveEvent.clientX - startMouseX;
        const deltaY = moveEvent.clientY - startMouseY;

        const newTargetX = Math.max(0, Math.min(gridCols - spanW, Math.round(startX + deltaX / step)));
        const newTargetY = Math.max(0, Math.round(startY + deltaY / step));

        if (newTargetX !== currentTargetX || newTargetY !== currentTargetY) {
          sounds.playDragStep();
          currentTargetX = newTargetX;
          currentTargetY = newTargetY;
        }

        setDraggingItem({
          id: item.id,
          deltaX,
          deltaY,
          targetX: currentTargetX,
          targetY: currentTargetY,
        });
      });
    };

    const onMouseUp = () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);

      sounds.playDropWidget();
      setDraggingItem(null);

      setLayout((prev) => {
        const updated = prev.map((it) =>
          it.id === item.id ? { ...it, x: currentTargetX, y: currentTargetY, visible: true } : it
        );
        const resolved = resolveCollisions(updated, item.id, gridCols);
        setHasUnsavedChanges(true);
        return resolved;
      });
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Custom Touch Dragging for Mobile / Tablets
  const handleCardTouchStart = (e: React.TouchEvent, item: GridItemConfig) => {
    if (!isEditing || resizingItemId) return;
    const target = e.target as HTMLElement;
    if (
      target.closest("[data-no-card-drag]") ||
      target.closest("button") ||
      target.closest(".resize-handle")
    ) {
      return;
    }
    const touch = e.touches[0];
    if (!touch) return;

    sounds.playGrabWidget();

    const startMouseX = touch.clientX;
    const startMouseY = touch.clientY;
    const startX = item.x;
    const startY = item.y;
    const spanW = Math.min(item.colSpan, gridCols);

    setDraggingItem({
      id: item.id,
      deltaX: 0,
      deltaY: 0,
      targetX: startX,
      targetY: startY,
    });

    let currentTargetX = startX;
    let currentTargetY = startY;
    let rafId: number | null = null;

    const onTouchMove = (moveEvent: TouchEvent) => {
      const t = moveEvent.touches[0];
      if (!t) return;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const deltaX = t.clientX - startMouseX;
        const deltaY = t.clientY - startMouseY;

        const newTargetX = Math.max(0, Math.min(gridCols - spanW, Math.round(startX + deltaX / step)));
        const newTargetY = Math.max(0, Math.round(startY + deltaY / step));

        if (newTargetX !== currentTargetX || newTargetY !== currentTargetY) {
          sounds.playDragStep();
          currentTargetX = newTargetX;
          currentTargetY = newTargetY;
        }

        setDraggingItem({
          id: item.id,
          deltaX,
          deltaY,
          targetX: currentTargetX,
          targetY: currentTargetY,
        });
      });
    };

    const onTouchEnd = () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);

      sounds.playDropWidget();
      setDraggingItem(null);

      setLayout((prev) => {
        const updated = prev.map((it) =>
          it.id === item.id ? { ...it, x: currentTargetX, y: currentTargetY, visible: true } : it
        );
        const resolved = resolveCollisions(updated, item.id, gridCols);
        setHasUnsavedChanges(true);
        return resolved;
      });
    };

    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
  };

  // Interactive Edge Resizing
  const handleResizeStart = (
    e: React.MouseEvent,
    itemId: string,
    currentColSpan: number,
    currentRowSpan: number,
    direction: "horizontal" | "vertical"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    sounds.playGrabWidget();
    setResizingItemId(itemId);

    const startX = e.clientX;
    const startY = e.clientY;

    const { minCol, minRow } = getMinItemDimensions(itemId);
    const currentItem = layout.find((i) => i.id === itemId);
    const startPosX = currentItem?.x ?? 0;

    let finalColSpan = currentColSpan;
    let finalRowSpan = currentRowSpan;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (direction === "horizontal") {
        const deltaX = moveEvent.clientX - startX;
        const colDelta = Math.round(deltaX / step);
        const maxCols = gridCols - startPosX;
        const newColSpan = Math.max(minCol, Math.min(maxCols, currentColSpan + colDelta));

        if (newColSpan !== finalColSpan) {
          sounds.playResizeStep();
          finalColSpan = newColSpan;
        }

        setResizeHint(`${finalColSpan} cols × ${currentRowSpan} lignes`);
        setLayout((prev) =>
          prev.map((item) => (item.id === itemId ? { ...item, colSpan: finalColSpan } : item))
        );
      } else {
        const deltaY = moveEvent.clientY - startY;
        const rowDelta = Math.round(deltaY / step);
        const newRowSpan = Math.max(minRow, Math.min(25, currentRowSpan + rowDelta));

        if (newRowSpan !== finalRowSpan) {
          sounds.playResizeStep();
          finalRowSpan = newRowSpan;
        }

        setResizeHint(`${currentColSpan} cols × ${finalRowSpan} lignes`);
        setLayout((prev) =>
          prev.map((item) => (item.id === itemId ? { ...item, rowSpan: finalRowSpan } : item))
        );
      }
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      sounds.playDropWidget();
      setResizingItemId(null);
      setResizeHint(null);

      setLayout((prev) => {
        const resolved = resolveCollisions(prev, itemId, gridCols);
        setHasUnsavedChanges(true);
        return resolved;
      });
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Interactive Edge Resizing for Touch Devices
  const handleResizeTouchStart = (
    e: React.TouchEvent,
    itemId: string,
    currentColSpan: number,
    currentRowSpan: number,
    direction: "horizontal" | "vertical"
  ) => {
    e.stopPropagation();
    const touch = e.touches[0];
    if (!touch) return;

    sounds.playGrabWidget();
    setResizingItemId(itemId);

    const startX = touch.clientX;
    const startY = touch.clientY;

    const { minCol, minRow } = getMinItemDimensions(itemId);
    const currentItem = layout.find((i) => i.id === itemId);
    const startPosX = currentItem?.x ?? 0;

    let finalColSpan = currentColSpan;
    let finalRowSpan = currentRowSpan;

    const onTouchMove = (moveEvent: TouchEvent) => {
      const t = moveEvent.touches[0];
      if (!t) return;
      if (direction === "horizontal") {
        const deltaX = t.clientX - startX;
        const colDelta = Math.round(deltaX / step);
        const maxCols = gridCols - startPosX;
        const newColSpan = Math.max(minCol, Math.min(maxCols, currentColSpan + colDelta));

        if (newColSpan !== finalColSpan) {
          sounds.playResizeStep();
          finalColSpan = newColSpan;
        }

        setResizeHint(`${finalColSpan} cols × ${currentRowSpan} lignes`);
        setLayout((prev) =>
          prev.map((item) => (item.id === itemId ? { ...item, colSpan: finalColSpan } : item))
        );
      } else {
        const deltaY = t.clientY - startY;
        const rowDelta = Math.round(deltaY / step);
        const newRowSpan = Math.max(minRow, Math.min(25, currentRowSpan + rowDelta));

        if (newRowSpan !== finalRowSpan) {
          sounds.playResizeStep();
          finalRowSpan = newRowSpan;
        }

        setResizeHint(`${currentColSpan} cols × ${finalRowSpan} lignes`);
        setLayout((prev) =>
          prev.map((item) => (item.id === itemId ? { ...item, rowSpan: finalRowSpan } : item))
        );
      }
    };

    const onTouchEnd = () => {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      sounds.playDropWidget();
      setResizingItemId(null);
      setResizeHint(null);

      setLayout((prev) => {
        const resolved = resolveCollisions(prev, itemId, gridCols);
        setHasUnsavedChanges(true);
        return resolved;
      });
    };

    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
  };

  // Restore all hidden items
  const handleRestoreAll = () => {
    const updated = layout.map((item) => ({ ...item, visible: true }));
    setLayout(updated);
    setHasUnsavedChanges(true);
    setDrawerOpen(false);
  };

  // Active items and hidden drawer items
  const activeItems = useMemo(() => {
    return layout.filter((item) => {
      if (!item.visible) return false;
      // Par défaut, le Coach Tactique et les statistiques masquées sont invisibles pour les visiteurs externes
      if (!canEdit && (item.id === "coach" || hiddenStatsByPrivacy?.includes(item.id))) return false;
      return true;
    });
  }, [layout, canEdit, hiddenStatsByPrivacy]);

  const sortedActiveItems = useMemo(() => {
    return [...activeItems].sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });
  }, [activeItems]);

  const hiddenDrawerItems = useMemo(() => {
    return layout.filter((item) => !item.visible);
  }, [layout]);

  // Compute total rows needed
  const totalRows = useMemo(() => {
    let maxRow = 0;
    activeItems.forEach((item) => {
      maxRow = Math.max(maxRow, (item.y || 0) + (item.rowSpan || 1));
    });
    if (draggingItem) {
      const draggedConfig = layout.find((i) => i.id === draggingItem.id);
      if (draggedConfig) {
        maxRow = Math.max(maxRow, draggingItem.targetY + draggedConfig.rowSpan);
      }
    }
    return Math.max(1, maxRow);
  }, [activeItems, draggingItem, layout]);

  // Exact pixel height of the grid content
  const gridPixelHeight = totalRows * cellSize + Math.max(0, totalRows - 1) * GRID_GAP;

  // État du mode Session en direct
  const [liveSessionActive, setLiveSessionActive] = useState<boolean>(false);
  const [liveSessionStart, setLiveSessionStart] = useState<number | null>(null);
  const [liveSessionInitialMatchIds, setLiveSessionInitialMatchIds] = useState<string[]>([]);
  const [liveSessionElapsed, setLiveSessionElapsed] = useState<number>(0);

  // Synchronisation depuis localStorage
  useEffect(() => {
    try {
      const storedActive = localStorage.getItem("sgs_live_session_active");
      const storedStart = localStorage.getItem("sgs_live_session_start");
      const storedIds = localStorage.getItem("sgs_live_session_match_ids");
      if (storedActive === "true" && storedStart) {
        setLiveSessionActive(true);
        setLiveSessionStart(parseInt(storedStart, 10));
        setLiveSessionInitialMatchIds(storedIds ? JSON.parse(storedIds) : []);
      }
    } catch {}
  }, []);

  // Timer de session en direct
  useEffect(() => {
    let interval: any = null;
    if (liveSessionActive && liveSessionStart) {
      setLiveSessionElapsed(Math.floor((Date.now() - liveSessionStart) / 1000));
      interval = setInterval(() => {
        setLiveSessionElapsed(Math.floor((Date.now() - liveSessionStart) / 1000));
      }, 1000);
    } else {
      setLiveSessionElapsed(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [liveSessionActive, liveSessionStart]);

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  // Basculement du mode session en direct
  const handleToggleLiveSession = () => {
    sounds.playClick();
    if (!liveSessionActive) {
      const now = Date.now();
      const currentIds = (matchHistory || []).map(
        (m) => m.id || m.matchId || `${m.date}_${m.map}`
      );
      setLiveSessionActive(true);
      setLiveSessionStart(now);
      setLiveSessionInitialMatchIds(currentIds);
      try {
        localStorage.setItem("sgs_live_session_active", "true");
        localStorage.setItem("sgs_live_session_start", now.toString());
        localStorage.setItem(
          "sgs_live_session_match_ids",
          JSON.stringify(currentIds)
        );
      } catch {}
    } else {
      setLiveSessionActive(false);
      setLiveSessionStart(null);
      setLiveSessionInitialMatchIds([]);
      try {
        localStorage.removeItem("sgs_live_session_active");
        localStorage.removeItem("sgs_live_session_start");
        localStorage.removeItem("sgs_live_session_match_ids");
      } catch {}
    }
  };

  // Calcul des deltas de la session en direct
  const sessionDeltas = useMemo(() => {
    if (!liveSessionActive || !liveSessionStart) return null;

    const initialSet = new Set(liveSessionInitialMatchIds);
    const sessionMatches = (matchHistory || []).filter((m) => {
      const id = m.id || m.matchId || `${m.date}_${m.map}`;
      if (initialSet.has(id)) return false;
      const matchTime = m.date ? new Date(m.date).getTime() : 0;
      return matchTime >= liveSessionStart - 60000;
    });

    const matchesCount = sessionMatches.length;
    let kills = 0;
    let deaths = 0;
    let assists = 0;
    let wins = 0;
    let totalAcs = 0;
    let totalHs = 0;
    let totalShots = 0;
    let totalAdr = 0;
    let firstBloods = 0;
    let aces = 0;

    sessionMatches.forEach((m) => {
      if (m.won) wins++;
      kills += m.kills || 0;
      deaths += m.deaths || 0;
      assists += m.assists || 0;
      totalAcs += m.acs || 0;
      totalAdr += m.adr || 0;
      firstBloods += m.firstBloods || 0;
      aces += m.aceCount || m.aces || 0;
      const hs = m.headshots || 0;
      const bs = m.bodyshots || 0;
      const ls = m.legshots || 0;
      totalHs += hs;
      totalShots += hs + bs + ls;
    });

    const losses = matchesCount - wins;
    const kd = deaths > 0 ? kills / deaths : kills;
    const avgAcs = matchesCount > 0 ? Math.round(totalAcs / matchesCount) : 0;
    const avgAdr = matchesCount > 0 ? Math.round(totalAdr / matchesCount) : 0;
    const hsPct = totalShots > 0 ? Math.round((totalHs / totalShots) * 100) : 0;

    const overallKd = stats?.kdRatio ?? 1.0;
    const overallAcs = stats?.acs ?? 200;
    const kdDelta = matchesCount > 0 ? kd - overallKd : 0;
    const acsDelta = matchesCount > 0 ? avgAcs - overallAcs : 0;

    return {
      matchesCount,
      wins,
      losses,
      kills,
      deaths,
      assists,
      kd,
      kdDelta,
      avgAcs,
      acsDelta,
      avgAdr,
      hsPct,
      firstBloods,
      aces,
    };
  }, [liveSessionActive, liveSessionStart, liveSessionInitialMatchIds, matchHistory, stats]);

  const getStatDelta = (key: string) => {
    if (!liveSessionActive) return undefined;
    if (!sessionDeltas || sessionDeltas.matchesCount === 0) {
      return { text: "0", neutral: true };
    }
    switch (key) {
      case "kills":
        return { text: `+${sessionDeltas.kills}`, positive: true };
      case "deaths":
        return { text: `+${sessionDeltas.deaths}`, neutral: true };
      case "assists":
        return { text: `+${sessionDeltas.assists}`, positive: true };
      case "kd": {
        const diff = sessionDeltas.kdDelta;
        return {
          text: `${diff >= 0 ? "+" : ""}${diff.toFixed(2)}`,
          positive: diff >= 0,
        };
      }
      case "adr":
        return {
          text: `+${sessionDeltas.avgAdr}`,
          positive: sessionDeltas.avgAdr >= 130,
        };
      case "hs":
        return {
          text: `${sessionDeltas.hsPct}%`,
          positive: sessionDeltas.hsPct >= 20,
        };
      case "wr":
        return {
          text: `${sessionDeltas.wins}V-${sessionDeltas.losses}D`,
          positive: sessionDeltas.wins >= sessionDeltas.losses,
        };
      case "acs": {
        const diff = sessionDeltas.acsDelta;
        return {
          text: `${diff >= 0 ? "+" : ""}${diff}`,
          positive: diff >= 0,
        };
      }
      case "fb":
        return { text: `+${sessionDeltas.firstBloods}`, positive: true };
      case "ace":
        return { text: `+${sessionDeltas.aces}`, positive: true };
      case "wins":
        return { text: `+${sessionDeltas.wins}`, positive: true };
      case "matches":
        return { text: `+${sessionDeltas.matchesCount}`, neutral: true };
      default:
        return undefined;
    }
  };

  // Render individual widget content
  const renderItemContent = (id: string) => {
    if (id === "chart" || id.startsWith("chart_")) {
      const foundCfg = chartsConfig.find((c) => c.id === id);
      const cfg = foundCfg || {
        id,
        title: id === "chart" ? "Progression" : `Progression ${id.replace("chart_", "").toUpperCase()}`,
        metrics: id === "chart" ? (["kd", "acs", "hs", "spi"] as MetricType[]) : ([(id.replace("chart_", "") as MetricType) || "spi"]),
      };
      const otherCharts = chartsConfig
        .filter((c) => c.id !== id)
        .map((c) => ({ id: c.id, label: c.title }));

      // Si c'est le graphique principal et qu'aucun autre graphique n'existe, garantir la présence de SPI
      const effectiveMetrics = (id === "chart" && otherCharts.length === 0 && !cfg.metrics.includes("spi"))
        ? [...cfg.metrics, "spi" as MetricType]
        : cfg.metrics;

      return (
        <PerformanceCharts
          key={id}
          chartId={id}
          title={cfg.title}
          matchHistory={matchHistory}
          allowedMetrics={effectiveMetrics}
          canDetach={effectiveMetrics.length > 1}
          onDetachMetric={(m) => handleDetachMetric(id, m)}
          isDetached={id !== "chart"}
          availableTargetCharts={otherCharts}
          onAttachMetric={(m, targetId) => handleAttachMetric(id, m, targetId)}
          isEditing={isEditing}
        />
      );
    }

    switch (id) {
      case "performanceScore":
        if (!performanceScoreResult) {
          return (
            <div className="w-full h-full p-4 rounded-2xl glass-panel border border-white/10 flex flex-col justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-secondary)]">
                Score SPI
              </span>
              <span className="text-xs text-[var(--color-text-secondary)]">Chargement du score...</span>
            </div>
          );
        }
        return (
          <PerformanceScoreCard
            result={performanceScoreResult}
            onClickDetail={onOpenPerformanceModal}
            isOwner={canEdit}
            isPublic={!hiddenStatsByPrivacy?.includes("performanceScore")}
          />
        );
      case "coach":
        return (
          <AiCoachWidget
            matches={matchHistory}
            agentStats={agentStats}
            stats={stats}
            playerName={playerName}
            onOpenModal={onOpenCoachModal || (() => {})}
          />
        );
      case "weapons":
        return <WeaponHitmap matchHistory={matchHistory} stats={stats} />;
      case "kills":
        return <StatCard label="Éliminations" value={stats?.kills ?? 0} smartRating={smartRating} sessionDelta={getStatDelta("kills")} />;
      case "deaths":
        return <StatCard label="Morts" value={stats?.deaths ?? 0} smartRating={smartRating} sessionDelta={getStatDelta("deaths")} />;
      case "assists":
        return <StatCard label="Passes décisives" value={stats?.assists ?? 0} smartRating={smartRating} sessionDelta={getStatDelta("assists")} />;
      case "kd":
        return (
          <StatCard
            label="Ratio K/D"
            value={(stats?.kdRatio ?? 0).toFixed(2)}
            highlight
            warning={warnings?.kd}
            smartRating={smartRating}
            sessionDelta={getStatDelta("kd")}
          />
        );
      case "adr":
        return <StatCard label="Dégâts/Tour (ADR)" value={stats?.adr ?? 0} highlight smartRating={smartRating} sessionDelta={getStatDelta("adr")} />;
      case "hs":
        return (
          <StatCard
            label="Headshot %"
            value={stats?.headshotPct ?? 0}
            suffix="%"
            warning={warnings?.hs}
            smartRating={smartRating}
            sessionDelta={getStatDelta("hs")}
          />
        );
      case "wr":
        return (
          <StatCard
            label="Win Rate"
            value={stats?.winRate ?? 0}
            suffix="%"
            warning={warnings?.wr}
            smartRating={smartRating}
            sessionDelta={getStatDelta("wr")}
          />
        );
      case "acs":
        return (
          <StatCard
            label="ACS Moyen"
            value={stats?.acs ?? 0}
            highlight
            warning={warnings?.acs}
            smartRating={smartRating}
            sessionDelta={getStatDelta("acs")}
          />
        );
      case "fb":
        return <StatCard label="Premiers sangs" value={stats?.firstBloods ?? 0} smartRating={smartRating} sessionDelta={getStatDelta("fb")} />;
      case "ace":
        return <StatCard label="ACE" value={stats?.aceCount ?? 0} smartRating={smartRating} sessionDelta={getStatDelta("ace")} />;
      case "kast":
        return (
          <StatCard
            label="KAST"
            value={stats?.kast ?? 0}
            suffix="%"
            sub={stats?.kastPercentile}
            warning={warnings?.kast}
            smartRating={smartRating}
          />
        );
      case "dd":
        return (
          <StatCard
            label="DDΔ / Round"
            value={stats?.ddDelta > 0 ? `+${stats?.ddDelta}` : stats?.ddDelta ?? 0}
            warning={warnings?.dd}
            smartRating={smartRating}
          />
        );
      case "wins":
        return (
          <StatCard
            label="Victoires"
            value={Math.round(((stats?.winRate ?? 0) / 100) * (stats?.matchesPlayed ?? 0))}
            smartRating={smartRating}
            sessionDelta={getStatDelta("wins")}
          />
        );
      case "matches":
        return <StatCard label="Parties" value={stats?.matchesPlayed ?? 0} smartRating={smartRating} sessionDelta={getStatDelta("matches")} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full flex flex-col relative select-none">
      {/* Top Header / Mode Edition Bar */}
      {canEdit && (
        <div className="w-full flex items-center justify-between gap-3 mb-4 pb-2 border-b border-[var(--color-border)]/60 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            {isEditing ? (
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-[var(--color-surface)]/80 border border-[var(--color-val-red)]/40 px-3 py-1.5 rounded-xl backdrop-blur-md">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-val-red)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-val-red)]"></span>
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider text-[var(--color-val-red)]">
                    Mode Grille • 29 Colonnes
                  </span>
                  <span className="text-[10px] text-[var(--color-text-secondary)] opacity-60 font-mono">
                    ({Math.round(cellSize)}px/case)
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  Tableau de Bord
                </span>
                {/* Bouton Mode Session Direct */}
                <button
                  type="button"
                  onMouseEnter={() => sounds.playHover()}
                  onClick={handleToggleLiveSession}
                  title={
                    liveSessionActive
                      ? "Arrêter la session en direct"
                      : "Activer le mode session en direct pour voir vos gains (+kills, etc.) en direct"
                  }
                  className={`px-2.5 sm:px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md select-none ${
                    liveSessionActive
                      ? "bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                      : "glass-pill hover:bg-amber-500/20 border-white/20 hover:border-amber-400/60 text-white/80 hover:text-white"
                  }`}
                >
                  {liveSessionActive ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                      <span>Session Direct ({formatElapsed(liveSessionElapsed)}) • Arrêter</span>
                    </>
                  ) : (
                    <>
                      <IconFlame size={13} className="text-amber-400" />
                      <span>Mode Session Direct</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Edit / Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {isEditing ? (
              <>
                {hiddenDrawerItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setDrawerOpen(!drawerOpen);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 cursor-pointer ${
                      drawerOpen
                        ? "bg-[var(--color-val-red)] border-[var(--color-val-red)] text-white shadow-md"
                        : "bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border-[var(--color-border)] text-[var(--color-text-primary)]"
                    }`}
                  >
                    <IconAppGrid size={14} />
                    <span>Tiroir</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-black">
                      {hiddenDrawerItems.length}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleResetLayout}
                  className="px-3 py-1.5 bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                  title="Réinitialiser l'agencement d'origine"
                >
                  Réinitialiser
                </button>

                {/* Bouton Annuler */}
                <button
                  type="button"
                  onClick={handleCancelEditing}
                  className="px-3.5 py-1.5 bg-neutral-800/90 hover:bg-neutral-700 border border-white/10 hover:border-white/20 text-neutral-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Annuler les modifications et rétablir la disposition d'origine"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  <span>Annuler</span>
                </button>

                {/* Bouton Confirmer */}
                <button
                  type="button"
                  onClick={handleConfirmEditing}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-lg ${
                    hasUnsavedChanges
                      ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/30 font-black ring-2 ring-emerald-300/60 animate-pulse"
                      : "bg-[var(--color-val-red)] hover:bg-[#ff5865] text-white shadow-[0_0_15px_rgba(255,70,85,0.4)]"
                  }`}
                  title="Confirmer et enregistrer définitivement la disposition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Confirmer</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleStartEditing}
                className="hidden md:flex px-3 py-1.5 bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] hover:border-[var(--color-val-red)]/50 text-[var(--color-text-primary)] hover:text-[var(--color-val-red)] rounded-xl text-xs font-bold uppercase tracking-wider transition-all items-center gap-1.5 cursor-pointer shadow-sm group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="group-hover:rotate-45 transition-transform"
                >
                  <rect width="7" height="7" x="3" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="14" rx="1" />
                  <rect width="7" height="7" x="3" y="14" rx="1" />
                </svg>
                <span>Personnaliser la grille</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Save Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-20 right-6 z-50 bg-[#121824] border border-emerald-500/50 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-4 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Agencement enregistré !</span>
        </div>
      )}

      {/* Live Resize Tooltip Hint */}
      {resizeHint && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#0f1923] border border-[var(--color-val-red)] text-white px-4 py-2 rounded-full shadow-2xl text-xs font-black uppercase tracking-wider animate-pulse flex items-center gap-1.5">
          <IconSettings size={13} className="text-[var(--color-val-red)]" />
          <span>{resizeHint}</span>
        </div>
      )}

      {/* Main Grid Container with exact padding boundary */}
      <div
        ref={gridContainerRef}
        onDragOver={(e) => {
          if (isEditing) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
          }
        }}
        onDrop={(e) => {
          if (!isEditing) return;
          try {
            const raw = e.dataTransfer.getData("application/spycam-metric");
            if (!raw) return;
            const data = JSON.parse(raw);
            if (data.chartId && data.metric) {
              sounds.playLockIn();
              handleDetachMetric(data.chartId, data.metric);
            }
          } catch {}
        }}
        className={`w-full transition-all duration-300 relative ${
          isEditing ? "p-3 sm:p-4 rounded-3xl border-2 border-dashed border-[var(--color-val-red)]/40 bg-black/25" : ""
        }`}
      >
        {/* Mobile helper notice during edit mode */}
        {isEditing && isMobile && (
          <div className="mb-3 px-3 py-2 bg-[var(--color-surface)]/90 border border-[var(--color-val-red)]/30 rounded-xl flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-val-red)] shrink-0"></span>
            <span>
              Faites défiler horizontalement pour accéder à toutes les cases et déplacer vos blocs.
            </span>
          </div>
        )}

        {!isEditing ? (
          // Normal Mode:
          // 1. Mobile (< 768px): clean responsive 2-col stack
          // 2. Desktop (>= 768px): 29-col custom precision grid
          isMobile ? (
            <div className="w-full grid grid-cols-2 gap-2.5">
              {sortedActiveItems.map((item) => {
                const isChart = item.id === "chart" || item.id.startsWith("chart_");
                const isWeapons = item.id === "weapons";
                const isFull = isChart || isWeapons;

                return (
                  <div
                    key={item.id}
                    className={`${
                      isFull ? "col-span-2" : "col-span-1"
                    } ${
                      isChart
                        ? "h-[250px] min-h-[250px]"
                        : isWeapons
                        ? "min-h-[290px]"
                        : "h-24 min-h-[96px]"
                    } min-w-0 flex flex-col overflow-hidden`}
                  >
                    <div className="w-full h-full flex-1 flex flex-col min-h-0 overflow-hidden">
                      {renderItemContent(item.id)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
                gridAutoRows: `${cellSize}px`,
                gap: `${GRID_GAP}px`,
              }}
              className="w-full"
            >
              {activeItems.map((item) => {
                const actualColSpan = Math.min(item.colSpan, gridCols);
                return (
                  <div
                    key={item.id}
                    style={{
                      gridColumn: `${item.x + 1} / span ${actualColSpan}`,
                      gridRow: `${item.y + 1} / span ${item.rowSpan}`,
                    }}
                    className="flex flex-col min-h-0 overflow-hidden"
                  >
                    <div className="w-full h-full flex-1 flex flex-col min-h-0 overflow-hidden">
                      {renderItemContent(item.id)}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          // Edit Mode: scrollable horizontal container on small screens with touch & mouse dragging
          <div className="w-full overflow-x-auto pb-4">
            <div
              style={{
                position: "relative",
                width: `${editCanvasWidth}px`,
                minWidth: `${editCanvasWidth}px`,
                height: `${gridPixelHeight}px`,
              }}
            >
              {/* SVG dots matrix: GPU-accelerated pattern (zero lag) */}
              <svg
                width={editCanvasWidth}
                height={gridPixelHeight}
                className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
              >
                <defs>
                  <pattern
                    id="spycam-grid-dots"
                    width={step}
                    height={step}
                    patternUnits="userSpaceOnUse"
                  >
                    <circle cx="2" cy="2" r="1.6" fill="rgba(255, 70, 85, 0.45)" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#spycam-grid-dots)" />
              </svg>

              {/* Snapped Ghost Placeholder while dragging */}
              {draggingItem && (
                <div
                  style={{
                    position: "absolute",
                    left: `${draggingItem.targetX * step}px`,
                    top: `${draggingItem.targetY * step}px`,
                    width: `${(layout.find((i) => i.id === draggingItem.id)?.colSpan || 1) * cellSize + ((layout.find((i) => i.id === draggingItem.id)?.colSpan || 1) - 1) * GRID_GAP}px`,
                    height: `${(layout.find((i) => i.id === draggingItem.id)?.rowSpan || 1) * cellSize + ((layout.find((i) => i.id === draggingItem.id)?.rowSpan || 1) - 1) * GRID_GAP}px`,
                  }}
                  className="rounded-2xl border-2 border-dashed border-[var(--color-val-red)]/70 bg-[var(--color-val-red)]/10 z-10 pointer-events-none transition-all duration-100 ease-out"
                />
              )}

              {/* Active Draggable Widgets */}
              {activeItems.map((item) => {
                const isBeingDragged = draggingItem?.id === item.id;
                const isResizing = resizingItemId === item.id;
                const actualColSpan = Math.min(item.colSpan, gridCols);
                const left = item.x * step;
                const top = item.y * step;
                const w = actualColSpan * cellSize + (actualColSpan - 1) * GRID_GAP;
                const h = item.rowSpan * cellSize + (item.rowSpan - 1) * GRID_GAP;

                const isChart = item.id === "chart" || item.id.startsWith("chart_");
                const transform = isBeingDragged
                  ? `translate3d(${draggingItem.deltaX}px, ${draggingItem.deltaY}px, 0)`
                  : "none";

                return (
                  <div
                    key={item.id}
                    onMouseDown={(e) => handleCardMouseDown(e, item)}
                    onTouchStart={(e) => handleCardTouchStart(e, item)}
                    style={{
                      position: "absolute",
                      left: `${left}px`,
                      top: `${top}px`,
                      width: `${w}px`,
                      height: `${h}px`,
                      transform,
                      zIndex: isBeingDragged ? 50 : isResizing ? 40 : 20,
                      transition: isBeingDragged ? "none" : "left 0.2s ease, top 0.2s ease, width 0.15s ease, height 0.15s ease",
                    }}
                    className={`group/item select-none flex flex-col min-h-0 overflow-hidden ${
                      isBeingDragged
                        ? "opacity-90 scale-105 shadow-[0_15px_35px_rgba(0,0,0,0.8)] ring-2 ring-[var(--color-val-red)] rounded-2xl cursor-grabbing"
                        : isResizing
                        ? "ring-2 ring-[var(--color-val-red)] shadow-[0_0_20px_rgba(255,70,85,0.4)] rounded-2xl"
                        : "cursor-grab hover:shadow-xl"
                    }`}
                  >
                    <div className={`w-full h-full flex-1 flex flex-col min-h-0 overflow-hidden ${isChart ? "pointer-events-auto" : "pointer-events-none"}`}>
                      {renderItemContent(item.id)}
                    </div>

                    {/* Size & Coordinates Indicator */}
                    <div className="absolute top-2 left-2 z-20 opacity-0 group-hover/item:opacity-100 transition-opacity bg-black/85 backdrop-blur-md rounded-lg px-2 py-0.5 flex items-center gap-1 border border-white/15 select-none pointer-events-none shadow-md">
                      <span className="text-[10px] text-[var(--color-val-red)]">⋮⋮</span>
                      <span className="text-[9px] font-black uppercase tracking-wider text-white">
                        {actualColSpan}×{item.rowSpan}
                      </span>
                    </div>

                    {/* Red "-" Remove Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVisibility(item.id, false);
                      }}
                      onTouchStart={(e) => e.stopPropagation()}
                      title="Retirer"
                      className="absolute -top-2.5 -right-2.5 z-30 w-7 h-7 rounded-full bg-red-600 hover:bg-red-500 text-white font-black text-base flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.8)] border-2 border-[#0a0e13] transition-transform hover:scale-115 cursor-pointer opacity-85 sm:opacity-0 group-hover/item:opacity-100"
                    >
                      −
                    </button>

                    {/* Right resize handle */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, item.id, actualColSpan, item.rowSpan, "horizontal")}
                      onTouchStart={(e) => handleResizeTouchStart(e, item.id, actualColSpan, item.rowSpan, "horizontal")}
                      className="resize-handle absolute -right-2.5 top-1/2 -translate-y-1/2 z-30 w-4 h-12 bg-[#0f1923]/95 hover:bg-[var(--color-val-red)] border border-white/30 hover:border-white rounded-full flex items-center justify-center cursor-ew-resize shadow-lg transition-all hover:scale-110 opacity-75 sm:opacity-0 group-hover/item:opacity-100 group/handle"
                    >
                      <div className="w-1 h-6 bg-white/70 rounded-full group-hover/handle:bg-white"></div>
                    </div>

                    {/* Bottom resize handle */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, item.id, actualColSpan, item.rowSpan, "vertical")}
                      onTouchStart={(e) => handleResizeTouchStart(e, item.id, actualColSpan, item.rowSpan, "vertical")}
                      className="resize-handle absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-30 h-4 w-12 bg-[#0f1923]/95 hover:bg-[var(--color-val-red)] border border-white/30 hover:border-white rounded-full flex items-center justify-center cursor-ns-resize shadow-lg transition-all hover:scale-110 opacity-75 sm:opacity-0 group-hover/item:opacity-100 group/handle"
                    >
                      <div className="h-1 w-6 bg-white/70 rounded-full group-hover/handle:bg-white"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Drawer for Hidden Widgets */}
      {isEditing && hiddenDrawerItems.length > 0 && (
        <div
          className={`w-full mt-4 p-4 sm:p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-xl shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
            drawerOpen ? "block" : "hidden"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black uppercase tracking-wider text-[var(--color-text-primary)]">
                Widgets Retirés ({hiddenDrawerItems.length})
              </span>
              <span className="text-xs text-[var(--color-text-secondary)]">
                — Cliquez sur &quot;+&quot; pour remettre dans la grille
              </span>
            </div>
            <button
              type="button"
              onClick={handleRestoreAll}
              className="text-xs font-bold text-[var(--color-val-red)] hover:underline cursor-pointer"
            >
              Tout réafficher
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {hiddenDrawerItems.map((hiddenItem) => {
              const meta =
                ITEM_LABELS[hiddenItem.id] ||
                (hiddenItem.id.startsWith("chart_")
                  ? {
                      label: `Graphique ${hiddenItem.id.replace("chart_", "").toUpperCase()}`,
                      desc: "Graphique de progression détaché",
                    }
                  : { label: hiddenItem.id, desc: "" });
              const iconEl = ITEM_ICONS[hiddenItem.id] || <IconChart size={14} />;
              return (
                <div
                  key={hiddenItem.id}
                  className="glass-panel p-3 rounded-xl border border-[var(--color-border)] hover:border-emerald-500/50 transition-all flex items-center justify-between gap-2 group bg-black/40 hover:bg-emerald-500/5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[var(--color-text-secondary)]">{iconEl}</span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-[var(--color-text-primary)] truncate">{meta.label}</span>
                      <span className="text-[9px] text-[var(--color-text-secondary)] opacity-70 truncate">{meta.desc}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleVisibility(hiddenItem.id, true)}
                    title="Remettre dans la grille"
                    className="w-6 h-6 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-md transition-transform hover:scale-110 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
