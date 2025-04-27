"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";

type Tab = "filmes" | "musicas" | "series";

interface TabContextType {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export const TabProvider = ({ children }: { children: ReactNode }) => {
  const [activeTab, setActiveTab] = useState<Tab>("filmes");
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.includes("musicas")) {
      setActiveTab("musicas");
    } else if (pathname.includes("series")) {
      setActiveTab("series");
    } else {
      setActiveTab("filmes");
    }
  }, [pathname]);

  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabContext.Provider>
  );
};

export const useTabContext = () => {
  const context = useContext(TabContext);
  if (!context) throw new Error("useTabContext must be used within TabProvider");
  return context;
};
