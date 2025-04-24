// src/i18n/LocaleProvider.tsx
"use client";

import { useEffect, useState } from "react";
import { NextIntlClientProvider } from "next-intl";
import { Toaster } from "react-hot-toast";
import { Header } from "@/components/header";
import { routing } from "./routing";

type Locale = (typeof routing)['locales'][number];

interface Props {
  locale: Locale;
  children: React.ReactNode;
}

export function LocaleProvider({ locale, children }: Props) {
  const [messages, setMessages] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    import(`@/i18n/messages/${locale}.json`)
      .then((mod) => setMessages(mod.default))
      .catch((error) => {
        console.error(`Erro ao carregar mensagens para locale ${locale}`, error);
      });
  }, [locale]);

  if (!messages) return null;

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone="America/Sao_Paulo"
      now={new Date()}
    >
      <Header />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#333",
            color: "#fff",
          },
        }}
      />
      {children}
    </NextIntlClientProvider>
  );
}
