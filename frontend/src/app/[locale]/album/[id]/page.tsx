"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Album } from "@/types/Album";
import Image from "next/image";
import { fetchAlbumById } from "@/services/album/fetch_album_by_id";

export default function AlbumPage() {
  const { id } = useParams<{ id: string }>();
  const [album, setAlbum] = useState<Album | null>(null);

  useEffect(() => {
    const loadAlbum = async () => {
      const result = await fetchAlbumById(id);
      setAlbum(result);
    };
    loadAlbum();
  }, [id]);

  if (!album) return <p className="text-white p-10">Carregando álbum...</p>;

  const year = new Date(album.release_date).getFullYear();

  return (
    <main className="relative w-full min-h-screen text-white overflow-hidden">
      {/* IMAGEM DE FUNDO PREENCHENDO TODA A TELA */}
      {album.imageUrl && (
        <div className="absolute inset-0 -z-10">
          <Image
            src={album.imageUrl}
            alt={album.name}
            fill
            className="object-cover opacity-40"
            priority
          />
          {/* Camadas de escurecimento para destacar o conteúdo */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        </div>
      )}

      {/* CONTEÚDO SOBRE O FUNDO */}
      <div className="flex flex-col justify-end h-screen max-w-6xl mx-auto px-8 pb-24 space-y-5">
        <h1 className="text-6xl font-extrabold">{album.name}</h1>

        <div className="flex items-center gap-4 text-sm text-gray-300">
          <span className="uppercase">{album.artist}</span>
          <span>{year}</span>
          <span>{album.total_tracks} músicas</span>
        </div>
      </div>
    </main>
  );
}
