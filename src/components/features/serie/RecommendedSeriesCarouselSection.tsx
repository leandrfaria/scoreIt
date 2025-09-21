// src/components/features/serie/RecommendedSeriesCarouselSection.tsx
"use client";

import { useEffect, useState } from "react";
import { Series } from "@/types/Series";
import { SeriesCarousel } from "@/components/features/serie/SeriesCarousel";
import { useMember } from "@/context/MemberContext";
import { fetchSeriesRecommendations } from "@/services/recommendations/recommendations";

type Props = {
  /** Título exibido acima do carrossel (opcional) */
  title?: string;
  /** Intervalo de auto-scroll em ms (opcional) */
  autoScrollInterval?: number;
};

export default function RecommendedSeriesCarouselSection({
  title = "Recomendados para você",
  autoScrollInterval = 6000,
}: Props) {
  const { member } = useMember();
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        if (!member?.id) {
          setSeries([]);
          return;
        }
        const list = await fetchSeriesRecommendations(member.id);
        if (!controller.signal.aborted) setSeries(list);
      } catch (e) {
        if (!controller.signal.aborted) {
          console.error("Falha ao carregar recomendações (séries):", e);
          setSeries([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [member?.id]);

  if (!member?.id) {
    return <div className="text-center py-8 sm:py-10 text-white/80">Faça login para ver recomendações de séries.</div>;
  }

  if (loading) return <div className="text-center py-8 sm:py-10 text-white">Carregando recomendações…</div>;
  if (series.length === 0) {
    return <div className="text-center py-8 sm:py-10 text-white/80">Ainda não há recomendações de séries para você.</div>;
  }

  return (
    <SeriesCarousel
      title={title}
      series={series}
      autoScroll
      autoScrollInterval={autoScrollInterval}
    />
  );
}
