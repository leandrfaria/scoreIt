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
    const controller = new AbortController();

    const loadMovies = async () => {
      try {
        const list = await fetchNowPlayingMovies();
        if (!controller.signal.aborted) setMovies(list);
      } catch (e) {
        if (!controller.signal.aborted) {
          console.error(e);
          setMovies([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadMovies();
    return () => controller.abort();
  }, []);

  if (loading) return <div className="text-center py-8 sm:py-10 text-white">{t("loading")}</div>;
  if (movies.length === 0) return <div className="text-center py-8 sm:py-10 text-white">{t("noMoviesFound")}</div>;

  return <MovieCarousel title={t("carouselTitle")} movies={movies} autoScroll autoScrollInterval={6000} />;
};

export default NowPlayingCarouselSection;
