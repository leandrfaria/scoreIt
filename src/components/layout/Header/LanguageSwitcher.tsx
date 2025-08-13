"use client";

import {useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {useRouter, usePathname} from "@/i18n/navigation";
import {DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem} from "@/utils/shadcn";

function swapLocaleInPath(pathname: string, next: "pt" | "en") {
  const parts = pathname.split("/");
  if (parts.length > 1 && (parts[1] === "pt" || parts[1] === "en")) {
    parts[1] = next;
    return parts.join("/");
  }
  return `/${next}${pathname === "/" ? "" : pathname}`;
}

export default function LanguageSwitcher() {
  const locale = useLocale(); // "pt" | "en"
  const t = useTranslations("header");
  const router = useRouter();
  const pathname = usePathname();
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  const changeLanguage = async (newLocale: "pt" | "en") => {
    if (newLocale === locale || isChangingLanguage) return;
    setIsChangingLanguage(true);
    try {
      const qs = typeof window !== "undefined" ? window.location.search : "";
      const target = swapLocaleInPath(pathname, newLocale) + qs;
      router.replace(target);
    } finally {
      setIsChangingLanguage(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="focus:outline-none text-white bg-gray-800 px-3 py-1 rounded-md hover:bg-gray-700 transition-all flex items-center gap-2 min-w-[50px] justify-center"
        disabled={isChangingLanguage}
        aria-label={t("changeLanguage") ?? "Change language"}
      >
        {isChangingLanguage ? (
          <span aria-hidden className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          locale.toUpperCase()
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={5} className="w-20 bg-black shadow-lg rounded-md p-1 border border-gray-700">
        <DropdownMenuItem onClick={() => changeLanguage("pt")} className="block px-2 py-1 hover:bg-gray-900 rounded text-center cursor-pointer text-white">
          PT
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage("en")} className="block px-2 py-1 hover:bg-gray-900 rounded text-center cursor-pointer text-white">
          EN
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
