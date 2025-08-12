"use client";

import { notFound } from "next/navigation";
import { isValidLocale, Locale } from "@/i18n/routing"; // 👈 importa Locale corretamente
import { NextIntlClientProvider } from "next-intl";
import { useEffect, useState } from "react";

type Messages = Record<string, string>;

export function IntlProvider({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const [messages, setMessages] = useState<Messages | null>(null);
  const [validLocale, setValidLocale] = useState<Locale | null>(null); // 👈 estado tipado corretamente

  useEffect(() => {
    if (!isValidLocale(locale)) {
      notFound();
      return;
    }

    setValidLocale(locale); // 👈 salva locale tipado

    import(`@/i18n/messages/${locale}.json`)
      .then((mod) => setMessages(mod.default))
      .catch((err) => {
        console.error("Erro ao carregar mensagens:", err);
        notFound();
      });
  }, [locale]);

  if (!messages || !validLocale) {
    return <p className="text-white p-4 text-center">Carregando...</p>;
  }

  return (
    <NextIntlClientProvider
      locale={validLocale}
      messages={messages}
      timeZone="America/Sao_Paulo"
      now={new Date()}
    >
      {children}
    </NextIntlClientProvider>
  );
}
