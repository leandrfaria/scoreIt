"use client";

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import Image from "next/image";
import { FaStar, FaHeart } from "react-icons/fa";
import { FiHeart } from "react-icons/fi";
import { MdPlaylistAdd } from "react-icons/md";
import { useRouter } from "next/navigation";
import { Movie } from "@/types/Movie";
import { useTranslations, useLocale } from "next-intl";
import { useMember } from "@/context/MemberContext";
import toast from "react-hot-toast";
import { addFavouriteMovie } from "@/services/movie/add_fav_movie";
import { isFavoritedMedia } from "@/services/user/is_favorited";
import { removeFavouriteMedia } from "@/services/user/remove_fav";
import { fetchMemberLists, addContentToList } from "@/services/customList/list";
import { fetchAverageRating } from "@/services/review/average";
import { onReviewChanged } from "@/lib/events";
import RatingModal from "@/components/features/review/RatingModal";

interface MovieCardProps extends Movie {
  onRemoveMovie?: (id: number) => void;
  priority?: boolean;
}

const mapLocaleToTMDBLanguage = (locale: string): string => {
  const mapping: Record<string, string> = { pt: "pt-BR", en: "en-US" };
  return mapping[locale] || "pt-BR";
};

const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnL3N2ZyI+PHJlY3QgZmlsbD0iIzk5OTk5OSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==";

const L = {
  addToList: "Adicionar à lista",
  selectList: "Selecione uma lista",
  add: "Adicionar",
  adding: "Adicionando...",
  rate: "Avaliar",
  ratingLabel: "nota",
};

