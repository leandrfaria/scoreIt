"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CustomList } from "@/types/CustomList";

type Props = {
  isOpen: boolean;
  onToggle: () => void;
  lists: CustomList[];
  onSelect: (list: CustomList) => void;
};

export default function CustomListsSection({ isOpen, onToggle, lists, onSelect }: Props) {
  return (
    <section className="mt-2">
      <div className="mb-4">
        <button
          className="flex items-center justify-between w-full text-xl font-semibold text-white"
          onClick={onToggle}
          aria-expanded={isOpen}
        >
          <span>Ver listas</span>
          <svg
            className={`w-5 h-5 transform transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, overflow: "hidden" }}
            animate={{ opacity: 1, height: "auto", overflow: "visible" }}
            exit={{ opacity: 0, height: 0, overflow: "hidden" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {lists.length === 0 ? (
              <p className="text-gray-400 py-2">Você não possui nenhuma lista!</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {lists.map((list) => (
                  <button
                    key={list.id}
                    className="bg-neutral-800 p-4 rounded-lg text-left hover:bg-neutral-700 ring-1 ring-white/10"
                    onClick={() => onSelect(list)}
                  >
                    <h3 className="text-lg font-semibold">{list.listName}</h3>
                    {list.list_description && (
                      <p className="text-sm text-white/60 mt-1">{list.list_description}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
