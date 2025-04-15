"use client";

import { AnimatedCarousel, CarouselItem } from "@/utils/aceternity/AnimatedTestimonials";
import { useEffect, useState } from "react";

export const RandomMoviesCarousel = () => {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("Token não encontrado. Faça login primeiro.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("http://localhost:8080/movie/get/page/1", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Erro ao buscar filmes");
        }

        const data = await response.json();
        const allMovies = data.results || [];

        // Embaralha e seleciona 3
        const shuffled = allMovies.sort(() => 0.5 - Math.random()).slice(0, 3);

        // Monta os itens com imagem em qualidade máxima
        const mappedItems: CarouselItem[] = shuffled.map((movie: any) => ({
          image: `https://image.tmdb.org/t/p/original${movie.backdrop_path}`,
          title: movie.title,
          description: movie.overview || "Sem descrição disponível.",
          buttonLabel: "Ver Detalhes",
          onClick: () => console.log("Detalhes de:", movie.title),
        }));

        setItems(mappedItems);
      } catch (error) {
        console.error("Erro ao buscar filmes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  return loading ? (
    <p className="text-gray-400 text-center">Carregando filmes...</p>
  ) : items.length > 0 ? (
    <AnimatedCarousel
      items={items}
      autoplay={true}
      arrowButtonClass="bg-[var(--color-darkgreen)] hover:brightness-110 text-white"
      detailButtonClass="bg-[var(--color-darkgreen)] hover:brightness-110 text-white"
    />
  ) : (
    <p className="text-gray-400 text-center">Nenhum filme encontrado.</p>
  );
};
