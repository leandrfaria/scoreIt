import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['pt', 'en'],
  defaultLocale: 'pt'
});

export const config = {
  matcher: ['/', '/(pt|en)/:path*']
};
