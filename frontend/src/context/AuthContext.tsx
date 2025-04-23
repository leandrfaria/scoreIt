"use client";

import { fetchMembers } from "@/services/service_member";
import { createContext, useContext, useEffect, useState } from "react";
import { useMember } from "./MemberContext";

interface AuthContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
  loadMemberData: () => Promise<void>; // Adicione esta função para carregar dados de membro
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  setIsLoggedIn: () => {},
  loadMemberData: async () => {}, // Inicialize com uma função vazia
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { setMember } = useMember();

  const loadMemberData = async () => {
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        const data = await fetchMembers(true); // Aguarde a resposta da API
        setMember(data);
        setIsLoggedIn(true);
      } catch (err) {
        console.error("Erro ao carregar membro:", err);
      }
    }
  };

  useEffect(() => {
    loadMemberData(); // Carregue os dados do membro ao montar o componente
  }, [setMember]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, loadMemberData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);