import { Suspense } from "react";
import { Metadata } from "next";
import { HomeContent } from "@/app/page";

export const metadata: Metadata = {
  title: "Actualités & Patch Notes Valorant - SGS Tracker",
  description: "Suivez les dernières actualités, patch notes officiels, analyses de meta et annonces de Valorant et SGS Tracker.",
  alternates: {
    canonical: "/actualites",
  },
};

export default function ActualitesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center text-[var(--color-text-secondary)] font-bold tracking-widest uppercase animate-pulse">
          Chargement des actualités...
        </div>
      }
    >
      <HomeContent initialNewsView={true} />
    </Suspense>
  );
}
