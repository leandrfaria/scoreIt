// src/components/ai/ChatWidget.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ChatWindow from "./ChatWindow";
import ChatMaskIcon from "./ChatMaskIcon";
import { useAuthContext } from "@/context/AuthContext";

export default function ChatWidget() {
  const { isLoggedIn } = useAuthContext();
  const [open, setOpen] = useState(false);
  const scrollYRef = useRef(0);

  // status de habilitação do widget
  const enabled = isLoggedIn === true;

  // trava/destrava o scroll ao abrir/fechar modal (só quando habilitado)
  useEffect(() => {
    if (!enabled) return;
    const body = document.body;

    if (open) {
      scrollYRef.current = window.scrollY;
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      body.style.paddingRight = `${scrollbarWidth}px`;
      body.style.position = "fixed";
      body.style.top = `-${scrollYRef.current}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      body.style.overflow = "hidden";
    } else {
      body.style.removeProperty("position");
      body.style.removeProperty("top");
      body.style.removeProperty("left");
      body.style.removeProperty("right");
      body.style.removeProperty("width");
      body.style.removeProperty("overflow");
      body.style.removeProperty("padding-right");
      window.scrollTo(0, scrollYRef.current);
    }

    return () => {
      body.style.removeProperty("position");
      body.style.removeProperty("top");
      body.style.removeProperty("left");
      body.style.removeProperty("right");
      body.style.removeProperty("width");
      body.style.removeProperty("overflow");
      body.style.removeProperty("padding-right");
    };
  }, [open, enabled]);

  // fechar com ESC (só quando habilitado e aberto)
  useEffect(() => {
    if (!enabled || !open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, enabled]);

  // depois de registrar todos os hooks, decide renderização
  if (!enabled) {
    // mantém ordem de hooks estável; apenas não renderiza UI
    return null;
  }

  return (
    <>
      {/* BOTÃO FLUTUANTE */}
      <button
        onClick={() => setOpen(true)}
        className="fixed z-[60] bottom-5 right-5 sm:bottom-6 sm:right-6 rounded-full p-3 shadow-xl
                   bg-[color:var(--color-darkgreen)] ring-1 ring-white/10 hover:brightness-110 transition
                   grid place-items-center"
        aria-label="Abrir chat do ScoreIt"
      >
        <ChatMaskIcon className="w-7 h-7" />
      </button>

      {/* MODAL */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-2 sm:p-4 lg:p-8 pointer-events-none">
              <motion.div
                className="pointer-events-auto w-full sm:w-[640px] max-w-[96vw] rounded-2xl border border-white/10
                           bg-[rgba(7,12,16,0.96)] backdrop-blur-xl shadow-2xl"
                initial={{ opacity: 0, y: 40, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
              >
                <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <ChatMaskIcon className="w-6 h-6" />
                    <h3 className="text-base sm:text-lg font-semibold">
                      ScoreIt · Chat IA
                    </h3>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-sm bg-white/5 ring-1 ring-white/10 hover:bg-white/10"
                    aria-label="Fechar chat"
                  >
                    Fechar
                  </button>
                </div>

                <div className="p-3 sm:p-4">
                  <ChatWindow />
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
