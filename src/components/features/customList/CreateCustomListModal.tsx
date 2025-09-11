"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { createCustomList } from "@/services/customList/list";
import { useOutsideClick } from "@/hooks/useOutsideClick";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  memberId: number;
  onCreated?: () => void;
};

export default function CreateCustomListModal({ isOpen, onClose, memberId, onCreated }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  useOutsideClick(modalRef, onClose);

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("O nome da lista é obrigatório");
    if (desc.length > 50) return toast.error("A descrição deve ter no máximo 50 caracteres");

    try {
      setSubmitting(true);
      await createCustomList(memberId, name.trim(), desc.trim());
      toast.success("Lista criada!");
      onCreated?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar lista");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/70 z-40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Criar lista"
            className="fixed z-50 top-[10%] left-1/2 -translate-x-1/2 bg-neutral-900 text-white p-6 max-w-lg w-[92vw] rounded-2xl shadow-2xl ring-1 ring-white/10"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28 }}
          >
            <h2 className="text-2xl font-bold mb-4">Criar nova lista</h2>
            <form onSubmit={onSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Nome da lista"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 rounded-lg bg-neutral-800 text-white outline-none ring-1 ring-transparent focus:ring-darkgreen/60"
                maxLength={50}
              />
              <div>
                <textarea
                  placeholder="Descrição (opcional)"
                  value={desc}
                  onChange={(e) => {
                    setDesc(e.target.value);
                    setCharCount(e.target.value.length);
                  }}
                  maxLength={50}
                  className="w-full p-3 rounded-lg bg-neutral-800 text-white outline-none ring-1 ring-transparent focus:ring-darkgreen/60"
                  rows={4}
                />
                <div className={`text-xs mt-1 text-right ${charCount === 50 ? "text-red-500" : "text-gray-400"}`}>
                  {charCount}/50 caracteres
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-500 disabled:opacity-60"
                >
                  {submitting ? "Criando..." : "Criar"}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
