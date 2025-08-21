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

  // ESC fecha
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [handleClose]);

  // Foco no título
  useEffect(() => {
    if (isOpen && titleRef.current) titleRef.current.focus();
  }, [isOpen]);

  // Checar favorito
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!member || !isOpen) return;
        const favorited = await isFavoritedMedia(member.id, id);
        if (mounted) setIsFavorited(favorited);
      } catch (err) {
        console.error("Erro ao verificar favorito:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, member, isOpen]);

  // Carregar listas
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!member || !isOpen) return;
        const lists = await fetchMemberLists(localStorage.getItem("authToken")!, member.id);
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
  }, [isOpen, member]);

  const openDetailsPath = useMemo(() => `/${locale}/album/${id}`, [locale, id]);

  const handleFavorite = useCallback(async () => {
    if (!member) {
      toast.error(t("notAuthenticated"));
      return;
    }
    if (isFavorited) {
      const ok = await removeFavouriteMedia(member.id, id, "album");
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
  }, [id, isFavorited, member, onRemoveAlbum, t]);

  const handleAddToList = useCallback(async () => {
    if (!selectedList) return toast.error("Selecione uma lista");
    try {
      setIsAdding(true);
      if (!member) return toast.error("Usuário não autenticado");
      const result = await addContentToList(localStorage.getItem("authToken")!, {
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

  // animações
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
        className="cursor-pointer w-[46vw] max-w-[190px] sm:w-[190px] shrink-0 rounded-xl overflow-hidden hover:scale-[1.03] hover:shadow-lg transition-all duration-300 bg-neutral-900/40 ring-1 ring-white/5"
      >
        <div className="relative w-full aspect-[3/3] sm:h-[190px]">
          <Image
            src={imgSrc}
            alt={name}
            fill
            className="object-cover rounded-xl"
            onError={() => setImgSrc("/fallback.jpg")}
          />
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
              </div>
              <div className="p-4 space-y-2">
                <h2 ref={titleRef} className="text-lg font-bold">{name}</h2>
                <p className="text-gray-400 text-sm">{artist}</p>
                <p className="text-gray-400 text-sm">{release_date ? new Date(release_date).toLocaleDateString() : "N/A"}</p>
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
