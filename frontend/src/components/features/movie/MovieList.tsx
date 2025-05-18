'use client';

import { useEffect, useState, useRef } from 'react';
import { fetchMoviesByPage, fetchGenres } from '@/services/movie/movies_list';
import { Movie } from '@/types/Movie';
import { useTranslations } from 'next-intl';
import { MovieCard } from './MovieCard';
import { FaSearch } from 'react-icons/fa';

export function MovieList() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [inputPage, setInputPage] = useState('1');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const t = useTranslations('MovieList');
  const maxPage = 500;
  const searchRef = useRef<HTMLInputElement | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Debounce para o searchTerm
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 1000); // 1000ms de debounce

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  useEffect(() => {
    const getMovies = async () => {
      setLoading(true);
      try {
        const moviesData = await fetchMoviesByPage(
          page,
          selectedYear ? parseInt(selectedYear) : undefined,
          selectedGenre ? parseInt(selectedGenre) : undefined,
          debouncedSearchTerm || undefined
        );

        setMovies(moviesData);
      } catch (error) {
        console.error('Erro ao carregar filmes:', error);
      } finally {
        setLoading(false);
      }
    };

    getMovies();
  }, [page, selectedYear, selectedGenre, debouncedSearchTerm]);

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const genresData = await fetchGenres();
        setGenres(genresData);
      } catch (error) {
        console.error('Erro ao carregar gêneros:', error);
      }
    };
    loadGenres();
  }, []);

  const handlePageChange = () => {
    const newPage = Number(inputPage);
    if (!isNaN(newPage) && newPage > 0 && newPage <= maxPage) {
      setPage(newPage);
    } else {
      setInputPage(String(page));
    }
  };

  const handleArrowClick = (direction: 'prev' | 'next') => {
    const newPage = direction === 'prev' ? page - 1 : page + 1;
    if (newPage > 0 && newPage <= maxPage) {
      setPage(newPage);
      setInputPage(String(newPage));
    }
  };

  return (
    <>
      {/* 🔍 Barra de busca, filtro de ano e gênero */}
      <div className="relative flex items-center mb-6 gap-4">
        <button onClick={() => setIsSearchVisible(!isSearchVisible)} className="focus:outline-none">
          <FaSearch className="text-white w-5 h-5" />
        </button>
        <div className={`transition-all duration-300 overflow-hidden ${isSearchVisible ? 'w-48' : 'w-0'}`}>
          <input
            type="text"
            ref={searchRef}
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Buscar filmes..."
            className="px-4 py-2 rounded-md border border-gray-300 focus:outline-none w-full"
          />
        </div>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-4 py-2 rounded-md border border-gray-300 focus:outline-none bg-gray-800 text-white appearance-none hover:border-white transition-colors"
        >
          <option value="">Anos</option>
          {Array.from({ length: 100 }, (_, i) => 2025 - i).map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        <select
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          className="px-4 py-2 rounded-md border border-gray-300 focus:outline-none bg-gray-800 text-white appearance-none hover:border-white transition-colors"
        >
          <option value="">Gêneros</option>
          {genres.map((genre) => (
            <option key={genre.id} value={genre.id}>
              {genre.name}
            </option>
          ))}
        </select>
      </div>

      {/* 🎥 Lista de filmes */}
      {loading ? (
        <p className="text-center mt-10 text-white">{t('loading')}</p>
      ) : movies.length === 0 ? (
        <p className="text-center mt-10 text-white">{t('noMoviesFound')}</p>
      ) : (
        <section className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 justify-center">
          {movies.map((movie) => (
            <MovieCard key={movie.id} {...movie} />
          ))}
        </section>
      )}

      {/* 🔄 Paginação */}
      <div className="flex justify-center items-center gap-2 mt-10 mb-20 text-white">
        <span className="text-white text-base">{t('ChoosePage')}</span>
        <button
          onClick={() => handleArrowClick('prev')}
          className="text-darkgreen text-3xl hover:scale-110 transition"
        >
          {'<'}
        </button>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={inputPage}
          onChange={(e) => setInputPage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handlePageChange()}
          onBlur={handlePageChange}
          className="w-16 h-10 text-white text-center rounded-md border outline-none border-darkgreen"
          style={{ backgroundColor: 'transparent', appearance: 'none' }}
        />
        <button
          onClick={() => handleArrowClick('next')}
          className="text-darkgreen text-3xl hover:scale-110 transition"
        >
          {'>'}
        </button>
      </div>
    </>
  );
}
