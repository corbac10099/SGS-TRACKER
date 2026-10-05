"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  setOverlaySize,
  getOverlayPosition,
  setOverlayPosition,
  setOverlayClickThrough,
  getThemeBackgroundColor,
} from "@/lib/desktop";
import {
  IconCrosshair,
  IconSkull,
  IconHandshake,
  IconFlame,
  IconLock,
  IconShield,
  IconChevronRight,
  IconRefresh,
  IconAgents,
  IconClock,
  IconSearch,
  IconX,
  IconUsers,
} from "@/components/icons/SpyIcons";
import { BASE_AGENTS_CATALOG, AgentCatalogEntry } from "@/lib/valorant/agentsCatalog";

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface LivePlayer {
  puuid?: string;
  name: string;
  tag: string;
  team: "ally" | "enemy";
  rank: string;
  rankTier: number;
  rankIcon?: string;
  isPrivateRank?: boolean;
  agent: string;
  agentName?: string;
  agentIcon?: string;
  kills: number;
  deaths: number;
  assists: number;
  score?: number;
  spi: number;
  isMe?: boolean;
}

interface LiveMatchData {
  active: boolean;
  status: "OFFLINE" | "MENUS" | "PREGAME" | "INGAME" | "ERROR";
  stateLabel?: string;
  message?: string;
  map?: {
    id: string;
    name: string;
    displayIcon?: string;
  };
  queue?: string;
  round?: number;
  score?: {
    ally: number;
    enemy: number;
  };
  players?: LivePlayer[];
}

type OverlayTab = "match" | "agents" | "history";

// ─── Extraction de la couleur d'accentuation ────────────────────────────────

function extractThemeAccent(t: string | null | undefined): string {
  if (!t) return "#ff4655";
  if (t === "midnight") return "#8c64ff";
  if (t === "ocean") return "#32c8b4";
  if (t === "crimson" || t === "light") return "#ff4655";
  if (t.startsWith("custom:")) {
    const match = t.match(/accent=([^,]+)/);
    if (match) return match[1];
  }
  return "#ff4655";
}

// ─── Composant Principal ────────────────────────────────────────────────────

