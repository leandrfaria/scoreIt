"use client";

import { useEffect, useState } from "react";
import { Album } from "@/types/Album";
import { fetchNewAlbumReleases } from "@/services/service_album_releases";
import { AlbumCarousel } from "@/components/album-carousel/AlbumCarousel";
import { useTranslations } from "next-intl";


const RecentsAlbumCarousel = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("RecentAlbumListByGenre");

  useEffect(() => {
    const loadAlbums = async () => {
      const data = await fetchNewAlbumReleases();
      setAlbums(data);
      setLoading(false);
    };

    loadAlbums();
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
