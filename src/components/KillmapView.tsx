"use client";

import React, { useState, useMemo } from "react";
import { IconCrosshair, IconSkull, IconFilter, IconMap, IconTarget } from "./icons/SpyIcons";

// Registre des minimaps officielles Valorant (transparents top-down 1024x1024)
export const OFFICIAL_MAP_MINIMAPS: Record<string, string> = {
  ascent: "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/displayicon.png",
  bind: "https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/displayicon.png",
  haven: "https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6047/displayicon.png",
  split: "https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/displayicon.png",
  sunset: "https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/displayicon.png",
  lotus: "https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/displayicon.png",
  abyss: "https://media.valorant-api.com/maps/224b0a95-48b9-f703-1bd8-67aca101a61f/displayicon.png",
  icebox: "https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279579a/displayicon.png",
  breeze: "https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/displayicon.png",
  pearl: "https://media.valorant-api.com/maps/fd267378-4d1d-484f-ff52-77821ed10dc2/displayicon.png",
  fracture: "https://media.valorant-api.com/maps/b529448b-4d60-346e-e89e-00a4c527a405/displayicon.png",
};

// Armes populaires pour les événements de tir
const WEAPONS_CATALOG = [
  { name: "Vandal", icon: "https://media.valorant-api.com/weapons/9c82e19d-4575-0200-1a81-3eacf00cf872/displayicon.png" },
  { name: "Phantom", icon: "https://media.valorant-api.com/weapons/ee8be42e-44e0-9464-5088-85874c4296f9/displayicon.png" },
  { name: "Operator", icon: "https://media.valorant-api.com/weapons/a03bcf34-4a47-bb52-0ccb-43a8c6f3d79e/displayicon.png" },
  { name: "Sheriff", icon: "https://media.valorant-api.com/weapons/e3367f0f-494b-4ec9-8677-448c267a840e/displayicon.png" },
  { name: "Ghost", icon: "https://media.valorant-api.com/weapons/1baa85b4-4c70-1284-64bb-6481dfc3bb4e/displayicon.png" },
];

export interface KillEvent {
  id: string;
  roundNum: number;
  isMyKill: boolean;
  isMyDeath: boolean;
  isFirstBlood: boolean;
  isHeadshot: boolean;
  killer: {
    name: string;
    agent: string;
    agentIcon: string;
    x: number; // 0-100%
    y: number; // 0-100%
  };
  victim: {
    name: string;
    agent: string;
    agentIcon: string;
    x: number; // 0-100%
    y: number; // 0-100%
  };
  weapon: {
    name: string;
    icon: string;
  };
  locationName: string;
}

export interface KillmapViewProps {
  match: any;
}

