export const routing = {
  locales: ['en', 'pt'] as const,
  defaultLocale: 'pt',
  pathnames: {
    '/': {
      en: '/',
      pt: '/',
    },
    '/login': {
      en: '/login',
      pt: '/login',
    },
    '/cadastro': {
      en: '/cadastro',
      pt: '/cadastro',
    },
    '/envia_email': {
      en: '/envia_email',
      pt: '/envia_email',
    },
    '/nova_senha': {
      en: '/nova_senha',
      pt: '/nova_senha',
    },
    '/profile': {
      en: '/profile',
      pt: '/profile',
    },
    '/novo_email': {
      en: '/novo_email',
      pt: '/novo_email',
    },
    "/envia_novoEmail": {
      en: '/envia_novoEmail',
      pt: '/envia_novoEmail',
    }
    // adicione mais rotas aqui conforme precisar
  }
};

export type Locale = (typeof routing.locales)[number];

export function isValidLocale(locale: string): locale is Locale {
  return routing.locales.includes(locale as Locale);
}
