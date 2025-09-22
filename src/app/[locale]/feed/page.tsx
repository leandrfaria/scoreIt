"use client";

import FeedCard from "@/components/features/review/FeedCard";
import { useMember } from "@/context/MemberContext";
import { useEffect, useState } from "react";
import { fetchFeedServer } from "@/services/feed/route";

interface FeedItem {
  member: { id: number; name: string; profileImageUrl?: string; handle?: string };
  review: {
    id: number;
    mediaId: string;
    mediaType: "movie" | "series" | "album";
    memberId: number;
    score: number;
    memberReview: string;
    watchDate: string;
    spoiler: boolean;
    reviewDate: string;
  };
  movie: {
    id: number;
    title: string;
    overview: string;
    posterUrl: string;
    backdropUrl: string;
    release_date: string;
  } | null;
  serie: {
    id: string;
    name: string;
    overview: string;
    posterUrl: string;
    backdrop_path: string;
    seasons?: { season_number: number; episode_count: number; name: string; poster_path: string | null }[];
  } | null;
  album: {
    id: string;
    name: string;
    release_date: string;
    images: { url: string; height: number; width: number }[];
    artists: { name: string; uri: string }[];
  } | null;
}

export default function FeedPage() {
  const { member } = useMember();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!member?.id) {
      setError("Usuário não autenticado");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadFeed = async () => {
      try {
        // Aqui usamos o fetch do route.ts, que já pega o token corretamente
        const data = await fetchFeedServer(member.id.toString());
        setFeed(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Erro ao carregar feed");
      } finally {
        setLoading(false);
      }
    };

    loadFeed();

    return () => controller.abort();
  }, [member]);

  if (loading) return <p className="text-white">Carregando...</p>;
  if (error) return <p className="text-red-400">{error}</p>;
  if (feed.length === 0) return <p className="text-white">Nenhuma atividade recente encontrada.</p>;

  return (
    <div className="min-h-screen bg-[#0D1117] px-4 py-8 md:px-16">
      <h1 className="text-white text-2xl font-bold mb-6">Feed</h1>
      <div className="space-y-6">
        {feed.map((item) => {
          const { review, member: reviewer } = item;
          const { mediaType } = review;

          let mediaData: any;

          if (mediaType === "movie" && item.movie) {
            mediaData = {
              id: review.mediaId,
              title: item.movie.title,
              overview: `Sinopse: ${item.movie.overview}`,
              posterUrl: item.movie.posterUrl,
              releaseDate: item.movie.release_date,
            };
          } else if (mediaType === "series" && item.serie) {
            const seasons = item.serie.seasons || [];
            const totalSeasons = seasons.length;
            const totalEpisodes = seasons.reduce((sum, s) => sum + s.episode_count, 0);
            mediaData = {
              id: review.mediaId,
              title: item.serie.name,
              seasons: totalSeasons,
              posterUrl: item.serie.posterUrl,
              overview: `${totalSeasons} temporada${totalSeasons !== 1 ? "s" : ""} • ${totalEpisodes} episódios`,
            };
          } else if (mediaType === "album" && item.album) {
            mediaData = {
              id: review.mediaId,
              title: item.album.name,
              artist: `Artista: ${item.album.artists[0]?.name ?? "Desconhecido"}`,
              posterUrl: item.album.images[0]?.url,
              releaseDate: item.album.release_date,
            };
          } else return null;

          return (
            <FeedCard
              key={review.id}
              name={reviewer.name}
              avatar={
                reviewer.profileImageUrl ??
                "https://marketup.com/wp-content/themes/marketup/assets/icons/perfil-vazio.jpg"
              }
              reviewDate={review.reviewDate}
              rating={review.score}
              comment={review.memberReview}
              memberId={reviewer.id.toString()}
              mediaType={mediaType}
              media={mediaData}
            />
          );
        })}
      </div>
    </div>
  );
}
