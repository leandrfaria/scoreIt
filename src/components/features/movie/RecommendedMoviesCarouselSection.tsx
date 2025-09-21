// src/components/features/movie/RecommendedMoviesCarouselSection.tsx
"use client";

import { useEffect, useState } from "react";
import { Movie } from "@/types/Movie";
import { MovieCarousel } from "@/components/features/movie/MovieCarousel";
import { useMember } from "@/context/MemberContext";
import { fetchMovieRecommendations } from "@/services/recommendations/recommendations";

type Props = {
  /** Título exibido acima do carrossel (opcional) */
  title?: string;
  /** Intervalo de auto-scroll em ms (opcional) */
  autoScrollInterval?: number;
};

export default function RecommendedMoviesCarouselSection({
  title = "Recomendados para você",
  autoScrollInterval = 6000,
}: Props) {
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
        const list = await fetchMovieRecommendations(member.id);
        if (!controller.signal.aborted) setMovies(list);
      } catch (e) {
        if (!controller.signal.aborted) {
          console.error("Falha ao carregar recomendações (filmes):", e);
          setMovies([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [member?.id]);

  if (!member?.id) {
    return <div className="text-center py-8 sm:py-10 text-white/80">Faça login para ver recomendações de filmes.</div>;
  }

  if (loading) return <div className="text-center py-8 sm:py-10 text-white">Carregando recomendações…</div>;
  if (movies.length === 0) {
    return <div className="text-center py-8 sm:py-10 text-white/80">Ainda não há recomendações de filmes para você.</div>;
  }

  return (
    <MovieCarousel
      title={title}
      movies={movies}
      autoScroll
      autoScrollInterval={autoScrollInterval}
    />
  );
}
