"use client";

import React from "react";
import type { DevStatOverrides } from "@/lib/devStatsTypes";

export type { DevStatOverrides };

export interface LocalDevStatsPanelProps {
  currentRole?: string;
  onOverridesChange?: (overrides: DevStatOverrides | null) => void;
  currentRiotId?: string;
  onRiotKeyChange?: (key: string | null) => void;
  isLiveRiotData?: boolean;
  playerStats?: any;
  trackerXp?: number;
  trackerLevel?: number;
  onXpDelta?: (delta: number) => void;
  onStatDelta?: (key: string, delta: number) => void;
  onSimulateMatch?: (simMatch: any) => void;
}

/**
 * Stub de production — Ne contient aucun code ni UI admin.
 * Substitué automatiquement à LocalDevStatsPanel lors des builds de production.
 */
export default function EmptyDevPanel(_props: LocalDevStatsPanelProps) {
  return null;
}
