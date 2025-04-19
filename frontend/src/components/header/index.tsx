"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCheckAuth } from "@/hooks/useCheckAuth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/utils/shadcn";
import LogoLateral from "@/assets/LogoLateral";
import { useLocale, useTranslations } from "next-intl";

export function Header() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("/");
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const isLoggedIn = useCheckAuth();
  const locale = useLocale();
  const t = useTranslations("header");
  const router = useRouter();

  useEffect(() => {
    setActiveTab(pathname);
  }, [pathname]);

  const changeLanguage = async (newLocale: string) => {
    setIsChangingLanguage(true);
    try {
      // Captura o token da URL atual se existir
      const url = new URL(window.location.href);
      const token = url.searchParams.get('token');
      
      // Remove o locale atual do pathname
      let newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
      
      // Se estivermos na raiz sem locale explícito
      if (pathname === "/") {
        newPath = `/${newLocale}`;
      }
      
      // Adiciona o token de volta à URL se existir
      if (token) {
        newPath += `?token=${encodeURIComponent(token)}`;
      }
      
      // Força recarregamento completo mantendo o token
      window.location.href = newPath;
    } catch (error) {
      console.error("Language change error:", error);
      // Fallback mantendo o token se possível
      const token = new URL(window.location.href).searchParams.get('token');
      window.location.href = token ? `/${newLocale}?token=${encodeURIComponent(token)}` : `/${newLocale}`;
    } finally {
      setIsChangingLanguage(false);
    }
  };

  if (isLoggedIn === null) {
    return null;
  }

  return (
    <header className="w-full h-20 bg-black relative">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between h-full px-6">
        {/* Logo à esquerda */}
        <div className="flex-1">
          <Link href={`/${locale}`} className="text-white text-lg font-semibold">
            <LogoLateral />
          </Link>
        </div>

        {/* Navegação central */}
        {isLoggedIn && (
          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2">
            <div className="relative flex">
              <div
                className={`absolute inset-0 h-full w-1/2 bg-darkgreen rounded-md transition-all duration-300 ${
                  activeTab === `/${locale}/musicas` ? "translate-x-full" : "translate-x-0"
                }`}
              ></div>
              <Link
                href={`/${locale}`}
                className={`w-32 text-center py-2 text-white relative z-10 transition-all ${
                  activeTab === `/${locale}` ? "font-bold" : "text-gray-400"
                }`}
              >
                {t("filmes")}
              </Link>
              <Link
                href={`/${locale}/musicas`}
                className={`w-32 text-center py-2 text-white relative z-10 transition-all ${
                  activeTab === `/${locale}/musicas` ? "font-bold" : "text-gray-400"
                }`}
              >
                {t("musicas")}
              </Link>
            </div>
          </nav>
        )}

        {/* Lado direito: Seletor de idioma e perfil */}
        <div className="flex-1 flex justify-end items-center gap-4">
          {/* Seletor de Idioma */}
          <DropdownMenu>
            <DropdownMenuTrigger 
              className="focus:outline-none text-white bg-gray-800 px-3 py-1 rounded-md hover:bg-gray-700 transition-all flex items-center gap-2 min-w-[50px] justify-center"
              disabled={isChangingLanguage}
            >
              {isChangingLanguage ? (
                <span className="loading-spinner h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                locale.toUpperCase()
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={5}
              className="w-20 bg-black shadow-lg rounded-md p-1 border border-gray-700"
            >
              <DropdownMenuItem
                onClick={() => changeLanguage("pt")}
                className="block px-2 py-1 hover:bg-gray-900 rounded text-center cursor-pointer"
              >
                PT
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => changeLanguage("en")}
                className="block px-2 py-1 hover:bg-gray-900 rounded text-center cursor-pointer"
              >
                EN
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none ml-4">
                <Image
                  src="/profile.jpg"
                  alt="Avatar"
                  width={50}
                  height={50}
                  className="rounded-full cursor-pointer"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="w-48 bg-black shadow-lg rounded-md p-2 border border-gray-700"
              >
                <DropdownMenuItem asChild>
                  <Link
                    href={`/${locale}/profile`}
                    className="block px-2 py-1 hover:bg-gray-900 rounded"
                  >
                    {t("perfil")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/${locale}/favoritos`}
                    className="block px-2 py-1 hover:bg-gray-900 rounded"
                  >
                    {t("favoritos")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    localStorage.removeItem("authToken");
                    window.location.href = `/${locale}/login`;
                  }}
                  className="block px-2 py-1 text-red-300 hover:bg-red-900 rounded cursor-pointer"
                >
                  {t("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href={`/${locale}/login`}
              className="text-white bg-darkgreen px-6 py-2 rounded-md hover:brightness-110 transition-all"
            >
              {t("login")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}