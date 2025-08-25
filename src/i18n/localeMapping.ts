// src/utils/localeMapping.ts
export const mapNextIntlToTMDB = (nextIntlLocale: string): string => {
  const mapping: Record<string, string> = {
    'pt': 'pt-BR',
    'en': 'en-US',
    'es': 'es-ES', 
    'fr': 'fr-FR',
    'de': 'de-DE',
    'it': 'it-IT',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'zh': 'zh-CN',
    'ru': 'ru-RU'
  };
  
  return mapping[nextIntlLocale] || 'en-US'; // Fallback para inglês
};

export const isTMDBLocale = (locale: string): boolean => {
  return locale.includes('-');
};