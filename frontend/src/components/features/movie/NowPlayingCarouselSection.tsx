"use client";

import { useEffect, useState } from "react";
import { fetchNowPlayingMovies } from "@/services/service_now_playing_movies";
import { Movie } from "@/types/Movie";
import { MovieCarousel } from "./MovieCarousel";
import { useTranslations } from "next-intl";

const NowPlayingCarouselSection = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("NowPlayingCarousel");

  useEffect(() => {
    const loadMovies = async () => {
      const token = localStorage.getItem("authToken");
      console.log("👉 TOKEN:", token);

      if (!token) {
        console.error(t("tokenNotFound"));
        setLoading(false);
        return;
      }

      const data = await fetchNowPlayingMovies(token);
      console.log("🎬 FILMES RECEBIDOS:", data);

      if (!data || data.length === 0) {
        console.warn(t("emptyListWarning"));
        setMovies([
          {
            id: 999,
            title: t("mockMovie.title"),
            posterUrl: "https://image.tmdb.org/t/p/w300/6DrHO1jr3qVrViUO6s6kFiAGM7.jpg",
            backdropUrl: "https://image.tmdb.org/t/p/original/rTh4K5uw9HypmpGslcKd4QfHl93.jpg",
            vote_average: 7.5,
            release_date: "2024-01-01",
            overview: t("mockMovie.overview"),
            genre: "Drama",
          },
        ]);
      } else {
        setMovies(data);
      }

      setLoading(false);
    };

    loadMovies();
  }, [t]);

  if (loading) {
    return (
      <div className="text-center py-10 text-white">{t("loading")}</div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="text-center py-10 text-white">
        {t("noMoviesFound")}
      </div>
    );
  }

  return <MovieCarousel title={t("carouselTitle")} movies={movies} />;
};

export default NowPlayingCarouselSection;