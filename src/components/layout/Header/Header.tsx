// Server Component
import Link from "next/link";
import dynamic from "next/dynamic";
import { getLocale } from "next-intl/server";
import LogoLateral from "@/assets/LogoLateral";

// widgets client carregados dinamicamente (sem ssr:false)
const SearchBar = dynamic(() => import("./SearchBar"));
const UserMenu = dynamic(() => import("./UserMenu"));
const LanguageSwitcher = dynamic(() => import("./LanguageSwitcher"));
const MobileMenu = dynamic(() => import("./MobileMenu"));
const TabSwitcherGuard = dynamic(() => import("./TabSwitcherGuard"));

export async function Header() {
  const locale = await getLocale();

  return (
    <header className="w-full h-20 bg-black relative z-40">
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

        {/* MOBILE - BOTÕES (hambúrguer e busca ficam no MobileMenu) */}
        <div className="flex lg:hidden items-center gap-2">
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
