import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';
 
export default getRequestConfig(async ({ locale: requestedLocale }) => {
  const locale = routing.locales.includes(requestedLocale as any)
    ? requestedLocale
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
