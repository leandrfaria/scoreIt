"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Album } from "@/types/Album";
import Image from "next/image";
import { fetchAlbumById } from "@/services/album/fetch_album_by_id";
import { useMember } from "@/context/MemberContext";
import { isFavoritedMedia } from "@/services/user/is_favorited";
import { addFavouriteAlbum } from "@/services/album/add_fav_album";
import { removeFavouriteMedia } from "@/services/user/remove_fav";
import RatingModal from "@/components/features/review/RatingModal";
import toast from "react-hot-toast";
import { FaHeart } from "react-icons/fa";
import { FiHeart } from "react-icons/fi";
import ReviewSection from "@/components/features/review/ReviewSection";

export default function AlbumPage() {
  const { id } = useParams<{ id: string }>();
  const [album, setAlbum] = useState<Album | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [refreshReviews, setRefreshReviews] = useState(false); // ✅
  const { member } = useMember();

  useEffect(() => {
    const loadAlbum = async () => {
      const result = await fetchAlbumById(id);
      setAlbum(result);
    };
    loadAlbum();
  }, [id]);

  useEffect(() => {
    const checkFavorite = async () => {
      if (member) {
        const fav = await isFavoritedMedia(member.id, id);
        setIsFavorited(fav);
      }
    };
    checkFavorite();
  }, [member, id]);

  const handleFavoriteToggle = async () => {
    const token = localStorage.getItem("authToken");
    if (!token || !member || !album) return;

    if (isFavorited) {
      const success = await removeFavouriteMedia(member.id, album.id, "album");
      if (success) {
        toast.success("Removido dos favoritos");
        setIsFavorited(false);
      } else {
        toast.error("Erro ao remover");
      }
    } else {
      const success = await addFavouriteAlbum(member.id, album.id);
      if (success) {
        toast.success("Adicionado aos favoritos");
        setIsFavorited(true);
      } else {
        toast.error("Erro ao favoritar");
      }
    }
  };

  if (!album) return <p className="text-white p-10">Carregando álbum...</p>;

  const year = new Date(album.release_date).getFullYear();

  return (
    <main className="relative w-full min-h-screen text-white overflow-hidden">
      {album.imageUrl && (
        <div className="absolute inset-0 -z-10">
          <Image
            src={album.imageUrl}
            alt={album.name}
            fill
            className="object-cover opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        </div>
      )}

      <div className="flex flex-col justify-end h-screen max-w-6xl mx-auto px-8 pb-24 space-y-5">
        <h1 className="text-6xl font-extrabold">{album.name}</h1>

        <div className="flex items-center gap-4 text-sm text-gray-300">
          <span className="uppercase">{album.artist}</span>
          <span>{year}</span>
          <span>{album.total_tracks} músicas</span>
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
        mediaId={album.id}
        mediaType="album"
        onSuccess={() => setRefreshReviews((prev) => !prev)} 
      />

      <ReviewSection mediaId={album.id.toString()} refreshTrigger={refreshReviews} /> 
    </main>
  );
}
