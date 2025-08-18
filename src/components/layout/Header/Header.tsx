"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import LogoLateral from "@/assets/LogoLateral";

// widgets client carregados dinamicamente (sem SSR para atrasar carga)
const SearchBar = dynamic(() => import("./SearchBar"), { ssr: false });
const UserMenu = dynamic(() => import("./UserMenu"), { ssr: false });
const LanguageSwitcher = dynamic(() => import("./LanguageSwitcher"), { ssr: false });
const MobileMenu = dynamic(() => import("./MobileMenu"), { ssr: false });
const TabSwitcherGuard = dynamic(() => import("./TabSwitcherGuard"), { ssr: false });

export function Header({ locale }: { locale: string }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.includes("/auth");

  return (
    <header
      className={[
        "w-full h-20 relative z-40", // <- volta ao fluxo normal (nada de fixed)
        isAuthPage
          ? "bg-black/30 backdrop-blur-md border-b border-white/10"
          : "bg-black",
      ].join(" ")}
    >
      <div className="max-w-screen-xl mx-auto flex items-center justify-between h-full px-6">
        {/* LOGO */}
        <div className="flex-1">
          <Link href={`/${locale}`} className="text-white text-lg font-semibold">
            <div className="lg:w-auto lg:h-auto w-8 h-8">
              <LogoLateral />
            </div>
          </Link>
        </div>

        {/* MENU DE TROCA DE ABA (DESKTOP) — controlado no client */}
        <div className="hidden lg:block">
          <TabSwitcherGuard />
        </div>

        {/* LADO DIREITO (DESKTOP) */}
        <div className="hidden lg:flex flex-1 justify-end items-center gap-3 xl:gap-4">
          <SearchBar />
          <LanguageSwitcher />
          <UserMenu />
        </div>

        {/* MOBILE */}
        <div className="flex lg:hidden items-center gap-2">
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
