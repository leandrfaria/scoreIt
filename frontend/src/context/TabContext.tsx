"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";

type Tab = "filmes" | "musicas";

interface TabContextType {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export const TabProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<Tab>("filmes");

  useEffect(() => {
    if (pathname.includes("musicas")) {
      setActiveTab("musicas");
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
