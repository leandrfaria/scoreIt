'use client';

import { useEffect, useState } from 'react';
import { Container } from '@/components/container';
import { RandomMoviesCarousel } from '@/components/random-movies-carousel/RandomMoviesCarousel';
import { MovieList } from '@/components/movies-list/MovieList';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setIsLoggedIn(!!token);
  }, []);

  return (
    <main className="w-full">
      <Container>
        {isLoggedIn === null ? (
          <p className="text-gray-400 text-center">Verificando login...</p>
        ) : isLoggedIn ? (
          <>
            <RandomMoviesCarousel />
            <h2 className="text-white text-xl font-bold mt-10 mb-4">Todos os Filmes</h2>
            <MovieList />
          </>
        ) : (
          <p className="text-gray-400 text-center text-lg mt-12">
            Você ainda não está logado. Faça login para visualizar os filmes!
          </p>
        )}
      </Container>
    </main>
  );
}
