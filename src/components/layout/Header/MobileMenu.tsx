"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { FaBars, FaTimes, FaSearch } from "react-icons/fa";

import { useAuthContext } from "@/context/AuthContext";
import { useMember } from "@/context/MemberContext";
import type { Member } from "@/types/Member";
import { apiFetch } from "@/lib/api";

const MIN_CHARS = 3;
const DEBOUNCE_MS = 300;

export default function MobileMenu() {
  const { isLoggedIn, setIsLoggedIn } = useAuthContext();
  const { member } = useMember();
  const locale = useLocale();
  const t = useTranslations("Mobileheader");
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  const [q, setQ] = useState("");
  const [results, setResults] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const debouncedQ = useDebouncedValue(q.trim(), DEBOUNCE_MS);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    if (!isLoggedIn) return;
    const onClickOutside = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setResults([]);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [isLoggedIn]);

  // Buscar membros
  useEffect(() => {
    if (!isLoggedIn || debouncedQ.length < MIN_CHARS) {
      setResults([]);
      setLoading(false);
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const fetchMembers = async () => {
      try {
        setLoading(true);
        const data = await apiFetch(
          `/member/search?handle=${encodeURIComponent(debouncedQ)}`,
          { method: "GET", auth: true, signal: controller.signal }
        );
        if (data === undefined) return; // abortado
        setResults(Array.isArray(data) ? (data as Member[]) : []);
      } catch (err) {
        console.error(t("deleteError"), err);
        setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchMembers();
    return () => controller.abort();
  }, [debouncedQ, isLoggedIn, t]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setIsLoggedIn(false);
    window.location.href = `/${locale}/auth?tab=login`;
  };

  const changeLanguage = async (newLocale: string) => {
    if (newLocale === locale) return;
    setIsChangingLanguage(true);
    try {
      const current = new URL(window.location.href);
      const token = current.searchParams.get("token");

      let newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
      if (pathname === "/") newPath = `/${newLocale}`;
      if (token) newPath += `?token=${encodeURIComponent(token)}`;

      window.location.href = newPath;
    } finally {
      setIsChangingLanguage(false);
    }
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteUser = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token || !member) return;
      const res = await fetch(
        `http://localhost:8080/member/delete/${member.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        localStorage.removeItem("authToken");
        setIsLoggedIn(false);
        window.location.href = `/${locale}/auth?tab=login`;
      } else {
        console.error(t("deleteError"), res.statusText);
      }
    } catch (e) {
      console.error(t("deleteError"), e);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="focus:outline-none p-2 hover:bg-gray-800 rounded-md transition-colors"
        aria-label={t("openMenu")}
        aria-expanded={open}
      >
        {open ? <FaTimes className="text-white w-5 h-5" /> : <FaBars className="text-white w-5 h-5" />}
      </button>

      {open && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-black border-t border-gray-700 shadow-lg z-30">
          <div className="p-4 space-y-4">
            {isLoggedIn && (
              <div ref={containerRef}>
                <label className="sr-only" htmlFor="mobile-user-search">
                  {t("searchUsers")}
                </label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    id="mobile-user-search"
                    type="text"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={t("searchUsersPlaceholder")}
                    className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-black text-white"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                </div>

                {(loading || results.length > 0) && (
                  <div className="mt-2 bg-gray-800 rounded-md max-h-60 overflow-y-auto shadow-lg border border-gray-700">
                    {loading && (
                      <div className="px-3 py-2 text-sm text-gray-300">{t("loading")}</div>
                    )}

                    {!loading && results.length > 0 && (
                      <ul className="max-h-60 overflow-y-auto py-1">
                        {results.map((m) => (
                          <li key={m.id}>
                            <Link
                              href={`/${locale}/profile/${normalizeHandle(m.handle) || suggestHandle(m)}`}
                              className="block px-3 py-2 hover:bg-gray-700 rounded transition-colors"
                              onClick={() => setOpen(false)}
                            >
                              <div className="flex items-center gap-2">
                                <img
                                  src={m.profileImageUrl || "https://marketup.com/wp-content/themes/marketup/assets/icons/perfil-vazio.jpg"}
                                  alt={m.name}
                                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                />
                                <div className="flex flex-col">
                                  <span className="text-white text-sm font-medium truncate">{m.name}</span>
                                  <span className="text-gray-400 text-xs truncate">@{m.handle}</span>
                                </div>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}

                    {!loading && results.length === 0 && debouncedQ.length >= MIN_CHARS && (
                      <div className="px-3 py-2 text-sm text-gray-300">{t("noUsersFound")}</div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-medium">
                {t("changeLanguage")}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => changeLanguage("pt")}
                  disabled={isChangingLanguage}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    locale === "pt"
                      ? "bg-darkgreen text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  PT
                </button>
                <button
                  onClick={() => changeLanguage("en")}
                  disabled={isChangingLanguage}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    locale === "en"
                      ? "bg-darkgreen text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  EN
                </button>
              </div>
            </div>

            {isLoggedIn ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-700">
                  <div className="w-10 h-10 rounded-full bg-gray-400 overflow-hidden relative flex-shrink-0">
                    <Image
                      src={
                        member?.profileImageUrl ||
                        "https://marketup.com/wp-content/themes/marketup/assets/icons/perfil-vazio.jpg"
                      }
                      alt={member?.name ?? t("user")}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">
                      {member?.name || t("user")}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/${locale}/profile`}
                  className="block px-3 py-2 text-white hover:bg-gray-800 rounded transition-colors"
                  onClick={() => setOpen(false)}
                >
                  {t("perfil")}
                </Link>

                <Link
                  href={`/${locale}/feed`}
                  className="block px-3 py-2 text-white hover:bg-gray-800 rounded transition-colors"
                  onClick={() => setOpen(false)}
                >
                  {t("feed")}
                </Link>

                <div className="border-t border-gray-700 pt-2">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 text-red-300 hover:bg-red-900 rounded transition-colors"
                  >
                    {t("logout")}
                  </button>
                  <button
                    onClick={() => setConfirmOpen(true)}
                    className="block w-full text-left px-3 py-2 text-red-300 hover:bg-red-900 rounded transition-colors"
                  >
                    {t("deleteUser")}
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href={`/${locale}/auth?tab=login`}
                className="block w-full text-center text-white bg-darkgreen px-4 py-3 rounded-md hover:brightness-110 transition-all"
                onClick={() => setOpen(false)}
              >
                {t("login")}
              </Link>
            )}
          </div>
        </div>
      )}

      {confirmOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 p-6 rounded-lg w-full max-w-md shadow-lg">
            <h2 className="font-bold text-white mb-2">{t("deleteModal.title")}</h2>
            <p className="text-gray-300 mb-6">{t("deleteModal.description")}</p>
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                onClick={() => setConfirmOpen(false)}
                className="order-2 sm:order-1 border border-gray-500 text-gray-300 px-4 py-2 rounded hover:bg-gray-800 transition-colors"
              >
                {t("deleteModal.cancel")}
              </button>
              <button
                onClick={async () => {
                  await deleteUser();
                  setConfirmOpen(false);
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

// Debounce hook
function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// Normalização de handle (igual ao SearchBar)
function normalizeHandle(handle?: string) {
  return handle?.toLowerCase().replace(/\s+/g, "-");
}

function suggestHandle(member: Member) {
  return normalizeHandle(member.handle) || `user-${member.id}`;
}
