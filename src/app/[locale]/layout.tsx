import ClientProviders from "./ClientProviders";
import { getMessages } from "next-intl/server";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: "pt" | "en" }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <ClientProviders locale={locale} messages={messages}>
      {children}
    </ClientProviders>
  );
}
