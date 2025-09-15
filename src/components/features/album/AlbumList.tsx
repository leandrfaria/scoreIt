// src/components/features/album/AlbumList.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Album } from "@/types/Album";
import { AlbumCard } from "@/components/features/album/AlbumCard";
import { fetchFixedAlbums } from "@/services/album/fixed_ids";
import { fetchAlbumsByName } from "@/services/album/by_name";
import { FaSearch, FaTimes } from "react-icons/fa";

function uniqueById(list: Album[]): Album[] {
  const map = new Map<string, Album>();
  for (const a of list) {
    if (!map.has(a.id)) map.set(a.id, a);
  }
  return Array.from(map.values());
}

export default function AlbumList() {
  const [allAlbums, setAllAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);

  // Debounce de busca
  useEffect(() => {
    const id = setTimeout(() => setDebounced(searchTerm.trim()), 600);
    return () => clearTimeout(id);
  }, [searchTerm]);

  // Carrega: se tem busca -> por nome; senão -> 20 fixos alternando conjuntos
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (debounced) {
          const list = await fetchAlbumsByName(debounced, 20, signal);
          setAllAlbums(uniqueById(list));
        } else {
          const list = await fetchFixedAlbums(signal);
          setAllAlbums(uniqueById(list));
        }
      } catch (e) {
        console.error(e);
        setError("Erro ao carregar álbuns.");
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [debounced]);

  useEffect(() => {
    if (isSearchVisible) searchRef.current?.focus();
  }, [isSearchVisible]);

  const clearSearch = () => setSearchTerm("");

  const Skeleton = useMemo(
    () =>
      function Skeleton() {
        return (
          <div className="animate-pulse">
            <div className="rounded-xl bg-neutral-800/60 h-[42vw] max-h-[190px] sm:h-[190px] w-[46vw] max-w-[190px]" />
            <div className="mt-2 h-4 bg-neutral-800/60 rounded w-3/4" />
            <div className="mt-1 h-3 bg-neutral-800/60 rounded w-1/2" />
          </div>
        );
      },
    []
  );

  return (
    <>
      {/* 🔎 Apenas a busca */}
      <div className="relative flex items-center mb-6 gap-3 sm:gap-4">
        <button
          onClick={() => setIsSearchVisible((v) => !v)}
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
              placeholder="Buscar álbum por nome"
              className="px-3 py-2 pr-9 rounded-md bg-neutral-900/60 text-white placeholder:text-neutral-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-darkgreen w-full"
              aria-label="Buscar álbum por nome"
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

        {!debounced && (
          <span className="ml-auto text-sm text-white/60">
            Exibindo 20 álbuns
          </span>
        )}
      </div>

      {/* Estados */}
      {loading ? (
        <section className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 justify-center">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} />
          ))}
        </section>
      ) : error ? (
        <div className="text-center mt-10 text-red-400" role="alert">
          {error}
        </div>
      ) : allAlbums.length === 0 ? (
        <div className="text-center mt-10 text-white space-y-3" aria-live="polite">
          <p>Nenhum álbum encontrado.</p>
          {debounced && (
            <button
              onClick={clearSearch}
              className="px-4 py-2 rounded-md bg-darkgreen text-white hover:brightness-110 transition"
            >
              Limpar busca
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
