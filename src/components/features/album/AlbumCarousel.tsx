"use client";

import { useRef, useState, useEffect } from "react";
import { AlbumCard } from "@/components/features/album/AlbumCard";
import { Album } from "@/types/Album";
import {
  ArrowLeft as IconArrowLeft,
  ArrowRight as IconArrowRight,
} from "lucide-react";

interface AlbumCarouselProps {
  title: string;
  albums: Album[];
  onRemoveAlbum?: (id: string) => void;
}

export function AlbumCarousel({ title, albums, onRemoveAlbum }: AlbumCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);

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

    carouselRef.current.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    checkScrollButtons();
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener("scroll", checkScrollButtons);
      return () => carousel.removeEventListener("scroll", checkScrollButtons);
    }
  }, [albums]);

  useEffect(() => {
    window.addEventListener("resize", checkScrollButtons);
    return () => window.removeEventListener("resize", checkScrollButtons);
  }, []);

  return (
    <section className="w-full py-6">
      <h2 className="text-xl font-bold text-white mb-4">{title}</h2>

      <div
        ref={carouselRef}
        className="flex gap-6 overflow-x-auto px-4 scroll-smooth scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {albums.map((album) => (
          <AlbumCard key={album.id} {...album} onRemoveAlbum={onRemoveAlbum} />
        ))}
      </div>

      <div className="flex justify-center mt-6 gap-4">
        <button
          onClick={() => scroll("left")}
          className={`h-9 w-9 flex items-center justify-center rounded-full ${
            !showLeftButton ? "opacity-50 cursor-not-allowed ring-1 ring-white/10" : "bg-darkgreen text-white hover:brightness-110"
          }`}
          disabled={!showLeftButton}
          aria-label="Scroll left"
        >
          <IconArrowLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => scroll("right")}
          className={`h-9 w-9 flex items-center justify-center rounded-full ${
            !showRightButton ? "opacity-50 cursor-not-allowed ring-1 ring-white/10" : "bg-darkgreen text-white hover:brightness-110"
          }`}
          disabled={!showRightButton}
          aria-label="Scroll right"
        >
          <IconArrowRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}
