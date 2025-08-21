"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft as IconArrowLeft, ArrowRight as IconArrowRight } from "lucide-react";
import { SeriesCard } from "@/components/features/serie/SeriesCard";
import type { Series } from "@/types/Series";

interface SeriesCarouselProps {
  title: string;
  series: Series[];
  autoScroll?: boolean;
  autoScrollInterval?: number;
  onRemoveSerie?: (id: number) => void;
}

export function SeriesCarousel({
  title,
  series,
  autoScroll = false,
  autoScrollInterval = 5000,
  onRemoveSerie
}: SeriesCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);

  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const movedPxRef = useRef(0);

  const updateButtons = () => {
    const el = carouselRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeftButton(scrollLeft > 0);
    setShowRightButton(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scheduleUpdateButtons = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(updateButtons);
  };

  const scroll = (direction: "left" | "right") => {
    const el = carouselRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.8;
    const newScrollLeft = direction === "left" ? el.scrollLeft - scrollAmount : el.scrollLeft + scrollAmount;
    el.scrollTo({ left: newScrollLeft, behavior: "smooth" });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = carouselRef.current;
    if (!el) return;
    setIsDragging(true);
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
    movedPxRef.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = carouselRef.current;
    if (!isDragging || !el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 2;
    movedPxRef.current = Math.max(movedPxRef.current, Math.abs(walk));
    el.scrollLeft = scrollLeftRef.current - walk;
    scheduleUpdateButtons();
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const el = carouselRef.current;
    if (!el) return;
    setIsDragging(true);
    startXRef.current = e.touches[0].pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
    movedPxRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const el = carouselRef.current;
    if (!isDragging || !el) return;
    const x = e.touches[0].pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 2;
    movedPxRef.current = Math.max(movedPxRef.current, Math.abs(walk));
    el.scrollLeft = scrollLeftRef.current - walk;
    scheduleUpdateButtons();
  };

  // listeners de scroll + cleanup com RAF (igual ao MovieCarousel)
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const onScroll = () => scheduleUpdateButtons();
    el.addEventListener("scroll", onScroll, { passive: true });
    scheduleUpdateButtons();
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [series]);

  // resize responsivo
  useEffect(() => {
    const onResize = () => scheduleUpdateButtons();
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // autoScroll opcional
  useEffect(() => {
    if (!autoScroll || series.length === 0) return;
    const id = setInterval(() => {
      const el = carouselRef.current;
      if (!el) return;
      const { scrollLeft, scrollWidth, clientWidth } = el;
      if (scrollLeft + clientWidth >= scrollWidth - 10) el.scrollTo({ left: 0, behavior: "smooth" });
      else scroll("right");
    }, autoScrollInterval);
    return () => clearInterval(id);
  }, [autoScroll, autoScrollInterval, series.length]);

  const arrowButtonClass = "bg-darkgreen text-white hover:brightness-110 transition-all";

  return (
    <section className="w-full py-4 sm:py-6">
      <div className="mb-3 sm:mb-4 px-2 sm:px-0">
        <h2 className="text-lg sm:text-xl font-bold text-white">{title}</h2>
      </div>

      <div
        ref={carouselRef}
        className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide scroll-smooth px-3 sm:px-4 select-none snap-x snap-mandatory"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleDragEnd}
        aria-label={title}
        role="list"
      >
        {series.map((serie) => (
          <div
            key={serie.id}
            className="flex-shrink-0 snap-start"
            style={{ width: "160px", maxWidth: "160px" }}
            role="listitem"
          >
            {/* Se arrastar mais de 10px, suprime open por clique acidental */}
            <div onClick={(e) => movedPxRef.current > 10 && e.preventDefault()}>
              <SeriesCard {...serie} onRemoveSerie={onRemoveSerie} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-5 sm:mt-6">
        <div className="flex gap-3 sm:gap-4">
          <button
            onClick={() => scroll("left")}
            className={`group/button flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-full ${
              !showLeftButton ? "opacity-50 cursor-not-allowed" : arrowButtonClass
            }`}
            disabled={!showLeftButton}
            aria-label="Scroll left"
          >
            <IconArrowLeft className="h-5 w-5 group-hover/button:scale-110 transition-transform" />
          </button>
          <button
            onClick={() => scroll("right")}
            className={`group/button flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-full ${
              !showRightButton ? "opacity-50 cursor-not-allowed" : arrowButtonClass
            }`}
            disabled={!showRightButton}
            aria-label="Scroll right"
          >
            <IconArrowRight className="h-5 w-5 group-hover/button:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
}
