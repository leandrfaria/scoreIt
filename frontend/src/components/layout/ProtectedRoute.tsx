"use client";

import { useAuthContext } from "@/context/AuthContext";
import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  fallback?: ReactNode;
}

export const ProtectedRoute = ({
  children,
  redirectTo = "/login",
  fallback = <p className="text-white text-center mt-10">Carregando...</p>,
}: ProtectedRouteProps) => {
  const { isLoggedIn, isLoading } = useAuthContext();
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    if (!isLoading && isLoggedIn === false) {
      router.push(`/${locale}${redirectTo}`);
    }
  }, [isLoggedIn, isLoading, locale, redirectTo]);

  if (isLoading || isLoggedIn === null) {
    return fallback;
  }

  return <>{children}</>;
};
