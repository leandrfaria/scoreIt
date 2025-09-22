"use client";

import { useEffect, useState } from "react";
import { Series } from "@/types/Series";
import { SeriesCarousel } from "@/components/features/serie/SeriesCarousel";
import { useMember } from "@/context/MemberContext";
import { fetchSeriesRecommendations } from "@/services/recommendations/recommendations";
import { useTranslations } from "next-intl";

type Props = {
  /** Título exibido acima do carrossel (opcional) */
  title?: string;
  /** Intervalo de auto-scroll em ms (opcional) */
  autoScrollInterval?: number;
};

export default function RecommendedSeriesCarouselSection({
  title,
  autoScrollInterval = 6000,
}: Props) {
  const t = useTranslations("recomendadoSeries");
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
          console.error(t("seriesLoadError"), e);
          setSeries([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [member?.id, t]);

  if (!member?.id) {
    return (
      <div className="text-center py-8 sm:py-10 text-white/80">
        {t("loginToSeeSeries")}
      </div>
    );
  }

  if (loading)
    return (
      <div className="text-center py-8 sm:py-10 text-white">
        {t("loadingSeries")}
      </div>
    );

  if (series.length === 0) {
    return (
      <div className="text-center py-8 sm:py-10 text-white/80">
        {t("noRecommendedSeries")}
      </div>
    );
  }

  return (
    <SeriesCarousel
      title={title || t("recommendedForYou")}
      series={series}
      autoScroll
      autoScrollInterval={autoScrollInterval}
    />
  );
}
