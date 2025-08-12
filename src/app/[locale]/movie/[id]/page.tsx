"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Movie } from "@/types/Movie";
import { fetchMovieById } from "@/services/movie/fetch_movie_by_id";
import { FaHeart, FaStar } from "react-icons/fa";
import { FiHeart } from "react-icons/fi";
import Image from "next/image";
import { useMember } from "@/context/MemberContext";
import { isFavoritedMedia } from "@/services/user/is_favorited";
import { addFavouriteMovie } from "@/services/movie/add_fav_movie";
import { removeFavouriteMedia } from "@/services/user/remove_fav";
import toast from "react-hot-toast";
import RatingModal from "@/components/features/review/RatingModal";
import ReviewSection from "@/components/features/review/ReviewSection";

export default function MoviePage() {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [refreshReviews, setRefreshReviews] = useState(false);
  const { member } = useMember();

  useEffect(() => {
    const loadMovie = async () => {
      const result = await fetchMovieById(id);
      setMovie(result);
    };
    loadMovie();
  }, [id]);

  useEffect(() => {
    const checkFavorite = async () => {
      if (member) {
        const fav = await isFavoritedMedia(member.id, Number(id));
        setIsFavorited(fav);
      }
    };
    checkFavorite();
  }, [member, id]);

  const handleFavoriteToggle = async () => {
    const token = localStorage.getItem("authToken");
    if (!token || !member || !movie) return;

    if (isFavorited) {
      const success = await removeFavouriteMedia(member.id, movie.id, "movie");
      if (success) {
        toast.success("Removido dos favoritos");
        setIsFavorited(false);
      } else {
        toast.error("Erro ao remover");
      }
    } else {
      const success = await addFavouriteMovie(token, member.id, movie.id);
      if (success) {
        toast.success("Adicionado aos favoritos");
        setIsFavorited(true);
      } else {
        toast.error("Erro ao favoritar");
      }
    }
  };

  if (!movie) return <p className="text-white p-10">Carregando filme...</p>;

  const year = new Date(movie.release_date).getFullYear();

  return (
    <>
      <main className="relative w-full min-h-screen text-white">
        {movie.backdropUrl && (
          <div className="absolute inset-0 -z-10">
            <Image
              src={movie.backdropUrl.replace("/w500/", "/original/")}
              alt={movie.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          </div>
        )}

        <div className="flex flex-col justify-end h-screen max-w-6xl mx-auto px-8 pb-24 space-y-5">
          <h1 className="text-6xl font-extrabold">{movie.title}</h1>

          <div className="flex items-center gap-4 text-sm text-gray-300">
            <div className="flex items-center gap-1 text-yellow-400">
              <FaStar />
              <span className="text-lg font-medium">
                {movie.vote_average.toFixed(1)}
              </span>
            </div>
            <span className="uppercase">
              {movie.genres?.[0] || "DESCONHECIDO"}
            </span>
            <span>{year}</span>
          </div>

          <p className="max-w-2xl text-gray-200 text-base leading-relaxed">
            {movie.overview}
          </p>

          <div className="flex gap-2 flex-wrap">
            {movie.genres?.map((genre, idx) => (
              <span
                key={idx}
                className="bg-white/20 px-3 py-1 rounded-full text-sm text-white font-medium"
              >
                {genre}
              </span>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setShowModal(true)}
              className="bg-white text-black font-semibold px-6 py-3 rounded hover:bg-gray-200 transition"
            >
              Avaliar
            </button>
            <button
              onClick={handleFavoriteToggle}
              className="bg-white/10 border border-white text-white px-6 py-3 rounded hover:bg-white hover:text-black transition flex items-center gap-2"
            >
              {isFavorited ? (
                <>
                  <FaHeart className="text-red-500" /> Remover dos Favoritos
                </>
              ) : (
                <>
                  <FiHeart /> Adicionar aos Favoritos
                </>
              )}
            </button>
          </div>
        </div>

        <RatingModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          mediaId={movie.id}
          mediaType="movie"
          onSuccess={() => setRefreshReviews((prev) => !prev)} // 👈 Avisa pra atualizar
        />
      </main>

      <ReviewSection mediaId={String(movie.id)} refreshTrigger={refreshReviews} />
    </>
  );
}
