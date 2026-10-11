"use client";

import React, { useState, useEffect } from "react";

export interface AbilityMeta {
  slot: "C" | "Q" | "E" | "X";
  name: string;
  type: "flash" | "damage" | "smoke" | "movement" | "recon" | "ultimate";
  description: string;
  defaultAvgCasts: number;
  defaultEnemiesFlashed?: number;
  defaultTeammatesFlashed?: number;
  defaultDamage?: number;
  defaultAssists?: number;
}

// Dictionnaire officiel des 4 sorts par agent principal
const AGENT_ABILITIES_META: Record<string, AbilityMeta[]> = {
  Jett: [
    { slot: "C", name: "Nuage de fumée", type: "smoke", description: "Projette un projectile qui crée un nuage de fumée obstruant la vision.", defaultAvgCasts: 1.8, defaultAssists: 0.4 },
    { slot: "Q", name: "Courant ascendant", type: "movement", description: "Propulse Jett haut dans les airs instantanément.", defaultAvgCasts: 1.2, defaultAssists: 0.2 },
    { slot: "E", name: "Vent arrière (Dash)", type: "movement", description: "Se propulse rapidement dans la direction du mouvement.", defaultAvgCasts: 2.1, defaultAssists: 0.8 },
    { slot: "X", name: "Tempête de lames", type: "ultimate", description: "S'équipe de dagues mortelles ultra-précises se rechargeant lors des éliminations.", defaultAvgCasts: 0.7, defaultDamage: 180, defaultAssists: 1.4 },
  ],
  Reyna: [
    { slot: "C", name: "Œil malveillant", type: "flash", description: "Projette un œil éthéré qui restreint la vision de tous les ennemis qui le regardent.", defaultAvgCasts: 1.9, defaultEnemiesFlashed: 2.4, defaultTeammatesFlashed: 0 },
    { slot: "Q", name: "Dévoration", type: "movement", description: "Consomme un orbe d'âme pour restaurer rapidement ses points de vie.", defaultAvgCasts: 1.5, defaultAssists: 0.1 },
    { slot: "E", name: "Rejet", type: "movement", description: "Consomme un orbe d'âme pour devenir intangible pendant une courte durée.", defaultAvgCasts: 1.8, defaultAssists: 0.2 },
    { slot: "X", name: "Impératrice", type: "ultimate", description: "Frénésie décuplant la vitesse de tir et accordant des Rejets invisibles.", defaultAvgCasts: 0.6, defaultDamage: 210, defaultAssists: 1.6 },
  ],
  Raze: [
    { slot: "C", name: "Boum-bot", type: "recon", description: "Déploie un robot terrestre qui traque et explose sur les ennemis.", defaultAvgCasts: 1.1, defaultDamage: 65, defaultAssists: 0.5 },
    { slot: "Q", name: "Pack explosif (Satchel)", type: "movement", description: "Lance une charge explosive projetant Raze ou infligeant des dégâts.", defaultAvgCasts: 2.3, defaultDamage: 40, defaultAssists: 0.3 },
    { slot: "E", name: "Grenade gigogne", type: "damage", description: "Grenade à sous-munitions infligeant de lourds dégâts de zone.", defaultAvgCasts: 1.6, defaultDamage: 145, defaultAssists: 0.9 },
    { slot: "X", name: "Bouquet final (Roquette)", type: "ultimate", description: "Lance-roquettes infligeant des dégâts massifs dans un large rayon.", defaultAvgCasts: 0.5, defaultDamage: 220, defaultAssists: 1.8 },
  ],
  Phoenix: [
    { slot: "C", name: "Brasier", type: "smoke", description: "Déploie un mur de flammes qui bloque la vision et inflige des dégâts.", defaultAvgCasts: 1.0, defaultDamage: 30, defaultAssists: 0.4 },
    { slot: "Q", name: "Balle courbe (Flash)", type: "flash", description: "Lance une boule de feu aveuglante courbée contournant les coins.", defaultAvgCasts: 2.2, defaultEnemiesFlashed: 3.1, defaultTeammatesFlashed: 0.4 },
    { slot: "E", name: "Mains chaudes", type: "damage", description: "Projette une boule de feu créant une zone de flammes au sol.", defaultAvgCasts: 1.4, defaultDamage: 85, defaultAssists: 0.6 },
    { slot: "X", name: "Revanche", type: "ultimate", description: "Marque un point de retour et ressuscite si tué pendant la durée du sort.", defaultAvgCasts: 0.6, defaultDamage: 120, defaultAssists: 1.2 },
  ],
  Sova: [
    { slot: "C", name: "Drone rapace", type: "recon", description: "Pilote un drone volant capable de marquer les ennemis avec une fléchette.", defaultAvgCasts: 0.9, defaultAssists: 0.8 },
    { slot: "Q", name: "Flèche électrique", type: "damage", description: "Tire une flèche explosive infligeant des dégâts de choc à l'impact.", defaultAvgCasts: 1.9, defaultDamage: 110, defaultAssists: 0.7 },
    { slot: "E", name: "Flèche de reconnaissance", type: "recon", description: "Révèle la position de tous les ennemis situés dans sa ligne de vue.", defaultAvgCasts: 2.5, defaultAssists: 1.6 },
    { slot: "X", name: "Fureur du chasseur", type: "ultimate", description: "Tire trois projectiles d'énergie dévastateurs traversant les murs.", defaultAvgCasts: 0.5, defaultDamage: 195, defaultAssists: 1.9 },
  ],
  Omen: [
    { slot: "C", name: "Voile sombre (TP)", type: "movement", description: "Téléportation à courte portée vers un endroit ciblé.", defaultAvgCasts: 1.4, defaultAssists: 0.3 },
    { slot: "Q", name: "Paranoïa (Flash)", type: "flash", description: "Projette un projectile d'ombre traversant les murs qui assourdit et aveugle.", defaultAvgCasts: 1.2, defaultEnemiesFlashed: 2.8, defaultTeammatesFlashed: 0.2 },
    { slot: "E", name: "Voile ténébreux (Smokes)", type: "smoke", description: "Projette des sphères d'ombre régénérables bloquant la vue.", defaultAvgCasts: 3.2, defaultAssists: 1.1 },
    { slot: "X", name: "Depuis les ombres", type: "ultimate", description: "Se téléporte à n'importe quel endroit de la carte.", defaultAvgCasts: 0.6, defaultAssists: 0.7 },
  ],
  Viper: [
    { slot: "C", name: "Morsure du serpent", type: "damage", description: "Lance une fiole de poison infligeant des dégâts et un effet Fragile.", defaultAvgCasts: 1.8, defaultDamage: 95, defaultAssists: 0.9 },
    { slot: "Q", name: "Nuage de poison", type: "smoke", description: "Émetteur de gaz toxique réutilisable.", defaultAvgCasts: 2.0, defaultAssists: 0.7 },
    { slot: "E", name: "Écran toxique", type: "smoke", description: "Ligne de diffuseurs créant un haut mur de gaz toxique.", defaultAvgCasts: 1.5, defaultAssists: 1.0 },
    { slot: "X", name: "Nid de vipère", type: "ultimate", description: "Nuage géant de poison réduisant les PV max des ennemis à 1.", defaultAvgCasts: 0.5, defaultDamage: 240, defaultAssists: 2.1 },
  ],
};

