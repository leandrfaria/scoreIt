"use client";

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { fetchMemberLists, addContentToList } from "@/services/customList/list";

interface MovieCardProps extends Movie {
  onRemoveMovie?: (id: number) => void;
  priority?: boolean;
}

const mapLocaleToTMDBLanguage = (locale: string): string => {
  const mapping: Record<string, string> = {
    'pt': 'pt-BR',
    'en': 'en-US',
  };
  return mapping[locale] || 'pt-BR';
};

const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnL3N2ZyI+PHJlY3QgZmlsbD0iIzk5OTk5OSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==";

function MovieCardBase({
  id,
  title,
  posterUrl,
  backdropUrl,
  vote_average,
  release_date,
  overview,
  genre,
  onRemoveMovie,
  priority = false,
}: MovieCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [customLists, setCustomLists] = useState<string[]>([]);
  const [selectedList, setSelectedList] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [backdropLoaded, setBackdropLoaded] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const year = useMemo(() => (release_date ? new Date(release_date).getFullYear() : ""), [release_date]);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("MovieCard");
  const { member } = useMember();

  const tmdbLanguage = useMemo(() => mapLocaleToTMDBLanguage(locale), [locale]);

  const handleOpen = useCallback(() => setIsOpen(true), []);
  const handleClose = useCallback(() => setIsOpen(false), []);
  useOutsideClick(modalRef, handleClose);

  // SCROLL LOCK body
  useEffect(() => {
    if (!isOpen) return;
    const { body, documentElement } = document;
    const scrollY = window.scrollY;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
    body.style.paddingRight = `${scrollbarWidth}px`;
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    return () => {
      body.style.removeProperty("position");
      body.style.removeProperty("top");
      body.style.removeProperty("left");
      body.style.removeProperty("right");
      body.style.removeProperty("width");
      body.style.removeProperty("overflow");
      body.style.removeProperty("padding-right");
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  // ESC fecha modal
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, handleClose]);

  // Checar favorito
  useEffect(() => {
    (async () => {
      try {
        if (!member) return;
        // Passar tmdbLanguage em vez de locale
        const favorited = await isFavoritedMedia(member.id, id, tmdbLanguage);
        setIsFavorited(favorited);
      } catch (error) {
        console.error(t("errorMovieFav"), error);
      }
    })();
  }, [id, member, t, tmdbLanguage]);

  // Carregar listas quando abrir o modal
  useEffect(() => {
    if (!isOpen || !member) return;
    (async () => {
      try {
        // Passar tmdbLanguage em vez de locale
        const lists = await fetchMemberLists(localStorage.getItem("authToken")!, member.id, tmdbLanguage);
        const unique = Array.from(new Set(lists.map((l) => l.listName)));
        setCustomLists(unique);
        if (unique.length > 0) setSelectedList((prev) => prev || unique[0]);
      } catch {
        toast.error(t("errorLoadingLists"));
      }
    })();
  }, [isOpen, member, tmdbLanguage, t]);

const handleFavorite = useCallback(async () => {
  if (!member) {
    toast.error(t("userNotAuthenticated"));
    return;
  }
  
  if (isFavorited) {
    // Correção: inverter a ordem dos parâmetros
    const ok = await removeFavouriteMedia(member.id, id, tmdbLanguage, "movie");
    if (ok) {
      toast.success(t("removedFromFavorites"));
      setIsFavorited(false);
      onRemoveMovie?.(id);
    } else {
      toast.error(t("errorRemovingFavorite"));
    }
  } else {
    const ok = await addFavouriteMovie(
      localStorage.getItem("authToken")!,
      member.id,
      id,
      tmdbLanguage
    );
    if (ok) {
      toast.success(t("addedToFavorites"));
      setIsFavorited(true);
    } else {
      toast.error(t("errorAddingFavorite"));
    }
  }
}, [id, isFavorited, member, onRemoveMovie, t, tmdbLanguage]);

  const handleAddToList = useCallback(async () => {
    if (!selectedList) return toast.error(t("selectList"));
    try {
      setIsAdding(true);
      if (!member) return toast.error(t("userNotAuthenticated"));
      const result = await addContentToList(localStorage.getItem("authToken")!, {
        memberId: member.id,
        mediaId: String(id),
        mediaType: "movie",
        listName: selectedList,
        language: tmdbLanguage,
      });
      if (result === "duplicate") toast.error(t("alreadyInList"));
      else if (result === "success") toast.success(t("movieAdded"));
      else toast.error(t("errorAdding"));
    } finally {
      setIsAdding(false);
    }
  }, [id, member, selectedList, t, tmdbLanguage]);

  const handleViewDetails = useCallback(() => router.push(`/${locale}/movie/${id}`), [id, locale, router]);

  return (
    <>
      {/* CARD */}
      <div
        onClick={handleOpen}
        className="cursor-pointer w-full max-w-[180px] sm:max-w-[190px] rounded-xl overflow-hidden shadow-lg hover:scale-[1.03] transition-transform duration-300 relative"
        aria-label={t("openDetails", { title })}
      >
        <div className="relative w-full aspect-[2/3] bg-neutral-900">
          {posterUrl && posterUrl !== "null" ? (
            <Image
              src={posterUrl}
              alt={title}
              fill
              className={`object-cover ${posterLoaded ? "opacity-100" : "opacity-0"}`}
              sizes="(max-width: 640px) 45vw, 190px"
              priority={priority}
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              onLoad={() => setPosterLoaded(true)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              {t("noImageAvailable")}
            </div>
          )}
          {!posterLoaded && <div className="absolute inset-0 animate-pulse bg-neutral-800" />}
          <div className="absolute top-2 left-2 bg-black/70 text-white text-[11px] px-2 py-1 rounded-full flex items-center gap-1">
            <FaStar size={12} />
            <span>{vote_average?.toFixed(1) ?? "0.0"}</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-2">
            <h3 className="text-white text-sm font-semibold line-clamp-2">{title}</h3>
            <p className="text-gray-300 text-xs">
              {genre || "Gênero não disponível"} {/* ADICIONANDO fallback aqui */}
              {year ? ` • ${year}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 sm:p-6">
              <motion.div
                ref={modalRef}
                className="bg-neutral-900 text-white w-[92vw] max-w-3xl rounded-xl shadow-lg"
                style={{ maxHeight: "92vh", overflowY: "auto" }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
              >
                <div className="p-4 sm:p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <button onClick={handleClose} className="text-red-400 text-2xl" aria-label={t("close")}>
                      ×
                    </button>
                  </div>
                  {backdropUrl && backdropUrl !== "null" ? (
                    <div className="relative w-full h-[200px] sm:h-[250px] rounded-md overflow-hidden mb-6">
                      <Image
                        src={backdropUrl}
                        alt={title}
                        fill
                        className={`object-cover ${backdropLoaded ? "opacity-100" : "opacity-0"}`}
                        onLoad={() => setBackdropLoaded(true)}
                      />
                      {!backdropLoaded && <div className="absolute inset-0 animate-pulse bg-neutral-800" />}
                      <button
                        onClick={handleFavorite}
                        className="absolute bottom-2 right-2 bg-black/60 p-2 rounded-full"
                        aria-label={isFavorited ? t("removeFromFavorites") : t("addToFavorites")}
                      >
                        {isFavorited ? (
                          <FaHeart className="text-red-500 w-6 h-6" />
                        ) : (
                          <FiHeart className="text-white w-6 h-6" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-[200px] bg-gray-800 flex items-center justify-center text-gray-500">
                      {t("noImageAvailable")}
                    </div>
                  )}
                  <div className="space-y-3">
                    <p className="text-gray-400 text-sm">
                      {t("releaseDate")}: {release_date ? new Date(release_date).toLocaleDateString(locale) : t("unknown")}
                    </p>
                    <p className="text-gray-300 text-sm">{overview?.trim() || t("noDescription")}</p>
                  </div>
                  <div className="mt-5 flex flex-col sm:flex-row gap-2">
                    <select
                      value={selectedList}
                      onChange={(e) => setSelectedList(e.target.value)}
                      className="bg-neutral-800 text-white p-2 rounded flex-grow text-sm"
                      disabled={customLists.length === 0}
                    >
                      <option value="">{t("selectList")}</option>
                      {customLists.map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddToList}
                      disabled={isAdding || !selectedList}
                      className="bg-darkgreen text-white px-4 py-2 rounded-md hover:brightness-110 transition text-sm"
                    >
                      {isAdding ? t("adding") : t("add")}
                    </button>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleViewDetails}
                      className="bg-darkgreen text-white px-5 py-2 rounded-md hover:brightness-110 transition text-sm"
                    >
                      {t("viewDetails")}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export const MovieCard = memo(MovieCardBase);