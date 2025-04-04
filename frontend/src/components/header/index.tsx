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

export function Header() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("/");
  const isLoggedIn = useCheckAuth();

  useEffect(() => {
    setActiveTab(pathname);
  }, [pathname]);

  if (isLoggedIn === null) {
    return null; // ou <p>Carregando...</p> se preferir
  }

  return (
    <header className="w-full h-20 bg-black">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between h-full px-6">
        {/* Nome do projeto à esquerda */}
        <div className="flex-1">
          <Link href="/" className="text-white text-lg font-semibold">
            ScoreIt
          </Link>
        </div>

        {/* Navegação ou Login à direita */}
        <div className="flex-1 flex justify-end items-center">
          {isLoggedIn ? (
            <>
              {/* Navegação com animação */}
              <nav className="relative hidden md:flex">
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
              </nav>

              {/* Avatar / Dropdown */}
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
            </>
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
