"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Series } from "@/types/Series";
import { FaHeart, FaStar } from "react-icons/fa";
import { FiHeart } from "react-icons/fi";
import Image from "next/image";
import { useMember } from "@/context/MemberContext";
import { isFavoritedMedia } from "@/services/user/is_favorited";
import { addFavouriteSeries } from "@/services/series/add_fav_series";
import { removeFavouriteMedia } from "@/services/user/remove_fav";
import toast from "react-hot-toast";
import RatingModal from "@/components/features/review/RatingModal";
import ReviewSection from "@/components/features/review/ReviewSection";

export default function SeriePage() {
  const { id } = useParams<{ id: string }>();
  const [serie, setSerie] = useState<Series | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [refreshReviews, setRefreshReviews] = useState(false);
  const { member } = useMember();

  useEffect(() => {
    const loadSerie = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL_DEV}/series/${id}/details`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await response.json();
        setSerie(data);
      } catch (err) {
        console.error("Erro ao buscar detalhes da série:", err);
      }
    };
    loadSerie();
  }, [id]);

  useEffect(() => {
    const checkFavorite = async () => {
      if (member && id) {
        const fav = await isFavoritedMedia(member.id, Number(id));
        setIsFavorited(fav);
      }
    };
    checkFavorite();
  }, [member, id]);

  const handleFavoriteToggle = async () => {
    if (!member || !serie) return;

    if (isFavorited) {
      const success = await removeFavouriteMedia(member.id, serie.id, "series");
      if (success) {
        toast.success("Removido dos favoritos");
        setIsFavorited(false);
      } else toast.error("Erro ao remover");
    } else {
      const success = await addFavouriteSeries("", member.id, serie.id);
      if (success) {
        toast.success("Adicionado aos favoritos");
        setIsFavorited(true);
      } else toast.error("Erro ao favoritar");
    }
  };

  if (!serie) return <p className="text-white p-10">Carregando série...</p>;

  const year = serie.release_date ? new Date(serie.release_date).getFullYear() : "Desconhecido";

  return (
    <main className="relative w-full min-h-screen text-white">
      {serie.backdropUrl && (
        <div className="absolute inset-0 -z-10">
          <Image
            src={serie.backdropUrl.replace("/w500/", "/original/")}
            alt={serie.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </div>
      )}

      <div className="flex flex-col justify-end h-screen max-w-6xl mx-auto px-8 pb-24 space-y-5">
        <h1 className="text-6xl font-extrabold">{serie.name}</h1>

        <div className="flex items-center gap-4 text-sm text-gray-300">
          <div className="flex items-center gap-1 text-yellow-400">
            <FaStar />
            <span className="text-lg font-medium">{serie.vote_average.toFixed(1)}</span>
          </div>
          <span className="uppercase">{serie.genres?.[0] || "DESCONHECIDO"}</span>
          <span>{year}</span>
        </div>

        <p className="max-w-2xl text-gray-200 text-base leading-relaxed">
          {serie.overview || "Sem descrição disponível."}
        </p>

        <div className="flex gap-4 flex-wrap">
          <button
            onClick={() => setShowModal(true)}
            className="bg-white text-black font-semibold px-6 py-3 rounded hover:bg-gray-200 transition"
          >
            Avaliar
          </button>
          <button
            onClick={handleFavoriteToggle}
            className="bg-darkgreen/80 border border-white/20 text-white px-6 py-3 rounded hover:bg-darkgreen hover:brightness-110 transition flex items-center gap-2"
            aria-label={isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            {isFavorited ? (
              <>
                <FaHeart className="text-red-500" /> Remover
              </>
            ) : (
              <>
                <FiHeart /> Favoritar
              </>
            )}
          </button>
        </div>
      </div>

      {member && serie && (
        <RatingModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          mediaId={serie.id}
          mediaType="series"
          onSuccess={() => setRefreshReviews((prev) => !prev)}
        />
      )}

      {serie && (
        <ReviewSection mediaId={serie.id.toString()} refreshTrigger={refreshReviews} />
      )}
    </main>
  );
}
