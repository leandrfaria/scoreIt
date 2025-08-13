import ClientProviders from "./ClientProviders";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <ClientProviders locale={locale}>
      {children}
    </ClientProviders>
  );
}
