"use client";

import { useEffect, useState, useRef } from "react";
import { Artist } from "@/types/Artist";
import { ArtistCard } from "@/components/artist-card/ArtistCard";
import {
  ArrowLeftIcon as IconArrowLeft,
  ArrowRightIcon as IconArrowRight,
} from "lucide-react";
import { fetchTopArtists } from "@/services/service_top_artists";
import { useTranslations } from "next-intl";

export default function TopArtistsCarouselSection() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("top_artists");

  useEffect(() => {
    const load = async () => {
      const data = await fetchTopArtists();
      setArtists(data);
      setLoading(false);
    };

    load();
  }, []);

  const handleScroll = (direction: "left" | "right") => {
    if (!carouselRef.current) return;

    const cardWidth = 160;
    const gap = 24;
    const cardsToScroll = 3;
    const scrollAmount = (cardWidth + gap) * cardsToScroll;

    const newScrollLeft =
      direction === "left"
        ? carouselRef.current.scrollLeft - scrollAmount
        : carouselRef.current.scrollLeft + scrollAmount;

    carouselRef.current.scrollTo({ left: newScrollLeft, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="text-center text-white py-10">{t("carregando")}</div>
    );
  }

  if (artists.length === 0) {
    return (
      <div className="text-center text-white py-10">{t("nenhum")}</div>
    );
  }

  return (
    <div className="w-full py-6">
      <h2 className="text-xl font-bold text-white mb-4">{t("Most_listened")}</h2>

      <div className="relative">
        <div
          id="top-artists-carousel"
          ref={carouselRef}
          className="flex gap-6 overflow-x-auto px-4 scroll-smooth"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <style jsx>{`
            #top-artists-carousel::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          {artists.map((artist, index) => (
            <ArtistCard key={artist.name} artist={artist} index={index} />
          ))}
        </div>

        <div className="flex justify-center mt-6">
          <div className="flex gap-4">
            <button
              onClick={() => handleScroll("left")}
              className="bg-darkgreen text-white h-8 w-8 flex items-center justify-center rounded-full hover:brightness-110 transition"
            >
              <IconArrowLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleScroll("right")}
              className="bg-darkgreen text-white h-8 w-8 flex items-center justify-center rounded-full hover:brightness-110 transition"
            >
              <IconArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
