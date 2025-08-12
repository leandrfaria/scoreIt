"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTabContext } from "@/context/TabContext";

export function TabSwitcherMediaType() {
  const { activeTab, setActiveTab } = useTabContext();
  const t = useTranslations("header");

  return (
    <nav className="flex justify-center">
      <div className="relative flex bg-gray-800 lg:bg-transparent rounded-lg lg:rounded-none p-1 lg:p-0">
        {/* Indicador deslizante */}
        <div
          className={`absolute inset-y-1 lg:inset-y-0 h-[calc(100%-8px)] lg:h-full w-1/3 bg-darkgreen rounded-md lg:rounded-md transition-all duration-300 ${
            activeTab === "musicas"
              ? "translate-x-full"
              : activeTab === "series"
              ? "translate-x-[200%]"
              : "translate-x-0"
          }`}
        ></div>

        {/* Botões */}
        <button
          onClick={() => setActiveTab("filmes")}
          className={`w-20 sm:w-24 lg:w-32 text-center py-2 lg:py-2 text-white relative z-10 transition-all text-xs sm:text-sm lg:text-base ${
            activeTab === "filmes" ? "font-bold" : "text-gray-400"
          }`}
        >
          {t("filmes")}
        </button>

        <button
          onClick={() => setActiveTab("musicas")}
          className={`w-20 sm:w-24 lg:w-32 text-center py-2 lg:py-2 text-white relative z-10 transition-all text-xs sm:text-sm lg:text-base ${
            activeTab === "musicas" ? "font-bold" : "text-gray-400"
          }`}
        >
          {t("musicas")}
        </button>

        <button
          onClick={() => setActiveTab("series")}
          className={`w-20 sm:w-24 lg:w-32 text-center py-2 lg:py-2 text-white relative z-10 transition-all text-xs sm:text-sm lg:text-base ${
            activeTab === "series" ? "font-bold" : "text-gray-400"
          }`}
        >
          {t("series")}
        </button>
      </div>
    </nav>
  );
}