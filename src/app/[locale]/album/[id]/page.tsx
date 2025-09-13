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
import { useLocale, useTranslations } from "next-intl";

export default function AlbumPage() {
  const { id } = useParams<{ id: string }>();
  const [album, setAlbum] = useState<Album | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [refreshReviews, setRefreshReviews] = useState(false);
  const { member } = useMember();
  const locale = useLocale();
  const t = useTranslations("Albums");

  useEffect(() => {
    const loadAlbum = async () => {
      const result = await fetchAlbumById(id, locale);
      setAlbum(result);
    };
    loadAlbum();
  }, [id, locale]);

  useEffect(() => {
    const checkFavorite = async () => {
      if (member && id) {
        const fav = await isFavoritedMedia(member.id, id, locale);
        setIsFavorited(fav);
      }
    };
    checkFavorite();
  }, [member, id, locale]);

  const handleFavoriteToggle = async () => {
    if (!member || !album) return;

    if (isFavorited) {
      const success = await removeFavouriteMedia(member.id, album.id, locale, "album");
      if (success) {
        toast.success(t("toastRemoved"));
        setIsFavorited(false);
      } else toast.error(t("toastErrorRemove"));
    } else {
      const success = await addFavouriteAlbum(member.id, album.id);
      if (success) {
        toast.success(t("toastAdded"));
        setIsFavorited(true);
      } else toast.error(t("toastErrorAdd"));
    }
  };

  if (!album) return <p className="text-white p-10">{t("loadingAlbum")}</p>;

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
          <span>{t("tracksCount", { count: album.total_tracks })}</span>
        </div>

        <div className="flex gap-4 flex-wrap">
          <button
            onClick={() => setShowModal(true)}
            className="bg-white text-black font-semibold px-6 py-3 rounded hover:bg-gray-200 transition"
          >
            {t("rate")}
          </button>
          <button
            onClick={handleFavoriteToggle}
            className="bg-darkgreen/80 border border-white/20 text-white px-6 py-3 rounded hover:bg-darkgreen hover:brightness-110 transition flex items-center gap-2"
            aria-label={isFavorited ? t("removeFromFavorites") : t("addToFavorites")}
          >
            {isFavorited ? (
              <>
                <FaHeart className="text-red-500" /> {t("remove")}
              </>
            ) : (
              <>
                <FiHeart /> {t("favorite")}
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
