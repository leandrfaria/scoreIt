"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { Album } from "@/types/Album";
import { fetchAlbumsByGenre, fetchAlbumsByName } from "@/services/album/by_genre";
import { AlbumCard } from "@/components/features/album/AlbumCard";
import { useTranslations } from "next-intl";
import { FaSearch, FaTimes } from "react-icons/fa";

export function AlbumListByGenre() {
  const [selectedGenre, setSelectedGenre] = useState<string>("rap");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [allAlbums, setAllAlbums] = useState<Album[]>([]);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [genres, setGenres] = useState<{ id: number; name: string; value: string }[]>([]);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const t = useTranslations("AlbumListByGenre");

  const limitOptions = [10, 20, 30, 40, 50];

  // lista de gêneros (mock) — memoizada
  const mockGenres = useMemo(
    () => [
      { id: 1, name: "Blues", value: "blues" },
      { id: 2, name: "Country", value: "country" },
      { id: 3, name: "Electronic", value: "electronic" },
      { id: 4, name: "Funk", value: "funk" },
      { id: 5, name: "Gospel", value: "gospel" },
      { id: 6, name: "Jazz", value: "jazz" },
      { id: 7, name: "Metal", value: "metal" },
      { id: 8, name: "Pagode", value: "pagode" },
      { id: 9, name: "Pop", value: "pop" },
      { id: 10, name: "Rap", value: "rap" },
      { id: 11, name: "Reggae", value: "reggae" },
      { id: 12, name: "Rock", value: "rock" },
      { id: 13, name: "Samba", value: "samba" },
      { id: 14, name: "Sertanejo", value: "sertanejo" },
    ],
    []
  );

  useEffect(() => {
    setGenres(mockGenres);
  }, [mockGenres]);

  // Debounce da busca
  useEffect(() => {
    const delay = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 600);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  // Busca dados
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (debouncedSearchTerm.length > 0) {
          const allMatching = await fetchAlbumsByName(debouncedSearchTerm, limit, signal);
          setAllAlbums(allMatching);
        } else {
          const byGenre = await fetchAlbumsByGenre(selectedGenre, 1, limit, signal);
          setAllAlbums(byGenre);
        }
      } catch (err) {
        console.error("Erro ao buscar álbuns:", err);
        // usamos string direta para evitar erro de tipagem de i18n
        setError("Erro ao carregar álbuns.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [debouncedSearchTerm, selectedGenre, limit]);

  useEffect(() => {
    if (isSearchVisible) searchRef.current?.focus();
  }, [isSearchVisible]);

  const clearSearch = () => setSearchTerm("");

  // Skeleton simples (cards)
  const Skeleton = () => (
    <div className="animate-pulse">
      <div className="rounded-xl bg-neutral-800/60 h-[42vw] max-h-[190px] sm:h-[190px] w-[46vw] max-w-[190px]" />
      <div className="mt-2 h-4 bg-neutral-800/60 rounded w-3/4" />
      <div className="mt-1 h-3 bg-neutral-800/60 rounded w-1/2" />
    </div>
  );

  return (
    <>
      {/* 🎵 Filtros */}
      <div className="relative flex flex-wrap md:flex-nowrap items-center mb-6 gap-3 sm:gap-4">
        <button
          onClick={() => setIsSearchVisible(!isSearchVisible)}
          className="focus:outline-none rounded-md p-2 bg-neutral-900/60 ring-1 ring-white/10 hover:ring-white/20 transition"
          aria-label="Abrir busca"
        >
          <FaSearch className="text-white w-5 h-5" />
        </button>

        <div className={`transition-all duration-300 overflow-hidden ${isSearchVisible ? "w-56" : "w-0"}`}>
          <div className="relative">
            <input
              type="text"
              ref={searchRef}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="px-3 py-2 pr-9 rounded-md bg-neutral-900/60 text-white placeholder:text-neutral-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-darkgreen w-full"
              aria-label={t("searchPlaceholder")}
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                aria-label="Limpar busca"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10"
              >
                <FaTimes className="w-3.5 h-3.5 text-white/80" />
              </button>
            )}
          </div>
        </div>

        <select
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          disabled={searchTerm.trim().length > 0} // 🔒 Desabilita quando há busca
          className={`px-4 py-2 rounded-md border border-white/10 focus:outline-none focus:ring-2 focus:ring-darkgreen bg-black text-lightgreen appearance-none ${
            searchTerm.trim().length > 0 ? "opacity-50 cursor-not-allowed" : ""
          }`}
          // usamos rótulo direto para evitar erro de tipagem de i18n
          aria-label="Selecionar gênero"
        >
          <option value=""></option>
          {genres.map((genre) => (
            <option key={genre.id} value={genre.value}>
              {genre.name}
            </option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-2 text-sm text-white/70">
          <span>{t("albunsAparecendo")}</span>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="appearance-none bg-[#1a1a1a] text-white px-3 py-2 rounded-md shadow-sm border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-darkgreen"
            // usamos rótulo direto para evitar erro de tipagem de i18n
            aria-label="Quantidade de álbuns"
          >
            {limitOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Estados */}
      {loading ? (
        <div aria-live="polite">
          <section className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 justify-center">
            {Array.from({ length: Math.min(limit, 12) }).map((_, i) => (
              <Skeleton key={i} />
            ))}
          </section>
        </div>
      ) : error ? (
        <div className="text-center mt-10 text-red-400" role="alert">
          {error}
        </div>
      ) : allAlbums.length === 0 ? (
        <div className="text-center mt-10 text-white space-y-3" aria-live="polite">
          <p>{t("noAlbumsFound")}</p>
          {(debouncedSearchTerm || selectedGenre) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedGenre("rap");
              }}
              className="px-4 py-2 rounded-md bg-darkgreen text-white hover:brightness-110 transition"
            >
              {/* rótulo direto para evitar erro de tipagem */}
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <section
          className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 justify-center"
          aria-live="polite"
        >
          {allAlbums.map((album) => (
            <AlbumCard key={album.id} {...album} />
          ))}
        </section>
      )}
    </>
  );
}
