// src/components/features/album/AlbumCard.tsx
"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import { Album } from "@/types/Album";
import { useMember } from "@/context/MemberContext";
import toast from "react-hot-toast";
import { FaHeart, FaStar } from "react-icons/fa"; // ⭐
import { FiHeart } from "react-icons/fi";
import { isFavoritedMedia } from "@/services/user/is_favorited";
import { removeFavouriteMedia } from "@/services/user/remove_fav";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { addFavouriteAlbum } from "@/services/album/add_fav_album";
import { fetchMemberLists, addContentToList } from "@/services/customList/list";
import { getToken } from "@/lib/api";
import { fetchAverageRating } from "@/services/review/average"; // ⭐
import { onReviewChanged } from "@/lib/events"; // ⭐

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
  const titleRef = useRef<HTMLHeadingElement>(null);
  const { member } = useMember();
  const [isFavorited, setIsFavorited] = useState(false);
  const [customLists, setCustomLists] = useState<string[]>([]);
  const [selectedList, setSelectedList] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [imgSrc, setImgSrc] = useState(imageUrl || "/fallback.jpg");
  const [scoreitAverage, setScoreitAverage] = useState<number | null>(null); // ⭐
  const t = useTranslations("AlbumCard");
  const router = useRouter();
  const locale = useLocale();
  const reduceMotion = useReducedMotion();

  const handleOpen = useCallback(() => setIsOpen(true), []);
  const handleClose = useCallback(() => setIsOpen(false), []);
  useOutsideClick(modalRef, handleClose);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [handleClose]);

  useEffect(() => {
    if (isOpen && titleRef.current) titleRef.current.focus();
  }, [isOpen]);

  // ✅ média ScoreIt (igual ao MovieCard)
  useEffect(() => {
    let controller = new AbortController();

    const load = async () => {
      const signal = controller.signal;
      const avg = await fetchAverageRating("ALBUM", id, { signal });
      if (!signal.aborted) setScoreitAverage(avg);
    };

    // 1) inicial
    load();

    // 2) polling a cada 5min (fallback)
    const interval = setInterval(() => {
      controller.abort();
      controller = new AbortController();
      load();
    }, 5 * 60 * 1000);

    // 3) ao focar a aba
    const onFocus = () => {
      controller.abort();
      controller = new AbortController();
      load();
    };
    window.addEventListener("focus", onFocus);

    // 4) “tempo real” via evento global (quando alguém avaliar)
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

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!member || !isOpen) return;
        const favorited = await isFavoritedMedia(member.id, id, locale);
        if (mounted) setIsFavorited(favorited);
      } catch (err) {
        console.error("Erro ao verificar favorito:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, member, isOpen, locale]);

  // ✅ pegar listas com o mesmo token do app
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!member || !isOpen) return;
        const token = getToken();
        if (!token) return;
        const lists = await fetchMemberLists(token, member.id, locale);
        const unique = Array.from(new Set(lists.map((l) => l.listName)));
        if (mounted) {
          setCustomLists(unique);
          if (unique.length > 0) setSelectedList(unique[0]);
        }
      } catch {
        toast.error("Erro carregando listas");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isOpen, member, locale]);

  const openDetailsPath = useMemo(() => `/${locale}/album/${id}`, [locale, id]);

  const handleFavorite = useCallback(async () => {
    if (!member) {
      toast.error(t("notAuthenticated"));
      return;
    }
    if (isFavorited) {
      const ok = await removeFavouriteMedia(member.id, id, locale, "album");
      if (ok) {
        toast.success(t("removedFromFavorites"), { id: "fav-removed" });
        setIsFavorited(false);
        onRemoveAlbum?.(id);
      } else toast.error(t("errorRemovingFavorite"));
    } else {
      const ok = await addFavouriteAlbum(member.id, id);
      if (ok) {
        toast.success(t("addedToFavorites"), { id: "fav-added" });
        setIsFavorited(true);
      } else toast.error(t("errorAddingFavorite"));
    }
  }, [id, isFavorited, member, onRemoveAlbum, t, locale]);

  const handleAddToList = useCallback(async () => {
    if (!selectedList) return toast.error("Selecione uma lista");
    try {
      setIsAdding(true);
      if (!member) return toast.error("Usuário não autenticado");
      const token = getToken();
      if (!token) return toast.error("Sessão expirada");
      const result = await addContentToList(token, {
        memberId: member.id,
        mediaId: id,
        mediaType: "album",
        listName: selectedList,
      });
      if (result === "duplicate") toast.error("Já está na lista");
      else if (result === "success") toast.success("Álbum adicionado!");
      else toast.error("Erro ao adicionar à lista");
    } finally {
      setIsAdding(false);
    }
  }, [id, member, selectedList]);

  const handleViewDetails = useCallback(() => router.push(openDetailsPath), [router, openDetailsPath]);

  const overlayAnim = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: reduceMotion ? 0 : 0.2 } },
    exit: { opacity: 0, transition: { duration: reduceMotion ? 0 : 0.15 } },
  };
  const modalAnim = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 24 },
    visible: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.25 } },
    exit: { opacity: 0, y: reduceMotion ? 0 : 24, transition: { duration: reduceMotion ? 0 : 0.2 } },
  };

  const ratingText = scoreitAverage == null ? t("noScore") : scoreitAverage.toFixed(1); // ⭐

  return (
    <>
      {/* Card */}
      <div
        onClick={handleOpen}
        className="cursor-pointer w-[46vw] max-w-[190px] sm:w-[190px] shrink-0 rounded-xl overflow-hidden hover:scale-[1.03] hover:shadow-lg transition-all duration-300 bg-neutral-900/40 ring-1 ring-white/5 relative"
      >
        <div className="relative w-full aspect-[3/3] sm:h-[190px]">
          <Image
            src={imgSrc}
            alt={name}
            fill
            className="object-cover rounded-xl"
            onError={() => setImgSrc("/fallback.jpg")}
          />
          {/* ⭐ badge de nota igual ao MovieCard */}
          <div className="absolute top-2 left-2 bg-black/70 text-white text-[11px] px-2 py-1 rounded-full flex items-center gap-1">
            <FaStar size={12} />
            <span>{ratingText}</span>
          </div>
        </div>
        <div className="p-2">
          <h3 className="text-white text-sm font-semibold line-clamp-1">{name}</h3>
          <p className="text-gray-400 text-xs line-clamp-1">{artist}</p>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm" variants={overlayAnim} initial="hidden" animate="visible" exit="exit"/>
            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              className="fixed z-[70] sm:top-[8%] sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md sm:w-full sm:rounded-2xl top-0 left-0 w-full h-[100dvh] sm:h-auto bg-neutral-900 text-white flex flex-col"
              variants={modalAnim}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="relative w-full h-[46vh] sm:h-[250px]">
                <Image src={imgSrc} alt={name} fill className="object-cover" onError={() => setImgSrc("/fallback.jpg")} priority/>
                <button
                  onClick={handleFavorite}
                  className="absolute bottom-3 right-3 bg-black/60 p-2 rounded-full"
                >
                  {isFavorited ? <FaHeart className="text-red-500 w-6 h-6"/> : <FiHeart className="text-white w-6 h-6"/>}
                </button>
                {/* badge também na imagem do modal (opcional) */}
                <div className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <FaStar size={12} />
                  <span>{ratingText}</span>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <h2 ref={titleRef} className="text-lg font-bold">{name}</h2>
                <p className="text-gray-400 text-sm">{artist}</p>
                <p className="text-gray-400 text-sm">
                  {release_date ? new Date(release_date).toLocaleDateString() : "N/A"}
                </p>
                <p className="text-gray-300 text-sm">Nota: {ratingText}</p>
              </div>
              <div className="p-4 mt-auto flex flex-col gap-3">
                <div className="flex gap-2">
                  <select
                    value={selectedList}
                    onChange={(e) => setSelectedList(e.target.value)}
                    className="bg-neutral-800 text-white p-2 rounded flex-grow text-sm"
                    disabled={customLists.length === 0}
                  >
                    <option value="">Selecione uma lista</option>
                    {customLists.map((l) => <option key={l}>{l}</option>)}
                  </select>
                  <button
                    onClick={handleAddToList}
                    disabled={isAdding || !selectedList}
                    className="bg-darkgreen text-white px-4 py-2 rounded-md hover:brightness-110 transition text-sm"
                  >
                    {isAdding ? "Adicionando..." : "Adicionar"}
                  </button>
                </div>
                <button onClick={handleViewDetails} className="bg-darkgreen text-white px-4 py-2 rounded-md hover:brightness-110 transition text-sm">
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
