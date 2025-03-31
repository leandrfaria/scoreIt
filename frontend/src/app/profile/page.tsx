"use client";

import { Container } from "@/components/container";
import MovieCarousel from "@/components/carousel";
import Image from "next/image";
import { useEffect, useState } from "react";
import { fetchMembers } from "../services/member.service";

type Movie = {
  title: string;
  description: string;
  poster: string;
};

type Member = {
  id: number;
  name: string;
  email: string;
  username: string;
};

export default function Profile() {

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const membersData = await fetchMembers();
        setMember(membersData[0]); // Pega o primeiro membro
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Um erro desconhecido ocorreu');
        }
      } finally {
        setLoading(false);
      }
    };
  
    loadMembers();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

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
        <span className="text-lg font-medium">{member?.name || 'Nome do Usuário'}</span>
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
