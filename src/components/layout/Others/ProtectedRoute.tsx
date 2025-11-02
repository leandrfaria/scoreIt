"use client";

import { useAuthContext } from "@/context/AuthContext";
import { ReactNode, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;            
  fallback?: ReactNode;           
  requiredRole?: string | null;   
  onNoRole?: ReactNode | null;    
  redirectDebounceMs?: number;
}

export const ProtectedRoute = ({
  children,
  redirectTo = "/auth",
  fallback,
  requiredRole = null,
  onNoRole = null,
  redirectDebounceMs = 300,
}: ProtectedRouteProps) => {
  const { isLoggedIn, isLoading, hasRole } = useAuthContext();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("ProtectedRoute");

  const mountedRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  // estado interno para esperar estabilização antes de mostrar onNoRole
  const [stabilized, setStabilized] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isLoading) {
      setStabilized(false);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      return;
    }

    // debounce antes de redirecionar
    if (isLoggedIn === false) {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        if (!mountedRef.current) return;
        if (isLoggedIn === false && !isLoading) {
          router.push(`/${locale}${redirectTo}`);
        }
      }, redirectDebounceMs);
      return;
    }

    // usuário está logado; estabiliza a verificação de role
    setStabilized(true);
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isLoggedIn, redirectTo, redirectDebounceMs]);

  // enquanto carregando ou antes de estabilizar, renderiza fallback
  if (!fallback) fallback = <p className="text-white text-center mt-10">{t("loading")}</p>;
  if (isLoading || isLoggedIn === null || (requiredRole && !stabilized)) return fallback;

  // se está logado e tem requiredRole -> valide
  if (requiredRole && !hasRole(requiredRole)) {
    return onNoRole ?? (
      <div className="py-12">
        <div className="max-w-md mx-auto bg-zinc-900/60 border border-rose-600 rounded-lg p-8 shadow">
          <h2 className="text-2xl font-semibold text-rose-300">{t("accessDenied.title")}</h2>
          <p className="mt-2 text-sm text-rose-200/80">{t("accessDenied.description")}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
