"use client";

import { useEffect, useState } from "react";
import { AnimatedTestimonials } from "@/utils/aceternity";
import { Container } from "@/components/container";

type Movie = {
  title: string;
  description: string;
  poster: string;
};

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://api.exemplo.com/movies?limit=4")
      .then((response) => response.json())
      .then((data) => {
        setMovies(data.slice(0, 4));
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erro ao buscar filmes:", error);
        setLoading(false);
      });
  }, []);

  return (
    <main className="w-full">
      <Container>
        <div className="flex flex-col items-center justify-center">
          {loading ? (
            <p className="text-gray-400">Carregando filmes</p>
          ) : movies.length > 0 ? (
            <AnimatedTestimonials testimonials={movies} autoplay={true} />
          ) : (
            <p className="text-gray-400">Nenhum filme encontrado.</p>
          )}
        </div>
      </Container>
    </main>
  );
}
