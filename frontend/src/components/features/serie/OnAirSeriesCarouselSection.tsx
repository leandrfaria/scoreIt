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
    const loadSeries = async () => {
      const token = localStorage.getItem("authToken");

      if (!token) {
        console.error(t("tokenNotFound"));
        setLoading(false);
        return;
      }

      const data = await fetchOnAirSeries(token);

      if (!data || data.length === 0) {
        console.warn(t("emptyListWarning"));
        setSeries([
          {
            id: 9999,
            name: t("mockMovie.title"),
            posterUrl: "https://image.tmdb.org/t/p/w300/6DrHO1jr3qVrViUO6s6kFiAGM7.jpg",
            backdropUrl: "https://image.tmdb.org/t/p/original/rTh4K5uw9HypmpGslcKd4QfHl93.jpg",
            vote_average: 7.5,
            release_date: "2024-01-01",
            overview: t("mockMovie.overview"),
            genres: []
          },
        ]);
      } else {
        setSeries(data);
      }

      setLoading(false);
    };

    loadSeries();
  }, [t]);

  if (loading) {
    return (
      <div className="text-center py-10 text-white">{t("loading")}</div>
    );
  }

  if (series.length === 0) {
    return (
      <div className="text-center py-10 text-white">
        {t("noMoviesFound")}
      </div>
    );
  }

  return <SeriesCarousel title={t("seriesTitle")} series={series} />;
};

export default OnAirSeriesCarouselSection;
