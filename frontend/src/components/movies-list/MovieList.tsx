'use client';

import { useEffect, useState } from 'react';
import { MovieCard } from '../film-card/MovieCard';
import { fetchMovies, Movie } from '@/services/service_movies';

export function MovieList() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getMovies = async () => {
      const moviesData = await fetchMovies();
      setMovies(moviesData);
      setLoading(false);
    };

    getMovies();
  }, []);

  if (loading) {
    return <p className="text-center mt-10 text-white">Carregando filmes...</p>;
  }

  if (movies.length === 0) {
    return <p className="text-center mt-10 text-white">Nenhum filme encontrado.</p>;
  }

  return (
    <section className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 justify-center">
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          id={movie.id}
          title={movie.title}
          posterUrl={movie.posterUrl}
          vote_average={movie.vote_average}
          release_date={movie.release_date}
        />
      ))}
    </section>
  );
}
