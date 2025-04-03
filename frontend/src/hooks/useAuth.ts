"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuth(redirectTo = "/login") {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      router.push(redirectTo);
    }
  }, [router]);
}
