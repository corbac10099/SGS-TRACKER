import React from "react";
import DownloadAppViewComponent from "@/components/DownloadAppViewComponent";
import Header from "@/components/Header";

export const metadata = {
  title: "Télécharger l'Application Desktop - SGS Tracker",
  description: "Téléchargez l'application officielle SGS Tracker pour Windows. Overlay in-game, statistiques en direct et zéro latence.",
};

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary,#06090e)] text-white flex flex-col justify-between">
      <main className="flex-1 flex flex-col justify-center py-6">
        <DownloadAppViewComponent />
      </main>
    </div>
  );
}
