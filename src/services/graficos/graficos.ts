import { apiFetch } from "@/lib/api";

const titleCache = new Map<string, string | null>();

export function mapLocaleToTMDBLanguage(locale: any): string {
  if (!locale) return "pt-BR";
  let l = locale;
  if (typeof locale === "object") {
    if (locale.locale) l = locale.locale;
    else if (locale.language) l = locale.language;
    else l = String(locale);
  }
  const s = String(l).toLowerCase();
  if (s.startsWith("pt")) return "pt-BR";
  if (s.startsWith("en")) return "en-US";
  return "pt-BR";
}

export function normalizeLocaleForTMDB(localeInput: any) {
  return mapLocaleToTMDBLanguage(localeInput);
}

export async function resolveMediaTitle(item: { mediaId?: string; mediaType?: string }, localeInput?: any): Promise<string> {
  const id = item?.mediaId;
  const rawType = (item?.mediaType || "").toUpperCase();
  if (!id) return `${rawType}:unknown`;

  const mk = (type: string, idv: string, lang: string) => `${type}:${idv}:${lang}`;

  // --- MOVIE / SERIES / TV: use language param mapped from locale ---
  if (rawType === "MOVIE" || rawType === "SERIES" || rawType === "TV") {
    const language = normalizeLocaleForTMDB(localeInput); // pt-BR | en-US | ...
    const cacheKey = mk(rawType, String(id), language);

    if (titleCache.has(cacheKey)) return titleCache.get(cacheKey) ?? `${rawType}:${id}`;

    const baseEndpoint = rawType === "MOVIE" ? "/movie" : "/series";
    const path = `${baseEndpoint}/${encodeURIComponent(id)}/details?language=${encodeURIComponent(language)}`;

    try {
      const data: any = await apiFetch(path, { auth: true, headers: { "Accept-Language": language } });
      if (data) {
        const title =
          String(data.title ?? data.name ?? data.original_title ?? data.original_name ?? extractAnyName(data) ?? "").trim() || null;
        const chosen = title || `${rawType}:${id}`;
        titleCache.set(cacheKey, chosen);
        return chosen;
      }
    } catch (err) {
      console.warn(`[resolveMediaTitle][${rawType}] fetch failed`, { path, err });
    }

    // fallback: try without language param
    try {
      const base = `${baseEndpoint}/${encodeURIComponent(id)}/details`;
      const data: any = await apiFetch(base, { auth: true });
      if (data) {
        const title =
          String(data.title ?? data.name ?? data.original_title ?? data.original_name ?? extractAnyName(data) ?? "").trim() || null;
        const chosen = title || `${rawType}:${id}`;
        titleCache.set(cacheKey, chosen);
        return chosen;
      }
    } catch (e) {
      /* ignore */
    }

    const fallback = `${rawType}:${id}`;
    titleCache.set(cacheKey, fallback);
    return fallback;
  }

  // --- ALBUM: NO internationalization. Always fetch album endpoint WITHOUT language/market headers/params ---
  if (rawType === "ALBUM") {
    const cacheKey = `${rawType}:${String(id)}`; // no locale in cache key
    if (titleCache.has(cacheKey)) return titleCache.get(cacheKey) ?? `${rawType}:${id}`;

    const path = `/spotify/api/album/${encodeURIComponent(id)}`;
    try {
      const data: any = await apiFetch(path, { auth: true });
      if (data) {
        const title = String(data.title ?? data.name ?? data.albumName ?? extractAnyName(data) ?? "").trim() || null;
        const chosen = title || `${rawType}:${id}`;
        titleCache.set(cacheKey, chosen);
        return chosen;
      }
    } catch (err) {
      console.warn(`[resolveMediaTitle][ALBUM] fetch failed`, { path, err });
    }

    const fallback = `${rawType}:${id}`;
    titleCache.set(cacheKey, fallback);
    return fallback;
  }

  // --- Other types (keep a robust attempt but unlikely used) ---
  const requestedLocale = normalizeLocaleForTMDB(localeInput) || "en-US";
  const englishLocale = "en-US";

  const cacheKeyRequested = mk(rawType, String(id), requestedLocale);
  const cacheKeyEn = mk(rawType, String(id), englishLocale);

  if (titleCache.has(cacheKeyRequested)) return titleCache.get(cacheKeyRequested) ?? `${rawType}:${id}`;

  // no other endpoints configured by default
  return `${rawType}:${id}`;
}

/* ---------- helpers ---------- */

function getEnglishTitle(d: any): string | null {
  if (!d) return null;
  if (typeof d === "string") return d;

  const englishKeys = ["title_en", "name_en", "english_title", "englishName", "en_title", "en_name"];
  for (const k of englishKeys) if (d[k]) return String(d[k]);

  if (d.title && typeof d.title === "string") return String(d.title);
  if (d.name && typeof d.name === "string") return String(d.name);

  return null;
}

function parseTranslationsForEnglish(data: any): string | null {
  if (!data) return null;

  const candidates = [
    data.translations?.results,
    data.translations?.translations,
    data.translations,
    data.translations?.translations?.results,
  ];

  for (const cand of candidates) {
    if (!cand) continue;
    const arr = Array.isArray(cand) ? cand : typeof cand === "object" ? Object.values(cand) : null;
    if (!arr) continue;
    for (const entry of arr as any[]) {
      const iso = (entry?.iso_639_1 || entry?.language || entry?.locale || "").toString().toLowerCase();
      if (iso === "en" || iso.startsWith("en")) {
        const possible = entry?.data ?? entry;
        if (possible?.title) return String(possible.title);
        if (possible?.name) return String(possible.name);
      }
    }
  }

  if (data?.translations?.en) {
    const en = data.translations.en;
    if (typeof en === "string") return en;
    if (en?.title) return en.title;
    if (en?.name) return en.name;
  }

  return null;
}

function extractAnyName(d: any): string | null {
  if (d == null) return null;
  if (typeof d === "string") return d || null;
  const keys = ["title", "name", "original_title", "originalName", "original_name", "mediaTitle", "albumName", "album_title"];
  for (const k of keys) if (d[k]) return d[k];

  if (d.data && typeof d.data === "object") {
    for (const k of keys) if (d.data[k]) return d.data[k];
    if (Array.isArray(d.data) && d.data[0]) for (const k of keys) if (d.data[0][k]) return d.data[0][k];
  }

  if (Array.isArray(d) && d[0]) for (const k of keys) if (d[0][k]) return d[0][k];

  try {
    for (const v of Object.values(d)) {
      if (typeof v === "string" && v.length > 0 && v.length < 200) return v as string;
    }
  } catch (e) {
    /* ignore */
  }

  return null;
}
