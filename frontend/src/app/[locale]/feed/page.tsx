"use client";

import FeedCard from "@/components/features/review/FeedCard";
import { useMember } from "@/context/MemberContext";
import { Member } from "@/types/Member";
import { useEffect, useState } from "react";

interface FeedItem {
    member: Member;
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
        seasons?: {
            season_number: number;
            episode_count: number;
            name: string;
            poster_path: string | null;
        }[];
    } | null;
    album: {
        id: string;
        name: string;
        release_date: string;
        images: {      // <-- Altere para "images"
            url: string;
            height: number;
            width: number;
        }[];
        artists: {
            name: string;
            uri: string;
        }[];
    } | null;
}

export default function FeedPage() {
    const { member } = useMember();
    const [feed, setFeed] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("authToken");

        if (!member?.id || !token) return;

        const fetchFeed = async () => {
            try {
                const res = await fetch(`http://localhost:8080/feed/${member.id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!res.ok) throw new Error("Erro ao carregar feed");
                const data = await res.json();
                setFeed(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchFeed();
    }, [member]);

    return (
        <div className="min-h-screen bg-[#0D1117] px-4 py-8 md:px-16">
            <h1 className="text-white text-2xl font-bold mb-6">Feed</h1>

            {loading ? (
                <p className="text-white">Carregando...</p>
            ) : feed.length === 0 ? (
                <p className="text-white">Nenhuma atividade recente encontrada.</p>
            ) : (
                <div className="space-y-6">
                    {feed.map((item) => {
                        const { review, member: reviewer } = item;
                        const { mediaType } = review;

                        let mediaData;

                        if (mediaType === "movie" && item.movie) {
                            mediaData = {
                                id: item.review.mediaId,
                                title: item.movie.title,
                                overview: `Sinopse: ${item.movie.overview}`,
                                posterUrl: item.movie.posterUrl,
                                releaseDate: item.movie.release_date,
                            };
                        } else if (mediaType === "series" && item.serie) {
                            const seasons = item.serie.seasons || [];

                            const totalSeasons = seasons.length;

                            const totalEpisodes = seasons.reduce(
                                (sum, season) => sum + season.episode_count,
                                0
                            );

                            const newOverview = `${totalSeasons} temporada${totalSeasons !== 1 ? 's' : ''} • ${totalEpisodes} episódios`;
                            mediaData = {
                                id: item.review.mediaId,
                                title: item.serie.name,
                                seasons: totalSeasons,
                                posterUrl: item.serie.posterUrl,
                            };
                        } else if (mediaType === "album" && item.album) {
                            mediaData = {
                                id: item.review.mediaId,
                                title: item.album.name,
                                artist: `Artista: ${item.album.artists[0]?.name ?? "Desconhecido"}`,
                                posterUrl: item.album.images[0]?.url, // <-- Linha corrigida
                                releaseDate: item.album.release_date,
                            };
                        } else {
                            return null; // pula se dados de mídia estiverem faltando
                        }

                        return (
                            <FeedCard
                                key={review.id}
                                name={reviewer.name}
                                avatar={reviewer.profileImageUrl}
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
            )}
        </div>
    );
}
