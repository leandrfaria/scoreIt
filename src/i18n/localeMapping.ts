// src/utils/localeMapping.ts
export const mapNextIntlToTMDB = (nextIntlLocale: string): string => {
  const mapping: Record<string, string> = {
    'pt': 'pt-BR',
    'en': 'en-US'
  };
  
  return mapping[nextIntlLocale] || 'en-US'; // Fallback para inglês
};

export const isTMDBLocale = (locale: string): boolean => {
  return locale.includes('-');
};