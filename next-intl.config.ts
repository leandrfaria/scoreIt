import { getRequestConfig } from 'next-intl/server';
import { routing } from './src/i18n/routing';

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = locale && routing.locales.includes(locale as any)
    ? locale
    : routing.defaultLocale;

  return {
    locale: resolvedLocale,
    messages: (await import(`./src/i18n/messages/${resolvedLocale}.json`)).default
  };
});
