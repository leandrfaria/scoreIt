"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthContext } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/utils/shadcn";
import LogoLateral from "@/assets/LogoLateral";
import { useLocale, useTranslations } from "next-intl";
import { useMember } from "@/context/MemberContext";
import { useTabContext } from "@/context/TabContext";

export function Header() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("header");
  const router = useRouter();
  const { isLoggedIn, setIsLoggedIn } = useAuthContext();
  const { member } = useMember();
  const { activeTab, setActiveTab } = useTabContext();
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  const changeLanguage = async (newLocale: string) => {
    setIsChangingLanguage(true);
    try {
      const url = new URL(window.location.href);
      const token = url.searchParams.get("token");

      let newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
      if (pathname === "/") newPath = `/${newLocale}`;
      if (token) newPath += `?token=${encodeURIComponent(token)}`;

      window.location.href = newPath;
    } catch (error) {
      console.error("Language change error:", error);
      const token = new URL(window.location.href).searchParams.get("token");
      window.location.href = token
        ? `/${newLocale}?token=${encodeURIComponent(token)}`
        : `/${newLocale}`;
    } finally {
      setIsChangingLanguage(false);
    }
  };

  if (isLoggedIn === null) return null;

  return (
    <header className="w-full h-20 bg-black relative">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between h-full px-6">
        <div className="flex-1">
          <Link href={`/${locale}`} className="text-white text-lg font-semibold">
            <LogoLateral />
          </Link>
        </div>

        {isLoggedIn && (
          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2">
            <div className="relative flex">
              <div
                className={`absolute inset-0 h-full w-1/3 bg-darkgreen rounded-md transition-all duration-300 ${
                  activeTab === "series"
                    ? "translate-x-0"
                    : activeTab === "filmes"
                    ? "translate-x-full"
                    : "translate-x-[200%]"
                }`}
              ></div>

              <button
                onClick={() => {
                  setActiveTab("series");
                  router.replace(`/${locale}`);
                }}
                className={`w-32 text-center py-2 text-white relative z-10 transition-all ${
                  activeTab === "series" ? "font-bold" : "text-gray-400"
                }`}
              >
                {t("series")}
              </button>
              <button
                onClick={() => {
                  setActiveTab("filmes");
                  router.replace(`/${locale}`);
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
                  router.replace(`/${locale}`);
                }}
                className={`w-32 text-center py-2 text-white relative z-10 transition-all ${
                  activeTab === "musicas" ? "font-bold" : "text-gray-400"
                }`}
              >
                {t("musicas")}
              </button>
            </div>
          </nav>
        )}

        <div className="flex-1 flex justify-end items-center gap-4">
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
                <div className="w-12 h-12 rounded-full bg-gray-400 overflow-hidden relative">
                  <Image
                    src={
                      member?.profileImageUrl ||
                      "https://marketup.com/wp-content/themes/marketup/assets/icons/perfil-vazio.jpg"
                    }
                    alt="Avatar"
                    fill
                    className="object-cover"
                  />
                </div>
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
                    setIsLoggedIn(false);
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
