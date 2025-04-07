"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import Image from "next/image";
import { FaStar } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { Movie } from "@/types/Movie"; // ✅ aqui está a interface importada

export function MovieCard({
  id,
  title,
  posterUrl,
  backdropUrl,
  vote_average,
  release_date,
  overview = "Sem descrição disponível.",
  genre = "Drama",
}: Movie) {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const year = new Date(release_date).getFullYear();
  const router = useRouter();

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

  return (
    <>
      <div
        onClick={handleOpen}
        className="cursor-pointer w-full max-w-[190px] rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-all duration-300"
      >
        <div className="relative w-full h-[270px]">
          <Image src={posterUrl} alt={title} fill className="object-cover" />

          <div className="absolute top-3 right-3 bg-black/70 text-white text-sm px-2 py-1 rounded-full flex items-center gap-1">
            <FaStar className="text-white" size={14} />
            <span>
              {vote_average.toFixed(1)}{" "}
              <span className="text-xs text-gray-300">/ 10</span>
            </span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-black/10 p-3">
            <h3 className="text-white text-sm font-semibold truncate">
              {title}
            </h3>
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

              {backdropUrl && (
                <div className="w-full h-[250px] relative rounded-md overflow-hidden mb-6">
                  <Image
                    src={backdropUrl}
                    alt={title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div className="space-y-4">
                <p className="text-xl font-semibold">{title}</p>
                <p className="text-gray-400 text-sm">
                  Lançamento: {new Date(release_date).toLocaleDateString("pt-BR")}
                </p>
                <p className="text-gray-300 text-sm">{overview}</p>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => router.push(`/movie/${id}`)}
                  className="bg-darkgreen text-white px-5 py-2 rounded-md hover:brightness-110 transition"
                >
                  Ver detalhes
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
