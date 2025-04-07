"use client";

import { Container } from "@/components/container";
import Image from "next/image";
import { useEffect, useState } from "react";
import { fetchMembers } from "../../services/member.service";
import { ProtectedRoute } from "@/components/protected-route/ProtectedRoute";
import { RandomMoviesCarousel } from "@/components/random-movies-carousel/RandomMoviesCarousel";
import NowPlayingCarouselSection from "@/components/now-playing-carousel/NowPlayingCarouselSection";

type Member = {
  id: number;
  name: string;
  email: string;
  username: string;
  bio: string;
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
    <ProtectedRoute>
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
          <div className="flex flex-col text-white space-y-1">
            <span className="text-lg font-medium">{member?.name || 'Nome do Usuário'}</span>
            <p className="text-gray-400 text-sm max-w-md">{member?.bio || 'Não há bio'}</p>
          </div>
        </div>
        {/* Informações do usuário */}
        <div className="flex gap-6 text-center">
          <div>
            <p className="text-sm">Filmes</p>
            <p className="text-lg font-semibold">7</p>
          </div>
          <div>
            <p className="text-sm">Seguidores</p>
            <p className="text-lg font-semibold">25</p>
          </div>
          <div>
            <p className="text-sm">Seguindo</p>
            <p className="text-lg font-semibold">14</p>
          </div>
        </div>
          </div>
        </Container>
        <Container>
          <NowPlayingCarouselSection /> {/* ✅ FUNCIONANDO AGORA */}
        </Container>
      </main>
    </ProtectedRoute>
  );
}
