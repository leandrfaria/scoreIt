"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";


export function useAuth(redirectTo = "/login") {
  const router = useRouter();
  const locale = useLocale(); // Obtém o idioma atual (en, pt, etc.)


  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      router.push(`/${locale}${redirectTo}`);
    }
  }, [router]);
}
