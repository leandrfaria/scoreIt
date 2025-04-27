"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useMember } from "@/context/MemberContext";
import { fetchFavouriteMovies } from "@/services/service_favourite_movies";
import { fetchFavouriteSeries } from "@/services/service_favourite_series";

interface FavoriteContextType {
  favoriteMovies: Set<number>;
  favoriteSeries: Set<number>;
  addFavoriteMovie: (id: number) => void;
  addFavoriteSeries: (id: number) => void;
  setFavoriteMovies: (movies: Set<number>) => void; // 🆕
  setFavoriteSeries: (series: Set<number>) => void; // 🆕
}

const FavoriteContext = createContext<FavoriteContextType | undefined>(undefined);

export const FavoriteProvider = ({ children }: { children: ReactNode }) => {
  const [favoriteMovies, setFavoriteMoviesState] = useState<Set<number>>(new Set());
  const [favoriteSeries, setFavoriteSeriesState] = useState<Set<number>>(new Set());
  const { member } = useMember();

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const token = localStorage.getItem("authToken");

        if (!token || !member) {
          console.warn("Aguardando token e usuário para carregar favoritos...");
          return;
        }

        const movies = await fetchFavouriteMovies(token, String(member.id));
        setFavoriteMoviesState(new Set(movies.map((movie) => movie.id)));

        const series = await fetchFavouriteSeries(token, String(member.id));
        setFavoriteSeriesState(new Set(series.map((serie) => serie.id)));

      } catch (error) {
        console.error("Erro ao carregar favoritos:", error);
      }
    };

    if (member) {
      loadFavorites();
    }
  }, [member]);

  const addFavoriteMovie = (id: number) => {
    setFavoriteMoviesState((prev) => new Set(prev).add(id));
  };

  const addFavoriteSeries = (id: number) => {
    setFavoriteSeriesState((prev) => new Set(prev).add(id));
  };

  const setFavoriteMovies = (movies: Set<number>) => {
    setFavoriteMoviesState(movies);
  };

  const setFavoriteSeries = (series: Set<number>) => {
    setFavoriteSeriesState(series);
  };

  return (
    <FavoriteContext.Provider
      value={{
        favoriteMovies,
        favoriteSeries,
        addFavoriteMovie,
        addFavoriteSeries,
        setFavoriteMovies,
        setFavoriteSeries,
      }}
    >
      {children}
    </FavoriteContext.Provider>
  );
};

export const useFavoriteContext = () => {
  const context = useContext(FavoriteContext);
  if (!context) {
    throw new Error("useFavoriteContext must be used within a FavoriteProvider");
  }
  return context;
};
