import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BASE_AGENTS_CATALOG } from "@/lib/valorant/agentsCatalog";

type Props = {
  params: Promise<{ agent: string }> | { agent: string };
};

export function generateStaticParams() {
  return Object.keys(BASE_AGENTS_CATALOG).map((agentKey) => ({
    agent: agentKey.toLowerCase(),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const agentKey = Object.keys(BASE_AGENTS_CATALOG).find(
    (k) => k.toLowerCase() === resolvedParams.agent?.toLowerCase()
  );
  const agent = agentKey ? BASE_AGENTS_CATALOG[agentKey] : null;

  if (!agent) {
    return {
      title: "Agent Valorant Introuvable - SGS Tracker",
    };
  }

  return {
    title: `Guide ${agent.name} Valorant (${agent.role}) - Compétences & Stats | SGS Tracker`,
    description: `Guide complet de ${agent.name} sur Valorant : rôle tactique ${agent.role}, compétences, astuces de pro et statistiques de victoire.`,
    alternates: {
      canonical: `/agents/${resolvedParams.agent.toLowerCase()}`,
    },
    openGraph: {
      title: `${agent.name} - Agent Valorant (${agent.role}) | SGS Tracker`,
      description: `Découvrez toutes les mécaniques, compétences et statistiques de ${agent.name} sur SGS Tracker.`,
      images: agent.fullPortrait ? [{ url: agent.fullPortrait }] : undefined,
    },
  };
}

export default async function AgentDetailPage({ params }: Props) {
  const resolvedParams = await Promise.resolve(params);
  const agentKey = Object.keys(BASE_AGENTS_CATALOG).find(
    (k) => k.toLowerCase() === resolvedParams.agent?.toLowerCase()
  );

  if (!agentKey) {
    notFound();
  }

  const agent = BASE_AGENTS_CATALOG[agentKey];
  const otherAgents = Object.values(BASE_AGENTS_CATALOG)
    .filter((a) => a.name !== agent.name)
    .slice(0, 8);

  const roleColors: Record<string, { bg: string; text: string; border: string }> = {
    Duelist: { bg: "rgba(255, 70, 85, 0.15)", text: "#ff4655", border: "rgba(255, 70, 85, 0.4)" },
    Initiator: { bg: "rgba(59, 130, 246, 0.15)", text: "#60a5fa", border: "rgba(59, 130, 246, 0.4)" },
    Controller: { bg: "rgba(168, 85, 247, 0.15)", text: "#c084fc", border: "rgba(168, 85, 247, 0.4)" },
    Sentinel: { bg: "rgba(16, 185, 129, 0.15)", text: "#34d399", border: "rgba(16, 185, 129, 0.4)" },
  };

  const roleTheme = roleColors[agent.role] || {
    bg: "rgba(255, 255, 255, 0.1)",
    text: "#ffffff",
    border: "rgba(255, 255, 255, 0.2)",
  };

  return (
    <div className="min-h-screen bg-[#070a0f] text-white flex flex-col justify-between">
      {/* Background radial subtle glow */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          background: `radial-gradient(circle at 65% 30%, ${roleTheme.text}33 0%, transparent 60%)`,
        }}
      />

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 py-10 w-full flex-1">
        {/* Navigation retour */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/agents"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 transition-colors"
          >
            ← Retour à l'Encyclopédie des Agents
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-[var(--color-val-red,#ff4655)] hover:underline"
          >
            Accéder au Tracker SGS →
          </Link>
        </div>

        {/* Hero Card de l'Agent */}
        <div className="rounded-3xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 p-6 sm:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Col Info */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
              <div className="flex items-center gap-3">
                <span
                  className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border"
                  style={{
                    backgroundColor: roleTheme.bg,
                    color: roleTheme.text,
                    borderColor: roleTheme.border,
                  }}
                >
                  {agent.role}
                </span>
                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                  Valorant Official Agent
                </span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white leading-none">
                {agent.name}
              </h1>

              <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-xl">
                Guide complet pour maîtriser <strong>{agent.name}</strong> ({agent.role}) dans vos parties classées sur Valorant. Analysez votre taux de victoire, précision de tir et efficacité avec le SGS Performance Index (SPI).
              </p>

              {/* Boutons d'action */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href={`/?view=agents`}
                  className="px-6 py-3 rounded-xl bg-[var(--color-val-red,#ff4655)] hover:brightness-110 font-black text-xs uppercase tracking-wider text-white shadow-[0_0_20px_rgba(255,70,85,0.4)] transition-all"
                >
                  Voir les Compétences en Vidéo
                </Link>
                <Link
                  href="/"
                  className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-xs uppercase tracking-wider text-gray-200 transition-colors"
                >
                  Rechercher un Profil Joueur
                </Link>
              </div>
            </div>

            {/* Col Portrait */}
            <div className="lg:col-span-5 flex items-center justify-center relative min-h-[320px]">
              {agent.fullPortrait ? (
                <img
                  src={agent.fullPortrait}
                  alt={`Portrait de ${agent.name}`}
                  className="max-h-[420px] w-auto object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.8)] filter transition-transform hover:scale-105 duration-300"
                />
              ) : (
                <img
                  src={agent.iconUrl}
                  alt={`Icône de ${agent.name}`}
                  className="w-40 h-40 object-contain"
                />
              )}
            </div>
          </div>
        </div>

        {/* Maillage interne SEO : Découvrir d'autres agents */}
        <div>
          <h2 className="text-lg font-black uppercase tracking-wider text-white mb-6">
            Découvrez d'autres agents Valorant
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {otherAgents.map((a) => (
              <Link
                key={a.name}
                href={`/agents/${a.name.toLowerCase()}`}
                className="group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-[var(--color-val-red,#ff4655)]/50 transition-all flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden mb-2 bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <img
                    src={a.iconUrl}
                    alt={a.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <span className="text-xs font-bold text-gray-200 group-hover:text-white truncate w-full">
                  {a.name}
                </span>
                <span className="text-[10px] text-gray-400">{a.role}</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
