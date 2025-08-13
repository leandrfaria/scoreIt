"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { FaSearch } from "react-icons/fa";
import { useAuthContext } from "@/context/AuthContext";
import { Member } from "@/types/Member";

const MIN_CHARS = 3;
const DEBOUNCE_MS = 300;

export default function SearchBar() {
  const { isLoggedIn } = useAuthContext();
  const locale = useLocale();

  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const debounced = useDebouncedValue(searchTerm.trim(), DEBOUNCE_MS);

  // Fechar quando clicar fora (hook sempre é chamado; o corpo respeita o estado de login)
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

  // Buscar membros (hook sempre é chamado; o corpo respeita o estado de login)
  useEffect(() => {
    if (!isLoggedIn) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    if (debounced.length < MIN_CHARS) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    let aborted = false;
    const fetchMembers = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("authToken");
        const res = await fetch(
          `http://localhost:8080/member/search?name=${encodeURIComponent(
            debounced
          )}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        if (!res.ok) {
          if (!aborted) setResults([]);
          return;
        }
        const data: Member[] = await res.json();
        if (!aborted) setResults(Array.isArray(data) ? data : []);
      } catch {
        if (!aborted) setResults([]);
      } finally {
        if (!aborted) setIsLoading(false);
      }
    };

    fetchMembers();
    return () => {
      aborted = true;
    };
  }, [debounced, isLoggedIn]);

  const toggle = () => setIsSearchVisible((v) => !v);

  const closeSearch = () => {
    setIsSearchVisible(false);
    setSearchTerm("");
    setResults([]);
    setIsLoading(false);
  };

  // Aqui sim podemos ocultar toda a UI quando não estiver logado (depois de todos os hooks terem sido chamados)
  if (!isLoggedIn) return null;

  const hasList = results.length > 0;
  const showList = isSearchVisible && (hasList || isLoading);

  return (
    <div
      className="relative flex items-center"
      ref={containerRef}
      onKeyDown={(e) => e.key === "Escape" && closeSearch()}
    >
      <button
        onClick={toggle}
        className="focus:outline-none mr-2"
        aria-label="Abrir busca de usuários"
        aria-expanded={isSearchVisible}
      >
        <FaSearch className="text-white w-5 h-5" />
      </button>

      <div
        className={`transition-all duration-300 overflow-hidden ${
          isSearchVisible ? "w-48" : "w-0"
        }`}
      >
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar usuários..."
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
          aria-label="Resultados da busca"
        >
          {isLoading && (
            <div className="px-4 py-2 text-sm text-gray-300">Carregando…</div>
          )}

          {!isLoading && hasList && (
            <ul className="max-h-72 overflow-y-auto py-1">
              {results.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/${locale}/profile/${m.id}`}
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
                      <span className="text-white text-sm truncate">
                        {m.name}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {!isLoading && !hasList && debounced.length >= MIN_CHARS && (
            <div className="px-4 py-2 text-sm text-gray-300">
              Nenhum usuário encontrado
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** hook de debounce simples para evitar excesso de requisições */
function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
