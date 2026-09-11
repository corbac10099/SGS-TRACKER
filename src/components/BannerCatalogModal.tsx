"use client";

import { useState, useEffect } from "react";

export interface BannerCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export default function BannerCatalogModal({ isOpen, onClose, onSelect }: BannerCatalogModalProps) {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isOpen && cards.length === 0) {
      setLoading(true);
      Promise.all([
        fetch("https://valorant-api.com/v1/playercards").then((res) => res.json()),
        fetch("https://valorant-api.com/v1/maps").then((res) => res.json()),
        fetch("https://valorant-api.com/v1/agents?isPlayableCharacter=true").then((res) => res.json()),
      ])
        .then(([cardsRes, mapsRes, agentsRes]) => {
          let allItems: any[] = [];

          // 1. Agents (HD local pour le profil, miniature -thumb.jpg basse résolution pour le catalogue)
          if (agentsRes.data) {
            const agentItems = agentsRes.data
              .filter((a: any) => a.isPlayableCharacter)
              .map((a: any) => {
                const slug = a.displayName.toLowerCase().replace(/[\/']/g, "");
                const hdUrl = `/banners/hero-${slug}.jpg`;
                const thumbUrl = `/banners/hero-${slug}-thumb.jpg`;
                return {
                  id: `hero-${a.uuid}`,
                  name: `Agent ${a.displayName}`,
                  url: hdUrl, // Full HD 2100px local pour le profil !
                  previewUrl: thumbUrl, // Version basse résolution (320px) très légère pour le catalogue !
                  isHD: true,
                };
              });
            allItems = [...allItems, ...agentItems];
          }

          // 2. Maps (HD Splash pour le profil, miniature listViewIcon basse résolution pour le catalogue)
          if (mapsRes.data) {
            const mapItems = mapsRes.data
              .filter((m: any) => m.splash)
              .map((m: any) => ({
                id: m.uuid,
                name: m.displayName + " (Map)",
                url: m.splash, // Full HD 1920x1080 pour le profil !
                previewUrl: m.listViewIcon || m.splash, // Miniature basse résolution (200px) pour le catalogue !
                isHD: true,
              }));
            allItems = [...allItems, ...mapItems];
          }

          // 3. Player cards (Wide Art 1028x268)
          if (cardsRes.data) {
            const cardItems = cardsRes.data
              .filter((c: any) => c.wideArt)
              .map((c: any) => ({
                id: c.uuid,
                name: c.displayName,
                url: c.wideArt,
                previewUrl: c.wideArt,
                isHD: false,
              }));
            allItems = [...allItems, ...cardItems];
          }

          setCards(allItems);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, cards.length]);

  if (!isOpen) return null;

  const filtered = cards.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]" onClick={onClose}></div>
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-[85vh] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl z-[70] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-val-dark)] text-white">
          <h2 className="text-2xl font-black uppercase tracking-widest">Catalogue de Bannières</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6 border-b border-[var(--color-border)]">
          <input
            type="text"
            placeholder="Rechercher une carte ou une map..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] px-4 py-3 rounded-xl outline-none focus:border-[var(--color-val-red)] transition-colors"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64 text-[var(--color-text-secondary)] font-bold uppercase tracking-widest animate-pulse">
              Chargement du catalogue...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    onSelect(c.url);
                    onClose();
                  }}
                  className="relative group rounded-xl overflow-hidden border-2 border-transparent hover:border-[var(--color-val-red)] transition-all cursor-pointer aspect-[3.5/1] bg-[var(--color-background)]"
                >
                  <img
                    referrerPolicy="no-referrer"
                    src={c.previewUrl}
                    alt={c.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity p-2">
                    <span className="text-white text-xs font-bold text-center leading-tight">{c.name}</span>
                  </div>
                  {c.isHD && (
                    <div className="absolute top-2 right-2 bg-[var(--color-val-red)] text-[var(--color-accent-contrast,#ffffff)] text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-accent-sm">
                      HD
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
