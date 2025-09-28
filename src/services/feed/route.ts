// src/services/feed/route.ts
import { getToken, apiFetch } from "@/lib/api";
import { mapNextIntlToTMDB, isTMDBLocale } from "@/i18n/localeMapping";

function safeDecodeJwt(t: string | null) {
  if (!t) return null;
  try {
    const raw = t.startsWith("Bearer ") ? t.slice(7) : t;
    const p = raw.split(".")[1];
    return JSON.parse(
      decodeURIComponent(
        atob(p.replace(/-/g, "+").replace(/_/g, "/"))
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      )
    );
  } catch {
    return null;
  }
}

function normalizeLocaleForBackend(locale?: string) {
  if (!locale) return "pt-BR";
  // se já está no formato TMDB (ex: en-US / pt-BR), mantém
  if (isTMDBLocale(locale)) return locale;
  // se veio só "en" ou "pt", mapeia para en-US / pt-BR
  return mapNextIntlToTMDB(locale);
}

/**
 * Busca o feed para `memberId` pedindo explicitamente o idioma.
 * Agora aceita `locale` (ex: "pt-BR", "en-US") e `signal` para abort.
 */
export async function fetchFeedClient(memberId: string, locale?: string, signal?: AbortSignal) {
  const token = getToken();
  console.log("[debug] getToken()", token);
  console.log("[debug] decoded", safeDecodeJwt(token));

  try {
    const normalized = normalizeLocaleForBackend(locale);
    const qs = `?language=${encodeURIComponent(normalized)}`;
    // supondo que apiFetch aceita um objeto de options que pode incluir `signal`
    const data = await apiFetch(`/feed/${memberId}${qs}`, { auth: true, signal });
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    console.error("[fetchFeedClient] apiFetch error:", err);
    throw err;
  }
}
