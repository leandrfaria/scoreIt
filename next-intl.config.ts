// next-intl.config.ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from './src/i18n/routing';

// Define o tipo com base nos locales suportados
type Locale = (typeof routing.locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale; // Await da Promise
  const locale = routing.locales.includes(requested as Locale) 
    ? requested 
    : routing.defaultLocale;

  return {
    locale: locale as Locale,
    messages: (await import(`./src/i18n/messages/${locale}.json`)).default
  };
});