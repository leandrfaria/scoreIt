// src/components/features/movie/NowPlayingCarouselSection.tsx
"use client";

import { useEffect, useState } from "react";
import { fetchNowPlayingMovies } from "@/services/movie/now_playing";
import { Movie } from "@/types/Movie";
import { MovieCarousel } from "./MovieCarousel";
import { useTranslations } from "next-intl";

const NowPlayingCarouselSection = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("NowPlayingCarousel");

  useEffect(() => {
    const loadMovies = async () => {
      try {
        const list = await fetchNowPlayingMovies();
        setMovies(list);
      } catch (e) {
        console.error(e);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };
    loadMovies();
  }, []);

  if (loading) return <div className="text-center py-10 text-white">{t("loading")}</div>;
  if (movies.length === 0) return <div className="text-center py-10 text-white">{t("noMoviesFound")}</div>;

  return <MovieCarousel title={t("carouselTitle")} movies={movies} />;
};

export default NowPlayingCarouselSection;
