import Link from "next/link";
import { useLocale, useTranslations } from "next-intl"; // 🌍

export function Footer() {
  const locale = useLocale(); // 🌍
  const t = useTranslations("footer"); // 🌍

  return (
    <footer className="w-full text-white py-6">
      <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row justify-between items-center px-6">
        {/* Logo e Direitos Autorais */}
        <div className="text-sm text-gray-400">
          © {new Date().getFullYear()} ScoreIt. {t("direitos")}
        </div>

        {/* Links úteis */}
        <nav className="flex gap-4 mt-4 md:mt-0">
          <Link href={`/${locale}/sobre`} className="text-gray-300 hover:text-white">
            {t("sobre")}
          </Link>
          <Link href={`/${locale}/contato`} className="text-gray-300 hover:text-white">
            {t("contato")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
