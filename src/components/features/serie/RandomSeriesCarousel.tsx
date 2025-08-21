"use client";

import { useEffect, useState } from "react";
import { AnimatedCarousel, CarouselItem } from "@/utils/aceternity/AnimatedTestimonials";
import { fetchPopularSeries } from "@/services/series/popular";
import { useTranslations, useLocale } from "next-intl";

export const RandomSeriesCarousel = () => {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("RandomMovie");
  const locale = useLocale();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const series = await fetchPopularSeries();
        const randomSeries = series.sort(() => 0.5 - Math.random()).slice(0, 3);

        const formattedItems: CarouselItem[] = randomSeries.map((serie) => ({
          id: serie.id,
          title: serie.name,
          description: serie.overview?.trim() ? serie.overview : t("noDescription"),
          image: serie.backdropUrl,
          poster: serie.posterUrl ?? undefined,
          rating: serie.vote_average,
          buttonLabel: t("detailButton"),
        }));

        if (mounted) setItems(formattedItems);
      } catch (error) {
        console.error("Erro ao carregar séries:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [locale, t]);

  if (loading) return <p className="text-gray-400 text-center">{t("loading")}</p>;
  if (items.length === 0) return <p className="text-gray-400 text-center">{t("notFound")}</p>;

  return (
    <AnimatedCarousel
      items={items}
      autoplay={true}
      arrowButtonClass="bg-[var(--color-darkgreen)] hover:brightness-110 text-white"
    />
  );
};
