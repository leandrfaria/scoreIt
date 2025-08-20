// src/components/features/album/RecentsAlbumCarousel.tsx
"use client";

import { useEffect, useState } from "react";
import { Album } from "@/types/Album";
import { fetchNewAlbumReleases } from "@/services/album/releases";
import { AlbumCarousel } from "@/components/features/album/AlbumCarousel";
import { useTranslations } from "next-intl";

const RecentsAlbumCarousel = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("RecentAlbumListByGenre");

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    (async () => {
      try {
        const data = await fetchNewAlbumReleases(signal);
        setAlbums(data);
      } catch (err) {
        console.error("Erro ao carregar releases:", err);
        // ⚠️ evita key inexistente no namespace tipado
        setError("Erro ao carregar lançamentos.");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  const Skeleton = () => (
    <div className="animate-pulse">
      <div className="rounded-xl bg-neutral-800/60 h-[42vw] max-h-[190px] sm:h-[190px] w-[46vw] max-w-[190px]" />
      <div className="mt-2 h-4 bg-neutral-800/60 rounded w-3/4" />
      <div className="mt-1 h-3 bg-neutral-800/60 rounded w-1/2" />
    </div>
  );

  if (loading) {
    return (
      <section className="w-full py-6">
        <div className="flex items-end justify-between mb-4 px-1">
          <h2 className="text-lg sm:text-xl font-bold text-white">{t("loading")}</h2>
        </div>
        <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 justify-center">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return <div className="text-center py-10 text-red-400">{error}</div>;
  }

  if (albums.length === 0) {
    return <div className="text-center py-10 text-white">{t("noAlbumsFound")}</div>;
  }

  return <AlbumCarousel title="Álbuns lançados recentemente" albums={albums} />;
};

export default RecentsAlbumCarousel;
