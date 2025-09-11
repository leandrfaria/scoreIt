"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useMember } from "./MemberContext";
import { fetchCurrentMember } from "@/services/user/member";
import { verifyToken } from "@/services/user/auth";
import { AUTH_TOKEN_KEY } from "@/lib/api";

interface AuthContextType {
  isLoggedIn: boolean | null;
  setIsLoggedIn: (loggedIn: boolean) => void;
  loadMemberData: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: null,
  setIsLoggedIn: () => {},
  loadMemberData: async () => {},
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setMember } = useMember();

  const loadMemberData = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
    if (!token) {
      setMember(null);
      setIsLoggedIn(false);
      return;
    }

    try {
      const me = await fetchCurrentMember();
      setMember(me);
      setIsLoggedIn(!!me);
    } catch (err) {
      console.error("Erro ao carregar membro:", err);
      setMember(null);
      setIsLoggedIn(false);
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  };

  useEffect(() => {
    const init = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;

      if (!token) {
        setMember(null);
        setIsLoggedIn(false);
        setIsLoading(false);
        return;
      }

      try {
        await verifyToken(token);  // valida token atual
        await loadMemberData();    // popula contexto
      } catch {
        console.warn("Token inválido/expirado. Limpando storage.");
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setMember(null);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, loadMemberData, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
