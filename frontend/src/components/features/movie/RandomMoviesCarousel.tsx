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
  const locale = useLocale(); // 👈 pega o locale

  useEffect(() => {
    const load = async () => {
      try {
        const carouselItems = await loadRandomCarouselItems(locale as "en" | "pt"); // 👈 passa o locale
        setItems(carouselItems);
      } catch (error) {
        console.error("Erro ao carregar filmes:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [locale]);

  if (loading) {
    return <p className="text-gray-400 text-center">{t("loading")}</p>;
  }

  if (items.length === 0) {
    return <p className="text-gray-400 text-center">{t("notFound")}</p>
  }

  return (
    <AnimatedCarousel
      items={items}
      autoplay={true}
      arrowButtonClass="bg-[var(--color-darkgreen)] hover:brightness-110 text-white"
      detailButtonClass="bg-[var(--color-darkgreen)] hover:brightness-110 text-white"
    />
  )
};