function upgradePosterQuality(src?: string | null): string | null {
  if (!src) return null;
  try {
    const u = new URL(src, typeof window !== "undefined" ? window.location.origin : "https://x");
    if (u.hostname.includes("image.tmdb.org") && /\/t\/p\//.test(u.pathname)) {
      const newPath = u.pathname.replace(/\/t\/p\/(w\d+|original)/, "/t/p/original");
      u.pathname = newPath;
      return u.toString().replace(/^https?:\/\/x/, "");
    }
  } catch {
    return src.replace(/\/t\/p\/(w\d+|original)/, "/t/p/original");
  }
  return src;
}

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

  const [showAddPanel, setShowAddPanel] = useState(false);
  const [scoreitAverage, setScoreitAverage] = useState<number | null>(null);
  const [isRatingOpen, setIsRatingOpen] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const year = useMemo(() => (release_date ? new Date(release_date).getFullYear() : ""), [release_date]);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("MovieCard");
  const { member } = useMember();

  const tmdbLanguage = useMemo(() => mapLocaleToTMDBLanguage(locale), [locale]);
  const posterBest = useMemo(() => upgradePosterQuality(posterUrl) ?? posterUrl ?? null, [posterUrl]);
  const backdropBest = useMemo(() => upgradePosterQuality(backdropUrl) ?? backdropUrl ?? null, [backdropUrl]);

  const handleOpen = useCallback(() => setIsOpen(true), []);
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setShowAddPanel(false);
  }, []);

  const handleCloseGuarded = useCallback(() => {
    if (isRatingOpen) return;
    handleClose();
  }, [isRatingOpen, handleClose]);

  useOutsideClick(modalRef, handleCloseGuarded);

  useEffect(() => {
    let controller = new AbortController();
    const load = async () => {
      const signal = controller.signal;
      const avg = await fetchAverageRating("MOVIE", id, { signal });
      if (!signal.aborted) setScoreitAverage(avg);
    };
    load();
    const intervalId = setInterval(() => {
      controller.abort();
      controller = new AbortController();
      load();
    }, 5 * 60 * 1000);

    const onFocus = () => {
      controller.abort();
      controller = new AbortController();
      load();
    };
    window.addEventListener("focus", onFocus);

    const off = onReviewChanged(({ mediaType, mediaId }) => {
      if (mediaType !== "MOVIE") return;
      if (String(mediaId) !== String(id)) return;
      controller.abort();
      controller = new AbortController();
      load();
    });

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      off();
      controller.abort();
    };
  }, [id]);

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

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isRatingOpen) handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, isRatingOpen, handleClose]);

  useEffect(() => {
    (async () => {
      try {
        if (!member) return;
        const favorited = await isFavoritedMedia(member.id, id, tmdbLanguage);
        setIsFavorited(favorited);
      } catch (error) {
        console.error(t("errorMovieFav"), error);
      }
    })();
  }, [id, member, t, tmdbLanguage]);

  useEffect(() => {
    if (!isOpen || !member) return;
    (async () => {
      try {
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
    if (!member) return toast.error(t("userNotAuthenticated"));
    if (isFavorited) {
      const ok = await removeFavouriteMedia(member.id, id, tmdbLanguage, "movie");
      if (ok) {
        toast.success(t("removedFromFavorites"));
        setIsFavorited(false);
        onRemoveMovie?.(id);
      } else toast.error(t("errorRemovingFavorite"));
    } else {
      const ok = await addFavouriteMovie(localStorage.getItem("authToken")!, member.id, id, tmdbLanguage);
      if (ok) {
        toast.success(t("addedToFavorites"));
        setIsFavorited(true);
      } else toast.error(t("errorAddingFavorite"));
    }
  }, [id, isFavorited, member, onRemoveMovie, t, tmdbLanguage]);

  const handleAddToList = useCallback(async () => {
    if (!selectedList) return toast.error(L.selectList);
    try {
      setIsAdding(true);
      if (!member) return toast.error(t("userNotAuthenticated"));
      const result = await addContentToList(localStorage.getItem("authToken")!, {
        memberId: member.id,
        mediaId: String(id),
        mediaType: "movie",
        language: tmdbLanguage,
        listName: selectedList,
      });
      if (result === "duplicate") toast.error(t("alreadyInList"));
      else if (result === "success") toast.success(t("movieAdded"));
      else toast.error(t("errorAdding"));
      setShowAddPanel(false);
    } finally {
      setIsAdding(false);
    }
  }, [id, member, selectedList, t, tmdbLanguage]);

  const handleViewDetails = useCallback(() => router.push(`/${locale}/movie/${id}`), [id, locale, router]);

  const ratingText = scoreitAverage == null ? "Sem Nota" : scoreitAverage.toFixed(1);

  return (
    <>
      {/* ===== CARD ===== */}
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
            <span>{ratingText}</span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-2">
            <h3 className="text-white text-sm font-semibold line-clamp-2">{title}</h3>
            <p className="text-gray-300 text-xs">
              {genre || "Gênero não disponível"}
              {year ? ` • ${year}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* ===== MODAL ===== */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* overlay */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            />
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-2 sm:p-3 lg:p-6">
              <motion.div
                ref={modalRef}
                className="relative w-[98vw] sm:w-[96vw] max-w-5xl rounded-2xl border border-white/10 bg-[rgba(7,12,16,0.9)] backdrop-blur-xl shadow-2xl"
                style={{ maxHeight: "94vh", overflowY: "auto" }}
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
              >
                <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10" />
                <div className="p-3 sm:p-4 lg:p-6">
                  {/* Fechar */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleClose}
                      className="p-2 -mr-2 text-white/70 hover:text-white transition text-2xl leading-none"
                      aria-label={t("close")}
                    >
                      ×
                    </button>
                  </div>

                  {/* layout 1 coluna no mobile / 2 colunas no desktop */}
                  <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:gap-6 lg:[grid-template-columns:360px_1fr]">
                    {/* MOBILE: backdrop como banner (mostrando imagem inteira) */}
                    <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-black/30 ring-1 ring-white/10 shadow-xl lg:hidden">
                      {(backdropBest || posterBest) ? (
                        <Image
                          src={(backdropBest || posterBest)!}
                          alt={`${title} backdrop`}
                          fill
                          className="object-contain"   
                          sizes="100vw"
                          placeholder="blur"
                          blurDataURL={BLUR_DATA_URL}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          {t("noImageAvailable")}
                        </div>
                      )}
                    </div>

                    <div className="hidden lg:block relative w-full h-[540px] rounded-xl overflow-hidden bg-black/30 ring-1 ring-white/10 shadow-xl">
                      {posterBest ? (
                        <Image
                          src={posterBest}
                          alt={`${title} poster`}
                          fill
                          className="object-cover"
                          sizes="360px"
                          placeholder="blur"
                          blurDataURL={BLUR_DATA_URL}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          {t("noImageAvailable")}
                        </div>
                      )}
                    </div>

                    {/* DIREITA */}
                    <div className="relative flex flex-col pb-28 lg:pb-24 min-h-[unset] lg:min-h-[540px]">
                      {/* Título + gênero + nota */}
                      <div className="flex items-stretch gap-3 sm:gap-4">
                        <div className="flex-1 flex flex-col gap-1.5 sm:gap-2">
                          <h3 className="text-[22px] sm:text-[24px] lg:text-[28px] font-extrabold leading-tight tracking-tight text-white">
                            {title}
                          </h3>
                          <p className="text-xs sm:text-sm text-white/70">
                            {genre || "Gênero não disponível"}{year ? ` • ${year}` : ""}
                          </p>
                        </div>

                        {/* Nota */}
                        <div className="shrink-0 self-stretch flex flex-col justify-center rounded-xl px-4 sm:px-5 py-2 text-center ring-1 ring-white/10 bg-transparent">
                          <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white/70">{L.ratingLabel}</span>
                          <div className="mt-1 flex items-center justify-center gap-1">
                            <FaStar className="text-[var(--color-mediumgreen)] drop-shadow-[0_0_6px_rgba(92,131,116,0.5)]" />
                            <span className="text-lg sm:text-xl font-bold text-white">{ratingText}</span>
                          </div>
                        </div>
                      </div>

                      {/* Descrição */}
                      <div className="mt-3 sm:mt-4 flex-1 overflow-auto min-h-[200px] sm:min-h-[240px] max-h-[55vh] lg:max-h-[420px]">
                        <p className="text-[14px] sm:text-[15px] leading-relaxed text-white/90">
                          {overview?.trim() || t("noDescription")}
                        </p>
                      </div>

                      {/* Botões fixos */}
                      <div className="absolute bottom-0 right-0 flex items-center gap-2 sm:gap-3 p-2">
                        {/* b1: adicionar lista */}
                        <div className="relative">
                          <button
                            onClick={() => setShowAddPanel((s) => !s)}
                            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/5 ring-1 ring-white/10 hover:bg-white/10 hover:ring-white/20 transition grid place-items-center"
                            aria-label={L.addToList}
                            title={L.addToList}
                          >
                            <MdPlaylistAdd className="w-6 h-6 text-white/90" />
                          </button>

                          {showAddPanel && (
                            <div className="absolute right-0 bottom-12 w-64 sm:w-72 rounded-xl bg-[rgba(8,12,16,0.95)] ring-1 ring-white/10 shadow-2xl p-3 z-10 backdrop-blur">
                              <div className="flex gap-2">
                                <select
                                  value={selectedList}
                                  onChange={(e) => setSelectedList(e.target.value)}
                                  className="bg-white/5 text-white px-3 py-2 rounded-lg text-sm flex-1 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                                  disabled={customLists.length === 0}
                                >
                                  <option value="">{L.selectList}</option>
                                  {customLists.map((l) => (
                                    <option key={l}>{l}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={handleAddToList}
                                  disabled={isAdding || !selectedList}
                                  className="px-3 sm:px-4 py-2 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 transition text-sm font-semibold disabled:opacity-50"
                                >
                                  {isAdding ? L.adding : L.add}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* b2: favorito */}
                        <button
                          onClick={handleFavorite}
                          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/5 ring-1 ring-white/10 hover:bg-white/10 hover:ring-white/20 transition grid place-items-center"
                          aria-label={isFavorited ? t("removeFromFavorites") : t("addToFavorites")}
                          title={isFavorited ? t("removeFromFavorites") : t("addToFavorites")}
                        >
                          {isFavorited ? (
                            <FaHeart className="text-red-500 w-5 h-5" />
                          ) : (
                            <FiHeart className="text-white/90 w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => setIsRatingOpen(true)}
                          className="px-4 sm:px-5 py-2 rounded-lg bg-[var(--color-darkgreen)] hover:brightness-110 transition text-sm font-semibold shadow-md"
                        >
                          {L.rate}
                        </button>

                        <button
                          onClick={handleViewDetails}
                          className="px-4 sm:px-5 py-2 rounded-lg bg-transparent ring-1 ring-white/15 hover:ring-white/30 hover:bg-white/5 transition text-sm"
                        >
                          {t("viewDetails")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <RatingModal
              isOpen={isRatingOpen}
              onClose={() => setIsRatingOpen(false)}
              mediaId={id}
              mediaType="movie"
              onSuccess={() => {}}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export const MovieCard = memo(MovieCardBase);
