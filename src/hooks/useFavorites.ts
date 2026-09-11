"use client";

import { useState, useEffect, useCallback } from "react";

export interface FavoritesState {
  favorites: Array<{
    riotId: string;
    gameName: string;
    tagLine: string;
    cardUrl: string;
  }>;
  toggleFavorite: (player: any) => void;
  isFavorited: (gameName: string, tagLine: string) => boolean;
}

export function useFavorites(session: any): FavoritesState {
  const [favorites, setFavorites] = useState<
    Array<{
      riotId: string;
      gameName: string;
      tagLine: string;
      cardUrl: string;
    }>
  >([]);

  const favoritesKey = session?.user?.email
    ? `spycam-favorites-${session.user.email}`
    : "spycam-favorites";

  useEffect(() => {
    try {
      const stored = localStorage.getItem(favoritesKey);
      if (stored) {
        setFavorites(JSON.parse(stored));
      } else {
        setFavorites([]);
      }
    } catch {}
  }, [favoritesKey]);

  const saveFavorites = useCallback(
    (newFavs: typeof favorites) => {
      setFavorites(newFavs);
      try {
        localStorage.setItem(favoritesKey, JSON.stringify(newFavs));
      } catch {}
    },
    [favoritesKey]
  );

  const toggleFavorite = useCallback(
    (player: any) => {
      const id = `${player.gameName}#${player.tagLine}`;
      const exists = favorites.some((f) => f.riotId === id);
      if (exists) {
        saveFavorites(favorites.filter((f) => f.riotId !== id));
      } else {
        saveFavorites([
          ...favorites,
          {
            riotId: id,
            gameName: player.gameName,
            tagLine: player.tagLine,
            cardUrl: player.cardUrl || "",
          },
        ]);
      }
    },
    [favorites, saveFavorites]
  );

  const isFavorited = useCallback(
    (gameName: string, tagLine: string) => {
      return favorites.some((f) => f.riotId === `${gameName}#${tagLine}`);
    },
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorited };
}
