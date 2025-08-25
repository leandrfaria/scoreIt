import ClientProviders from "./ClientProviders";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  
  // Garantir que o locale é válido
  const validLocale = routing.locales.includes(locale as any) 
    ? locale as "pt" | "en" 
    : routing.defaultLocale;

  return (
    <ClientProviders locale={validLocale} messages={messages}>
      {children}
    </ClientProviders>
  );
}