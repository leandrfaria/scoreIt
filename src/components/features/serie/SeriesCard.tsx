"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import Image from "next/image";
import { FaStar, FaHeart } from "react-icons/fa";
import { FiHeart } from "react-icons/fi";
import { Series } from "@/types/Series";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useMember } from "@/context/MemberContext";
import toast from "react-hot-toast";
import { addFavouriteSeries } from "@/services/series/add_fav_series";
import { isFavoritedMedia } from "@/services/user/is_favorited";
import { removeFavouriteMedia } from "@/services/user/remove_fav";
import { fetchMemberLists, addContentToList } from "@/services/customList/add_content_list";

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
  const locale = useLocale();
  const t = useTranslations("MovieCard");
  const { member } = useMember();
  const [customLists, setCustomLists] = useState<string[]>([]);
  const [selectedList, setSelectedList] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  useOutsideClick(modalRef, handleClose);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  useEffect(() => {
    const checkIfFavorited = async () => {
      try {
        if (!member) return;
        const favorited = await isFavoritedMedia(member.id, id);
        setIsFavorited(favorited);
      } catch (error) {
        console.error("Erro ao verificar favorito:", error);
      }
    };
    checkIfFavorited();
  }, [member, id]);

  useEffect(() => {
    const loadLists = async () => {
      try {
        if (!member) return;
        const token = localStorage.getItem("authToken");
        if (!token) return;
        const lists = await fetchMemberLists(token, member.id);
        const unique = Array.from(new Set(lists.map((i) => i.listName)));
        setCustomLists(unique);
        if (unique.length > 0) setSelectedList(unique[0]);
      } catch (error) {
        toast.error("Erro carregando listas");
      }
    };
    if (isOpen) loadLists();
  }, [isOpen, member]);

  const handleFavorite = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token || !member) {
        toast.error(t("userNotAuthenticated"));
        return;
      }

      if (isFavorited) {
        const success = await removeFavouriteMedia(member.id, id, "series");
        if (success) {
          toast.success(t("removedFromFavorites"));
          setIsFavorited(false);
          if (onRemoveSerie) onRemoveSerie(id);
        } else {
          toast.error(t("errorRemovingFavorite"));
        }
      } else {
        const success = await addFavouriteSeries(token, member.id, id);
        if (success) {
          toast.success(t("SerieaddFavorite"));
          setIsFavorited(true);
        } else {
          toast.error(t("SerieserrorAddingFavorite"));
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(t("errorUpdatingFavorites"));
    }
  };

  const handleAddToList = async () => {
    if (!selectedList) {
      toast.error("Selecione uma lista");
      return;
    }
    try {
      setIsAdding(true);
      const token = localStorage.getItem("authToken");
      if (!token || !member) {
        toast.error(t("userNotAuthenticated"));
        return;
      }
      const result = await addContentToList(token, {
        memberId: member.id,
        mediaId: String(id),
        mediaType: "series",
        listName: selectedList,
      });

      if (result === "duplicate") {
        toast.error("Este conteúdo já está na lista");
      } else if (result === "success") {
        toast.success("Série adicionada à lista!");
      } else {
        toast.error("Erro ao adicionar à lista");
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleViewDetails = () => {
    router.push(`/${locale}/series/${id}`);
  };

  return (
    <>
      <div
        onClick={handleOpen}
        className="cursor-pointer w-full max-w-[190px] rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-all duration-300"
      >
        <div className="relative w-full h-[270px]">
          {posterUrl && posterUrl !== "null" ? (
            <Image src={posterUrl} alt={name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-white text-sm">
              {t("noImageAvailable")}
            </div>
          )}
          <div className="absolute top-3 right-3 bg-black/70 text-white text-sm px-2 py-1 rounded-full flex items-center gap-1">
            <FaStar className="text-white" size={14} />
            <span>
              {Number.isFinite(vote_average) ? vote_average.toFixed(1) : "0.0"}{" "}
              <span className="text-xs text-gray-300">/ 10</span>
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-black/10 p-3">
            <h3 className="text-white text-sm font-semibold truncate">{name}</h3>
          </div>
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
              className="fixed z-50 top-[8%] left-1/2 -translate-x-1/2 bg-neutral-900 text-white p-6 max-w-3xl w-full rounded-xl shadow-lg"
              role="dialog"
              aria-modal="true"
              aria-labelledby={`serie-title-${id}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 id={`serie-title-${id}`} className="text-2xl font-bold">
                  {name}
                </h2>
                <button onClick={handleClose} className="text-red-400 text-xl" aria-label="Close">
                  ×
                </button>
              </div>

              {backdropUrl && backdropUrl !== "null" ? (
                <div className="relative w-full h-[250px] rounded-md overflow-hidden mb-6">
                  <Image src={backdropUrl} alt={name} fill className="object-cover rounded-md" />
                  <button
                    onClick={handleFavorite}
                    className="absolute bottom-3 right-3 bg-black/60 p-2 rounded-full"
                    aria-label={isFavorited ? t("removedFromFavorites") : t("SerieaddFavorite")}
                  >
                    {isFavorited ? (
                      <FaHeart className="text-red-500 w-6 h-6" />
                    ) : (
                      <FiHeart className="text-white w-6 h-6" />
                    )}
                  </button>
                </div>
              ) : (
                <div className="w-full h-[250px] bg-neutral-800 rounded-md mb-6 flex items-center justify-center text-white text-sm">
                  {t("noBackdropAvailable")}
                </div>
              )}

              <div className="space-y-4">
                <p className="text-xl font-semibold">{name}</p>
                <p className="text-gray-300 text-sm">
                  {overview?.trim() ? overview : t("noDescription")}
                </p>
              </div>

              <div className="mt-6 flex items-center gap-2">
                <select
                  value={selectedList}
                  onChange={(e) => setSelectedList(e.target.value)}
                  className="bg-neutral-800 text-white p-2 rounded flex-grow"
                  disabled={customLists.length === 0}
                  aria-label="Selecionar lista"
                >
                  <option value="" disabled>
                    Selecione uma lista
                  </option>
                  {customLists.map((listName) => (
                    <option key={listName} value={listName}>
                      {listName}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleAddToList}
                  disabled={isAdding || customLists.length === 0 || !selectedList}
                  className="bg-darkgreen text-white px-5 py-2 rounded-md hover:brightness-110 transition"
                >
                  {isAdding ? "Adicionando..." : "Adicionar"}
                </button>
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
