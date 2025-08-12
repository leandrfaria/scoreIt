'use client';

import { useEffect, useState, useRef } from 'react';
import { Album } from '@/types/Album';
import { fetchAlbumsByGenre, fetchAlbumsByName } from '@/services/album/by_genre';
import { AlbumCard } from '@/components/features/album/AlbumCard';
import { useTranslations } from 'next-intl';
import { FaSearch } from 'react-icons/fa';

export function AlbumListByGenre() {
  const [selectedGenre, setSelectedGenre] = useState<string>('rap');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [allAlbums, setAllAlbums] = useState<Album[]>([]);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [genres, setGenres] = useState<{ id: number; name: string; value: string }[]>([]);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const t = useTranslations('AlbumListByGenre');

  const limitOptions = [10, 20, 30, 40, 50];

const fetchData = async (query: string, genre: string, limit: number) => {
  setLoading(true);

  try {
    if (query.trim().length > 0) {
      // Se estiver buscando por nome, buscar de todos os gêneros
      const allMatching = await fetchAlbumsByName(query); // Você precisa garantir que essa função existe no serviço
      setAllAlbums(allMatching.slice(0, limit));
    } else {
      // Caso contrário, buscar pelos álbuns do gênero selecionado
      const byGenre = await fetchAlbumsByGenre(genre, 0, limit);
      setAllAlbums(byGenre);
    }
  } catch (err) {
    console.error('Erro ao buscar álbuns:', err);
  } finally {
    setLoading(false);
  }
};



  // Debounce
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 1000);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // Buscar dados com debounce
  useEffect(() => {
    fetchData(debouncedSearchTerm, selectedGenre, limit);
  }, [debouncedSearchTerm, selectedGenre, limit]);

  // Mock de gêneros
  useEffect(() => {
    const mockGenres = [
      { id: 1, name: 'Blues', value: 'blues' },
      { id: 2, name: 'Country', value: 'country' },
      { id: 3, name: 'Electronic', value: 'electronic' },
      { id: 4, name: 'Funk', value: 'funk' },
      { id: 5, name: 'Gospel', value: 'gospel' },
      { id: 6, name: 'Jazz', value: 'jazz' },
      { id: 7, name: 'Metal', value: 'metal' },
      { id: 8, name: 'Pagode', value: 'pagode' },
      { id: 9, name: 'Pop', value: 'pop' },
      { id: 10, name: 'Rap', value: 'rap' },
      { id: 11, name: 'Reggae', value: 'reggae' },
      { id: 12, name: 'Rock', value: 'rock' },
      { id: 13, name: 'Samba', value: 'samba' },
      { id: 14, name: 'Sertanejo', value: 'sertanejo' },
    ];
    setGenres(mockGenres);
  }, []);

  return (
    <>
      {/* 🎵 Filtros */}
      <div className="relative flex flex-wrap md:flex-nowrap items-center mb-6 gap-4">
        <button onClick={() => setIsSearchVisible(!isSearchVisible)} className="focus:outline-none">
          <FaSearch className="text-white w-5 h-5" />
        </button>

        <div className={`transition-all duration-300 overflow-hidden ${isSearchVisible ? 'w-48' : 'w-0'}`}>
          <input
            type="text"
            ref={searchRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="px-4 py-2 rounded-md border border-gray-300 focus:outline-none w-full"
          />
        </div>

        <select
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          disabled={searchTerm.trim().length > 0} // 🔒 Desabilita quando há busca
          className={`px-4 py-2 rounded-md border border-darkgreen focus:outline-none bg-black text-lightgreen appearance-none ${
            searchTerm.trim().length > 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <option value=""></option>
          {genres.map((genre) => (
            <option key={genre.id} value={genre.value}>
              {genre.name}
            </option>
          ))}
        </select>

      </div>

      {/* 🎧 Lista de álbuns */}
      {loading ? (
        <p className="text-center mt-10 text-white">{t('loading')}</p>
      ) : allAlbums.length === 0 ? (
        <p className="text-center mt-10 text-white">{t('noAlbumsFound')}</p>
      ) : (
        <section className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 justify-center">
          {allAlbums.map((album, index) => (
            <AlbumCard key={`${album.id}-${index}`} {...album} />
          ))}
        </section>
      )}

      {/* 🔢 Controle de limite */}
      <div className="flex justify-center mt-10 mb-20">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white">{t('albunsAparecendo')}</span>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="appearance-none bg-[#1a1a1a] text-white px-3 py-2 rounded-md shadow-sm border border-neutral-700 focus:outline-none"
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