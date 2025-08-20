"use client";

import { useEffect, useState } from "react";
import { Album } from "@/types/Album";
import { fetchNewAlbumReleases } from "@/services/album/releases";
import { AlbumCarousel } from "@/components/features/album/AlbumCarousel";
import { useTranslations } from "next-intl";

const RecentsAlbumCarousel = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("RecentAlbumListByGenre");

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    (async () => {
      const data = await fetchNewAlbumReleases(signal);
      setAlbums(data);
      setLoading(false);
    })();

    return () => controller.abort();
  }, []);

  if (loading) {
    return <div className="text-center py-10 text-white">{t("loading")}</div>;
  }

  if (albums.length === 0) {
    return <div className="text-center py-10 text-white">{t("noAlbumsFound")}</div>;
  }

  return <AlbumCarousel title="Álbuns lançados recentemente" albums={albums} />;
};

export default RecentsAlbumCarousel;
