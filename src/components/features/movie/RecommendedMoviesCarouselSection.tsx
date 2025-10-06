"use client";

import { useEffect, useState } from "react";
import { Movie } from "@/types/Movie";
import { MovieCarousel } from "@/components/features/movie/MovieCarousel";
import { useMember } from "@/context/MemberContext";
import { fetchMovieRecommendations } from "@/services/recommendations/recommendations";
import { useLocale, useTranslations } from "next-intl";

type Props = {
  /** Título exibido acima do carrossel (opcional) */
  title?: string;
  /** Intervalo de auto-scroll em ms (opcional) */
  autoScrollInterval?: number;
};

export default function RecommendedMoviesCarouselSection({
  title,
  autoScrollInterval = 6000,
}: Props) {
  const t = useTranslations("recomendados");
  const locale = useLocale(); // pega o idioma atual do Next.js
  const { member } = useMember();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        if (!member?.id) {
          setMovies([]);
          return;
        }
        // Passa o locale para o backend
        const list = await fetchMovieRecommendations(member.id, locale);
        if (!controller.signal.aborted) setMovies(list);
      } catch (e) {
        if (!controller.signal.aborted) {
          console.error(t("moviesLoadError"), e);
          setMovies([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [member?.id, t, locale]);

  if (!member?.id) {
    return (
      <div className="text-center py-8 sm:py-10 text-white/80">
        {t("loginToSeeMovies")}
      </div>
    );
  }

  if (loading)
    return (
      <div className="text-center py-8 sm:py-10 text-white">
        {t("loadingMovies")}
      </div>
    );

  if (movies.length === 0) {
    return (
      <div className="text-center py-8 sm:py-10 text-white/80">
        {t("noRecommendedMovies")}
      </div>
    );
  }

  return (
    <MovieCarousel
      title={title || t("recommendedForYou")}
      movies={movies.map(m => ({
        ...m,
        genre: (m.genres ?? []).map(g => g.name).join(", "), // garante array mesmo se undefined
      }))}
      autoScroll
      autoScrollInterval={autoScrollInterval}
    />
  );
}