// Fallback générique pour tout autre agent (Vyse, Tejo, Clove, etc.)
const DEFAULT_FALLBACK_ABILITIES: AbilityMeta[] = [
  { slot: "C", name: "Compétence Basique", type: "smoke", description: "Utilitaire tactique de soutien d'équipe.", defaultAvgCasts: 1.5, defaultAssists: 0.5 },
  { slot: "Q", name: "Compétence Tactique", type: "flash", description: "Sort de contrôle de zone ou d'aveuglement.", defaultAvgCasts: 1.8, defaultEnemiesFlashed: 2.2, defaultTeammatesFlashed: 0.1 },
  { slot: "E", name: "Compétence Signature", type: "damage", description: "Compétence principale se rechargeant au fil du round.", defaultAvgCasts: 2.4, defaultDamage: 75, defaultAssists: 0.8 },
  { slot: "X", name: "Capacité Ultime", type: "ultimate", description: "Capacité à fort impact renversant le cours d'un round.", defaultAvgCasts: 0.6, defaultDamage: 160, defaultAssists: 1.5 },
];

export default function AgentAbilitiesCatalogue({
  agentName,
  matchesCount = 1,
}: {
  agentName: string;
  matchesCount?: number;
}) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [liveStats, setLiveStats] = useState<Record<string, any> | null>(null);

  // Charger les stats réelles Neon DB si disponibles
  useEffect(() => {
    let isMounted = true;
    fetch(`/api/tracker/abilities?agent=${agentName}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.aggregated) {
          const agKey = agentName.toLowerCase();
          if (data.aggregated[agKey]) {
            setLiveStats(data.aggregated[agKey]);
          }
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [agentName]);

  const abilities = AGENT_ABILITIES_META[agentName] || DEFAULT_FALLBACK_ABILITIES;

  return (
    <div className="w-full bg-[var(--color-surface)] border border-white/10 rounded-2xl overflow-hidden shadow-lg transition-all">
      {/* Header Accordion Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-val-red)]/15 border border-[var(--color-val-red)]/30 flex items-center justify-center text-sm">
            ✨
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Catalogue Dépliable des Sorts & Stats de Compétences
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-gray-300">
                4 Sorts
              </span>
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary)]">
              Analyse de rentabilité de chaque capacité de {agentName} (flashes, dégâts, utilisation)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[var(--color-val-red)]">
            {isOpen ? "Réduire" : "Déplier"}
          </span>
          <svg
            className={`w-4 h-4 text-white/70 transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="p-4 pt-0 border-t border-white/5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
            {abilities.map((ab) => {
              const liveSlotData = liveStats ? liveStats[ab.slot] : null;

              const avgCasts = liveSlotData
                ? (liveSlotData.totalCasts / Math.max(1, liveSlotData.matchCount)).toFixed(1)
                : ab.defaultAvgCasts;

              const enemiesFlashed = liveSlotData?.totalEnemiesFlashed ?? ab.defaultEnemiesFlashed;
              const teammatesFlashed = liveSlotData?.totalTeammatesFlashed ?? ab.defaultTeammatesFlashed;
              const damage = liveSlotData?.totalDamageDealt ?? ab.defaultDamage;
              const assists = liveSlotData?.totalAssists ?? ab.defaultAssists;

              return (
                <div
                  key={ab.slot}
                  className="bg-[var(--color-background)]/80 border border-white/10 rounded-xl p-3.5 flex flex-col justify-between hover:border-white/20 transition-all gap-3"
                >
                  {/* Top Slot Badge + Name */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="w-6 h-6 rounded-md bg-[var(--color-val-red)] text-white font-black text-xs flex items-center justify-center shadow-sm">
                        {ab.slot}
                      </span>
                      <span className="text-[10px] font-black uppercase text-gray-400 bg-white/5 px-2 py-0.5 rounded">
                        {ab.type}
                      </span>
                    </div>

                    <h6 className="text-xs font-black text-white">{ab.name}</h6>
                    <p className="text-[10px] text-[var(--color-text-secondary)] mt-1 line-clamp-2 leading-relaxed">
                      {ab.description}
                    </p>
                  </div>

                  {/* Quantitative Metrics Box */}
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-2.5 flex flex-col gap-1.5 text-[10px]">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Lancers / round :</span>
                      <span className="font-black text-white">{avgCasts}</span>
                    </div>

                    {enemiesFlashed !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-amber-400">Ennemis aveuglés :</span>
                        <span className="font-black text-amber-300">~{enemiesFlashed}</span>
                      </div>
                    )}

                    {teammatesFlashed !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-rose-400">Alliés flashés :</span>
                        <span className="font-black text-rose-300">{teammatesFlashed}</span>
                      </div>
                    )}

                    {damage !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-red-400">Dégâts infligés :</span>
                        <span className="font-black text-red-300">{damage} PV</span>
                      </div>
                    )}

                    {assists !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400">Assists générées :</span>
                        <span className="font-black text-emerald-300">{assists}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-[var(--color-text-secondary)] italic text-right pt-1">
            * Les données en direct sont enrichies par le client desktop SGS lors de chaque partie.
          </div>
        </div>
      )}
    </div>
  );
}
