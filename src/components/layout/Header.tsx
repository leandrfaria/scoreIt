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
import { FaSearch, FaBars, FaTimes } from "react-icons/fa";
import path from "path";

export function Header() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("header");
  const { isLoggedIn, setIsLoggedIn } = useAuthContext();
  const { member } = useMember();
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const showMediaTypeMenu = !pathname.endsWith('/feed') && !pathname.includes('/series')
  && !pathname.includes('/album')
  && !pathname.includes('/movie');

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fechar menu mobile quando redimensionar para desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    console.log("PATHNAME:", pathname)

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
      setSearchResults([]);
      return;
    }

    try {
      const token = localStorage.getItem("authToken");

      const response = await fetch(`http://localhost:8080/member/search?name=${value}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      if (response.ok) {
        const data: Member[] = await response.json();
        setSearchResults(data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Erro ao buscar membros:", error);
      setSearchResults([]);
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const closeSearch = () => {
    setIsSearchVisible(false);
    setSearchTerm('');
    setSearchResults([]);
  };

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

        {/* MENU DE TROCA DE ABA (DESKTOP) */}
        {isLoggedIn && showMediaTypeMenu && <div className="invisible lg:visible"><TabSwitcherMediaType /></div>}

        {/* LADO DIREITO (IDIOMA + AVATAR OU LOGIN) */}
        <div className="hidden lg:flex flex-1 flex justify-end items-center gap-3 xl:gap-4">
          {/*Barra de busca de usuários*/}
          {isLoggedIn &&
            <div className="flex items-center"> {/* Container flexível */}
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
                      <div className="flex items-center" onClick={() => {setIsSearchVisible(!isSearchVisible); setSearchTerm(''); setSearchResults([])}}>
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
          }

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
                className="block px-2 py-1 hover:bg-gray-900 rounded text-center cursor-pointer text-white"
              >
                PT
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => changeLanguage("en")}
                className="block px-2 py-1 hover:bg-gray-900 rounded text-center cursor-pointer text-white"
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
                    className="block px-2 py-1 hover:bg-gray-900 rounded text-white"
                  >
                    {t("perfil")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/${locale}/feed`}
                    className="block px-2 py-1 hover:bg-gray-900 rounded text-white"
                  >
                    Feed
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

        {/* MOBILE - LADO DIREITO */}
        <div className="flex lg:hidden items-center gap-2">
          
          {/* Busca mobile */}
          {isLoggedIn && (
            <button
              onClick={() => setIsSearchVisible(!isSearchVisible)}
              className="focus:outline-none p-2 hover:bg-gray-800 rounded-md transition-colors"
            >
              <FaSearch className="text-white w-4 h-4" />
            </button>
          )}

          {/* Menu Hambúrguer */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="focus:outline-none p-2 hover:bg-gray-800 rounded-md transition-colors"
          >
            {isMobileMenuOpen ? (
              <FaTimes className="text-white w-5 h-5" />
            ) : (
              <FaBars className="text-white w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Barra de busca mobile (fullwidth) */}
      {isLoggedIn && isSearchVisible && (
        <div className="lg:hidden border-t border-gray-700 bg-black px-4 py-3">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Buscar usuários..."
              className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            
            {/* Resultados da busca mobile */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-gray-800 rounded-md max-h-60 overflow-y-auto shadow-lg">
                {searchResults.map((member: Member) => (
                  <Link 
                    key={member.id} 
                    href={`/${locale}/profile/${member.id}`} 
                    className="block px-3 py-2 hover:bg-gray-700 transition-colors"
                    onClick={() => {
                      closeSearch();
                      closeMobileMenu();
                    }}
                  >
                    <div className="flex items-center">
                      <img
                        src={member.profileImageUrl || "https://marketup.com/wp-content/themes/marketup/assets/icons/perfil-vazio.jpg"}
                        alt={member.name}
                        className="w-8 h-8 rounded-full mr-2 flex-shrink-0"
                      />
                      <span className="text-white text-sm truncate">{member.name}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Menu Mobile */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-black border-t border-gray-700 shadow-lg z-30">
          <div className="p-4 space-y-4">
            
            {/* Menu de abas mobile */}
            {isLoggedIn && showMediaTypeMenu && (
              <div className="border-b border-gray-700 pb-4">
                <TabSwitcherMediaType />  
              </div>
            )}

            {/* Seletor de idioma mobile */}
            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-medium">Idioma:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    changeLanguage("pt");
                    closeMobileMenu();
                  }}
                  disabled={isChangingLanguage}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    locale === 'pt' ? 'bg-darkgreen text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  PT
                </button>
                <button
                  onClick={() => {
                    changeLanguage("en");
                    closeMobileMenu();
                  }}
                  disabled={isChangingLanguage}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    locale === 'en' ? 'bg-darkgreen text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  EN
                </button>
              </div>
            </div>

            {/* Menu do usuário mobile */}
            {isLoggedIn ? (
              <div className="space-y-2">
                {/* Perfil do usuário */}
                <div className="flex items-center gap-3 pb-3 border-b border-gray-700">
                    <img
                        src={member?.profileImageUrl || "https://marketup.com/wp-content/themes/marketup/assets/icons/perfil-vazio.jpg"}
                        alt={member?.name}
                        className="w-10 h-10 rounded-full bg-gray-400 overflow-hidden relative flex-shrink-0"
                      />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">
                      {member?.name || "Usuário"}
                    </p>
                  </div>
                </div>

                {/* Links do menu */}
                <Link
                  href={`/${locale}/profile`}
                  className="block px-3 py-2 text-white hover:bg-gray-800 rounded transition-colors"
                  onClick={closeMobileMenu}
                >
                  {t("perfil")}
                </Link>
                <Link
                  href={`/${locale}/feed`}
                  className="block px-3 py-2 text-white hover:bg-gray-800 rounded transition-colors"
                  onClick={closeMobileMenu}
                >
                  Feed
                </Link>
                
                <div className="border-t border-gray-700 pt-2">
                  <button
                    onClick={() => {
                      localStorage.removeItem("authToken");
                      setIsLoggedIn(false);
                      window.location.href = `/${locale}/login`;
                    }}
                    className="block w-full text-left px-3 py-2 text-red-300 hover:bg-red-900 rounded transition-colors"
                  >
                    {t("logout")}
                  </button>
                  <button
                    onClick={() => {
                      setIsModalOpen(true);
                      closeMobileMenu();
                    }}
                    className="block w-full text-left px-3 py-2 text-red-300 hover:bg-red-900 rounded transition-colors"
                  >
                    {t("deleteUser")}
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href={`/${locale}/login`}
                className="block w-full text-center text-white bg-darkgreen px-4 py-3 rounded-md hover:brightness-110 transition-all"
                onClick={closeMobileMenu}
              >
                {t("login")}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 p-6 rounded-lg w-full max-w-md shadow-lg">
            <h2 className="font-bold text-white mb-2">{t("deleteModal.title")}</h2>
            <p className="text-gray-300 mb-6">{t("deleteModal.description")}</p>
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="order-2 sm:order-1 border border-gray-500 text-gray-300 px-4 py-2 rounded hover:bg-gray-800 transition-colors"
              >
                {t("deleteModal.cancel")}
              </button>
              <button
                onClick={() => {
                  deleteUser();
                  setIsModalOpen(false);
                }}
                className="order-1 sm:order-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                {t("deleteModal.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}