"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
import { TabSwitcherMediaType } from "./TabSwitcherMediaType";
import { Member } from "@/types/Member";
import { FaSearch } from "react-icons/fa";

export function Header() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("header");
  const { isLoggedIn, setIsLoggedIn } = useAuthContext();
  const { member } = useMember();
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false); // Estado para controlar a visibilidade

  const [isModalOpen, setIsModalOpen] = useState(false);

  const deleteUser = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token || !member) return;
      const response = await fetch(`http://localhost:8080/member/delete/${member.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (response.ok) {
        localStorage.removeItem("authToken");
        setIsLoggedIn(false);
        window.location.href = `/${locale}/login`;
      } else {
        console.error("Erro ao deletar usuário:", response.statusText);
      }
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
    }
  };

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

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.length < 3) {
      setSearchResults([]); // Limpa os resultados se menos de 3 caracteres
      return;
    }

    console.log("TO PASSANDO AQUI EM:   ", value)
    try {
      const token = localStorage.getItem("authToken");

      const response = await fetch(`http://localhost:8080/member/search?name=${value}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      if (response.ok) {
        const data: Member[] = await response.json(); // Tipar os dados como Member[]
        setSearchResults(data);
      } else {
        setSearchResults([]); // Limpa os resultados se houver erro
      }
    } catch (error) {
      console.error("Erro ao buscar membros:", error);
      setSearchResults([]); // Limpa os resultados em caso de erro
    }
  };

  return (
    <header className="w-full h-20 bg-black relative">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between h-full px-6">
        {/* LOGO */}
        <div className="flex-1">
          <Link href={`/${locale}`} className="text-white text-lg font-semibold">
            <LogoLateral />
          </Link>
        </div>

        {/* MENU DE TROCA DE ABA (DESKTOP) */}
        {isLoggedIn && <TabSwitcherMediaType />
        }

        {/* MENU DE TROCA DE ABA (MOBILE) */}
        {isLoggedIn && (
          <div className="flex md:hidden">
            <TabSwitcherMediaType />
          </div>
        )}

        {/* LADO DIREITO (IDIOMA + AVATAR OU LOGIN) */}
        <div className="flex-1 flex justify-end items-center gap-4">
          {/*Barra de busca de usuários*/}
          <div className="relative flex items-center"> {/* Container flexível */}
            <button 
                onClick={() => setIsSearchVisible(!isSearchVisible)} 
                className="focus:outline-none mr-2" // Margem à direita para espaçamento
            >
                <FaSearch className="text-white w-5 h-5" />
            </button>
            <div className={`transition-all duration-300 overflow-hidden ${isSearchVisible ? "w-48" : "w-0"}`}>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder="Buscar usuários..."
                    className={`px-4 py-2 rounded-md border border-gray-300 focus:outline-none w-full`}
                />
            </div>
            {/* Lista de Resultados */}
            {isSearchVisible && searchResults.length > 0 && (
                <div className="absolute z-10 bg-gray-800 black-md rounded-md mt-23 ml-7 w-48"> {/* Lista flutuante */}
                    {searchResults.map((member: Member) => (
                        <Link key={member.id} href={`/${locale}/profile/${member.id}`} className="block px-4 py-2 rounded-md hover:bg-gray-700">
                            <div className="flex items-center">
                                <img
                                    src={member.profileImageUrl || "https://marketup.com/wp-content/themes/marketup/assets/icons/perfil-vazio.jpg"}
                                    alt={member.name}
                                    className="w-8 h-8 rounded-full mr-2"
                                />
                                <span>{member.name}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
          {/* Trocar idioma */}
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

          {/* Avatar ou botão de login */}
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
                {/* <DropdownMenuItem asChild>
                  <Link
                    href={`/${locale}/favoritos`}
                    className="block px-2 py-1 hover:bg-gray-900 rounded"
                  >
                    {t("favoritos")}
                  </Link>
                </DropdownMenuItem> */}
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
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setIsModalOpen(true)}
                  className="block px-2 py-1 text-red-300 hover:bg-red-900 rounded cursor-pointer"
                >
                  {t("deleteUser")}
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

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
            <div className="bg-zinc-900 p-6 rounded-lg w-full max-w-md shadow-lg">
              <h2 className="font-bold">{t("deleteModal.title")}</h2>
              <p>{t("deleteModal.description")}</p>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="mr-2 border border-gray-500 text-gray-300 px-4 py-1 rounded"
                >
                  {t("deleteModal.cancel")}
                </button>
                <button
                  onClick={() => {
                    deleteUser();
                    setIsModalOpen(false);
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded"
                >
                  {t("deleteModal.confirm")}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </header>
  );
}
