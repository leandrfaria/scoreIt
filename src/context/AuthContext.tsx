"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useMember } from "./MemberContext";
import { fetchCurrentMember } from "@/services/user/member";
import { verifyToken } from "@/services/user/auth";
import { getToken } from "@/lib/api";
import { jwtDecode } from "jwt-decode";
import { Member } from "@/types/Member";

interface AuthContextType {
  isLoggedIn: boolean | null;
  setIsLoggedIn: (loggedIn: boolean) => void;
  loadMemberData: () => Promise<void>;
  isLoading: boolean;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: null,
  setIsLoggedIn: () => {},
  loadMemberData: async () => {},
  isLoading: true,
  logout: () => {},
  hasRole: () => false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // usando member/setMember do MemberContext (mantive sua arquitetura)
  const { setMember, member } = useMember();

  // controla requests em voo e versões/auth epochs
  const abortRef = useRef<AbortController | null>(null);
  const authEpochRef = useRef(0);

  const resetAbortController = () => {
    try { abortRef.current?.abort(); } catch {}
    abortRef.current = new AbortController();
    return abortRef.current;
  };

  // helper: extrai member mínimo do JWT — NÃO substitui dados do servidor (apenas préenche)
  const extractMemberFromToken = (token: string): Member | null => {
    try {
      const decoded: any = jwtDecode(token);
      let role = decoded.role ?? null;
      if (!role && Array.isArray(decoded.roles) && decoded.roles.length) role = decoded.roles[0];
      if (!role && Array.isArray(decoded.authorities) && decoded.authorities.length) {
        const auth = decoded.authorities[0];
        role = typeof auth === "string" ? auth : auth?.authority ?? null;
      }
      if (role && !String(role).startsWith("ROLE_")) role = `ROLE_${String(role).toUpperCase()}`;
      const mem: Member = {
        id: decoded.id ?? NaN,
        name: decoded.name ?? "",
        birthDate: decoded.birthDate ?? "",
        email: decoded.sub ?? decoded.email ?? "",
        handle: decoded.handle ?? "",
        gender: decoded.gender ?? "",
        bio: decoded.bio ?? "",
        profileImageUrl: decoded.profileImageUrl ?? "",
        role: role ?? undefined,
        enabled: typeof decoded.enabled === "boolean" ? decoded.enabled : true,
      };
      return mem;
    } catch (err) {
      console.warn("extractMemberFromToken: falha ao decodificar JWT", err);
      return null;
    }
  };

  const logout = () => {
    authEpochRef.current += 1;
    resetAbortController();
    setMember(null);
    setIsLoggedIn(false);
    // limpeza de storages/cookies (mantive sua lógica)
    try {
      if (typeof window !== "undefined") {
        const ls = window.localStorage;
        const ss = window.sessionStorage;
        const explicit = [
          "authToken","authToken_dev","authToken_prod",
          "token","access_token","refresh_token","jwt","jwt_token","id_token"
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
          const cookieNames = ["authToken","authToken_dev","authToken_prod","token","access_token","refresh_token","jwt","jwt_token","id_token"];
          cookieNames.forEach(name => { try { document.cookie = `${name}=; Max-Age=0; path=/`; } catch {} });
        } catch {}
      }
    } catch {}
  };

  const loadMemberData = async () => {
    const epochAtStart = authEpochRef.current;
    const token = typeof window !== "undefined" ? getToken() : null;
    if (!token) {
      if (authEpochRef.current === epochAtStart) {
        setMember(null);
        setIsLoggedIn(false);
      }
      return;
    }

    const ac = resetAbortController();

    try {
      const me = await fetchCurrentMember({ signal: ac.signal });
      if (authEpochRef.current !== epochAtStart) return;
      setMember(me);
      setIsLoggedIn(!!me);
    } catch (err: any) {
      if (err?.name === "AbortError") return;
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

      // PRE-FILL member com dados do JWT para ter role disponível imediatamente
      try {
        const pre = extractMemberFromToken(token);
        if (pre) {
          // só preenche se ainda não tiver member (evita sobrescrever dados mais completos)
          if (!member) {
            setMember(pre);
            // consideramos isLoggedIn provisoriamente true — será ajustado após fetch/verify
            setIsLoggedIn(true);
          }
        }
      } catch (err) {
      }

      const ac = resetAbortController();

      try {
        await verifyToken(token);
        if (authEpochRef.current !== epochAtStart) return;
        await loadMemberData();
      } catch (err) {
        if (authEpochRef.current === epochAtStart) {
          // só limpa se verificação explicitamente falhar
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

  // hasRole tolerante: checa várias formas possíveis do role no `member`
  const hasRole = (roleName: string) => {
    if (!member) return false;
    const wanted = roleName.startsWith("ROLE_") ? roleName : `ROLE_${roleName}`;

    // 1) member.role como string
    if (typeof member.role === "string") {
      if (member.role === wanted) return true;
      if (member.role.toUpperCase() === wanted.toUpperCase()) return true;
      // casos em que role vem sem prefixo ROLE_
      if (`ROLE_${member.role.toUpperCase()}` === wanted) return true;
    }

    // 2) member pode ter 'roles' array
    const anyAsAny: any = member as any;
    if (Array.isArray(anyAsAny.roles)) {
      if (anyAsAny.roles.includes(wanted) || anyAsAny.roles.includes(wanted.replace("ROLE_", ""))) return true;
      if (anyAsAny.roles.map((r: any) => String(r).toUpperCase()).includes(wanted.toUpperCase())) return true;
    }

    // 3) authorities array (pode ser objetos {authority: "ROLE_ADMIN"})
    if (Array.isArray(anyAsAny.authorities)) {
      for (const a of anyAsAny.authorities) {
        if (!a) continue;
        const val = typeof a === "string" ? a : a.authority ?? a?.role ?? null;
        if (!val) continue;
        if (String(val).toUpperCase() === wanted.toUpperCase()) return true;
        if (String(val).toUpperCase() === wanted.replace("ROLE_", "").toUpperCase()) return true;
      }
    }

    return false;
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, loadMemberData, isLoading, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
