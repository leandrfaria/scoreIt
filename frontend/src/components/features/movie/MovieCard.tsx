'use client';

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import Image from "next/image";
import { FaStar, FaHeart } from "react-icons/fa";
import { FiHeart } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { Movie } from "@/types/Movie";
import { useTranslations, useLocale } from "next-intl";
import { useMember } from "@/context/MemberContext";
import toast from "react-hot-toast";
import { addFavouriteMovie } from "@/services/movie/add_fav_movie";
import { isFavoritedMedia } from "@/services/user/is_favorited";
import { removeFavouriteMedia } from "@/services/user/remove_fav";
import { fetchMemberLists, addContentToList } from "@/services/customList/add_content_list";

interface MovieCardProps extends Movie {
  onRemoveMovie?: (id: number) => void;
}

  export function MovieCard({
    id,
    title,
    posterUrl,
    backdropUrl,
    vote_average,
    release_date,
    overview,
    genre = "Drama",
    onRemoveMovie
  }: MovieCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [customLists, setCustomLists] = useState<string[]>([]);  // nomes únicos das listas
  const [selectedList, setSelectedList] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const year = new Date(release_date).getFullYear();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("MovieCard");
  const { member } = useMember();

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
        console.error(t("errorMovieFav"), error);
      }
    };

    checkIfFavorited();
  }, [id, member, t]);

  useEffect(() => {
    const loadLists = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token || !member) return;

        const lists = await fetchMemberLists(token, member.id);
        // Extrai nomes únicos das listas a partir do array de CustomList
        const uniqueListNames = Array.from(new Set(lists.map((item) => item.listName)));
        setCustomLists(uniqueListNames);
        if (uniqueListNames.length > 0) setSelectedList(uniqueListNames[0]);
      } catch (error) {
        toast.error("Erro carregando listas");
      }
    };

    if (isOpen) {
      loadLists();
    }
  }, [isOpen, member]);

  const handleFavorite = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token || !member) {
        toast.error(t("userNotAuthenticated"));
        return;
      }

      if (isFavorited) {
        const success = await removeFavouriteMedia(member.id, id, "movie");
        if (success) {
          toast.success(t("removedFromFavorites"));
          setIsFavorited(false);
          if (onRemoveMovie) onRemoveMovie(id);
        } else {
          toast.error(t("errorRemovingFavorite"));
        }
      } else {
        const success = await addFavouriteMovie(token, member.id, id);
        if (success) {
          toast.success(t("addedToFavorites"));
          setIsFavorited(true);
        } else {
          toast.error(t("errorAddingFavorite"));
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
      mediaType: "movie",
      listName: selectedList,
    });


    if (result === "duplicate") {
      toast.error("Este conteúdo já está na lista");
    } else if (result === "success") {
      toast.success("Filme adicionado à lista!");
    } else {
      toast.error("Erro ao adicionar à lista");
    }
  } finally {
    setIsAdding(false);
  }
};


  const handleViewDetails = () => {
    router.push(`/${locale}/movie/${id}`);
  };

  return (
    <>
      <div
        onClick={handleOpen}
        className="cursor-pointer w-full max-w-[190px] rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-all duration-300"
      >
        <div className="relative w-full h-[270px] bg-gray-800">
          {posterUrl && posterUrl !== "null" ? (
            <Image src={posterUrl} alt={title} fill className="object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              {t("noImageAvailable")}
            </div>
          )}
          <div className="absolute top-3 right-3 bg-black/70 text-white text-sm px-2 py-1 rounded-full flex items-center gap-1">
            <FaStar className="text-white" size={14} />
            <span>
              {vote_average.toFixed(1)} <span className="text-xs text-gray-300">/ 10</span>
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-black/10 p-3">
            <h3 className="text-white text-sm font-semibold truncate">{title}</h3>
            <p className="text-gray-300 text-xs">
              {genre} • {year}
            </p>
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
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{title}</h2>
                <button onClick={handleClose} className="text-red-400 text-xl">
                  ×
                </button>
              </div>

              {backdropUrl && backdropUrl !== "null" ? (
                <div className="relative w-full h-[250px] rounded-md overflow-hidden mb-6">
                  <Image src={backdropUrl} alt={title} fill className="object-cover rounded-md" />
                  <button onClick={handleFavorite} className="absolute bottom-3 right-3 bg-black/60 p-2 rounded-full">
                    {isFavorited ? (
                      <FaHeart className="text-red-500 w-6 h-6" />
                    ) : (
                      <FiHeart className="text-white w-6 h-6" />
                    )}
                  </button>
                </div>
              ) : (
                <div className="w-full h-[250px] rounded-md overflow-hidden mb-6 bg-gray-800 flex items-center justify-center text-gray-500 text-sm">
                  {t("noBackdropAvailable")}
                </div>
              )}

              <div className="space-y-4">
                <p className="text-xl font-semibold">{title}</p>
                <p className="text-gray-400 text-sm">
                  {t("releaseDate")}: {new Date(release_date).toLocaleDateString()}
                </p>
                <p className="text-gray-300 text-sm">{overview?.trim() ? overview : t("noDescription")}</p>
              </div>

              <div className="mt-6 flex items-center gap-2">
                <select
                  value={selectedList}
                  onChange={(e) => setSelectedList(e.target.value)}
                  className="bg-neutral-800 text-white p-2 rounded flex-grow"
                  disabled={customLists.length === 0}
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
