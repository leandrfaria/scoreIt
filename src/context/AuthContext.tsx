"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useMember } from "./MemberContext";
import { fetchMembers } from "@/services/user/member";
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
      setIsLoggedIn(false);
      return;
    }
    try {
      const data = await fetchMembers(true); // seu service já injeta Authorization
      setMember(data);
      setIsLoggedIn(true);
    } catch (err) {
      console.error("Erro ao carregar membro:", err);
      setIsLoggedIn(false);
      localStorage.removeItem("authToken");
    }
  };

  useEffect(() => {
    const init = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

      if (!token) {
        setIsLoggedIn(false);
        setIsLoading(false);
        return;
      }

      try {
        // valida token na API correta (usa apiBase dentro do verifyToken)
        await verifyToken(token);
        await loadMemberData();
      } catch (error) {
        console.warn("Token inválido/expirado. Limpando storage.");
        localStorage.removeItem("authToken");
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, loadMemberData, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
