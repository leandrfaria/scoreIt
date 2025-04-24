"use client";

import { useAuthContext } from "@/context/AuthContext";
import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect } from "react";

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
  const { isLoggedIn } = useAuthContext();
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    if (isLoggedIn === false) {
      router.push(`/${locale}${redirectTo}`);
    }
  }, [isLoggedIn, locale, redirectTo]);

  if (isLoggedIn === null) {
    return fallback;
  }

  return <>{children}</>;
};