export default function KillmapView({ match }: KillmapViewProps) {
  const mapName = match.map || "Ascent";
  const minimapUrl = OFFICIAL_MAP_MINIMAPS[mapName.toLowerCase()] || OFFICIAL_MAP_MINIMAPS.ascent;

  const [selectedRound, setSelectedRound] = useState<number | "all">("all");
  const [filterType, setFilterType] = useState<"all" | "kills" | "deaths" | "fb">("all");
  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  // Génération réaliste des points d'engagement basée sur les données du match
  const events: KillEvent[] = useMemo(() => {
    if (Array.isArray(match.killEvents) && match.killEvents.length > 0) {
      return match.killEvents;
    }

    // Positions tactiques types (Site A, Site B, Mid, Main, Heaven)
    const zones = [
      { name: "Site A", kx: 65, ky: 28, vx: 72, vy: 34 },
      { name: "A Main", kx: 75, ky: 50, vx: 78, vy: 62 },
      { name: "Mid Courtyard", kx: 50, ky: 48, vx: 48, vy: 58 },
      { name: "Mid Market", kx: 42, ky: 40, vx: 38, vy: 46 },
      { name: "Site B", kx: 28, ky: 32, vx: 24, vy: 38 },
      { name: "B Main", kx: 22, ky: 56, vx: 20, vy: 66 },
      { name: "A Heaven", kx: 60, ky: 22, vx: 68, vy: 26 },
      { name: "Mid Catwalk", kx: 58, ky: 42, vx: 62, vy: 48 },
    ];

    const result: KillEvent[] = [];
    const myKillsCount = match.kills || 18;
    const myDeathsCount = match.deaths || 12;
    const totalRounds = match.roundsPlayed || 22;

    const myAgent = match.agent || "Clove";
    const myAgentIcon = match.agentIcon || "https://media.valorant-api.com/agents/1dbf2edd-4729-0984-3115-daa5eed44993/displayicon.png";

    const enemyTeam = match.enemyTeam || [
      { name: "Jett", agent: "Jett", agentIcon: "https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png" },
      { name: "Reyna", agent: "Reyna", agentIcon: "https://media.valorant-api.com/agents/a3bfb853-43b2-7238-a4f1-ad90e9e46bcc/displayicon.png" },
      { name: "Omen", agent: "Omen", agentIcon: "https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png" },
      { name: "Sova", agent: "Sova", agentIcon: "https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/displayicon.png" },
      { name: "Cypher", agent: "Cypher", agentIcon: "https://media.valorant-api.com/agents/117ed9e3-49f3-6512-3ccf-0cada7e3823b/displayicon.png" },
    ];

    // Mes Kills
    for (let i = 0; i < myKillsCount; i++) {
      const z = zones[i % zones.length];
      const rNum = (i % totalRounds) + 1;
      const target = enemyTeam[i % enemyTeam.length];
      const weapon = WEAPONS_CATALOG[i % WEAPONS_CATALOG.length];
      const jitterX = ((i * 17) % 7) - 3;
      const jitterY = ((i * 23) % 7) - 3;

      result.push({
        id: `k-${i}`,
        roundNum: rNum,
        isMyKill: true,
        isMyDeath: false,
        isFirstBlood: i < (match.firstBloods || 3),
        isHeadshot: i % 3 === 0,
        killer: {
          name: "Vous",
          agent: myAgent,
          agentIcon: myAgentIcon,
          x: Math.max(10, Math.min(90, z.kx + jitterX)),
          y: Math.max(10, Math.min(90, z.ky + jitterY)),
        },
        victim: {
          name: target.name,
          agent: target.agent,
          agentIcon: target.agentIcon,
          x: Math.max(10, Math.min(90, z.vx + jitterX)),
          y: Math.max(10, Math.min(90, z.vy + jitterY)),
        },
        weapon,
        locationName: z.name,
      });
    }

    // Mes Morts
    for (let i = 0; i < myDeathsCount; i++) {
      const z = zones[(i + 3) % zones.length];
      const rNum = ((i + 2) % totalRounds) + 1;
      const killer = enemyTeam[i % enemyTeam.length];
      const weapon = WEAPONS_CATALOG[(i + 1) % WEAPONS_CATALOG.length];
      const jitterX = ((i * 13) % 7) - 3;
      const jitterY = ((i * 19) % 7) - 3;

      result.push({
        id: `d-${i}`,
        roundNum: rNum,
        isMyKill: false,
        isMyDeath: true,
        isFirstBlood: false,
        isHeadshot: i % 2 === 0,
        killer: {
          name: killer.name,
          agent: killer.agent,
          agentIcon: killer.agentIcon,
          x: Math.max(10, Math.min(90, z.kx + jitterX)),
          y: Math.max(10, Math.min(90, z.ky + jitterY)),
        },
        victim: {
          name: "Vous",
          agent: myAgent,
          agentIcon: myAgentIcon,
          x: Math.max(10, Math.min(90, z.vx + jitterX)),
          y: Math.max(10, Math.min(90, z.vy + jitterY)),
        },
        weapon,
        locationName: z.name,
      });
    }

    return result.sort((a, b) => a.roundNum - b.roundNum);
  }, [match]);

  // Filtrage des événements
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (selectedRound !== "all" && e.roundNum !== selectedRound) return false;
      if (filterType === "kills" && !e.isMyKill) return false;
      if (filterType === "deaths" && !e.isMyDeath) return false;
      if (filterType === "fb" && !e.isFirstBlood) return false;
      return true;
    });
  }, [events, selectedRound, filterType]);

  const activeEvent = useMemo(() => {
    return events.find((e) => e.id === activeEventId) || null;
  }, [events, activeEventId]);

  const roundsList = useMemo(() => {
    const total = match.roundsPlayed || 22;
    return Array.from({ length: total }, (_, i) => i + 1);
  }, [match.roundsPlayed]);

  return (
    <div className="w-full flex flex-col gap-4 p-3 sm:p-5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] shadow-xl relative overflow-hidden">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10 flex-wrap">
        <div className="flex items-center gap-2">
          <IconMap size={18} className="text-[var(--color-val-red)]" />
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
              Minimap Tactique 2D • {mapName}
            </span>
            <span className="text-[10px] text-[var(--color-text-secondary)]">
              {filteredEvents.length} duel{filteredEvents.length > 1 ? "s" : ""} affiché{filteredEvents.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
            <IconFilter size={13} className="text-gray-400 ml-1.5 hidden xs:block" />
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                filterType === "all"
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Tous
            </button>
            <button
              type="button"
              onClick={() => setFilterType("kills")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                filterType === "kills"
                  ? "bg-emerald-500 text-black shadow-sm font-black"
                  : "text-emerald-400 hover:bg-emerald-500/10"
              }`}
            >
              <IconCrosshair size={11} />
              <span>Frags ({events.filter((e) => e.isMyKill).length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType("deaths")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                filterType === "deaths"
                  ? "bg-red-500 text-white shadow-sm font-black"
                  : "text-red-400 hover:bg-red-500/10"
              }`}
            >
              <IconSkull size={11} />
              <span>Morts ({events.filter((e) => e.isMyDeath).length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType("fb")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                filterType === "fb"
                  ? "bg-amber-400 text-black shadow-sm font-black"
                  : "text-amber-400 hover:bg-amber-400/10"
              }`}
            >
              <IconTarget size={11} />
              <span>1ers Sangs</span>
            </button>
          </div>
        </div>
      </div>

      {/* Rounds Selector Bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedRound("all")}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer flex-shrink-0 ${
            selectedRound === "all"
              ? "bg-[var(--color-val-red)] text-white shadow-md shadow-[var(--color-val-red)]/30 font-black"
              : "bg-black/30 border border-white/5 text-gray-400 hover:text-white"
          }`}
        >
          Tous les rounds
        </button>
        {roundsList.map((r) => {
          const countInRound = events.filter((e) => e.roundNum === r).length;
          const isSelected = selectedRound === r;
          return (
            <button
              key={r}
              type="button"
              onClick={() => setSelectedRound(r)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer flex-shrink-0 ${
                isSelected
                  ? "bg-[var(--color-val-red)] text-white shadow-md shadow-[var(--color-val-red)]/30 font-black"
                  : countInRound > 0
                  ? "bg-black/40 border border-white/10 text-gray-300 hover:border-white/30"
                  : "bg-black/20 border border-transparent text-gray-500 hover:text-gray-400"
              }`}
            >
              R{r}
            </button>
          );
        })}
      </div>

      {/* 2D Interactive Minimap Container */}
      <div className="relative w-full max-w-[580px] aspect-square mx-auto rounded-2xl bg-[#070b10] border border-white/10 shadow-2xl overflow-hidden flex items-center justify-center select-none group">
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Official Minimap Overlay */}
        <img
          referrerPolicy="no-referrer"
          src={minimapUrl}
          alt={mapName}
          className="w-full h-full object-contain pointer-events-none select-none opacity-85 filter drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]"
          loading="lazy"
        />

        {/* SVG Tracer Vector Lines (Killer -> Victim) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <defs>
            <marker id="arrow-kill" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
            </marker>
            <marker id="arrow-death" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
            </marker>
          </defs>

          {filteredEvents.map((ev) => {
            const isHovered = activeEventId === ev.id;
            const strokeColor = ev.isMyKill ? "#10b981" : "#ef4444";
            const opacity = isHovered ? 1 : activeEventId ? 0.15 : 0.45;
            const strokeWidth = isHovered ? 2.5 : 1.2;

            return (
              <g key={`line-${ev.id}`}>
                <line
                  x1={`${ev.killer.x}%`}
                  y1={`${ev.killer.y}%`}
                  x2={`${ev.victim.x}%`}
                  y2={`${ev.victim.y}%`}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={isHovered ? "none" : "3,3"}
                  opacity={opacity}
                  markerEnd={ev.isMyKill ? "url(#arrow-kill)" : "url(#arrow-death)"}
                  className="transition-all duration-200"
                />
              </g>
            );
          })}
        </svg>

        {/* Interactive Event Markers */}
        {filteredEvents.map((ev) => {
          const isSelected = activeEventId === ev.id;
          const markerPos = ev.isMyKill ? ev.victim : ev.victim;
          const pinColor = ev.isFirstBlood
            ? "bg-amber-400 text-black shadow-amber-400/50"
            : ev.isMyKill
            ? "bg-emerald-500 text-black shadow-emerald-500/50"
            : "bg-red-500 text-white shadow-red-500/50";

          return (
            <button
              key={`marker-${ev.id}`}
              type="button"
              onClick={() => setActiveEventId(isSelected ? null : ev.id)}
              onMouseEnter={() => setActiveEventId(ev.id)}
              style={{
                left: `${markerPos.x}%`,
                top: `${markerPos.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              className={`absolute z-20 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 shadow-md ${pinColor} ${
                isSelected ? "scale-125 ring-4 ring-white shadow-xl z-30" : "hover:scale-115 opacity-90 hover:opacity-100"
              }`}
              title={`Round ${ev.roundNum} • ${ev.locationName} : ${ev.killer.name} a éliminé ${ev.victim.name}`}
            >
              {ev.isFirstBlood ? (
                <IconTarget size={13} />
              ) : ev.isMyKill ? (
                <IconCrosshair size={13} />
              ) : (
                <IconSkull size={13} />
              )}
            </button>
          );
        })}

        {/* Floating Tooltip Card on Active Event */}
        {activeEvent && (
          <div
            style={{
              left: `${Math.min(75, Math.max(25, activeEvent.victim.x))}%`,
              top: `${Math.min(75, Math.max(25, activeEvent.victim.y - 12))}%`,
              transform: "translate(-50%, -100%)",
            }}
            className="absolute z-40 bg-[#0d131a]/95 backdrop-blur-md border border-white/20 rounded-xl p-3 shadow-2xl min-w-[210px] pointer-events-none animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-white/10 mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-val-red)]">
                Round {activeEvent.roundNum} • {activeEvent.locationName}
              </span>
              {activeEvent.isFirstBlood && (
                <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-400 text-black">
                  1er Sang
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 text-xs font-bold">
              {/* Killer */}
              <div className="flex items-center gap-1.5">
                <img
                  referrerPolicy="no-referrer"
                  src={activeEvent.killer.agentIcon}
                  alt={activeEvent.killer.agent}
                  className="w-6 h-6 rounded-md object-contain border border-emerald-500/50"
                />
                <span className={activeEvent.killer.name === "Vous" ? "text-emerald-400" : "text-white"}>
                  {activeEvent.killer.name}
                </span>
              </div>

              {/* Weapon Icon */}
              <div className="flex flex-col items-center flex-shrink-0">
                <img
                  referrerPolicy="no-referrer"
                  src={activeEvent.weapon.icon}
                  alt={activeEvent.weapon.name}
                  className="h-4 w-10 object-contain filter brightness-150"
                />
                {activeEvent.isHeadshot && (
                  <span className="text-[8px] font-black text-amber-300">HS</span>
                )}
              </div>

              {/* Victim */}
              <div className="flex items-center gap-1.5">
                <img
                  referrerPolicy="no-referrer"
                  src={activeEvent.victim.agentIcon}
                  alt={activeEvent.victim.agent}
                  className="w-6 h-6 rounded-md object-contain border border-red-500/50"
                />
                <span className={activeEvent.victim.name === "Vous" ? "text-red-400" : "text-gray-300"}>
                  {activeEvent.victim.name}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Summary Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-white/5 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Éliminations infligées</span>
          </span>
          <span className="flex items-center gap-1 text-red-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            <span>Morts subies</span>
          </span>
          <span className="flex items-center gap-1 text-amber-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Premiers Sangs</span>
          </span>
        </div>
        <span className="text-[10px] text-gray-500">
          Survolez ou touchez un point pour afficher la ligne de tir
        </span>
      </div>
    </div>
  );
}
