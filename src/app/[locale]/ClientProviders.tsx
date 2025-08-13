"use client";

import { MemberProvider } from "@/context/MemberContext";
import { AuthProvider } from "@/context/AuthContext";
import { TabProvider } from "@/context/TabContext";
import { IntlProvider } from "./intl-provider";
import { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";

const Header = dynamic(
  () => import("@/components/layout/Header/Header").then((mod) => mod.Header),
  { ssr: false }
);

export default function ClientProviders({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  return (
    <MemberProvider>
      <AuthProvider>
        <IntlProvider locale={locale}>
          <TabProvider>
            <Header locale={locale} />
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: { background: "#333", color: "#fff" },
              }}
            />
            {children}
          </TabProvider>
        </IntlProvider>
      </AuthProvider>
    </MemberProvider>
  );
}
