// src/components/layout/Header/UserMenu.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useCallback } from "react";
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
import { getToken } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";

export default function UserMenu() {
  // hooks: sempre no topo, sem condicionais
  const { isLoggedIn, logout } = useAuthContext();
  const { member } = useMember();
  const locale = useLocale();
  const t = useTranslations("header");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  // mover o useCallback aqui, junto com os outros hooks
  const toggleTheme = useCallback(() => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(next); // salva preferência explícita
  }, [resolvedTheme, setTheme]);

  // returns condicionais depois dos hooks
  if (isLoggedIn === null) return null;

  const handleLogout = () => {
    logout();
    window.location.href = `/${locale}/auth?tab=login`;
  };

  const deleteUser = async () => {
    try {
      const token = getToken();
      if (!token || !member) return;

      const response = await fetch(
        `http://localhost:8080/member/delete/${member.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        logout();
        window.location.href = `/${locale}/auth`;
      } else {
        console.error("Erro ao deletar usuário:", response.statusText);
      }
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
    }
  };

  if (!isLoggedIn) {
    return (
      <Link
        href={`/${locale}/auth?tab=login`}
        className="px-5 py-2 rounded-md hover:brightness-110 transition-all text-sm sm:text-base"
        style={{
          backgroundColor: "var(--color-darkgreen)",
          color: "var(--text)",
        }}
      >
        {t("login")}
      </Link>
    );
  }

  const isAdmin =
    !!member?.role && String(member.role).toUpperCase().includes("ADMIN");

  const itemBase =
    "block px-2 py-2 rounded cursor-pointer text-sm sm:text-base";

  return (
    <div className="flex items-center gap-2">
      {/* Botão de alternância (sol/lua) */}
      <button
        onClick={toggleTheme}
        aria-label="Alternar tema claro/escuro"
        title={resolvedTheme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
        className="p-2 rounded-full ring-1 hover:opacity-90 active:opacity-80 transition"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
          color: "var(--text)",
        }}
      >
        {/* Ícones inline para evitar dependências */}
        {resolvedTheme === "dark" ? (
          // Sun
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4"></circle>
            <path d="M12 2v2"></path>
            <path d="M12 20v2"></path>
            <path d="M4.93 4.93l1.41 1.41"></path>
            <path d="M17.66 17.66l1.41 1.41"></path>
            <path d="M2 12h2"></path>
            <path d="M20 12h2"></path>
            <path d="M6.34 17.66l-1.41 1.41"></path>
            <path d="M19.07 4.93l-1.41 1.41"></path>
          </svg>
        ) : (
          // Moon
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"></path>
          </svg>
        )}
      </button>

      {/* Avatar + menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="focus:outline-none">
          <div
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden relative ring-1"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
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
          className="w-56 shadow-lg rounded-md p-2"
          style={{
            backgroundColor: "var(--surface)",
            color: "var(--text)",
            border: "1px solid var(--border)",
          }}
        >
          <DropdownMenuItem asChild>
            <Link
              href={`/${locale}/profile`}
              className={`${itemBase} hover:opacity-80`}
              style={{ color: "var(--text)" }}
            >
              {t("perfil")}
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            {isAdmin ? (
              <Link
                href={`/${locale}/admin`}
                className={`${itemBase} hover:opacity-80`}
                style={{ color: "var(--text)" }}
              >
                Admin
              </Link>
            ) : (
              <Link
                href={`/${locale}/feed`}
                className={`${itemBase} hover:opacity-80`}
                style={{ color: "var(--text)" }}
              >
                Feed
              </Link>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator
            className="my-2"
            style={{ backgroundColor: "var(--border)", height: 1 }}
          />

          <DropdownMenuItem
            onClick={handleLogout}
            className={`${itemBase} hover:opacity-80`}
            style={{ color: "#fca5a5" }}
          >
            {t("logout")}
          </DropdownMenuItem>

          <DropdownMenuSeparator
            className="my-2"
            style={{ backgroundColor: "var(--border)", height: 1 }}
          />

          <DropdownMenuItem
            onClick={() => setIsModalOpen(true)}
            className={`${itemBase} hover:opacity-80`}
            style={{ color: "#fca5a5" }}
          >
            {t("deleteUser")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal deletar usuário */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "var(--overlay)" }}
        >
          <div
            className="p-6 rounded-lg w-full max-w-md shadow-lg"
            style={{ backgroundColor: "var(--surface-2)", color: "var(--text)" }}
          >
            <h2 className="font-bold mb-2">{t("deleteModal.title")}</h2>
            <p className="mb-6" style={{ color: "var(--muted)" }}>
              {t("deleteModal.description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="order-2 sm:order-1 border px-4 py-2 rounded hover:opacity-80 transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                {t("deleteModal.cancel")}
              </button>
              <button
                onClick={async () => {
                  await deleteUser();
                  setIsModalOpen(false);
                }}
                className="order-1 sm:order-2 px-4 py-2 rounded hover:opacity-90 transition-colors"
                style={{ backgroundColor: "#ef4444", color: "#fff" }}
              >
                {t("deleteModal.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}