export default function OverlayPage() {
  const [data, setData] = useState<LiveMatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OverlayTab>("match");
  const [inspectedPlayer, setInspectedPlayer] = useState<LivePlayer | null>(null);
  const [isClickThrough, setIsClickThrough] = useState(false);
  const [themeName, setThemeName] = useState("dark");
  const [agentsSearch, setAgentsSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedAgentDetail, setSelectedAgentDetail] = useState<AgentCatalogEntry | null>(null);
  const [shortcutKey, setShortcutKey] = useState("F9");

  // Initialisation du thème sauvegardé sur le compte SGS
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("spycam_theme") || "dark";
      setThemeName(savedTheme);
      const savedShortcut = localStorage.getItem("sgs_overlay_shortcut") || "F9";
      setShortcutKey(savedShortcut);
    }
  }, []);

  const accentColor = useMemo(() => extractThemeAccent(themeName), [themeName]);
  const bgColor = useMemo(() => getThemeBackgroundColor(themeName), [themeName]);

  // Récupération des données du match en direct
  const fetchLiveMatch = async () => {
    try {
      const res = await fetch("/api/valorant/live-match", { cache: "no-store" });
      if (res.ok) {
        const json: LiveMatchData = await res.json();
        setData(json);
      }
    } catch {
      // Ignorer silencieusement en arrière-plan
    } finally {
      setLoading(false);
    }
  };

  // Polling adaptatif éco-ressource : 3s en jeu, 8s en attente, pause si l'overlay est masqué
  useEffect(() => {
    fetchLiveMatch();

    let timer: NodeJS.Timeout | null = null;

    const scheduleNext = () => {
      if (typeof document !== "undefined" && document.hidden) {
        timer = setTimeout(scheduleNext, 5000);
        return;
      }
      const isLive = data?.status === "INGAME" || data?.status === "PREGAME";
      const interval = isLive ? 3000 : 8000;
      timer = setTimeout(async () => {
        await fetchLiveMatch();
        scheduleNext();
      }, interval);
    };

    scheduleNext();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [data?.status]);

  // Raccourcis clavier (F10 pour clics traversants, Escape pour quitter l'inspection)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (inspectedPlayer) {
          setInspectedPlayer(null);
          return;
        }
        if (selectedAgentDetail) {
          setSelectedAgentDetail(null);
          return;
        }
        if (typeof window !== "undefined" && (window as any).__TAURI__?.core) {
          (window as any).__TAURI__.core.invoke("toggle_overlay");
        }
      }
      if (e.key === "F10") {
        e.preventDefault();
        toggleClickThrough();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inspectedPlayer, selectedAgentDetail, isClickThrough]);

  // Bascule du mode clics traversants (Click-through)
  const toggleClickThrough = async () => {
    const nextState = !isClickThrough;
    setIsClickThrough(nextState);
    await setOverlayClickThrough(nextState);
  };

  // Déplacement entièrement fluide par positionnement absolu + requestAnimationFrame
  const handleDragPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || isClickThrough) return;
    if ((e.target as HTMLElement).closest("button, a, input, [data-no-drag]")) return;

    e.preventDefault();
    const startMouseX = e.screenX;
    const startMouseY = e.screenY;

    let initWinX = window.screenX;
    let initWinY = window.screenY;

    getOverlayPosition().then((pos) => {
      if (pos && Array.isArray(pos) && pos.length === 2) {
        initWinX = pos[0];
        initWinY = pos[1];
      }
    });

    let rafId: number | null = null;
    let latestEv: PointerEvent | null = null;

    const onPointerMove = (ev: PointerEvent) => {
      latestEv = ev;
      if (rafId !== null) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (!latestEv) return;
        const dx = latestEv.screenX - startMouseX;
        const dy = latestEv.screenY - startMouseY;
        setOverlayPosition(initWinX + dx, initWinY + dy);
      });
    };

    const cleanup = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", cleanup);
      window.removeEventListener("pointercancel", cleanup);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", cleanup);
    window.addEventListener("pointercancel", cleanup);
  };

  // Redimensionnement fluide interactif
  const handleResizePointerDown = (e: React.PointerEvent) => {
    if (isClickThrough || e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    const target = e.currentTarget as HTMLElement;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {}

    const startX = e.screenX;
    const startY = e.screenY;
    const startW = window.innerWidth;
    const startH = window.innerHeight;

    const onPointerMove = (ev: PointerEvent) => {
      const dx = ev.screenX - startX;
      const dy = ev.screenY - startY;
      const targetW = Math.max(startW + dx, 380);
      const targetH = Math.max(startH + dy, 260);
      setOverlaySize(targetW, targetH);
    };

    const cleanup = (ev: PointerEvent) => {
      try {
        target.releasePointerCapture(ev.pointerId);
      } catch {}
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", cleanup);
      window.removeEventListener("pointercancel", cleanup);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", cleanup);
    window.addEventListener("pointercancel", cleanup);
  };

  const isPregame = data?.status === "PREGAME";
  const isIngame = data?.status === "INGAME";
  const isWaiting = !data?.active || data?.status === "OFFLINE" || data?.status === "MENUS";

  const allyPlayers = data?.players?.filter((p) => p.team === "ally") || [];
  const enemyPlayers = data?.players?.filter((p) => p.team === "enemy") || [];

  // Filtrage du catalogue d'agents
  const filteredAgents = useMemo(() => {
    return Object.values(BASE_AGENTS_CATALOG).filter((ag) => {
      const matchSearch = ag.name.toLowerCase().includes(agentsSearch.toLowerCase());
      const matchRole = selectedRole === "all" || ag.role.toLowerCase() === selectedRole.toLowerCase();
      return matchSearch && matchRole;
    });
  }, [agentsSearch, selectedRole]);

  return (
    <div className="w-full h-full bg-transparent p-2 font-sans select-none overflow-hidden flex flex-col justify-start">
      <div
        className="w-full h-full rounded-2xl border border-white/15 backdrop-blur-2xl shadow-2xl p-3 text-white flex flex-col gap-2 relative overflow-hidden transition-colors"
        style={{
          backgroundColor: `${bgColor}F2`, // Opacité ~95%
          boxShadow: `0 20px 50px rgba(0, 0, 0, 0.9), 0 0 20px ${accentColor}25, inset 0 1px 0 rgba(255, 255, 255, 0.12)`,
          borderColor: `${accentColor}40`,
        }}
      >
        {/* Poignée supérieure de déplacement (Draggable Handle) */}
        <div
          onPointerDown={handleDragPointerDown}
          className="w-full cursor-grab active:cursor-grabbing py-1 -mt-1 flex flex-col items-center select-none touch-none"
          title="Glisser pour déplacer l'overlay"
        >
          <div
            className="w-12 h-1 rounded-full transition-colors pointer-events-none"
            style={{ backgroundColor: `${accentColor}60` }}
          />
        </div>

        {/* ─── Barre Supérieure Compacte : Statut, Onglets & Contrôles ─── */}
        <div
          onPointerDown={handleDragPointerDown}
          className="flex items-center justify-between gap-2 pb-2 border-b border-white/10 cursor-grab active:cursor-grabbing select-none touch-none flex-shrink-0"
        >
          {/* Statut & Carte */}
          <div className="flex items-center gap-2 pointer-events-none">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isIngame ? "bg-emerald-400" : isPregame ? "bg-cyan-400" : "bg-amber-400"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isIngame ? "bg-emerald-500" : isPregame ? "bg-cyan-500" : "bg-amber-500"
                }`}
              />
            </span>
            <div className="flex items-baseline gap-1.5 leading-none">
              <span className="text-xs font-black tracking-wider uppercase">
                {data?.map?.name || "Valorant"}
              </span>
              <span className="text-[10px] text-white/50 font-medium">
                {data?.queue || (isWaiting ? "En attente" : isPregame ? "Sélection" : "Match")}
              </span>
            </div>
          </div>

          {/* Onglets épurés : Match / Agents / Historique */}
          <div
            data-no-drag
            className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10"
          >
            <button
              onClick={() => {
                setActiveTab("match");
                setInspectedPlayer(null);
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                activeTab === "match"
                  ? "text-white shadow-sm"
                  : "text-white/50 hover:text-white/80"
              }`}
              style={{
                backgroundColor: activeTab === "match" ? accentColor : "transparent",
              }}
            >
              <IconCrosshair size={12} />
              <span>Match</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("agents");
                setSelectedAgentDetail(null);
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                activeTab === "agents"
                  ? "text-white shadow-sm"
                  : "text-white/50 hover:text-white/80"
              }`}
              style={{
                backgroundColor: activeTab === "agents" ? accentColor : "transparent",
              }}
            >
              <IconAgents size={12} />
              <span>Agents</span>
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                activeTab === "history"
                  ? "text-white shadow-sm"
                  : "text-white/50 hover:text-white/80"
              }`}
              style={{
                backgroundColor: activeTab === "history" ? accentColor : "transparent",
              }}
            >
              <IconClock size={12} />
              <span>Historique</span>
            </button>
          </div>

          {/* Contrôles : Clics Traversants, Tailles & Refresh */}
          <div data-no-drag className="flex items-center gap-1">
            {/* Bouton Clics Traversants (Click-through) */}
            <button
              onClick={toggleClickThrough}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border transition-all ${
                isClickThrough
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                  : "bg-white/5 border-white/10 text-white/60 hover:text-white"
              }`}
              title={
                isClickThrough
                  ? "Mode Combat activé : Clics traversants vers Valorant (Appuyez sur F10 pour déverrouiller)"
                  : "Activer les clics traversants (F10)"
              }
            >
              {isClickThrough ? <IconLock size={11} /> : <IconShield size={11} />}
              <span>{isClickThrough ? "Verrouillé" : "Interactif"}</span>
            </button>

            {/* Bouton de rafraîchissement rapide */}
            <button
              onClick={fetchLiveMatch}
              className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-white/50 hover:text-white border border-white/10 transition-colors"
              title="Rafraîchir les données"
            >
              <IconRefresh size={12} className={loading ? "animate-spin" : ""} />
            </button>

            {/* Préréglages de taille rapides */}
            <button
              onClick={() => setOverlaySize(420, 480)}
              className="px-1.5 py-0.5 rounded text-[9px] font-mono text-white/40 hover:text-white bg-white/5 border border-white/5 hover:border-white/20 transition-all"
              title="Taille Compacte (420p)"
            >
              420p
            </button>
            <button
              onClick={() => setOverlaySize(780, 490)}
              className="px-1.5 py-0.5 rounded text-[9px] font-mono text-white/40 hover:text-white bg-white/5 border border-white/5 hover:border-white/20 transition-all"
              title="Taille Standard (780p)"
            >
              780p
            </button>
          </div>
        </div>

        {/* Bannière de notification si le mode clics traversants est actif */}
        {isClickThrough && (
          <div className="bg-amber-500/15 border border-amber-500/30 rounded-lg px-2.5 py-1 flex items-center justify-between text-[10px] text-amber-200">
            <span className="flex items-center gap-1.5">
              <IconLock size={12} className="text-amber-400" />
              <span>Mode Combat actif — Vos tirs traversent directement vers le jeu</span>
            </span>
            <kbd className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[9px] font-bold">
              F10
            </kbd>
          </div>
        )}

        {/* ─── CONTENU DYNAMIQUE SELON L'ONGLET ACTIF ─── */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* ─────────────────────────────────────────────────────────────
              ONGLET 1 : MATCH EN DIRECT
          ───────────────────────────────────────────────────────────── */}
          {activeTab === "match" && (
            <>
              {/* VUE FICHE JOUEUR (Inspecter un joueur public) */}
              {inspectedPlayer ? (
                <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setInspectedPlayer(null)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold transition-colors"
                      style={{ color: accentColor }}
                    >
                      <IconChevronRight size={12} className="rotate-180" />
                      <span>Retour au match</span>
                    </button>
                    <span className="text-[10px] text-white/40">Fiche Joueur</span>
                  </div>

                  <div
                    className="p-3 rounded-xl border border-white/10 bg-black/40 flex items-center gap-3 relative overflow-hidden"
                    style={{ borderColor: `${accentColor}30` }}
                  >
                    <img
                      src={inspectedPlayer.agentIcon || inspectedPlayer.rankIcon}
                      alt={inspectedPlayer.agentName || inspectedPlayer.name}
                      className="w-14 h-14 rounded-xl object-cover bg-black/60 border border-white/15"
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm text-white truncate">
                          {inspectedPlayer.name}
                        </span>
                        <span className="text-xs text-white/40 font-mono">
                          #{inspectedPlayer.tag}
                        </span>
                        {inspectedPlayer.isMe && (
                          <span
                            className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase text-white"
                            style={{ backgroundColor: accentColor }}
                          >
                            Vous
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {inspectedPlayer.rankIcon && (
                          <img
                            src={inspectedPlayer.rankIcon}
                            alt={inspectedPlayer.rank}
                            className="w-5 h-5 object-contain"
                          />
                        )}
                        <span className="text-xs font-bold text-white/80">
                          {inspectedPlayer.rank}
                        </span>
                        <span className="text-xs text-white/30">•</span>
                        <span className="text-xs font-medium text-white/60">
                          {inspectedPlayer.agentName || "Agent"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Statistiques en match */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-black/30 border border-white/10 rounded-xl p-2 text-center">
                      <div className="text-[10px] text-white/40 uppercase font-bold">K / D / A</div>
                      <div className="text-sm font-black text-white mt-0.5 font-mono">
                        {inspectedPlayer.kills}/{inspectedPlayer.deaths}/{inspectedPlayer.assists}
                      </div>
                    </div>
                    <div className="bg-black/30 border border-white/10 rounded-xl p-2 text-center">
                      <div className="text-[10px] text-white/40 uppercase font-bold">Ratio K/D</div>
                      <div className="text-sm font-black text-white mt-0.5 font-mono">
                        {inspectedPlayer.deaths > 0
                          ? (inspectedPlayer.kills / inspectedPlayer.deaths).toFixed(2)
                          : inspectedPlayer.kills.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-black/30 border border-white/10 rounded-xl p-2 text-center">
                      <div className="text-[10px] text-white/40 uppercase font-bold">Score ACS</div>
                      <div className="text-sm font-black text-white mt-0.5 font-mono">
                        {inspectedPlayer.score || "-"}
                      </div>
                    </div>
                    <div className="bg-black/30 border border-white/10 rounded-xl p-2 text-center">
                      <div className="text-[10px] text-white/40 uppercase font-bold">Note SPI</div>
                      <div
                        className="text-sm font-black mt-0.5 font-mono"
                        style={{ color: accentColor }}
                      >
                        {inspectedPlayer.spi || 75}
                      </div>
                    </div>
                  </div>
                </div>
              ) : isWaiting ? (
                /* ÉTAT EN ATTENTE (Radar Sobre) */
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <div className="relative flex items-center justify-center w-12 h-12 mb-2">
                    <div
                      className="absolute inset-0 rounded-full animate-ping opacity-20"
                      style={{ backgroundColor: accentColor }}
                    />
                    <div
                      className="w-10 h-10 rounded-full border flex items-center justify-center"
                      style={{
                        borderColor: `${accentColor}50`,
                        backgroundColor: `${accentColor}15`,
                      }}
                    >
                      <IconCrosshair size={18} style={{ color: accentColor }} />
                    </div>
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">
                    En attente d'une partie
                  </h3>
                  <p className="text-[11px] text-white/40 mt-1 max-w-xs">
                    Lancez un match ou une partie personnalisée sur Valorant pour afficher la composition.
                  </p>
                </div>
              ) : (
                /* TABLEAU DE MATCH : 2 COLONNES (Alliés & Ennemis) */
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 overflow-hidden min-h-0">
                  {/* Colonne Alliée */}
                  <div className="flex flex-col gap-1.5 overflow-hidden min-h-0">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Équipe Alliée ({allyPlayers.length})
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
                      {allyPlayers.map((player, idx) => (
                        <PlayerRowItem
                          key={player.puuid || idx}
                          player={player}
                          accentColor={accentColor}
                          onInspect={() => {
                            if (!player.isPrivateRank) setInspectedPlayer(player);
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Colonne Adverse */}
                  <div className="flex flex-col gap-1.5 overflow-hidden min-h-0">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        Équipe Adverse ({enemyPlayers.length})
                      </span>
                      {isPregame && (
                        <span className="text-[9px] text-white/30 font-medium flex items-center gap-1">
                          <IconLock size={10} />
                          Masqué en sélection
                        </span>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
                      {isPregame ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-3 border border-dashed border-white/10 rounded-xl bg-black/20">
                          <IconLock size={16} className="text-white/20 mb-1" />
                          <span className="text-[11px] font-bold text-white/40">
                            Adversaires révélés au coup d'envoi
                          </span>
                        </div>
                      ) : (
                        enemyPlayers.map((player, idx) => (
                          <PlayerRowItem
                            key={player.puuid || idx}
                            player={player}
                            accentColor={accentColor}
                            onInspect={() => {
                              if (!player.isPrivateRank) setInspectedPlayer(player);
                            }}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ─────────────────────────────────────────────────────────────
              ONGLET 2 : CATALOGUE DES AGENTS
          ───────────────────────────────────────────────────────────── */}
          {activeTab === "agents" && (
            <div className="flex-1 flex flex-col gap-2 overflow-hidden min-h-0">
              {selectedAgentDetail ? (
                /* Fiche détaillée de l'agent sélectionné */
                <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSelectedAgentDetail(null)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold transition-colors"
                      style={{ color: accentColor }}
                    >
                      <IconChevronRight size={12} className="rotate-180" />
                      <span>Tous les agents</span>
                    </button>
                    <span className="text-xs font-bold uppercase tracking-wider text-white/40">
                      {selectedAgentDetail.role}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/10">
                    <img
                      src={selectedAgentDetail.iconUrl}
                      alt={selectedAgentDetail.name}
                      className="w-14 h-14 rounded-xl object-cover bg-black/60 border border-white/15"
                    />
                    <div>
                      <h3 className="text-base font-black text-white">{selectedAgentDetail.name}</h3>
                      <span
                        className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white mt-1"
                        style={{ backgroundColor: accentColor }}
                      >
                        {selectedAgentDetail.role}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Liste et filtres des agents */
                <>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="flex-1 relative">
                      <IconSearch
                        size={12}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40"
                      />
                      <input
                        type="text"
                        value={agentsSearch}
                        onChange={(e) => setAgentsSearch(e.target.value)}
                        placeholder="Rechercher un agent..."
                        className="w-full pl-7 pr-2 py-1 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1 text-[10px]">
                      {["all", "Duelist", "Initiator", "Controller", "Sentinel"].map((role) => (
                        <button
                          key={role}
                          onClick={() => setSelectedRole(role)}
                          className={`px-2 py-1 rounded-md font-bold transition-colors ${
                            selectedRole === role
                              ? "text-white"
                              : "text-white/40 hover:text-white/70 bg-white/5"
                          }`}
                          style={{
                            backgroundColor: selectedRole === role ? accentColor : undefined,
                          }}
                        >
                          {role === "all" ? "Tous" : role}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-1.5 pr-0.5">
                    {filteredAgents.map((ag) => (
                      <button
                        key={ag.uuid || ag.name}
                        onClick={() => setSelectedAgentDetail(ag)}
                        className="flex items-center gap-2 p-1.5 rounded-xl bg-black/30 hover:bg-black/50 border border-white/10 hover:border-white/20 transition-all text-left group"
                      >
                        <img
                          src={ag.iconUrl}
                          alt={ag.name}
                          className="w-8 h-8 rounded-lg object-cover bg-black/60 border border-white/10 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1 leading-tight">
                          <div className="font-bold text-xs text-white truncate group-hover:text-cyan-300">
                            {ag.name}
                          </div>
                          <div className="text-[10px] text-white/40">{ag.role}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              ONGLET 3 : HISTORIQUE RAPIDE
          ───────────────────────────────────────────────────────────── */}
          {activeTab === "history" && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 overflow-y-auto">
              <IconClock size={24} className="text-white/30 mb-2" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Historique des Matchs
              </h4>
              <p className="text-[11px] text-white/40 mt-1 max-w-xs">
                Vos parties récentes se synchronisent automatiquement après chaque match terminé.
              </p>
            </div>
          )}
        </div>

        {/* ─── Pied de Page Épuré ─── */}
        <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-white/40 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span>Raccourcis :</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[9px] text-white/70">
              {shortcutKey}
            </kbd>
            <span className="text-white/20">•</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[9px] text-white/70">
              F10
            </kbd>
            <span className="text-white/40 text-[9px]">(Mode combat)</span>
          </div>

          {/* Poignée de redimensionnement libre dans le coin inférieur droit */}
          <div
            onPointerDown={handleResizePointerDown}
            className="w-5 h-5 flex items-center justify-center cursor-nwse-resize select-none touch-none text-white/30 hover:text-white transition-colors"
            title="Glisser pour redimensionner"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <circle cx="8" cy="8" r="1.2" fill="currentColor" />
              <circle cx="5" cy="8" r="1.2" fill="currentColor" />
              <circle cx="8" cy="5" r="1.2" fill="currentColor" />
              <circle cx="2" cy="8" r="1" fill="currentColor" opacity="0.5" />
              <circle cx="5" cy="5" r="1" fill="currentColor" opacity="0.5" />
              <circle cx="8" cy="2" r="1" fill="currentColor" opacity="0.5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Ligne Joueur Élégante & Sans Emoji ──────────────────────────────────────

function PlayerRowItem({
  player,
  accentColor,
  onInspect,
}: {
  player: LivePlayer;
  accentColor: string;
  onInspect: () => void;
}) {
  return (
    <div
      onClick={onInspect}
      className={`px-2 py-1.5 rounded-xl border transition-all flex items-center justify-between gap-1.5 ${
        player.isPrivateRank ? "cursor-default" : "cursor-pointer"
      } ${
        player.isMe
          ? "bg-amber-500/10 border-amber-500/40 shadow-sm"
          : "bg-black/30 hover:bg-black/50 border-white/[0.07] hover:border-white/20"
      }`}
    >
      {/* Gauche : Portrait Agent + Rang SVG + Nom */}
      <div className="flex items-center gap-1.5 min-w-0">
        {/* Portrait Agent */}
        <div className="w-7 h-7 rounded-lg overflow-hidden bg-black/60 border border-white/10 flex-shrink-0">
          {player.agentIcon ? (
            <img
              src={player.agentIcon}
              alt={player.agentName || player.agent}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-white/30 font-bold">
              ?
            </div>
          )}
        </div>

        {/* Rang ou Cadenas SVG */}
        <div className="flex-shrink-0">
          {player.isPrivateRank ? (
            <div
              className="w-4 h-4 rounded bg-white/5 border border-white/10 flex items-center justify-center"
              title="Profil privé sur SGS"
            >
              <IconLock size={10} className="text-amber-400" />
            </div>
          ) : player.rankIcon ? (
            <img
              src={player.rankIcon}
              alt={player.rank}
              className="w-4 h-4 object-contain"
              title={player.rank}
            />
          ) : (
            <div className="w-4 h-4 rounded bg-white/5 flex items-center justify-center text-[8px] text-white/30 font-mono">
              -
            </div>
          )}
        </div>

        {/* Nom & Agent */}
        <div className="flex flex-col min-w-0 leading-tight">
          <div className="flex items-center gap-1">
            <span
              className={`text-xs font-bold truncate ${
                player.isMe ? "text-amber-300" : "text-white"
              }`}
            >
              {player.name}
            </span>
            {player.isMe && (
              <span
                className="px-1 py-0.2 rounded text-[8px] font-black uppercase text-white"
                style={{ backgroundColor: accentColor }}
              >
                Vous
              </span>
            )}
          </div>
          <span className="text-[10px] text-white/40 truncate">
            {player.agentName || player.agent || "En cours..."}
          </span>
        </div>
      </div>

      {/* Droite : Note SPI & K/D/A */}
      <div className="flex items-center gap-2 flex-shrink-0 text-right">
        {player.spi > 0 && (
          <div className="flex items-center gap-0.5 text-[10px] font-bold text-amber-400">
            <IconFlame size={10} />
            <span>{player.spi}</span>
          </div>
        )}
        <div className="text-[10px] font-mono text-white/60">
          {player.kills}/{player.deaths}/{player.assists}
        </div>
      </div>
    </div>
  );
}
