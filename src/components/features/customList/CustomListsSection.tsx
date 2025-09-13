"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import type { CustomList } from "@/types/CustomList";
import { ArrowLeft as IconArrowLeft, ArrowRight as IconArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
  isOpen?: boolean;
  onToggle?: () => void;
  lists: CustomList[];
  onSelect: (list: CustomList) => void;
};

export default function CustomListsSection({ lists, onSelect }: Props) {
  const t = useTranslations("CustomListsSection");
  const trackRef = useRef<HTMLDivElement>(null);

  const hasLists = (lists?.length || 0) > 0;

  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);
  const rafRef = useRef<number | null>(null);

  const updateButtons = () => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeftButton(scrollLeft > 0);
    setShowRightButton(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scheduleUpdateButtons = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(updateButtons);
  };

  const scroll = (direction: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.8;
    const newLeft = direction === "left" ? el.scrollLeft - scrollAmount : el.scrollLeft + scrollAmount;
    el.scrollTo({ left: newLeft, behavior: "smooth" });
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => scheduleUpdateButtons();
    el.addEventListener("scroll", onScroll, { passive: true });
    scheduleUpdateButtons();
    return () => el.removeEventListener("scroll", onScroll);
  }, [lists.length]);

  useEffect(() => {
    const onResize = () => scheduleUpdateButtons();
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const scrollByAmount = useMemo(() => {
    if (typeof window === "undefined") return 560;
    const w = window.innerWidth;
    if (w >= 1536) return 900;
    if (w >= 1280) return 760;
    if (w >= 1024) return 640;
    if (w >= 640) return 460;
    return 320;
  }, []);

  if (!hasLists) {
    return <p className="text-gray-400 py-2">{t("noLists")}</p>;
  }

  return (
    <section className="relative">
      <div
        ref={trackRef}
        className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory scroll-smooth [scrollbar-width:none]"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" as any, WebkitOverflowScrolling: "touch" }}
        role="list"
        aria-label={t("customLists")}
      >
        <div className="absolute w-0 h-0 overflow-hidden" aria-hidden />

        {lists.map((list) => (
          <button
            key={list.id}
            onClick={() => onSelect(list)}
            className="
              group snap-start shrink-0
              w-[62vw] sm:w-[40vw] md:w-[28vw] lg:w-[22vw] xl:w-[18vw]
              rounded-xl overflow-hidden
              bg-neutral-900/70 ring-1 ring-white/10 hover:ring-white/20
              transition-all duration-200
            "
            aria-label={t("openList", { listName: list.listName })}
            title={list.listName}
            role="listitem"
          >
            <div className="h-20 sm:h-24 md:h-28 bg-[var(--color-darkgreen)]/60 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-darkgreen)]/80 via-[var(--color-mediumgreen)]/30 to-transparent" />
              <div className="absolute bottom-2 left-3 text-left">
                <h3 className="text-sm sm:text-base font-semibold text-white">{list.listName}</h3>
              </div>
            </div>

            <div className="p-3">
              {list.list_description ? (
                <p className="text-xs sm:text-sm text-white/70 line-clamp-2">{list.list_description}</p>
              ) : (
                <p className="text-xs italic text-white/40">{t("noDescription")}</p>
              )}

              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] sm:text-xs text-white/50">id: {list.id}</span>
                <span
                  className="
                    inline-flex items-center gap-1 text-[10px] sm:text-xs
                    px-3 py-1 rounded-md
                    bg-[var(--color-mediumgreen)]/15 ring-1 ring-[var(--color-mediumgreen)]/25
                    text-[var(--color-lightgreen)]
                  "
                >
                  {t("viewList")}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-center mt-5 gap-6">
        <button
          onClick={() => scroll("left")}
          aria-label={t("previous")}
          className="p-1 text-white/70 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          disabled={!showLeftButton}
        >
          <IconArrowLeft className="h-5 w-5 transition-transform hover:scale-110" />
        </button>
        <button
          onClick={() => scroll("right")}
          aria-label={t("next")}
          className="p-1 text-white/70 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          disabled={!showRightButton}
        >
          <IconArrowRight className="h-5 w-5 transition-transform hover:scale-110" />
        </button>
      </div>
    </section>
  );
}
