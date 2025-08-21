"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import LogoLateral from "@/assets/LogoLateral";
import { FaFilm, FaMusic, FaTv } from "react-icons/fa";
import { useTabContext } from "@/context/TabContext";
import { useAuthContext } from "@/context/AuthContext";

// widgets client carregados dinamicamente
const SearchBar = dynamic(() => import("./SearchBar"), { ssr: false });
const UserMenu = dynamic(() => import("./UserMenu"), { ssr: false });
const LanguageSwitcher = dynamic(() => import("./LanguageSwitcher"), { ssr: false });
const MobileMenu = dynamic(() => import("./MobileMenu"), { ssr: false });
const TabSwitcherGuard = dynamic(() => import("./TabSwitcherGuard"), { ssr: false });

export function Header({ locale }: { locale: string }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.includes("/auth");
  const { activeTab, setActiveTab } = useTabContext();
  const { isLoggedIn } = useAuthContext();

  return (
    <header
      className={[
        "w-full h-20 relative z-40",
        isAuthPage
          ? "bg-black/30 backdrop-blur-md border-b border-white/10"
          : "bg-black",
      ].join(" ")}
    >
      <div className="max-w-screen-xl mx-auto flex items-center justify-between h-full px-4 sm:px-6">
        
        {/* LOGO */}
        <div className="flex items-center flex-shrink-0">
          <Link href={`/${locale}`} className="text-white text-lg font-semibold flex items-center gap-2">
            <div className="lg:w-auto lg:h-auto w-7 h-7 sm:w-8 sm:h-8">
              <LogoLateral />
            </div>
          </Link>
        </div>

        {/* MENU DE TROCA DE ABA (DESKTOP) */}
        <div className="hidden lg:block">
          <TabSwitcherGuard />
        </div>

        {/* MOBILE — ícones centrais para abas (só aparecem se logado) */}
        {isLoggedIn && (
          <div className="flex lg:hidden items-center justify-center gap-6 absolute left-1/2 -translate-x-1/2">
            <button
              onClick={() => setActiveTab("filmes")}
              aria-label="Filmes"
              className={`text-xl transition-colors ${
                activeTab === "filmes" ? "text-white" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <FaFilm />
            </button>
            <button
              onClick={() => setActiveTab("musicas")}
              aria-label="Músicas"
              className={`text-xl transition-colors ${
                activeTab === "musicas" ? "text-white" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <FaMusic />
            </button>
            <button
              onClick={() => setActiveTab("series")}
              aria-label="Séries"
              className={`text-xl transition-colors ${
                activeTab === "series" ? "text-white" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <FaTv />
            </button>
          </div>
        )}

        {/* LADO DIREITO (DESKTOP) */}
        <div className="hidden lg:flex flex-1 justify-end items-center gap-3 xl:gap-4">
          <SearchBar />
          <LanguageSwitcher />
          <UserMenu />
        </div>

        {/* MOBILE — menu sanduíche no canto direito */}
        <div className="flex lg:hidden items-center gap-2 ml-auto">
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
