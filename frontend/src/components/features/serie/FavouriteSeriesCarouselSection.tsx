"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { fetchFavouriteSeries } from "@/services/series/get_fav_series";
import { useMember } from "@/context/MemberContext";
import { Series } from "@/types/Series";
import { SeriesCarousel } from "./SeriesCarousel";

const FavouriteSeriesCarouselSection = () => {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("NowPlayingCarousel");
  const { member } = useMember();

  useEffect(() => {
    const loadSeries = async () => {
      const token = localStorage.getItem("authToken");

      if (!token || !member?.id) {
        console.error(t("tokenNotFound"));
        setLoading(false);
        return;
      }

      const data = await fetchFavouriteSeries(token, String(member.id));
      setSeries(data);

      setLoading(false);
    };

    loadSeries();
  }, [t, member]);

  if (loading) {
    return (
      <div className="text-center py-10 text-white">{t("loadingFavSeries")}</div>
    );
  }

  if (series.length === 0) {
    return (
      <div className="text-center py-10 text-white">
        {t("noFavSeries")}
        </div>
    );
  }

  const handleRemoveSerie = (id: number) => {
    setSeries((prevSeries) => prevSeries.filter((serie) => serie.id !== id));
  };  

  return <SeriesCarousel title={t("SeriesFavoritos")} series={series}  onRemoveSerie={handleRemoveSerie}/>;
};

export default FavouriteSeriesCarouselSection;
