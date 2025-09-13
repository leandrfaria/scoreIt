"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  imageUrl?: string;
};

export default function AchievementModal({ open, onClose, title, description, imageUrl }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-[min(520px,90vw)] rounded-xl bg-neutral-900 text-white p-6 ring-1 ring-white/10 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="flex items-center gap-4">
              {imageUrl && (
                <div className="relative w-20 h-20 shrink-0 rounded-full overflow-hidden ring-2 ring-darkgreen/50">
                  <Image src={imageUrl} alt={title} fill className="object-cover" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-semibold">Parabéns! 🎉</h3>
                <p className="text-sm text-white/80 mt-1">
                  Você desbloqueou a conquista: <span className="font-medium">{title}</span>
                </p>
                {description && <p className="text-xs text-white/60 mt-1">{description}</p>}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded bg-darkgreen text-white hover:brightness-110"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
