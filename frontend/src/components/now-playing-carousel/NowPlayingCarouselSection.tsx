
"use client";

import { useEffect, useState } from "react";
import { fetchNowPlayingMovies } from "@/services/service_now_playing_movies";
import { Movie } from "@/types/Movie";
import { MovieCarousel } from "../movie-carousel/MovieCarousel";

const NowPlayingCarouselSection = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMovies = async () => {
      const token = localStorage.getItem("authToken");
      console.log("👉 TOKEN:", token);

      if (!token) {
        console.error("Token não encontrado. Faça login primeiro.");
        setLoading(false);
        return;
      }

      const data = await fetchNowPlayingMovies(token);
      console.log("🎬 FILMES RECEBIDOS:", data);

      if (!data || data.length === 0) {
        console.warn("🚨 Lista vazia! Adicionando mock...");
        setMovies([
          {
            id: 999,
            title: "Mockado",
            posterUrl: "https://image.tmdb.org/t/p/w300/6DrHO1jr3qVrViUO6s6kFiAGM7.jpg",
            backdropUrl: "https://image.tmdb.org/t/p/original/rTh4K5uw9HypmpGslcKd4QfHl93.jpg",
            vote_average: 7.5,
            release_date: "2024-01-01",
            overview: "Esse é um mock.",
            genre: "Drama",
          },
        ]);
      } else {
        setMovies(data);
      }

      setLoading(false);
    };

    loadMovies();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-10 text-white">Carregando filmes em cartaz...</div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="text-center py-10 text-white">
        Nenhum filme em cartaz encontrado.
      </div>
    );
  }

  return <MovieCarousel title="Filmes em Cartaz" movies={movies} />;
};

export default NowPlayingCarouselSection;
