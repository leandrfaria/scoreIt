'use client';

import { useEffect, useState } from "react";
import { Album } from "@/types/Album";
import { fetchAlbumsByGenre } from "@/services/service_album_by_genre";
import { AlbumCard } from "@/components/album-card/AlbumCard";
import { useTranslations } from "next-intl";

interface AlbumListByGenreProps {
  genre: string;
}

export function AlbumListByGenre({ genre }: AlbumListByGenreProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("AlbumListByGenre");

  useEffect(() => {
    const getAlbums = async () => {
      const albumsData = await fetchAlbumsByGenre(genre);
      setAlbums(albumsData);
      setLoading(false);
    };

    getAlbums();
  }, [genre]);

  if (loading) {
    return <p className="text-center mt-10 text-white">{t('loading')}</p>;
  }

  if (albums.length === 0) {
    return <p className="text-center mt-10 text-white">{t('noAlbumsFound')}</p>;
  }

  return (
    <section className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 justify-center">
      {albums.map((album) => (
        <AlbumCard key={album.id} {...album} />
      ))}
    </section>
  );
}
