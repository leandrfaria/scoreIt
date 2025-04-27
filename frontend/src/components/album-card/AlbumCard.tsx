"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import { Album } from "@/types/Album";
import { useMember } from "@/context/MemberContext";
import { useFavoriteContext } from "@/context/FavoriteContext";
import toast from "react-hot-toast";
import { addFavouriteAlbum } from "@/services/service_add_favourite_album";
import { FaHeart } from "react-icons/fa";
import { FiHeart } from "react-icons/fi";

export function AlbumCard({
  id,
  name,
  release_date,
  imageUrl,
  artistName,
}: Album) {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const { member } = useMember();
  const { favoriteAlbums, addFavoriteAlbum } = useFavoriteContext();
  const [isFavorited, setIsFavorited] = useState(false);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  useOutsideClick(modalRef, handleClose);

  useEffect(() => {
    setIsFavorited(favoriteAlbums.has(id));
  }, [favoriteAlbums, id]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleFavorite = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token || !member) {
        toast.error("Usuário não autenticado.");
        return;
      }
      const payloadId = isNaN(Number(id)) ? id : Number(id);

      const success = await addFavouriteAlbum(token, member.id, payloadId);
      if (success) {
        addFavoriteAlbum(id);
        toast.success("Álbum adicionado aos favoritos!");
      } else {
        toast.error("Erro ao adicionar álbum aos favoritos.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao adicionar álbum aos favoritos.");
    }
  };

  return (
    <>
      <div
        onClick={handleOpen}
        className="cursor-pointer w-[190px] shrink-0 rounded-lg overflow-hidden hover:scale-105 transition-transform duration-300"
      >
        <div className="relative w-full h-[190px] rounded-lg overflow-hidden">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover rounded-lg"
          />
        </div>
        <div className="mt-2">
          <h3 className="text-white text-sm font-semibold leading-tight line-clamp-1">
            {name}
          </h3>
          <p className="text-gray-400 text-xs mt-1 line-clamp-1">{artistName}</p>
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
              className="fixed z-50 top-[10%] left-1/2 -translate-x-1/2 bg-neutral-900 text-white p-6 max-w-md w-full rounded-xl shadow-xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{name}</h2>
                <button onClick={handleClose} className="text-red-400 text-2xl">×</button>
              </div>

              <div className="w-full h-[250px] relative rounded-md overflow-hidden mb-4">
                <Image
                  src={imageUrl}
                  alt={name}
                  fill
                  className="object-cover rounded-md"
                />
                <button
                  onClick={handleFavorite}
                  className="absolute bottom-3 right-3 bg-black/60 p-2 rounded-full"
                >
                  {isFavorited ? (
                    <FaHeart className="text-red-500 w-6 h-6" />
                  ) : (
                    <FiHeart className="text-white w-6 h-6" />
                  )}
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-sm">
                  <span className="text-gray-400">Artista:</span> {artistName}
                </p>
                <p className="text-sm">
                  <span className="text-gray-400">Lançamento:</span>{" "}
                  {release_date ? new Date(release_date).toLocaleDateString("pt-BR") : "N/A"}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
