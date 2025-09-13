// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  // Carregar mensagens com fallback seguro
  let messages;
  try {
    messages = (await import(`./messages/${locale}.json`)).default;
    console.log(`[i18n] Mensagens carregadas para: ${locale}`);
  } catch (error) {
    console.error(`[i18n] Erro ao carregar mensagens para ${locale}:`, error);
    // Fallback para o locale padrão em caso de erro
    messages = (await import(`./messages/${routing.defaultLocale}.json`)).default;
  }

  return {
    locale,
    messages
  };
});