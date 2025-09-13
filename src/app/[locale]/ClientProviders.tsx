// ClientProviders.tsx
"use client";

import { MemberProvider } from "@/context/MemberContext";
import { AuthProvider } from "@/context/AuthContext";
import { TabProvider } from "@/context/TabContext";
import { NextIntlClientProvider } from "next-intl";
import { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";
import { type Locale } from "@/i18n/routing";

// Carregar o Header normalmente sem SSR false
import { Header } from "@/components/layout/Header/Header";

export default function ClientProviders({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: any;
  children: React.ReactNode;
}) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone="America/Sao_Paulo"
    >
      <MemberProvider>
        <AuthProvider>
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
        </AuthProvider>
      </MemberProvider>
    </NextIntlClientProvider>
  );
}