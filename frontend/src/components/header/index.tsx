"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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

export function Header() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("/");
  const isLoggedIn = useCheckAuth();

  useEffect(() => {
    setActiveTab(pathname);
  }, [pathname]);

  if (isLoggedIn === null) {
    return null;
  }

  return (
    <header className="w-full h-20 bg-black relative">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between h-full px-6">
        {/* Nome do projeto à esquerda */}
        <div className="flex-1">
          <Link href="/" className="text-white text-lg font-semibold">
            <LogoLateral/>
          </Link>
        </div>

        {/* Navegação centralizada */}
        {isLoggedIn && (
          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2">
            <div className="relative flex">
              <div
                className={`absolute inset-0 h-full w-1/2 bg-darkgreen rounded-md transition-all duration-300 ${
                  activeTab === "/musicas" ? "translate-x-full" : "translate-x-0"
                }`}
              ></div>
              <Link
                href="/"
                className={`w-32 text-center py-2 text-white relative z-10 transition-all ${
                  activeTab === "/" ? "font-bold" : "text-gray-400"
                }`}
              >
                Filmes
              </Link>
              <Link
                href="/musicas"
                className={`w-32 text-center py-2 text-white relative z-10 transition-all ${
                  activeTab === "/musicas" ? "font-bold" : "text-gray-400"
                }`}
              >
                Músicas
              </Link>
            </div>
          </nav>
        )}

        {/* Lado direito: Avatar ou Botão de Login */}
        <div className="flex-1 flex justify-end items-center">
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
                className="w-48 bg-black shadow-lg rounded-md p-2 border border-gray-700 data-[state=open]:animate-fadeIn data-[state=closed]:animate-fadeOut"
              >
                <DropdownMenuItem asChild>
                  <Link
                    href="/profile"
                    className="block px-2 py-1 hover:bg-gray-900 rounded"
                  >
                    Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/favoritos"
                    className="block px-2 py-1 hover:bg-gray-900 rounded"
                  >
                    Meus Favoritos
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    localStorage.removeItem("authToken");
                    window.location.href = "/login";
                  }}
                  className="block px-2 py-1 text-red-300 hover:bg-red-900 rounded cursor-pointer"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/login"
              className="text-white bg-darkgreen px-6 py-2 rounded-md hover:brightness-110 transition-all"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
