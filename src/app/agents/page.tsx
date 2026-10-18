import { Suspense } from "react";
import { Metadata } from "next";
import { HomeContent } from "@/app/page";

export const metadata: Metadata = {
  title: "Encyclopédie & Guides des Agents Valorant - SGS Tracker",
  description: "Explorez les 26+ agents Valorant : compétences détaillées, rôles tactiques (Duelliste, Initiateur, Contrôleur, Sentinelle), statistiques et astuces de jeu.",
  alternates: {
    canonical: "/agents",
  },
};

export default function AgentsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center text-[var(--color-text-secondary)] font-bold tracking-widest uppercase animate-pulse">
          Chargement du wiki des agents...
        </div>
      }
    >
      <HomeContent initialAgentsView={true} />
    </Suspense>
  );
}
