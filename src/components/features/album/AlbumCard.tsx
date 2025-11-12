// src/components/features/album/AlbumCard.tsx
"use client";

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import { Album } from "@/types/Album";
import { useMember } from "@/context/MemberContext";
import toast from "react-hot-toast";
import { FaHeart, FaStar } from "react-icons/fa";
import { FiHeart } from "react-icons/fi";
import { isFavoritedMedia } from "@/services/user/is_favorited";
import { removeFavouriteMedia } from "@/services/user/remove_fav";
import { useRouter } from "next/navigation";
import { addFavouriteAlbum } from "@/services/album/add_fav_album";
import { fetchMemberLists, addContentToList } from "@/services/customList/list";
import { getToken } from "@/lib/api";
import { fetchAverageRating } from "@/services/review/average";
import { onReviewChanged } from "@/lib/events";
import RatingModal from "@/components/features/review/RatingModal";

interface AlbumCardProps extends Album {
  onRemoveAlbum?: (id: string) => void;
  priority?: boolean;
}

const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnL3N2ZyI+PHJlY3QgZmlsbD0iIzk5OTk5OSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==";

function AlbumCardBase({
  id,
  name,
  release_date,
  imageUrl,
  artist,
  onRemoveAlbum,
  priority = false,
}: AlbumCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [posterLoaded, setPosterLoaded] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const { member } = useMember();
  const [isFavorited, setIsFavorited] = useState(false);
  const [customLists, setCustomLists] = useState<string[]>([]);
  const [selectedList, setSelectedList] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [imgSrc, setImgSrc] = useState(imageUrl || "/fallback.jpg");
  const [scoreitAverage, setScoreitAverage] = useState<number | null>(null);
  const [isRatingOpen, setIsRatingOpen] = useState(false);

  const router = useRouter();

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

  // ===== Média ScoreIt (ALBUM) =====
  useEffect(() => {
    let controller = new AbortController();
    const load = async () => {
      const signal = controller.signal;
      const avg = await fetchAverageRating("ALBUM", id, { signal });
      if (!signal.aborted) setScoreitAverage(avg);
    };
    load();
    const interval = setInterval(() => {
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
      if (mediaType !== "ALBUM") return;
      if (String(mediaId) !== String(id)) return;
      controller.abort();
      controller = new AbortController();
      load();
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      off();
      controller.abort();
    };
  }, [id]);

  // ===== Favorito =====
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!member || !isOpen) return;
        const favorited = await isFavoritedMedia(member.id, id, "pt");
        if (mounted) setIsFavorited(Boolean(favorited));
      } catch (err) {
        console.error("Erro ao verificar favorito:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, member, isOpen]);

  // ===== Listas =====
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!member || !isOpen) return;
        const token = getToken();
        if (!token) return;
        const lists = await fetchMemberLists(token, member.id, "pt");
        const unique = Array.from(new Set(lists.map((l) => String(l.listName || "")))).filter(Boolean);
        if (!mounted) return;
        setCustomLists(unique);
        if (unique.length > 0) setSelectedList((prev) => prev || unique[0]);
      } catch {
        toast.error("Erro ao carregar listas");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isOpen, member]);

  // ===== Scroll-lock =====
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

  // ===== ESC =====
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isRatingOpen) handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, isRatingOpen, handleClose]);

  const [showAddPanel, setShowAddPanel] = useState(false);

  // ===== Funções =====
  const handleFavorite = useCallback(async () => {
    if (!member) {
      toast.error("Você precisa estar logado.");
      return;
    }
    if (isFavorited) {
      const ok = await removeFavouriteMedia(member.id, id, "pt", "album");
      if (ok) {
        toast.success("Removido dos favoritos.");
        setIsFavorited(false);
        onRemoveAlbum?.(id);
      } else toast.error("Erro ao remover dos favoritos.");
    } else {
      const ok = await addFavouriteAlbum(member.id, id);
      if (ok) {
        toast.success("Adicionado aos favoritos.");
        setIsFavorited(true);
      } else toast.error("Erro ao adicionar aos favoritos.");
    }
  }, [id, isFavorited, member, onRemoveAlbum]);

  const handleAddToList = useCallback(async () => {
    if (!selectedList) return toast.error("Selecione uma lista");
    try {
      setIsAdding(true);
      if (!member) return toast.error("Você precisa estar logado.");
      const token = getToken();
      if (!token) return toast.error("Sessão expirada");
      const result = await addContentToList(token, {
        memberId: member.id,
        mediaId: id,
        mediaType: "album",
        listName: selectedList,
        language: "pt",
      });
      if (result === "duplicate") toast.error("Já está na lista");
      else if (result === "success") toast.success("Álbum adicionado!");
      else toast.error("Erro ao adicionar à lista");
      setShowAddPanel(false);
    } finally {
      setIsAdding(false);
    }
  }, [id, member, selectedList]);

  const handleViewDetails = useCallback(() => router.push(`/pt/album/${id}`), [id, router]);

  const year = useMemo(() => {
    if (!release_date) return "";
    const d = new Date(release_date);
    return isNaN(d.getTime()) ? "" : d.getFullYear().toString();
  }, [release_date]);

  const ratingText = scoreitAverage == null ? "—" : scoreitAverage.toFixed(1);

  return (
    <>
      {/* ===== CARD ===== */}
      <div
        onClick={handleOpen}
        className="cursor-pointer w-full max-w-[180px] sm:max-w-[190px] rounded-xl overflow-hidden shadow-lg hover:scale-[1.03] transition-transform duration-300 relative"
      >
        <div className="relative w-full aspect-square bg-neutral-900">
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={name}
              fill
              className={`object-cover ${posterLoaded ? "opacity-100" : "opacity-0"}`}
              sizes="(max-width: 640px) 45vw, 190px"
              priority={priority}
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              onLoad={() => setPosterLoaded(true)}
              onError={() => setImgSrc("/fallback.jpg")}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              Sem imagem disponível
            </div>
          )}
          {!posterLoaded && <div className="absolute inset-0 animate-pulse bg-neutral-800" />}

          {/* ⭐ Nota */}
          <div className="absolute top-2 left-2 bg-black/70 text-white text-[11px] px-2 py-1 rounded-full flex items-center gap-1">
            <FaStar size={12} />
            <span>{ratingText}</span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-2">
            <h3 className="text-white text-sm font-semibold line-clamp-2">{name}</h3>
            <p className="text-gray-300 text-xs">
              {artist || "Artista indisponível"} {year ? ` • ${year}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* ===== MODAL ===== */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-2 sm:p-3 lg:p-6">
              <motion.div
                ref={modalRef}
                className="relative w-[98vw] sm:w-[96vw] max-w-5xl rounded-2xl border border-white/10 bg-[rgba(7,12,16,0.9)] backdrop-blur-xl shadow-2xl"
                style={{ maxHeight: "94vh", overflowY: "auto" }}
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
              >
                <div className="flex justify-end">
                  <button onClick={handleClose} className="p-2 -mr-2 text-white/70 hover:text-white transition text-2xl leading-none">
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:gap-6 lg:[grid-template-columns:360px_1fr]">
                  {/* Imagem */}
                  <div className="hidden lg:block relative w-full h-[540px] rounded-xl overflow-hidden bg-black/30 ring-1 ring-white/10 shadow-xl">
                    <Image src={imgSrc} alt={name} fill className="object-cover" onError={() => setImgSrc("/fallback.jpg")} />
                  </div>

                  {/* Conteúdo */}
                  <div className="relative flex flex-col min-h-[unset] lg:min-h-[540px]">
                    <div className="flex items-stretch gap-3 sm:gap-4">
                      <div className="flex-1 flex flex-col gap-1.5 sm:gap-2">
                        <h3 className="text-[24px] lg:text-[28px] font-extrabold leading-tight text-white">{name}</h3>
                        <p className="text-sm text-white/70">
                          {artist || "Artista indisponível"} {year ? ` • ${year}` : ""}
                        </p>
                      </div>
                      <div className="shrink-0 flex flex-col justify-center rounded-xl px-4 py-2 text-center ring-1 ring-white/10">
                        <span className="text-[10px] uppercase text-white/70">Média</span>
                        <div className="mt-1 flex items-center justify-center gap-1">
                          <FaStar className="text-[var(--color-mediumgreen)]" />
                          <span className="text-lg font-bold text-white">{ratingText}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex-1 overflow-auto max-h-[55vh] pb-4">
                      <p className="text-[15px] leading-relaxed text-white/90">
                        Avalie e adicione este álbum às suas listas personalizadas.
                      </p>
                    </div>

                    <div className="sticky bottom-0 -mx-3 sm:-mx-4 lg:mx-0 z-10">
                      <div className="flex items-center justify-end gap-3 p-3 bg-[rgba(8,12,16,0.92)] border-t border-white/10 rounded-b-2xl">
                        {/* Adicionar à lista */}
                        <div className="relative">
                          <button
                            onClick={() => setShowAddPanel((s) => !s)}
                            className="w-10 h-10 rounded-full bg-white/5 ring-1 ring-white/10 hover:bg-white/10 transition grid place-items-center"
                            title="Adicionar à lista"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white/90" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M3 6h14v2H3V6zm0 4h14v2H3v-2zm0 4h10v2H3v-2zm14 0v-2h4v2h-4zm0 2h4v2h-4v-2z" />
                            </svg>
                          </button>

                          {showAddPanel && (
                            <div className="absolute right-0 bottom-12 w-64 rounded-xl bg-[rgba(8,12,16,0.95)] ring-1 ring-white/10 p-3 z-20 shadow-2xl">
                              <div className="flex gap-2">
                                <select
                                  value={selectedList}
                                  onChange={(e) => setSelectedList(e.target.value)}
                                  className="bg-white/5 text-white px-3 py-2 rounded-lg text-sm flex-1 ring-1 ring-white/10"
                                  disabled={customLists.length === 0}
                                >
                                  <option value="">Selecione uma lista</option>
                                  {customLists.map((l) => (
                                    <option key={l}>{l}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={handleAddToList}
                                  disabled={isAdding || !selectedList}
                                  className="px-4 py-2 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 transition text-sm font-semibold disabled:opacity-50"
                                >
                                  {isAdding ? "Adicionando..." : "Adicionar"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Favoritar */}
                        <button
                          onClick={handleFavorite}
                          className="w-10 h-10 rounded-full bg-white/5 ring-1 ring-white/10 hover:bg-white/10 transition grid place-items-center"
                          title={isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                        >
                          {isFavorited ? <FaHeart className="text-red-500 w-5 h-5" /> : <FiHeart className="text-white/90 w-5 h-5" />}
                        </button>

                        {/* Avaliar */}
                        <button
                          onClick={() => setIsRatingOpen(true)}
                          className="px-5 py-2 rounded-lg bg-[var(--color-darkgreen)] hover:brightness-110 transition text-sm font-semibold shadow-md"
                        >
                          Avaliar
                        </button>

                        {/* Detalhes */}
                        <button
                          onClick={handleViewDetails}
                          className="px-5 py-2 rounded-lg bg-transparent ring-1 ring-white/15 hover:ring-white/30 hover:bg-white/5 transition text-sm"
                        >
                          Ver detalhes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <RatingModal isOpen={isRatingOpen} onClose={() => setIsRatingOpen(false)} mediaId={id} mediaType="album" onSuccess={() => {}} />
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export const AlbumCard = memo(AlbumCardBase);
