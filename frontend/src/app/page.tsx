"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/container";
import { RandomMoviesCarousel } from "@/components/random-movies-carousel/RandomMoviesCarousel";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    setIsLoggedIn(!!token); 
  }, []);

  return (
    <main className="w-full">
      <Container>
        {isLoggedIn === null ? (
          <p className="text-gray-400 text-center">Verificando login...</p>
        ) : isLoggedIn ? (
          <RandomMoviesCarousel />
        ) : (
          <p className="text-gray-400 text-center text-lg mt-12">
            Você ainda não está logado. Faça login para visualizar os filmes!
          </p>
        )}
      </Container>
    </main>
  );
}
