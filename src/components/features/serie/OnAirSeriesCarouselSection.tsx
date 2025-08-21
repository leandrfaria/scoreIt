"use client";

import { useEffect, useState } from "react";
import { fetchOnAirSeries } from "@/services/series/on_air";
import { Series } from "@/types/Series";
import { SeriesCarousel } from "@/components/features/serie/SeriesCarousel";
import { useTranslations } from "next-intl";

const OnAirSeriesCarouselSection = () => {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("NowPlayingCarousel");

  useEffect(() => {
    const controller = new AbortController();

    const loadSeries = async () => {
      try {
        // Mantemos a assinatura original do service (aceita token), mas ele usa apiFetch internamente.
        const token = localStorage.getItem("authToken") ?? "";
        const list = await fetchOnAirSeries(token);
        if (!controller.signal.aborted) setSeries(list);
      } catch (e) {
        if (!controller.signal.aborted) {
          console.error(e);
          setSeries([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadSeries();
    return () => controller.abort();
  }, []);

  if (loading) return <div className="text-center py-8 sm:py-10 text-white">{t("loading")}</div>;
  if (series.length === 0) return <div className="text-center py-8 sm:py-10 text-white">{t("noMoviesFound")}</div>;

  return (
    <SeriesCarousel
      title={t("seriesTitle")}
      series={series}
      autoScroll
      autoScrollInterval={6000}
    />
  );
};

export default OnAirSeriesCarouselSection;
