// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['pt', 'en'],
  defaultLocale: 'pt',
  pathnames: {
    '/': { pt: '/', en: '/' },
    '/login': { pt: '/login', en: '/login' },
    '/cadastro': { pt: '/cadastro', en: '/register' },
  }
});

export type Locale = (typeof routing.locales)[number];

export function isValidLocale(locale: string): locale is Locale {
  return routing.locales.includes(locale as Locale);
}
