"use client";

import { MemberProvider } from "@/context/MemberContext";
import { AuthProvider } from "@/context/AuthContext";
import { TabProvider } from "@/context/TabContext";
import { NextIntlClientProvider } from "next-intl";
import { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";

// Header export nomeado
const Header = dynamic(
  () => import("@/components/layout/Header/Header").then((m) => m.Header),
  { ssr: false }
);

type Messages = Record<string, unknown>;

export default function ClientProviders({
  locale,
  messages,
  children,
}: {
  locale: "pt" | "en";
  messages: Messages;
  children: React.ReactNode;
}) {
  return (
    <MemberProvider>
      <AuthProvider>
        <NextIntlClientProvider
          locale={locale}
          messages={messages}
          timeZone="America/Sao_Paulo"
          now={new Date()}
        >
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
        </NextIntlClientProvider>
      </AuthProvider>
    </MemberProvider>
  );
}
