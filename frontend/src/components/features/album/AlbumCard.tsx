"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import { Album } from "@/types/Album";
import { useMember } from "@/context/MemberContext";
import toast from "react-hot-toast";
import { FaHeart } from "react-icons/fa";
import { FiHeart } from "react-icons/fi";
import { isFavoritedMedia } from "@/services/user/is_favorited";
import { removeFavouriteMedia } from "@/services/user/remove_fav";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { addFavouriteAlbum } from "@/services/album/add_fav_album";

interface AlbumCardProps extends Album {
  onRemoveAlbum?: (id: string) => void;
}

export function AlbumCard({
  id,
  name,
  release_date,
  imageUrl,
  artist,
  onRemoveAlbum,
}: AlbumCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const { member } = useMember();
  const [isFavorited, setIsFavorited] = useState(false);
  const t = useTranslations("AlbumCard");
  const router = useRouter();
  const locale = useLocale();

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);
  useOutsideClick(modalRef, handleClose);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);

  useEffect(() => {
    const checkIfFavorited = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token || !member) return;
        const favorited = await isFavoritedMedia(member.id, id);
        setIsFavorited(favorited);
      } catch (error) {
        console.error("Erro ao verificar favorito:", error);
      }
    };
    checkIfFavorited();
  }, []);

  const handleFavorite = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token || !member) {
        toast.error(t("notAuthenticated"));
        return;
      }

      if (isFavorited) {
        const success = await removeFavouriteMedia(member.id, id, "album");
        if (success) {
          toast.success(t("removedFromFavorites"));
          setIsFavorited(false);
          if (onRemoveAlbum) onRemoveAlbum(id);
        } else {
          toast.error(t("errorRemovingFavorite"));
        }
      } else {
        const success = await addFavouriteAlbum(member.id, id);
        if (success) {
          toast.success(t("addedToFavorites"));
          setIsFavorited(true);
        } else {
          toast.error(t("errorAddingFavorite"));
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(t("errorAddingFavorite"));
    }
  };

  const handleViewDetails = () => {
    router.push(`/${locale}/album/${id}`);
  };

  return (
    <>
      <div
        onClick={handleOpen}
        className="cursor-pointer w-[190px] shrink-0 rounded-lg overflow-hidden hover:scale-105 transition-transform duration-300"
      >
        <div className="relative w-full h-[190px] rounded-lg overflow-hidden">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover rounded-lg"
          />
        </div>
        <div className="mt-2">
          <h3 className="text-white text-sm font-semibold leading-tight line-clamp-1">
            {name}
          </h3>
          <p className="text-gray-400 text-xs mt-1 line-clamp-1">{artist}</p>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              ref={modalRef}
              className="fixed z-50 top-[10%] left-1/2 -translate-x-1/2 bg-neutral-900 text-white p-6 max-w-md w-full rounded-xl shadow-xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{name}</h2>
                <button onClick={handleClose} className="text-red-400 text-2xl">
                  ×
                </button>
              </div>

              <div className="w-full h-[250px] relative rounded-md overflow-hidden mb-4">
                <Image
                  src={imageUrl}
                  alt={name}
                  fill
                  className="object-cover rounded-md"
                />
                <button
                  onClick={handleFavorite}
                  className="absolute bottom-3 right-3 bg-black/60 p-2 rounded-full"
                >
                  {isFavorited ? (
                    <FaHeart className="text-red-500 w-6 h-6" />
                  ) : (
                    <FiHeart className="text-white w-6 h-6" />
                  )}
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-sm">
                  <span className="text-gray-400">{t("artist")}</span> {artist}
                </p>
                <p className="text-sm">
                  <span className="text-gray-400">{t("releaseDate")}</span>{" "}
                  {release_date
                    ? new Date(release_date).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleViewDetails}
                  className="bg-darkgreen text-white px-5 py-2 rounded-md hover:brightness-110 transition"
                >
                  {t("viewDetails")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
