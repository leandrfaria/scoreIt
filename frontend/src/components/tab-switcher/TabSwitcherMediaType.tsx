"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTabContext } from "@/context/TabContext";

export function TabSwitcherMediaType() {
  const { activeTab, setActiveTab } = useTabContext();

  const t = useTranslations("header");

  return (
    <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2">
      <div className="relative flex">
        <div
          className={`absolute inset-0 h-full w-1/3 bg-darkgreen rounded-md transition-all duration-300 ${
            activeTab === "musicas"
              ? "translate-x-full"
              : activeTab === "series"
              ? "translate-x-[200%]"
              : "translate-x-0"
          }`}
        ></div>

        <button
          onClick={() => {
            setActiveTab("filmes");
          }}
          className={`w-32 text-center py-2 text-white relative z-10 transition-all ${
            activeTab === "filmes" ? "font-bold" : "text-gray-400"
          }`}
        >
          {t("filmes")}
        </button>

        <button
          onClick={() => {
            setActiveTab("musicas");
          }}
          className={`w-32 text-center py-2 text-white relative z-10 transition-all ${
            activeTab === "musicas" ? "font-bold" : "text-gray-400"
          }`}
        >
          {t("musicas")}
        </button>

        <button
          onClick={() => {
            setActiveTab("series");
          }}
          className={`w-32 text-center py-2 text-white relative z-10 transition-all ${
            activeTab === "series" ? "font-bold" : "text-gray-400"
          }`}
        >
          {t("series")}
        </button>
      </div>
    </nav>
  );
}
