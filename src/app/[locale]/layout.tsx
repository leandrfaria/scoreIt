// app/[locale]/layout.tsx
import ClientProviders from "./ClientProviders";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { notFound } from "next/navigation";
import "@/app/globals.css";
import { ThemeProvider } from "@/context/ThemeContext";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    return notFound();
  }

  const validLocale = locale as Locale;
  setRequestLocale(validLocale);
  const messages = await getMessages();

  return (
    <ThemeProvider>
      <ClientProviders locale={validLocale} messages={messages}>
        {children}
      </ClientProviders>
    </ThemeProvider>
  );
}

function unstable_setRequestLocale(validLocale: string) {
  throw new Error("Function not implemented.");
}
