// src/components/features/album/TopAlbums.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchTopAlbums } from "@/services/album/top_albums";
import type { Album } from "@/types/Album";
import { AlbumCarousel } from "@/components/features/album/AlbumCarousel";

export default function TopAlbums() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const list = await fetchTopAlbums(signal);
        setAlbums(list);
      } catch (e) {
        console.error("Erro ao carregar Top Álbuns:", e);
        setErr("Não foi possível carregar os Top Álbuns.");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  const Skeleton = useMemo(
    () =>
      function Skeleton() {
        return (
          <div className="flex gap-4 overflow-hidden px-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse w-[150px] shrink-0">
                <div className="rounded-xl bg-neutral-800/60 h-[150px] w-[150px]" />
                <div className="mt-2 h-4 bg-neutral-800/60 rounded w-28" />
                <div className="mt-1 h-3 bg-neutral-800/60 rounded w-20" />
              </div>
            ))}
          </div>
        );
      },
    []
  );

  if (loading) {
    return (
      <section className="w-full py-6">
        <div className="flex items-end justify-between mb-4 px-1">
          <h2 className="text-lg sm:text-xl font-bold text-white">Top álbuns</h2>
        </div>
        <Skeleton />
      </section>
    );
  }

  if (err || albums.length === 0) {
    return null;
  }

  return <AlbumCarousel title="Top álbuns" albums={albums} />;
}
