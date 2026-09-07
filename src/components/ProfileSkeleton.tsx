"use client";

import React from "react";

/** Brique de base : un bloc shimmer rectangulaire */
function Bone({ className = "" }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-xl ${className}`} />;
}

/**
 * Skeleton de chargement du profil joueur —
 * imite la bannière, l'avatar, les stats et les onglets
 */
export default function ProfileSkeleton() {
  return (
    <div className="flex-1 flex flex-col items-center px-4 sm:px-8 z-10 w-full max-w-6xl mx-auto animate-page-in">
      {/* Bannière skeleton */}
      <div className="w-full rounded-2xl overflow-hidden border border-[var(--color-border)] mb-6">
        <div className="w-full aspect-[2.3/1] sm:aspect-[3.6/1] skeleton-shimmer" />
      </div>

      {/* Onglets skeleton */}
      <div className="w-full flex gap-6 border-b border-[var(--color-border)] mb-6 pb-3">
        <Bone className="h-4 w-24" />
        <Bone className="h-4 w-20" />
        <Bone className="h-4 w-16" />
      </div>

      {/* Grille de stats skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 w-full mb-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[var(--color-border)] p-4 flex flex-col gap-3"
          >
            <Bone className="h-3 w-16" />
            <Bone className="h-7 w-20" />
            <Bone className="h-2 w-full" />
          </div>
        ))}
      </div>

      {/* Graphique skeleton */}
      <div className="w-full rounded-2xl border border-[var(--color-border)] p-5 mb-6">
        <Bone className="h-4 w-32 mb-4" />
        <Bone className="h-40 w-full rounded-xl" />
      </div>
    </div>
  );
}
