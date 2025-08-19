"use client";

import { useEffect, useState } from "react";
import { AnimatedCarousel } from "@/utils/aceternity/AnimatedTestimonials";
import { loadRandomCarouselItems } from "@/services/carousel_utils";
import { CarouselItem } from "@/utils/aceternity/AnimatedTestimonials";
import { useTranslations, useLocale } from "next-intl";

export const RandomMoviesCarousel = () => {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("RandomMovie");
  const locale = (useLocale() as "en" | "pt") || "pt";

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // ✅ a função aceita apenas 1 argumento
        const carouselItems = await loadRandomCarouselItems(locale);
        if (mounted) setItems(carouselItems);
      } catch (error) {
        if (mounted) console.error("Erro ao carregar filmes:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [locale]);

  if (loading) return <p className="text-gray-400 text-center">{t("loading")}</p>;
  if (items.length === 0) return <p className="text-gray-400 text-center">{t("notFound")}</p>;

  return (
    <AnimatedCarousel
      items={items}
      autoplay
      arrowButtonClass="bg-[var(--color-darkgreen)] hover:brightness-110 text-white"
    />
  );
};
