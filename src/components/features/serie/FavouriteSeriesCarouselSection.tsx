"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { fetchFavouriteSeries } from "@/services/series/get_fav_series";
import { useMember } from "@/context/MemberContext";
import { Series } from "@/types/Series";
import { SeriesCarousel } from "./SeriesCarousel";

type Props = { memberId?: string };

const FavouriteSeriesCarouselSection = ({ memberId }: Props) => {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("NowPlayingCarousel");
  const { member } = useMember();
  const locale = useLocale();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const idToUse = memberId ?? String(member?.id ?? "");
      if (!idToUse) { setLoading(false); return; }
      try {
        const data = await fetchFavouriteSeries(
          localStorage.getItem("authToken") ?? "",
          idToUse,
          locale
        );
        if (mounted) setSeries(data);
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [memberId, member, locale]);

  if (loading) return <div className="text-center py-10 text-gray-300 animate-pulse">{t("loadingFavSeries")}</div>;
  if (series.length === 0)
    return (
      <div className="text-center py-10 text-gray-400">
        <p className="text-lg font-semibold">{t("noFavSeries")}</p>
        <p className="text-sm mt-2">{t("noSeriesFound")}</p>
      </div>
    );

  return <SeriesCarousel title={t("SeriesFavoritos")} series={series} onRemoveSerie={(id) => setSeries((prev) => prev.filter((s) => s.id !== id))} />;
};

export default FavouriteSeriesCarouselSection;
