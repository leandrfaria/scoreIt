"use client";

export default function ThemeHydration() {
  // nada a renderizar; só injeta script antes do paint
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
(function() {
  try {
    var saved = localStorage.getItem('theme') || 'system';
    var isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var finalTheme = (saved === 'system') ? (isDark ? 'dark' : 'light') : saved;
    document.documentElement.setAttribute('data-theme', finalTheme);
  } catch (e) {}
})();
`,
      }}
    />
  );
}
