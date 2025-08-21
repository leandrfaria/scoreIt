"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { useMember } from "@/context/MemberContext";
import { useLocale, useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/utils/shadcn";

export default function UserMenu() {
  const { isLoggedIn, setIsLoggedIn } = useAuthContext();
  const { member } = useMember();
  const locale = useLocale();
  const t = useTranslations("header");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Caso o estado de auth ainda não esteja resolvido, não renderiza nada
  if (isLoggedIn === null) return null;

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setIsLoggedIn(false);
    window.location.href = `/${locale}/auth`;
  };

  const deleteUser = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token || !member) return;

      const response = await fetch(
        `http://localhost:8080/member/delete/${member.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        localStorage.removeItem("authToken");
        setIsLoggedIn(false);
        window.location.href = `/${locale}/auth`;
      } else {
        console.error("Erro ao deletar usuário:", response.statusText);
      }
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
    }
  };

  // Se não estiver logado, mostra o botão de login
if (!isLoggedIn) {
  return (
    <Link
      href={`/${locale}/auth`}
      className="text-white bg-darkgreen px-5 py-2 rounded-md hover:brightness-110 transition-all text-sm sm:text-base"
    >
      {t("login")}
    </Link>
  );
}

  // Logado → avatar + dropdown
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="focus:outline-none ml-2">
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
            onClick={handleLogout}
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
                onClick={async () => {
                  await deleteUser();
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
    </>
  );
}
