"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeftIcon as IconArrowLeft, ArrowRightIcon as IconArrowRight } from "lucide-react";
import { SeriesCard } from "@/components/series-card/SeriesCard";
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
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const checkScrollButtons = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setShowLeftButton(scrollLeft > 0);
    setShowRightButton(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: "left" | "right") => {
    if (!carouselRef.current) return;
    const scrollAmount = carouselRef.current.clientWidth * 0.8;
    const newScrollLeft =
      direction === "left"
        ? carouselRef.current.scrollLeft - scrollAmount
        : carouselRef.current.scrollLeft + scrollAmount;
    carouselRef.current.scrollTo({ left: newScrollLeft, behavior: "smooth" });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (carouselRef.current?.offsetLeft || 0));
    setScrollLeft(carouselRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (carouselRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - (carouselRef.current?.offsetLeft || 0));
    setScrollLeft(carouselRef.current?.scrollLeft || 0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - (carouselRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  useEffect(() => {
    if (autoScroll && series.length > 0) {
      const interval = setInterval(() => {
        if (carouselRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
          if (scrollLeft + clientWidth >= scrollWidth - 10) {
            carouselRef.current.scrollTo({ left: 0, behavior: "smooth" });
          } else {
            scroll("right");
          }
        }
      }, autoScrollInterval);

      return () => clearInterval(interval);
    }
  }, [autoScroll, autoScrollInterval, series.length]);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener("scroll", checkScrollButtons);
      checkScrollButtons();
      return () => carousel.removeEventListener("scroll", checkScrollButtons);
    }
  }, [series]);

  useEffect(() => {
    window.addEventListener("resize", checkScrollButtons);
    return () => window.removeEventListener("resize", checkScrollButtons);
  }, []);

  const arrowButtonClass = "bg-darkgreen text-white hover:brightness-110 transition-all";

  return (
    <div className="w-full py-6">
      <div className="mb-4">
        <h2 className="text-xl md:text-xl font-bold text-white">{title}</h2>
      </div>

      <div
        ref={carouselRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth px-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleDragEnd}
      >
        {series.map((serie) => (
          <div
            key={serie.id}
            className="flex-shrink-0"
            style={{ width: "190px", maxWidth: "190px" }}
          >
            <SeriesCard {...serie} onRemoveSerie={onRemoveSerie} />
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-6">
        <div className="flex gap-4">
          <button
            onClick={() => scroll("left")}
            className={`group/button flex h-8 w-8 items-center justify-center rounded-full ${!showLeftButton ? "opacity-50 cursor-not-allowed" : arrowButtonClass
              }`}
            disabled={!showLeftButton}
            aria-label="Scroll left"
          >
            <IconArrowLeft className="h-5 w-5 group-hover/button:scale-110 transition-transform" />
          </button>
          <button
            onClick={() => scroll("right")}
            className={`group/button flex h-8 w-8 items-center justify-center rounded-full ${!showRightButton ? "opacity-50 cursor-not-allowed" : arrowButtonClass
              }`}
            disabled={!showRightButton}
            aria-label="Scroll right"
          >
            <IconArrowRight className="h-5 w-5 group-hover/button:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
