"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useTabContext } from "@/context/TabContext";

type Tab = "filmes" | "musicas" | "series";

export function TabSwitcherMediaType() {
  const { activeTab, setActiveTab } = useTabContext();
  const t = useTranslations("header");

  const tabs: { key: Tab; label: string }[] = useMemo(
    () => [
      { key: "filmes", label: t("filmes") },
      { key: "series", label: t("series") },
      { key: "musicas", label: t("musicas") },
    ],
    [t]
  );

  return (
    <nav
      aria-label="Selecionar tipo de mídia"
      className="inline-flex items-center rounded-md border border-gray-700 bg-black p-1"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            aria-current={isActive ? "page" : undefined}
            aria-pressed={isActive}
            className={[
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              isActive
                ? "bg-darkgreen text-white"
                : "text-gray-300 hover:bg-gray-800",
            ].join(" ")}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
