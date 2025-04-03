"use client";

import { useAuth } from "@/hooks/useAuth";
import { ReactNode } from "react";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  useAuth(); // chama a verificação

  return <>{children}</>;
};
