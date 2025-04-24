// src/i18n/requests.ts
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl'; // ✅ correto agora
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;

  // ✅ Garantindo que o tipo seja "pt" | "en"
  const locale = hasLocale(routing.locales, requested)
    ? (requested as 'pt' | 'en')
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
