'use client';

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import Image from "next/image";
import { FaStar, FaHeart } from "react-icons/fa";
import { FiHeart } from "react-icons/fi";
import { Series } from "@/types/Series";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMember } from "@/context/MemberContext";
import toast from "react-hot-toast";
import { addFavouriteSeries } from "@/services/service_add_favourite_series";
import { isFavoritedMedia } from "@/services/service_is_favorited";
import { removeFavouriteMedia } from "@/services/service_remove_favourite";

interface SeriesCardProps extends Series {
  onRemoveSerie?: (id: number) => void; 
}

export function SeriesCard({
  id,
  name,
  posterUrl,
  backdropUrl,
  vote_average,
  release_date,
  overview,
  onRemoveSerie,
}: SeriesCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const t = useTranslations("MovieCard");
  const { member } = useMember();

  const year = release_date ? new Date(release_date).getFullYear() : "N/A";

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  useOutsideClick(modalRef, handleClose);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
        toast.error((t("userNotAuthenticated")));
        return;
      }

      if (isFavorited) {
        const success = await removeFavouriteMedia(member.id, id, 'series');
        if (success) {
          toast.success(t("removedFromFavorites"));
          setIsFavorited(false);

          if (onRemoveSerie) {
            onRemoveSerie(id); // 👈 chama aqui se foi removido
          }
        } else {
          toast.error(t("errorRemovingFavorite"));
        }
      } else {
        const success = await addFavouriteSeries(token, member.id, id);
        if (success) {
          toast.success(t("SerieaddFavorite"));
          setIsFavorited(true);
        } else {
          toast.error((t("SerieserrorAddingFavorite")))
        }
      }
    } catch (error) {
      console.error(error);
      toast.error((t("errorUpdatingFavorites")));
    }
  };

  return (
    <>
      <div onClick={handleOpen} className="cursor-pointer w-full max-w-[190px] rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-all duration-300">
        <div className="relative w-full h-[270px]">
          <Image src={posterUrl} alt={name} fill className="object-cover" />
          <div className="absolute top-3 right-3 bg-black/70 text-white text-sm px-2 py-1 rounded-full flex items-center gap-1">
            <FaStar className="text-white" size={14} />
            <span>{vote_average.toFixed(1)} <span className="text-xs text-gray-300">/ 10</span></span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-black/10 p-3">
            <h3 className="text-white text-sm font-semibold truncate">{name}</h3>
            <p className="text-gray-300 text-xs">{year}</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div ref={modalRef} className="fixed z-50 top-[8%] left-1/2 -translate-x-1/2 bg-neutral-900 text-white p-6 max-w-3xl w-full rounded-xl shadow-lg" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{name}</h2>
                <button onClick={handleClose} className="text-red-400 text-xl">×</button>
              </div>

              {backdropUrl && (
                <div className="relative w-full h-[250px] rounded-md overflow-hidden mb-6">
                  <Image src={backdropUrl} alt={name} fill className="object-cover rounded-md" />
                  <button onClick={handleFavorite} className="absolute bottom-3 right-3 bg-black/60 p-2 rounded-full">
                    {isFavorited ? <FaHeart className="text-red-500 w-6 h-6" /> : <FiHeart className="text-white w-6 h-6" />}
                  </button>
                </div>
              )}

              <div className="space-y-4">
                <p className="text-xl font-semibold">{name}</p>
                <p className="text-gray-400 text-sm">{t("releaseDate")}: {release_date ? new Date(release_date).toLocaleDateString() : "N/A"}</p>
                <p className="text-gray-300 text-sm">{overview ? overview : t("noDescription")}</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
