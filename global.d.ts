// global.d.ts
import { routing } from './src/i18n/routing';
import en from './src/i18n/messages/en.json';

declare module 'next-intl' {
  interface AppConfig {
    Messages: typeof en;
    Locale: (typeof routing.locales)[number];
  }
}
