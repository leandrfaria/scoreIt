"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { Artist } from "@/types/Artist";
import { motion, AnimatePresence } from "framer-motion";
import { useOutsideClick } from "@/hooks/useOutsideClick";

interface ArtistCardProps {
  artist: Artist;
  index?: number;
}

export function ArtistCard({ artist, index }: ArtistCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

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
        className="flex flex-col items-center justify-center text-center w-[200px] cursor-pointer hover:scale-105 transition"
      >
        <div className="relative w-[180px] h-[180px] rounded-full overflow-hidden shadow-md">
          <Image
            src={artist.imageUrl}
            alt={artist.name}
            fill
            className="object-cover"
            sizes="180px"
          />
        </div>
        <p className="mt-2 text-sm font-semibold text-white leading-tight">
          {index !== undefined ? `${index + 1}. ` : ""}
          {artist.name}
        </p>
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
              className="fixed z-50 top-[8%] left-1/2 -translate-x-1/2 bg-neutral-900 text-white p-6 max-w-xl w-full rounded-xl shadow-lg"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{artist.name}</h2>
                <button onClick={handleClose} className="text-red-400 text-xl">×</button>
              </div>

              <div className="w-full h-[240px] relative rounded-md overflow-hidden mb-4">
                <Image
                  src={artist.imageUrl}
                  alt={artist.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="text-sm text-gray-300 space-y-3">
                <p>
                  <strong title="Quantas vezes as músicas do artista foram tocadas">
                    Execuções:
                  </strong>{" "}
                  {artist.playcount}
                </p>
                <p>
                  <strong title="Quantidade de pessoas diferentes que escutaram o artista">
                    Ouvintes únicos:
                  </strong>{" "}
                  {artist.listeners}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
