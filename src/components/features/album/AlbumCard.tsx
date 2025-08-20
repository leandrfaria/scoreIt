"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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
import { fetchMemberLists, addContentToList } from "@/services/customList/add_content_list";

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
  const t = useTranslations("AlbumCard");
  const router = useRouter();
  const locale = useLocale();
  const reduceMotion = useReducedMotion();

  const handleOpen = useCallback(() => setIsOpen(true), []);
  const handleClose = useCallback(() => setIsOpen(false), []);
  useOutsideClick(modalRef, handleClose);

  // Fechar via ESC
  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [handleClose]);

  // Foco ao abrir
  useEffect(() => {
    if (isOpen && titleRef.current) {
      titleRef.current.focus();
    }
  }, [isOpen]);

  // Checar favorito só quando o modal abre
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token || !member || !isOpen) return;
        const favorited = await isFavoritedMedia(member.id, id);
        if (mounted) setIsFavorited(favorited);
      } catch (error) {
        console.error("Erro ao verificar favorito:", error);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [id, member, isOpen]);

  // Carregar listas só quando abrir o modal
  useEffect(() => {
    let mounted = true;
    const loadLists = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token || !member || !isOpen) return;

        const lists = await fetchMemberLists(token, member.id);
        const uniqueListNames = Array.from(new Set(lists.map((item) => item.listName)));
        if (!mounted) return;
        setCustomLists(uniqueListNames);
        if (uniqueListNames.length > 0) setSelectedList(uniqueListNames[0]);
      } catch {
        toast.error("Erro carregando listas");
      }
    };
    loadLists();
    return () => {
      mounted = false;
    };
  }, [isOpen, member]);

  const openDetailsPath = useMemo(() => `/${locale}/album/${id}`, [locale, id]);

  const handleFavorite = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token || !member) {
        toast.error(t("notAuthenticated"));
        return;
      }

      if (isFavorited) {
        const success = await removeFavouriteMedia(member.id, id, "album");
        if (success) {
          // Sem isActive: use um ID fixo para atualizar o mesmo toast
          toast.success(t("removedFromFavorites"), { id: "fav-removed" });
          setIsFavorited(false);
          if (onRemoveAlbum) onRemoveAlbum(id);
        } else {
          toast.error(t("errorRemovingFavorite"));
        }
      } else {
        const success = await addFavouriteAlbum(member.id, id);
        if (success) {
          toast.success(t("addedToFavorites"), { id: "fav-added" });
          setIsFavorited(true);
        } else {
          toast.error(t("errorAddingFavorite"));
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(t("errorAddingFavorite"));
    }
  }, [id, isFavorited, member, onRemoveAlbum, t]);

  const handleAddToList = useCallback(async () => {
    if (!selectedList) {
      toast.error("Selecione uma lista");
      return;
    }

    try {
      setIsAdding(true);
      const token = localStorage.getItem("authToken");
      if (!token || !member) {
        toast.error("Usuário não autenticado");
        setIsAdding(false);
        return;
      }

      const result = await addContentToList(token, {
        memberId: member.id,
        mediaId: id,
        mediaType: "album",
        listName: selectedList,
      });

      if (result === "duplicate") {
        toast.error("Este conteúdo já está na lista");
      } else if (result === "success") {
        toast.success("Álbum adicionado à lista!");
      } else {
        toast.error("Erro ao adicionar à lista");
      }
    } finally {
      setIsAdding(false);
    }
  }, [id, member, selectedList]);

  const handleViewDetails = useCallback(() => {
    router.push(openDetailsPath);
  }, [router, openDetailsPath]);

  // Animações com suporte a prefers-reduced-motion
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

  return (
    <>
      {/* Card */}
      <div
        onClick={handleOpen}
        onKeyDown={(e) => (e.key === "Enter" ? handleOpen() : null)}
        tabIndex={0}
        role="button"
        aria-label={`${name} — ${artist}`}
        className="cursor-pointer w-[46vw] max-w-[190px] sm:w-[190px] shrink-0 rounded-xl overflow-hidden hover:scale-[1.03] hover:shadow-lg transition-all duration-300 bg-neutral-900/40 ring-1 ring-white/5 outline-none focus:ring-2 focus:ring-darkgreen"
      >
        <div className="relative w-full aspect-[3/3] sm:h-[190px] rounded-xl overflow-hidden">
          <Image
            src={imgSrc}
            alt={name}
            fill
            className="object-cover rounded-xl"
            onError={() => setImgSrc("/fallback.jpg")}
            sizes="(max-width: 640px) 46vw, 190px"
            priority={false}
          />
        </div>
        <div className="p-2">
          <h3 className="text-white text-sm font-semibold leading-tight line-clamp-1">{name}</h3>
          <p className="text-gray-400 text-xs mt-1 line-clamp-1">{artist}</p>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
              variants={overlayAnim}
              initial="hidden"
              animate="visible"
              exit="exit"
            />

            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`album-title-${id}`}
              aria-describedby={`album-desc-${id}`}
              className="
                fixed z-[70]
                sm:top-[8%] sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md sm:w-full sm:rounded-2xl
                top-0 left-0 w-full h-[100dvh] sm:h-auto
                bg-neutral-900 text-white p-0 sm:p-6 shadow-2xl ring-1 ring-white/10
                flex flex-col
              "
              variants={modalAnim}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 sm:px-0 sm:py-0 sm:mb-4">
                <h2
                  id={`album-title-${id}`}
                  ref={titleRef}
                  tabIndex={-1}
                  className="text-lg sm:text-xl font-bold focus:outline-none"
                >
                  {name}
                </h2>
                <button
                  onClick={handleClose}
                  className="text-red-400 text-2xl leading-none hover:scale-110 transition px-2 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-red-400/50"
                  aria-label="Fechar"
                >
                  ×
                </button>
              </div>

              {/* Cover */}
              <div className="relative w-full h-[46vh] sm:h-[250px] overflow-hidden">
                <Image
                  src={imgSrc}
                  alt={name}
                  fill
                  className="object-cover"
                  onError={() => setImgSrc("/fallback.jpg")}
                  sizes="100vw"
                  priority
                />
                <button
                  onClick={handleFavorite}
                  className="absolute bottom-3 right-3 bg-black/60 px-3 py-2 rounded-full hover:brightness-110 transition focus:outline-none focus:ring-2 focus:ring-white/40"
                  aria-label={isFavorited ? t("removedFromFavorites") : t("addedToFavorites")}
                  title={isFavorited ? t("removedFromFavorites") : t("addedToFavorites")}
                >
                  {isFavorited ? (
                    <FaHeart className="text-red-500 w-6 h-6" />
                  ) : (
                    <FiHeart className="text-white w-6 h-6" />
                  )}
                </button>
              </div>

              {/* Info */}
              <div id={`album-desc-${id}`} className="px-4 sm:px-0 sm:space-y-2 text-sm mt-3 sm:mt-4">
                <p>
                  <span className="text-gray-400">{t("artist")}</span> {artist}
                </p>
                <p>
                  <span className="text-gray-400">{t("releaseDate")}</span>{" "}
                  {release_date ? new Date(release_date).toLocaleDateString() : "N/A"}
                </p>
              </div>

              {/* Footer (mobile: sticky) */}
              <div className="mt-auto w-full px-4 py-4 sm:p-0 sm:mt-6">
                <div className="flex items-center gap-2 sm:mb-4">
                  <select
                    value={selectedList}
                    onChange={(e) => setSelectedList(e.target.value)}
                    className="bg-neutral-800 text-white p-3 sm:p-2 rounded flex-grow border border-white/10 focus:outline-none focus:ring-2 focus:ring-darkgreen"
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
                    className="bg-darkgreen text-white px-5 py-3 sm:py-2 rounded-md hover:brightness-110 transition disabled:opacity-50 w-auto"
                  >
                    {isAdding ? "Adicionando..." : "Adicionar"}
                  </button>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleViewDetails}
                    className="bg-darkgreen text-white w-full sm:w-auto px-5 py-3 sm:py-2 rounded-md hover:brightness-110 transition"
                  >
                    {t("viewDetails")}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
