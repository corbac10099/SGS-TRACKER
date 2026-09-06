"use client";

import { useState, useEffect, useMemo } from "react";
import AbilityCard from "./AbilityCard";
import { t, Locale } from "@/lib/i18n";
import { getAgentInfo } from "@/lib/valorant/agentsCatalog";

export interface AgentsWikiComponentProps {
  videoLoop?: boolean;
  videoLoopDelay?: number;
  locale: Locale;
  pushUrl: (opts: any) => void;
}

type RoleType = "all" | "Duelist" | "Initiator" | "Controller" | "Sentinel";

interface RoleMeta {
  key: RoleType;
  label: string;
  color: string;
  bg: string;
  border: string;
  glow: string;
}

const ROLES_CONFIG: Record<Exclude<RoleType, "all">, RoleMeta> = {
  Duelist: {
    key: "Duelist",
    label: "Duellistes",
    color: "#ff4655",
    bg: "rgba(255, 70, 85, 0.12)",
    border: "rgba(255, 70, 85, 0.35)",
    glow: "rgba(255, 70, 85, 0.25)",
  },
  Initiator: {
    key: "Initiator",
    label: "Initiateurs",
    color: "#38bdf8",
    bg: "rgba(56, 189, 248, 0.12)",
    border: "rgba(56, 189, 248, 0.35)",
    glow: "rgba(56, 189, 248, 0.25)",
  },
  Controller: {
    key: "Controller",
    label: "Contrôleurs",
    color: "#c084fc",
    bg: "rgba(192, 132, 252, 0.12)",
    border: "rgba(192, 132, 252, 0.35)",
    glow: "rgba(192, 132, 252, 0.25)",
  },
  Sentinel: {
    key: "Sentinel",
    label: "Sentinelles",
    color: "#34d399",
    bg: "rgba(52, 211, 153, 0.12)",
    border: "rgba(52, 211, 153, 0.35)",
    glow: "rgba(52, 211, 153, 0.25)",
  },
};

function normalizeRole(role?: string): "Duelist" | "Initiator" | "Controller" | "Sentinel" {
  const r = (role || "").toLowerCase().trim();
  if (r.includes("duel")) return "Duelist";
  if (r.includes("init")) return "Initiator";
  if (r.includes("contr")) return "Controller";
  if (r.includes("sent")) return "Sentinel";
  return "Duelist";
}

