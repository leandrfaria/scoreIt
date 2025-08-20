"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { AlbumCard } from "@/components/features/album/AlbumCard";
import { Album } from "@/types/Album";
import { ArrowLeft as IconArrowLeft, ArrowRight as IconArrowRight } from "lucide-react";

interface AlbumCarouselProps {
  title: string;
  albums: Album[];
  onRemoveAlbum?: (id: string) => void;
}

export function AlbumCarousel({ title, albums, onRemoveAlbum }: AlbumCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const checkScrollButtons = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeft(scrollLeft > 0);
    setShowRight(scrollLeft < scrollWidth - clientWidth - 8);
  }, []);

  const scroll = useCallback((direction: "left" | "right") => {
    const el = carouselRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.85;
    const newScrollLeft = direction === "left" ? el.scrollLeft - scrollAmount : el.scrollLeft + scrollAmount;
    el.scrollTo({ left: newScrollLeft, behavior: "smooth" });
  }, []);

  // Atualiza exibição dos botões em resize e quando a lista muda
  useEffect(() => {
    checkScrollButtons();
    const el = carouselRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScrollButtons);
    return () => el.removeEventListener("scroll", checkScrollButtons);
  }, [albums, checkScrollButtons]);

  useEffect(() => {
    const onResize = () => checkScrollButtons();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [checkScrollButtons]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        scroll("left");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        scroll("right");
      }
    },
    [scroll]
  );

  return (
    <section className="w-full py-6">
      <div className="flex items-end justify-between mb-4 px-1">
        <h2 className="text-lg sm:text-xl font-bold text-white">{title}</h2>
      </div>

      <div className="relative">
        {/* Gradientes nas bordas (somente quando há overflow) */}
        {showLeft && (
          <div className="pointer-events-none absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-black/70 to-transparent rounded-l-lg" />
        )}
        {showRight && (
          <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-black/70 to-transparent rounded-r-lg" />
        )}

        <div
          ref={carouselRef}
          role="region"
          aria-label={title}
          tabIndex={0}
          onKeyDown={onKeyDown}
          className="
            flex gap-4 sm:gap-6 overflow-x-auto px-3 sm:px-4 pb-2
            scroll-smooth scrollbar-hide snap-x snap-mandatory
            [&>*]:snap-start
          "
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {albums.map((album) => (
            <AlbumCard key={album.id} {...album} onRemoveAlbum={onRemoveAlbum} />
          ))}
        </div>

        {/* Botões flutuantes (desktop) */}
        <div className="hidden md:flex items-center justify-between pointer-events-none">
          <button
            onClick={() => scroll("left")}
            disabled={!showLeft}
            aria-label="Scroll left"
            className={`pointer-events-auto absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full transition
              ${!showLeft ? "opacity-0" : "bg-darkgreen text-white hover:brightness-110 shadow-lg"}`}
          >
            <IconArrowLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!showRight}
            aria-label="Scroll right"
            className={`pointer-events-auto absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full transition
              ${!showRight ? "opacity-0" : "bg-darkgreen text-white hover:brightness-110 shadow-lg"}`}
          >
            <IconArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Controles (mobile) */}
      <div className="md:hidden flex justify-center mt-5 gap-3">
        <button
          onClick={() => scroll("left")}
          disabled={!showLeft}
          aria-label="Scroll left"
          className={`h-9 w-9 flex items-center justify-center rounded-full transition
          ${!showLeft ? "opacity-50 cursor-not-allowed ring-1 ring-white/10" : "bg-darkgreen text-white hover:brightness-110"}`}
        >
          <IconArrowLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => scroll("right")}
          disabled={!showRight}
          aria-label="Scroll right"
          className={`h-9 w-9 flex items-center justify-center rounded-full transition
          ${!showRight ? "opacity-50 cursor-not-allowed ring-1 ring-white/10" : "bg-darkgreen text-white hover:brightness-110"}`}
        >
          <IconArrowRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}
