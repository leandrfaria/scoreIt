"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { fetchFavouriteSeries } from "@/services/series/get_fav_series";
import { useMember } from "@/context/MemberContext";
import { Series } from "@/types/Series";
import { SeriesCarousel } from "./SeriesCarousel";

type Props = {
  memberId?: string;
};

const FavouriteSeriesCarouselSection = ({ memberId }: Props) => {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("NowPlayingCarousel");
  const { member } = useMember();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const token = localStorage.getItem("authToken");
      const idToUse = memberId ?? String(member?.id);

      if (!token || !idToUse) {
        console.error(t("tokenNotFound"));
        if (mounted) setLoading(false);
        return;
      }

      const data = await fetchFavouriteSeries(token, idToUse);
      if (mounted) {
        setSeries(data);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [t, memberId, member]);

  if (loading) return <div className="text-center py-10 text-white">{t("loadingFavSeries")}</div>;
  if (series.length === 0) return <div className="text-center py-10 text-white">{t("noFavSeries")}</div>;

  const handleRemoveSerie = (id: number) => {
    setSeries((prev) => prev.filter((s) => s.id !== id));
  };

  return <SeriesCarousel title={t("SeriesFavoritos")} series={series} onRemoveSerie={handleRemoveSerie} />;
};

export default FavouriteSeriesCarouselSection;
