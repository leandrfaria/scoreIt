"use client";

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  /** Se true, dá prioridade ao carregamento do poster (itens acima da dobra) */
  priority?: boolean;
}

/** Blur minúsculo inline para efeito blur-up */
const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnL3N2ZyI+PHJlY3QgZmlsbD0iIzk5OTk5OSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==";

function SeriesCardBase({
  id,
  name,
  posterUrl,
  backdropUrl,
  vote_average,
  release_date,
  overview,
  genres = [],
  onRemoveSerie,
  priority = false,
}: SeriesCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [customLists, setCustomLists] = useState<string[]>([]);
  const [selectedList, setSelectedList] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [backdropLoaded, setBackdropLoaded] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("MovieCard");
  const { member } = useMember();

  const year = useMemo(() => {
    if (!release_date) return "";
    const d = new Date(release_date);
    return isNaN(d.getTime()) ? "" : d.getFullYear().toString();
  }, [release_date]);

  const genre = useMemo(() => (genres && genres.length > 0 ? genres[0] : "Drama"), [genres]);

  const handleOpen = useCallback(() => setIsOpen(true), []);
  const handleClose = useCallback(() => setIsOpen(false), []);
  useOutsideClick(modalRef, handleClose);

  // ---------- SCROLL LOCK DO BODY (sem pulo) ----------
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
  // ----------------------------------------------------

  // Esc para fechar somente quando aberto
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, handleClose]);

  // checar favorito
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token || !member) return;
        const favorited = await isFavoritedMedia(member.id, id);
        setIsFavorited(favorited);
      } catch (error) {
        console.error("Erro ao verificar favorito:", error);
      }
    })();
  }, [id, member]);

  // carregar listas quando modal abrir
  useEffect(() => {
    if (!isOpen || !member) return;
    (async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;
        const lists = await fetchMemberLists(token, member.id);
        const uniqueListNames = Array.from(new Set(lists.map((item) => item.listName)));
        setCustomLists(uniqueListNames);
        if (uniqueListNames.length > 0) setSelectedList((prev) => prev || uniqueListNames[0]);
      } catch {
        toast.error("Erro carregando listas");
      }
    })();
  }, [isOpen, member]);

  const handleFavorite = useCallback(async () => {
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
          onRemoveSerie?.(id);
        } else {
          toast.error(t("errorRemovingFavorite"));
        }
      } else {
        const success = await addFavouriteSeries(token, member.id, id);
        if (success) {
          // Mantendo suas chaves específicas de séries
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
  }, [id, isFavorited, member, onRemoveSerie, t]);

  const handleAddToList = useCallback(async () => {
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

      if (result === "duplicate") toast.error("Este conteúdo já está na lista");
      else if (result === "success") toast.success("Série adicionada à lista!");
      else toast.error("Erro ao adicionar à lista");
    } finally {
      setIsAdding(false);
    }
  }, [id, member, selectedList, t]);

  const handleViewDetails = useCallback(() => {
    router.push(`/${locale}/series/${id}`);
  }, [id, locale, router]);

  // --- UI ---
  return (
    <>
      <div
        onClick={handleOpen}
        className="cursor-pointer w-full max-w-[180px] sm:max-w-[190px] rounded-xl overflow-hidden shadow-lg hover:scale-[1.03] md:hover:scale-105 transition-transform duration-300"
        aria-label={`Abrir detalhes de ${name}`}
        style={{ contentVisibility: "auto", containIntrinsicSize: "270px 180px" }}
      >
        <div className="relative w-full aspect-[2/3] bg-neutral-900">
          {posterUrl && posterUrl !== "null" ? (
            <Image
              src={posterUrl}
              alt={name}
              fill
              className={`object-cover select-none ${posterLoaded ? "opacity-100" : "opacity-0"}`}
              sizes="(max-width: 640px) 45vw, 190px"
              priority={priority}
              fetchPriority={priority ? "high" : undefined}
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              onLoad={() => setPosterLoaded(true)}
              decoding="async"
              draggable={false}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              {t("noImageAvailable")}
            </div>
          )}

          {!posterLoaded && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-800" />
          )}

          <div className="absolute top-2 right-2 bg-black/70 text-white text-[11px] px-2 py-1 rounded-full flex items-center gap-1">
            <FaStar className="text-white" size={12} />
            <span className="leading-none">
              {Number.isFinite(vote_average) ? vote_average.toFixed(1) : "0.0"}{" "}
              <span className="text-[10px] text-gray-300">/ 10</span>
            </span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-2 sm:p-3">
            <h3 className="text-white text-[12px] sm:text-sm font-semibold line-clamp-2">{name}</h3>
            <p className="text-gray-300 text-[10px] sm:text-xs">
              {genre}
              {year ? ` • ${year}` : ""}
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-hidden
            />

            {/* Container com rolagem própria */}
            <div
              className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain touch-pan-y p-3 sm:p-6"
              onWheelCapture={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              <motion.div
                ref={modalRef}
                className="bg-neutral-900 text-white w-[92vw] max-w-3xl rounded-xl shadow-lg outline-none"
                style={{ maxHeight: "92vh", overflowY: "auto", WebkitOverflowScrolling: "touch" }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                role="dialog"
                aria-modal="true"
                aria-label={`Detalhes de ${name}`}
              >
                <div className="p-4 sm:p-6">
                  <div className="flex justify-between items-start mb-3 sm:mb-4 gap-3">
                    <h2 className="text-lg sm:text-2xl font-bold leading-tight">{name}</h2>
                    <button
                      onClick={handleClose}
                      className="text-red-400 text-2xl sm:text-xl -mt-1"
                      aria-label="Fechar modal"
                    >
                      ×
                    </button>
                  </div>

                  {backdropUrl && backdropUrl !== "null" ? (
                    <div className="relative w-full h-[180px] sm:h-[250px] rounded-md overflow-hidden mb-4 sm:mb-6">
                      <Image
                        src={backdropUrl}
                        alt={name}
                        fill
                        className={`object-cover rounded-md select-none ${backdropLoaded ? "opacity-100" : "opacity-0"}`}
                        sizes="(max-width: 640px) 92vw, 768px"
                        placeholder="blur"
                        blurDataURL={BLUR_DATA_URL}
                        onLoad={() => setBackdropLoaded(true)}
                        decoding="async"
                        draggable={false}
                      />
                      {!backdropLoaded && (
                        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-800" />
                      )}

                      <button
                        onClick={handleFavorite}
                        className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 bg-black/60 p-2 rounded-full"
                        // <<< resolvido: usar strings literais para evitar conflito de tipagem do next-intl
                        aria-label={isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                      >
                        {isFavorited ? (
                          <FaHeart className="text-red-500 w-6 h-6" />
                        ) : (
                          <FiHeart className="text-white w-6 h-6" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-[180px] sm:h-[250px] rounded-md overflow-hidden mb-6 bg-gray-800 flex items-center justify-center text-gray-500 text-sm">
                      {t("noBackdropAvailable")}
                    </div>
                  )}

                  <div className="space-y-3 sm:space-y-4">
                    <p className="text-base sm:text-xl font-semibold">{name}</p>
                    {release_date && (
                      <p className="text-gray-400 text-xs sm:text-sm">
                        {t("releaseDate")}: {new Date(release_date).toLocaleDateString()}
                      </p>
                    )}
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {overview?.trim() ? overview : t("noDescription")}
                    </p>
                  </div>

                  <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <select
                      value={selectedList}
                      onChange={(e) => setSelectedList(e.target.value)}
                      className="bg-neutral-800 text-white p-2 rounded flex-grow text-sm"
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
                      className="bg-darkgreen text-white px-4 py-2 rounded-md hover:brightness-110 transition text-sm"
                    >
                      {isAdding ? "Adicionando..." : "Adicionar"}
                    </button>
                  </div>

                  <div className="mt-4 sm:mt-6 flex justify-end">
                    <button
                      onClick={handleViewDetails}
                      className="bg-darkgreen text-white px-5 py-2 rounded-md hover:brightness-110 transition text-sm sm:text-base"
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

export const SeriesCard = memo(SeriesCardBase);