export default function AgentsWikiComponent({
  videoLoop,
  videoLoopDelay,
  locale,
  pushUrl,
}: AgentsWikiComponentProps) {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<RoleType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/cms/agents")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAgents(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (agents.length > 0) {
      const pathname = window.location.pathname;
      const match = pathname.match(/\/agents\/([^/]+)/);
      if (match && match[1]) {
        const slug = match[1];
        const agent = agents.find((a) => a.name.toLowerCase() === slug.toLowerCase());
        if (agent) {
          setSelectedAgent(agent);
        }
      } else {
        setSelectedAgent(null);
      }
    }
  }, [agents]);

  // Écouter popstate pour navigation fluide
  useEffect(() => {
    const handlePop = () => {
      const pathname = window.location.pathname;
      const match = pathname.match(/\/agents\/([^/]+)/);
      if (match && match[1]) {
        const slug = match[1];
        const agent = agents.find((a) => a.name.toLowerCase() === slug.toLowerCase());
        if (agent) setSelectedAgent(agent);
      } else {
        setSelectedAgent(null);
      }
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [agents]);

  // Rôles avec compteurs
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: agents.length,
      Duelist: 0,
      Initiator: 0,
      Controller: 0,
      Sentinel: 0,
    };
    agents.forEach((a) => {
      const norm = normalizeRole(a.role);
      counts[norm] = (counts[norm] || 0) + 1;
    });
    return counts;
  }, [agents]);

  // Filtrage combiné (rôle + recherche texte)
  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const roleMatch =
        selectedRole === "all" || normalizeRole(agent.role) === selectedRole;
      if (!roleMatch) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = agent.name.toLowerCase().includes(q);
      const roleTextMatch = (agent.role || "").toLowerCase().includes(q);
      const abilities = agent.abilities || {};
      const abilityMatch = Object.values(abilities).some((ab: any) =>
        ab?.name?.toLowerCase().includes(q)
      );
      return nameMatch || roleTextMatch || abilityMatch;
    });
  }, [agents, selectedRole, searchQuery]);

  const abilitySlots = [
    { key: "C", label: "C — Gratuite", color: "#22c55e" },
    { key: "Q", label: "Q", color: "#3b82f6" },
    { key: "E", label: "E — Signature", color: "#f59e0b" },
    { key: "X", label: "X — Ultime", color: "#ef4444" },
  ];

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-24 flex flex-col items-center justify-center">
        <div className="relative w-16 h-16 mb-6">
          <div className="absolute inset-0 rounded-2xl border-2 border-[var(--color-val-red)]/20 animate-ping" />
          <div className="w-16 h-16 rounded-2xl border-2 border-[var(--color-val-red)] flex items-center justify-center bg-black/40">
            <span className="text-xl font-black text-[var(--color-val-red)] animate-pulse">V</span>
          </div>
        </div>
        <div className="text-sm font-bold uppercase tracking-[0.25em] text-[var(--color-text-secondary)]">
          {t("loading_agents", locale)}...
        </div>
      </div>
    );
  }

  // ==================== VUE FICHE AGENT SÉLECTIONNÉ ====================
  if (selectedAgent) {
    const normRole = normalizeRole(selectedAgent.role);
    const roleMeta = ROLES_CONFIG[normRole];
    const abilities = selectedAgent.abilities || {};
    const fullPortrait =
      selectedAgent.fullPortrait ||
      getAgentInfo(selectedAgent.name)?.fullPortrait ||
      selectedAgent.iconUrl;

    const totalVideos = abilitySlots.reduce((acc, slot) => {
      return acc + (abilities[slot.key]?.videos?.length || 0);
    }, 0);

    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-in fade-in duration-300 pb-16">
        {/* Bouton retour */}
        <button
          onClick={() => {
            setSelectedAgent(null);
            pushUrl({ view: "agents", agentSlug: null });
          }}
          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-[var(--color-text-secondary)] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[var(--color-val-red)] transition-all mb-8 cursor-pointer group"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:-translate-x-1 transition-transform"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Retour aux agents
        </button>

        {/* HERO BANNER DE L'AGENT */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#121620] via-[#0d1017] to-[#07080c] p-6 sm:p-10 mb-10 shadow-2xl">
          {/* Lueur de fond liée au rôle */}
          <div
            className="absolute top-0 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ background: roleMeta?.color || "#ff4655" }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Colonne Portrait */}
            <div className="lg:col-span-5 flex justify-center items-center">
              <div className="relative w-72 sm:w-80 h-96 sm:h-[420px] rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center shadow-2xl">
                {fullPortrait ? (
                  <img
                    referrerPolicy="no-referrer"
                    src={fullPortrait}
                    alt={selectedAgent.name}
                    className="w-full h-full object-cover object-top filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)] hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-black text-white/20">
                    {selectedAgent.name}
                  </div>
                )}
                {/* Dégradé bas du portrait */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />
              </div>
            </div>

            {/* Colonne Informations */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              {/* Badge Rôle & Statut */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span
                  className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border flex items-center gap-2"
                  style={{
                    color: roleMeta?.color || "#ff4655",
                    background: roleMeta?.bg || "rgba(255,70,85,0.1)",
                    borderColor: roleMeta?.border || "rgba(255,70,85,0.3)",
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: roleMeta?.color || "#ff4655" }}
                  />
                  {selectedAgent.role || roleMeta?.label}
                </span>

                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-[var(--color-text-secondary)]">
                  {totalVideos} vidéo{totalVideos > 1 ? "s" : ""} tactique{totalVideos > 1 ? "s" : ""}
                </span>
              </div>

              {/* Titre Agent */}
              <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white mb-4 drop-shadow-md">
                {selectedAgent.name}
              </h1>

              {/* Description */}
              {selectedAgent.description && (
                <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed mb-8 max-w-2xl">
                  {selectedAgent.description}
                </p>
              )}

              {/* Barre de prévisualisation des 4 compétences */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {abilitySlots.map((slot) => {
                  const ab = abilities[slot.key];
                  if (!ab) return null;
                  return (
                    <div
                      key={slot.key}
                      className="p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-colors flex items-center gap-3"
                    >
                      {ab.iconUrl ? (
                        <img
                          referrerPolicy="no-referrer"
                          src={ab.iconUrl}
                          alt={ab.name}
                          className="w-9 h-9 rounded-lg bg-black/60 p-1 border border-white/10 object-contain flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center font-bold text-xs">
                          {slot.key}
                        </div>
                      )}
                      <div className="min-w-0">
                        <span
                          className="block text-[10px] font-black uppercase tracking-wider"
                          style={{ color: slot.color }}
                        >
                          Touche {slot.key}
                        </span>
                        <span className="block text-xs font-bold text-white truncate">
                          {ab.name || "Inconnue"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION COMPÉTENCES DÉTAILLÉES */}
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white mb-2 flex items-center gap-3">
            ARSENAL TACTIQUE <span className="text-[var(--color-val-red)]">•</span>
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] uppercase tracking-widest font-semibold">
            Guides, mécaniques et analyses d'utilisation
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {abilitySlots.map((slot) => {
            const ab = abilities[slot.key];
            if (!ab || !ab.name) return null;
            return (
              <AbilityCard
                key={slot.key}
                ability={ab}
                slotName={slot.label}
                globalLoop={videoLoop}
                globalLoopDelayMs={videoLoopDelay}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // ==================== VUE PRINCIPALE : CATALOGUE DES AGENTS ====================
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-in fade-in duration-300 pb-20">
      {/* HEADER DE LA PAGE */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-[var(--color-val-red)]/15 text-[var(--color-val-red)] border border-[var(--color-val-red)]/30">
              <span className="w-2 h-2 rounded-full bg-[var(--color-val-red)] animate-pulse" />
              {agents.length} AGENTS DISPONIBLES
            </span>
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary)]">
              Protocole Valorant v9
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            AGENTS <span className="text-[var(--color-val-red)]">.</span>
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-2xl mt-1">
            Explorez les 29 agents, maîtrisez leurs compétences tactiques et découvrez leurs guides vidéo.
          </p>
        </div>

        {/* Barre de Recherche */}
        <div className="relative w-full lg:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un agent..."
            className="w-full bg-white/[0.04] hover:bg-white/[0.06] focus:bg-black/60 border border-white/10 focus:border-[var(--color-val-red)] rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-[var(--color-text-secondary)] outline-none transition-all"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-secondary)] hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* FILTRES PAR RÔLES (PILULES) */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-4 mb-8 scrollbar-none">
        {/* Tous */}
        <button
          onClick={() => setSelectedRole("all")}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border flex items-center gap-2 ${
            selectedRole === "all"
              ? "bg-[var(--color-val-red)] text-white border-[var(--color-val-red)] shadow-[0_0_20px_rgba(255,70,85,0.4)]"
              : "bg-white/[0.03] text-[var(--color-text-secondary)] hover:text-white border-white/10 hover:border-white/20"
          }`}
        >
          <span>Tous</span>
          <span className="px-1.5 py-0.2 rounded-md bg-black/40 text-[10px] font-mono">
            {roleCounts.all}
          </span>
        </button>

        {/* 4 Rôles */}
        {(Object.keys(ROLES_CONFIG) as Exclude<RoleType, "all">[]).map((rKey) => {
          const meta = ROLES_CONFIG[rKey];
          const isSelected = selectedRole === rKey;
          const count = roleCounts[rKey] || 0;

          return (
            <button
              key={rKey}
              onClick={() => setSelectedRole(rKey)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border flex items-center gap-2 ${
                isSelected
                  ? "text-white border-transparent"
                  : "bg-white/[0.03] text-[var(--color-text-secondary)] hover:text-white border-white/10 hover:border-white/20"
              }`}
              style={{
                background: isSelected ? meta.bg : undefined,
                borderColor: isSelected ? meta.border : undefined,
                boxShadow: isSelected ? `0 0 20px ${meta.glow}` : undefined,
                color: isSelected ? meta.color : undefined,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: meta.color }}
              />
              <span>{meta.label}</span>
              <span className="px-1.5 py-0.2 rounded-md bg-black/40 text-[10px] font-mono text-white/80">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* GRILLE POSTERS VALORANT */}
      {filteredAgents.length === 0 ? (
        <div className="rounded-2xl p-12 text-center border border-white/10 bg-white/[0.02]">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-1">
            Aucun agent trouvé
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Essayez de modifier votre recherche ou vos filtres.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
          {filteredAgents.map((agent, index) => {
            const normRole = normalizeRole(agent.role);
            const roleMeta = ROLES_CONFIG[normRole];
            const fullPortrait =
              agent.fullPortrait ||
              getAgentInfo(agent.name)?.fullPortrait ||
              agent.iconUrl;

            const abilities = agent.abilities || {};
            const abilityIcons = [
              abilities["C"]?.iconUrl,
              abilities["Q"]?.iconUrl,
              abilities["E"]?.iconUrl,
              abilities["X"]?.iconUrl,
            ].filter(Boolean);

            const hasVideos = ["C", "Q", "E", "X"].some(
              (s) => (abilities[s]?.videos?.length || 0) > 0
            );

            return (
              <button
                key={agent.id || agent.uuid || agent.name}
                onClick={() => {
                  setSelectedAgent(agent);
                  pushUrl({ view: "agents", agentSlug: agent.name.toLowerCase() });
                }}
                className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-[var(--color-val-red)] bg-gradient-to-b from-[#141822] via-[#0f121a] to-[#090b10] flex flex-col text-left transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.8),0_0_25px_rgba(255,70,85,0.25)] cursor-pointer"
                style={{
                  aspectRatio: "3 / 4.4",
                }}
              >
                {/* Filigrane discret du nom de l'agent en arrière-plan */}
                <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none overflow-hidden">
                  <span className="text-5xl font-black uppercase tracking-tighter text-white/[0.03] rotate-90 transform translate-x-4">
                    {agent.name}
                  </span>
                </div>

                {/* PORTRAIT DU PERSONNAGE */}
                <div className="absolute inset-0 overflow-hidden">
                  {fullPortrait ? (
                    <img
                      referrerPolicy="no-referrer"
                      src={fullPortrait}
                      alt={agent.name}
                      className="w-full h-full object-cover object-top filter contrast-[1.05] brightness-95 group-hover:scale-110 group-hover:brightness-105 transition-all duration-500 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white/10">
                      ?
                    </div>
                  )}

                  {/* Dégradés superposés pour lisibilité */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090b10] via-[#090b10]/70 via-40% to-transparent pointer-events-none" />
                  <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
                </div>

                {/* BADGES HAUT DE CARTE */}
                <div className="relative z-10 p-3 flex items-center justify-between w-full">
                  {/* Badge Rôle */}
                  <span
                    className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider backdrop-blur-md border flex items-center gap-1.5"
                    style={{
                      color: roleMeta?.color || "#fff",
                      background: "rgba(0,0,0,0.65)",
                      borderColor: roleMeta?.border || "rgba(255,255,255,0.1)",
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: roleMeta?.color || "#ff4655" }}
                    />
                    {agent.role || roleMeta?.label}
                  </span>

                  {/* Badge Vidéo ou Index */}
                  {hasVideos ? (
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-[var(--color-val-red)]/20 border border-[var(--color-val-red)]/40 text-[var(--color-val-red)] flex items-center gap-1">
                      ▶ Vidéos
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-white/30">
                      #{String(index + 1).padStart(2, "0")}
                    </span>
                  )}
                </div>

                {/* CONTENU BAS DE CARTE */}
                <div className="relative z-10 mt-auto p-3.5 flex flex-col">
                  <h3 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white group-hover:text-[var(--color-val-red)] transition-colors leading-tight drop-shadow-md">
                    {agent.name}
                  </h3>

                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-2.5">
                    {agent.role}
                  </span>

                  {/* Ligne d'icônes de compétences */}
                  {abilityIcons.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-2 border-t border-white/10">
                      {abilityIcons.map((icon, idx) => (
                        <img
                          key={idx}
                          referrerPolicy="no-referrer"
                          src={icon}
                          alt="compétence"
                          className="w-5 h-5 rounded-md bg-black/50 border border-white/10 p-0.5 object-contain group-hover:border-[var(--color-val-red)]/40 transition-colors"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

