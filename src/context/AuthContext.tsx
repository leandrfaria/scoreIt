"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useMember } from "./MemberContext";
import { fetchCurrentMember } from "@/services/user/member";
import { verifyToken } from "@/services/user/auth";
import { getToken } from "@/lib/api";

interface AuthContextType {
  isLoggedIn: boolean | null;
  setIsLoggedIn: (loggedIn: boolean) => void;
  loadMemberData: () => Promise<void>;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: null,
  setIsLoggedIn: () => {},
  loadMemberData: async () => {},
  isLoading: true,
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setMember } = useMember();

  // ✅ controla requests em voo e “versões” de auth
  const abortRef = useRef<AbortController | null>(null);
  const authEpochRef = useRef(0); // incrementa no logout; respostas antigas são ignoradas

  // 🔒 helper: inicia um novo AbortController cancelando o anterior
  const resetAbortController = () => {
    try { abortRef.current?.abort(); } catch {}
    abortRef.current = new AbortController();
    return abortRef.current;
  };

  // 🔥 LOGOUT NUCLEAR (sem tocar no lib.ts)
  const logout = () => {
    // 1) invalida qualquer request pendente e “vira” a versão
    authEpochRef.current += 1;
    resetAbortController();

    // 2) limpa estado local
    setMember(null);
    setIsLoggedIn(false);

    // 3) limpa TUDO no client (localStorage, sessionStorage, cookies conhecidos)
    try {
      if (typeof window !== "undefined") {
        const ls = window.localStorage;
        const ss = window.sessionStorage;

        const explicit = [
          "authToken",
          "authToken_dev",
          "authToken_prod",
          "token",
          "access_token",
          "refresh_token",
          "jwt",
          "jwt_token",
          "id_token",
        ];
        for (const k of explicit) {
          try { ls.removeItem(k); } catch {}
          try { ss.removeItem(k); } catch {}
        }

        const patterns = [/auth/i, /token/i, /jwt/i];
        try {
          const keys: string[] = [];
          for (let i = 0; i < ls.length; i++) { const k = ls.key(i); if (k) keys.push(k); }
          for (const k of keys) if (patterns.some(p => p.test(k))) { try { ls.removeItem(k); } catch {} }
        } catch {}
        try {
          const keys: string[] = [];
          for (let i = 0; i < ss.length; i++) { const k = ss.key(i); if (k) keys.push(k); }
          for (const k of keys) if (patterns.some(p => p.test(k))) { try { ss.removeItem(k); } catch {} }
        } catch {}

        try {
          const cookieNames = [
            "authToken","authToken_dev","authToken_prod",
            "token","access_token","refresh_token","jwt","jwt_token","id_token"
          ];
          cookieNames.forEach(name => {
            try { document.cookie = `${name}=; Max-Age=0; path=/`; } catch {}
          });
        } catch {}
      }
    } catch {}
  };

  const loadMemberData = async () => {
    const epochAtStart = authEpochRef.current;
    const token = typeof window !== "undefined" ? getToken() : null;
    if (!token) {
      // se já não tem token, garante estado limpo
      if (authEpochRef.current === epochAtStart) {
        setMember(null);
        setIsLoggedIn(false);
      }
      return;
    }

    const ac = resetAbortController();

    try {
      const me = await fetchCurrentMember({ signal: ac.signal });
      // ignora se houve logout no meio do caminho
      if (authEpochRef.current !== epochAtStart) return;

      setMember(me);
      setIsLoggedIn(!!me);
    } catch (err: any) {
      if (err?.name === "AbortError") return; // ignorar abort
      // erro real → zera estado (mas respeita epoch)
      if (authEpochRef.current === epochAtStart) {
        setMember(null);
        setIsLoggedIn(false);
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      const epochAtStart = authEpochRef.current;
      const token = typeof window !== "undefined" ? getToken() : null;

      if (!token) {
        if (authEpochRef.current === epochAtStart) {
          setMember(null);
          setIsLoggedIn(false);
          setIsLoading(false);
        }
        return;
      }

      const ac = resetAbortController();

      try {
        await verifyToken(token);
        if (authEpochRef.current !== epochAtStart) return; // ignorar se houve logout
        await loadMemberData();
      } catch {
        // token inválido → limpa estado, respeitando epoch
        if (authEpochRef.current === epochAtStart) {
          setMember(null);
          setIsLoggedIn(false);
        }
      } finally {
        if (authEpochRef.current === epochAtStart) {
          setIsLoading(false);
        }
      }
    };

    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, loadMemberData, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
