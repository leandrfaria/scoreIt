"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useMember } from "./MemberContext";
import { fetchCurrentMember } from "@/services/user/member";
import { verifyToken } from "@/services/user/auth";

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
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    if (!token) {
      setMember(null);
      setIsLoggedIn(false);
      return;
    }

    try {
      // busca **um** membro garantido
      const me = await fetchCurrentMember();
      setMember(me);
      setIsLoggedIn(!!me);
    } catch (err) {
      console.error("Erro ao carregar membro:", err);
      setMember(null);
      setIsLoggedIn(false);
      localStorage.removeItem("authToken");
    }
  };

  useEffect(() => {
    const init = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

      if (!token) {
        setMember(null);
        setIsLoggedIn(false);
        setIsLoading(false);
        return;
      }

      try {
        await verifyToken(token);  // normaliza Bearer internamente
        await loadMemberData();    // popula contexto
      } catch (error) {
        console.warn("Token inválido/expirado. Limpando storage.");
        localStorage.removeItem("authToken");
        setMember(null);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, loadMemberData, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
