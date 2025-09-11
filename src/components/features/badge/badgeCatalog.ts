import type { BadgeCode, BadgeResponse } from "@/types/Badge";

/** Domínios onde suas imagens estão separadas no /public/badges */
type Domain = "filmes" | "series" | "musicas";

type CatalogEntry = {
  code: BadgeCode;
  name: string;          // Nome amigável (também ajuda no fallback por name)
  domain: Domain;        // pasta raiz em /public/badges
  folder: string;        // nome exato da pasta (com espaços/acentos) – igual ao que está no /public
};

export const BADGE_CATALOG: CatalogEntry[] = [
  // FILMES
  { code: "MOVIE_FIRST", name: "novato", domain: "filmes", folder: "1- novato" },
  { code: "MOVIE_10",    name: "maratonista da pipoca", domain: "filmes", folder: "2- maratonista da pipoca" },
  { code: "MOVIE_50",    name: "critico de ouro",       domain: "filmes", folder: "3 - critico de ouro" },
  { code: "MOVIE_100",   name: "cinefilo",              domain: "filmes", folder: "4 - cinefilo" },

  // SÉRIES
  { code: "SERIES_FIRST", name: "maratonista novato", domain: "series", folder: "1 - maratonista novato" },
  { code: "SERIES_10",    name: "virador de noite",   domain: "series", folder: "2 - virador de noite" },
  { code: "SERIES_30",    name: "seriemaniaco",       domain: "series", folder: "3 - seriemaniaco" },
  { code: "SERIES_50",    name: "lenda do sofa",      domain: "series", folder: "4 - lenda do sofa" },
];

/** retorna a entry do catálogo por code ou (fallback) pelo nome aproximado vindo do backend */
export function findCatalogEntry(badge: BadgeResponse): CatalogEntry | null {
  if ((badge as any).code) {
    const byCode = BADGE_CATALOG.find(b => b.code === (badge as any).code);
    if (byCode) return byCode;
  }
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const name = norm(badge.name || "");
  const byName = BADGE_CATALOG.find(b => name.includes(norm(b.name)));
  return byName ?? null;
}

/** monta caminho da imagem (bloqueado|desbloqueado). usa encodeURI pra espaços/acentos */
export function getBadgeImage(entry: CatalogEntry, unlocked: boolean) {
  const status = unlocked ? "desbloqueado" : "bloqueado";
  const path = `/badges/${entry.domain}/${entry.folder}/${status}.png`;
  return encodeURI(path);
}
