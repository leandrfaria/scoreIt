'use client';

import { useEffect, useState } from 'react';
import { MovieCard } from '../film-card/MovieCard';

interface Movie {
  id: number;
  title: string;
  posterUrl: string;
  vote_average: number;
  release_date: string;
}

export function MovieList() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('Token não encontrado. Faça login primeiro.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:8080/movie/get/page/1', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Erro ao buscar filmes: ${response.status}`);
        }

        const text = await response.text();

        if (!text) {
          throw new Error('Resposta da API vazia');
        }

        const data = JSON.parse(text);
        setMovies(data.results || []);
      } catch (error) {
        console.error('Erro ao buscar filmes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
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
