'use client';

import { useEffect, useState } from "react";
import { Album } from "@/types/Album";
import { fetchAlbumsByGenre } from "@/services/service_album_by_genre";
import { AlbumCard } from "@/components/album-card/AlbumCard";
import { useTranslations } from "next-intl";

const genres = [
  { label: "Blues", value: "blues" },
  { label: "Country", value: "country" },
  { label: "Electronic", value: "electronic" },
  { label: "Funk", value: "funk" },
  { label: "Gospel", value: "gospel" },
  { label: "Jazz", value: "jazz" },
  { label: "Metal", value: "metal" },
  { label: "Pagode", value: "pagode" },
  { label: "Pop", value: "pop" },
  { label: "Rap", value: "rap" },
  { label: "Reggae", value: "reggae" },
  { label: "Rock", value: "rock" },
  { label: "Samba", value: "samba" },
  { label: "Sertanejo", value: "sertanejo" }
];

export function AlbumListByGenre() {
  const [selectedGenre, setSelectedGenre] = useState("rap");
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("AlbumListByGenre");

  useEffect(() => {
    const getAlbums = async () => {
      setLoading(true);
      const albumsData = await fetchAlbumsByGenre(selectedGenre);
      setAlbums(albumsData);
      setLoading(false);
    };
    getAlbums();
  }, [selectedGenre]);

  if (loading) {
    return <p className="text-center mt-10 text-white">{t("loading")}</p>;
  }

  if (albums.length === 0) {
    return <p className="text-center mt-10 text-white">{t("noAlbumsFound")}</p>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-xl font-bold">
          {selectedGenre.charAt(0).toUpperCase() + selectedGenre.slice(1)} Albums
        </h2>
        <div className="relative w-fit">
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="appearance-none bg-neutral-800 text-white px-4 py-2 pr-8 rounded-md shadow-sm border border-neutral-700 focus:outline-none focus:ring-0 active:bg-neutral-800 transition custom-scroll styled-select"
          >
            {genres.map((genre) => (
              <option key={genre.value} value={genre.value}>
                {genre.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-white text-xs">
            ▼
          </div>
        </div>
      </div>
      <section className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 justify-center">
        {albums.map((album, index) => (
          <AlbumCard key={`${album.id}-${index}`} {...album} />
        ))}
      </section>
    </>
  );
}
