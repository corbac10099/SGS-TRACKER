"use client";

import { useState, useEffect } from "react";
import RichTextRenderer from "./RichTextRenderer";

export interface NewsViewComponentProps {
  newsItems: any[];
  setNewsItems: (items: any[]) => void;
  targetNewsId?: string | null;
}

export default function NewsViewComponent({ newsItems, setNewsItems, targetNewsId }: NewsViewComponentProps) {
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState("");
  const [sortOption, setSortOption] = useState<"date_desc" | "date_asc" | "title_asc" | "title_desc">("date_desc");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    setNewsLoading(true);
    fetch("/api/cms/news")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setNewsItems(data);
        else setNewsItems([]);
      })
      .catch(() => setNewsError("Impossible de charger les actualités."))
      .finally(() => setNewsLoading(false));
  }, [setNewsItems]);

  // Scroll to target news card if specified from notification
  useEffect(() => {
    if (targetNewsId && !newsLoading) {
      setHighlightedId(targetNewsId);
      const timer = setTimeout(() => {
        const el = document.getElementById(`news-card-${targetNewsId}`);
        if (el) {
          const yOffset = -90; // offset sous le header sticky
          const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
        }
      }, 150);

      // Remove strong highlight after 4 seconds
      const clearTimer = setTimeout(() => {
        setHighlightedId(null);
      }, 4000);

      return () => {
        clearTimeout(timer);
        clearTimeout(clearTimer);
      };
    }
  }, [targetNewsId, newsLoading, newsItems]);

  // Résout le nœud actif de chaque actualité (arbre de décision)
  const getActiveNode = (item: any) => {
    const nodes = item.nodes || [];
    return nodes.find((n: any) => n.id === item.currentNodeId) || nodes[0] || null;
  };

  const sortedNews = [...newsItems].sort((a, b) => {
    if (sortOption === "date_desc") {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    } else if (sortOption === "date_asc") {
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    } else if (sortOption === "title_asc") {
      return (a.title || "").localeCompare(b.title || "");
    } else if (sortOption === "title_desc") {
      return (b.title || "").localeCompare(a.title || "");
    }
    return 0;
  });

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <h2 className="text-3xl font-black uppercase tracking-widest text-[var(--color-text-primary)]">Actualités</h2>
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as any)}
          className="bg-[var(--color-surface)] text-[var(--color-text-primary)] px-4 py-2 rounded-lg border border-[var(--color-border)] outline-none focus:border-[var(--color-val-red)] transition-colors text-sm font-bold uppercase tracking-wider cursor-pointer"
        >
          <option value="date_desc">Récentes d&apos;abord</option>
          <option value="date_asc">Anciennes d&apos;abord</option>
          <option value="title_asc">Titre (A-Z)</option>
          <option value="title_desc">Titre (Z-A)</option>
        </select>
      </div>

      {newsLoading && (
        <div className="flex flex-col gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="glass-panel rounded-2xl p-6 animate-page-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-5 w-48 skeleton-shimmer rounded-lg" />
                <div className="h-3 w-24 skeleton-shimmer rounded-md ml-auto" />
              </div>
              <div className="space-y-2.5">
                <div className="h-3 w-full skeleton-shimmer rounded-md" />
                <div className="h-3 w-5/6 skeleton-shimmer rounded-md" />
                <div className="h-3 w-3/4 skeleton-shimmer rounded-md" />
              </div>
            </div>
          ))}
        </div>
      )}

      {newsError && (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <p className="text-[var(--color-text-secondary)] mb-2">{newsError}</p>
        </div>
      )}

      {!newsLoading && !newsError && sortedNews.length === 0 && (
        <div className="glass-panel rounded-2xl p-10 text-center animate-page-in">
          <p className="text-lg text-[var(--color-text-secondary)] font-bold">Aucune actualité pour le moment</p>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {sortedNews.map((item, index) => {
          const activeNode = getActiveNode(item);
          const isTargeted = highlightedId === item.id || targetNewsId === item.id;

          return (
            <div
              key={item.id}
              id={`news-card-${item.id}`}
              className={`glass-panel rounded-2xl p-6 transition-all duration-500 animate-page-in ${
                isTargeted
                  ? "ring-2 ring-[var(--color-val-red)] shadow-[0_0_35px_rgba(255,70,85,0.4)] bg-[var(--color-surface-hover)] scale-[1.01]"
                  : "hover:bg-[var(--color-surface-hover)]"
              }`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">{item.title}</h3>
                <span className="text-[10px] text-[var(--color-text-secondary)] ml-auto font-semibold">
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </span>
              </div>
              {activeNode && (
                <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  <RichTextRenderer content={activeNode.content || ""} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
