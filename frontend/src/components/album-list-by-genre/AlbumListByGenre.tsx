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
  { label: "Sertanejo", value: "sertanejo" },
];

const limitOptions = [10, 20, 30, 40, 50];

export function AlbumListByGenre() {
  const [selectedGenre, setSelectedGenre] = useState("rap");
  const [allAlbums, setAllAlbums] = useState<Album[]>([]);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("AlbumListByGenre");

  useEffect(() => {
    const fetchAlbums = async () => {
      setLoading(true);
      const data = await fetchAlbumsByGenre(selectedGenre, 0, limit);
      setAllAlbums(data);
      setLoading(false);
    };
    fetchAlbums();
  }, [selectedGenre, limit]);

  const handleGenreChange = (value: string) => {
    setSelectedGenre(value);
    setLimit(10);
  };

  const handleLimitChange = (value: number) => {
    setLimit(value);
  };

  if (loading) {
    return <p className="text-center mt-10 text-white">{t("loading")}</p>;
  }

  if (allAlbums.length === 0) {
    return <p className="text-center mt-10 text-white">{t("noAlbumsFound")}</p>;
  }

  const albumsToShow = allAlbums.slice(0, limit);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <h2 className="text-white text-xl font-bold">
          {selectedGenre.charAt(0).toUpperCase() + selectedGenre.slice(1)} Albums
        </h2>

        <div className="relative w-fit">
          <select
            value={selectedGenre}
            onChange={(e) => handleGenreChange(e.target.value)}
            className="bg-[#1a1a1a] text-white px-4 py-2 rounded-md shadow-sm border border-neutral-700 focus:outline-none focus:ring-0 transition custom-scroll styled-select"
            style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
          >
            {genres.map((genre) => (
              <option key={genre.value} value={genre.value}>
                {genre.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 justify-center transition-all duration-500">
        {albumsToShow.map((album, index) => (
          <AlbumCard key={`${album.id}-${index}`} {...album} />
        ))}
      </section>

      <div className="flex justify-center mt-10 mb-20">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white">{t("albunsAparecendo")}</span>
          <select
            value={limit}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            className="appearance-none bg-[#1a1a1a] text-white px-3 py-2 rounded-md shadow-sm border border-neutral-700 focus:outline-none focus:ring-0 transition text-center custom-scroll styled-select"
            style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
          >
            {limitOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}
