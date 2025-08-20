"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatedCarousel } from "@/utils/aceternity/AnimatedTestimonials";
import { loadRandomCarouselItems } from "@/services/carousel_utils";
import { CarouselItem } from "@/utils/aceternity/AnimatedTestimonials";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const RandomMoviesCarousel = () => {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("RandomMovie");
  const locale = (useLocale() as "en" | "pt") || "pt";
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
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

  const clickPrev = () => {
    const root = wrapperRef.current;
    if (!root) return;
    const arrows = root.querySelectorAll<HTMLButtonElement>(".random-arrows");
    // assume 2 setas internas: [prev, next]
    arrows[0]?.click();
  };

  const clickNext = () => {
    const root = wrapperRef.current;
    if (!root) return;
    const arrows = root.querySelectorAll<HTMLButtonElement>(".random-arrows");
    arrows[arrows.length - 1]?.click();
  };

  return (
    <div ref={wrapperRef} className="w-full">
      {/* setas internas (do AnimatedCarousel) recebem uma classe única para podermos atuar nelas */}
      <AnimatedCarousel
        items={items}
        autoplay
        arrowButtonClass="random-arrows bg-[var(--color-darkgreen)] hover:brightness-110 text-white"
      />

      {/* Controles CENTRAIS somente no mobile */}
      <div className="mt-[-4px] flex items-center justify-center gap-1 sm:hidden">
        <button
          onClick={clickPrev}
          className="h-9 w-9 rounded-full bg-[var(--color-darkgreen)] text-white flex items-center justify-center active:scale-95 transition"
          aria-label="Anterior"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          onClick={clickNext}
          className="h-9 w-9 rounded-full bg-[var(--color-darkgreen)] text-white flex items-center justify-center active:scale-95 transition"
          aria-label="Próximo"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>



      {/* Esconde as setas internas do componente no mobile, deixa só as centrais acima */}
      <style jsx global>{`
        @media (max-width: 640px) {
          .random-arrows {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
