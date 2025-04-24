"use client";

import { fetchMembers } from "@/services/service_member";
import { createContext, useContext, useEffect, useState } from "react";
import { useMember } from "./MemberContext";

interface AuthContextType {
  isLoggedIn: boolean | null;
  setIsLoggedIn: (loggedIn: boolean) => void;
  loadMemberData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: null,
  setIsLoggedIn: () => {},
  loadMemberData: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const { setMember } = useMember();

  const loadMemberData = async () => {
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        const data = await fetchMembers(true);
        setMember(data);
        setIsLoggedIn(true);
      } catch (err) {
        console.error("Erro ao carregar membro:", err);
        setIsLoggedIn(false);
        localStorage.removeItem("authToken");
      }
    }
  };

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setIsLoggedIn(false);
        return;
      }

      try {
        const res = await fetch("http://localhost:8080/auth/verifyToken", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          await loadMemberData();
        } else {
          localStorage.removeItem("authToken");
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error("Erro ao validar token:", error);
        localStorage.removeItem("authToken");
        setIsLoggedIn(false);
      }
    };

    validateToken();
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, loadMemberData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
