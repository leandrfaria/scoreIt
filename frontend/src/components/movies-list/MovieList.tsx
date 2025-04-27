'use client';

import { useEffect, useState } from 'react';
import { fetchMoviesByPage } from '@/services/service_movies_list';
import { Movie } from '@/types/Movie';
import { useTranslations } from 'next-intl';
import { MovieCard } from '../movie-card/MovieCard';

export function MovieList() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [inputPage, setInputPage] = useState('1');
  const t = useTranslations('MovieList');
  const maxPage = 500;

  useEffect(() => {
    const getMovies = async () => {
      setLoading(true);
      const moviesData = await fetchMoviesByPage(page);
      setMovies(moviesData);
      setLoading(false);
    };

    getMovies();
  }, [page]);

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

  if (loading) {
    return <p className="text-center mt-10 text-white">{t('loading')}</p>;
  }

  if (movies.length === 0) {
    return <p className="text-center mt-10 text-white">{t('noMoviesFound')}</p>;
  }

  return (
    <>
      <section className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 justify-center">
        {movies.map((movie) => (
          <MovieCard key={movie.id} {...movie} />
        ))}
      </section>

      <div className="flex justify-center items-center gap-2 mt-10 mb-20 text-white">
        <span className="text-white text-base">{t("ChoosePage")}</span>

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
          style={{
            backgroundColor: 'transparent',
            appearance: 'none',
          }}
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
