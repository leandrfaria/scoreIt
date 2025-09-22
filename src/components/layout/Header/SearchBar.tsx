"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { FaSearch } from "react-icons/fa";
import { useAuthContext } from "@/context/AuthContext";
import { Member } from "@/types/Member";
import { apiFetch } from "@/lib/api";

const MIN_CHARS = 3;
const DEBOUNCE_MS = 300;

export default function SearchBar() {
  const { isLoggedIn } = useAuthContext();
  const locale = useLocale();
  const t = useTranslations("Mobileheader");

  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const debounced = useDebouncedValue(searchTerm.trim(), DEBOUNCE_MS);

  useEffect(() => {
    if (!isLoggedIn) return;

    const onClickOutside = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        closeSearch();
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || debounced.length < MIN_CHARS) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const fetchMembers = async () => {
      try {
        setIsLoading(true);
        const data = await apiFetch(
          `/member/search?handle=${encodeURIComponent(debounced)}`,
          { method: "GET", auth: true, signal: controller.signal }
        );

        if (data === undefined) return; // abortado
        setResults(Array.isArray(data) ? (data as Member[]) : []);
      } catch (err) {
        console.error(t("deleteError"), err);
        setResults([]);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    fetchMembers();

    return () => controller.abort();
  }, [debounced, isLoggedIn, t]);

  const toggle = () => setIsSearchVisible((v) => !v);

  const closeSearch = () => {
    setIsSearchVisible(false);
    setSearchTerm("");
    setResults([]);
    setIsLoading(false);
    controllerRef.current?.abort();
  };

  if (!isLoggedIn) return null;

  const hasList = results.length > 0;
  const showList = isSearchVisible && (hasList || isLoading || debounced.length >= MIN_CHARS);

  return (
    <div
      className="relative flex items-center"
      ref={containerRef}
      onKeyDown={(e) => e.key === "Escape" && closeSearch()}
    >
      <button
        onClick={toggle}
        className="focus:outline-none mr-2"
        aria-label={t("openMenu")}
        aria-expanded={isSearchVisible}
      >
        <FaSearch className="text-white w-5 h-5" />
      </button>

      <div
        className={`transition-all duration-300 overflow-hidden ${isSearchVisible ? "w-48" : "w-0"}`}
      >
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t("searchUsersPlaceholder")}
          className="px-4 py-2 rounded-md border border-gray-300 focus:outline-none w-full text-sm"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
        />
      </div>

      {showList && (
        <div
          className="absolute top-full left-0 mt-2 z-50 bg-gray-800 rounded-md w-56 shadow-lg border border-gray-700"
          role="listbox"
          aria-label={t("searchUsers")}
        >
          {isLoading && (
            <div className="px-4 py-2 text-sm text-gray-300">{t("loading")}</div>
          )}

          {!isLoading && hasList && (
            <ul className="max-h-72 overflow-y-auto py-1">
              {results.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/${locale}/profile/${normalizeHandle(m.handle) || suggestHandle(m)}`}
                    className="block px-3 py-2 hover:bg-gray-700 rounded transition-colors"
                    onClick={closeSearch}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          m.profileImageUrl ||
                          "https://marketup.com/wp-content/themes/marketup/assets/icons/perfil-vazio.jpg"
                        }
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

          {!isLoading && !hasList && debounced.length >= MIN_CHARS && (
            <div className="px-4 py-2 text-sm text-gray-300">{t("noUsersFound")}</div>
          )}
        </div>
      )}
    </div>
  );
}

/** hook de debounce simples */
function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function normalizeHandle(v: string) {
  return (v || "").replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9._]/g, "");
}

function suggestHandle(m?: Member | null) {
  if (!m) return "user";
  const fromHandle = normalizeHandle(m?.handle || "");
  if (fromHandle) return fromHandle;
  const emailLeft = (m?.email || "").split("@")[0] || "";
  const fromEmail = normalizeHandle(emailLeft);
  if (fromEmail) return fromEmail;
  const fromName = normalizeHandle((m?.name || "").replace(/\s+/g, "."));
  if (fromName) return fromName;
  return `user${m?.id || ""}`;
}
