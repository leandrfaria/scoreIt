"use client";

import { Container } from "@/components/container";
import MovieCarousel from "@/components/carousel";
import Image from "next/image";

type Movie = {
  title: string;
  description: string;
  poster: string;
};

export default function Profile() {
  return (
    <main className="w-full">
      <Container>
        <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-400 overflow-hidden">
          <Image
            src="https://image.tmdb.org/t/p/w1280/a5RuXKcLcfyjwZRDmW4yEdjigNx.jpg"
            alt="User Avatar"
            width={64}
            height={64}
          />
        </div>
        <span className="text-lg font-medium">Nome do Usuário</span>
      </div>

      {/* Informações do usuário */}
      <div className="flex gap-6 text-center">
        <div>
          <p className="text-sm">Filmes</p>
          <p className="text-lg font-semibold">X</p>
        </div>
        <div>
          <p className="text-sm">Seguidores</p>
          <p className="text-lg font-semibold">X</p>
        </div>
        <div>
          <p className="text-sm">Seguindo</p>
          <p className="text-lg font-semibold">X</p>
        </div>
      </div>
        </div>
      </Container>
      <Container>
        <div className="flex flex-col items-center justify-center">
          <MovieCarousel></MovieCarousel>
        </div>
      </Container>
      <Container>
        <div className="flex flex-col items-center justify-center">
          <MovieCarousel></MovieCarousel>
        </div>
      </Container>
    </main>
  );
}
