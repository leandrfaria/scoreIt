"use client";

import { AnimatedCarousel } from "@/utils/aceternity/AnimatedTestimonials";
import { useEffect, useState } from "react";
import { loadRandomCarouselItems } from "@/services/carousel_utils";
import { CarouselItem } from "@/utils/aceternity/AnimatedTestimonials";

export const RandomMoviesCarousel = () => {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const carouselItems = await loadRandomCarouselItems();
        setItems(carouselItems);
      } catch (error) {
        console.error("Erro ao carregar filmes:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return loading ? (
    <p className="text-gray-400 text-center">Carregando filmes...</p>
  ) : items.length > 0 ? (
    <AnimatedCarousel
      items={items}
      autoplay={true}
      arrowButtonClass="bg-[var(--color-darkgreen)] hover:brightness-110 text-white"
      detailButtonClass="bg-[var(--color-darkgreen)] hover:brightness-110 text-white"
    />
  ) : (
    <p className="text-gray-400 text-center">Nenhum filme encontrado.</p>
  );
};
