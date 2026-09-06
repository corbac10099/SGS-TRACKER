/**
 * Script execute au postinstall / prebuild sur Vercel et les environnements distants.
 * Si le composant LocalDevStatsPanel.tsx n'est pas present (car exclu par .gitignore),
 * genere un stub TypeScript minimal afin d'assurer un build 0-erreur sans inclure
 * le moindre code admin sur le depot distant.
 */
const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'src', 'components', 'LocalDevStatsPanel.tsx');

if (!fs.existsSync(targetPath)) {
  const stubContent = `// Auto-generated fallback stub for CI/production builds.
// The actual admin panel is unversioned and strictly local.
import React from 'react';
import type { AgentRole } from '@/lib/valorant/performanceScore';

export interface DevStatOverrides {
  enabled: boolean;
  kd: number;
  acs: number;
  hs: number;
  winRate: number;
  kast: number;
  adr: number;
  dd: number;
  firstBloods: number;
  firstDeaths: number;
  clutches: number;
  role: "Auto" | AgentRole;
  matchesCount: number;
}

export default function LocalDevStatsPanel(_props: any) {
  return null;
}
`;
  fs.writeFileSync(targetPath, stubContent, 'utf8');
  console.log('[Spycam Build] Generated LocalDevStatsPanel stub for remote build.');
}
