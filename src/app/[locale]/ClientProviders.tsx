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

// Adicione esta função de validação
const isValidLocale = (locale: string): locale is "pt" | "en" => {
  return locale === "pt" || locale === "en";
};

export default function ClientProviders({
  locale,
  messages,
  children,
}: {
  locale: string;
  messages: any;
  children: React.ReactNode;
}) {
  // Valide o locale antes de passar para o NextIntlClientProvider
  const validLocale = isValidLocale(locale) ? locale : "pt";

  return (
    <MemberProvider>
      <AuthProvider>
        <NextIntlClientProvider
          locale={validLocale} // Use o locale validado aqui
          messages={messages}
          timeZone="America/Sao_Paulo"
          now={new Date()}
        >
          <TabProvider>
            <Header locale={validLocale} /> {/* Use o mesmo locale validado aqui */}
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