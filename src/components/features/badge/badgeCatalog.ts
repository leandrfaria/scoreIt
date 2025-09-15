import type { BadgeCode, BadgeResponse } from "@/types/Badge";

export type Domain = "filmes" | "series" | "musicas";
export type MediaKind = "MOVIE" | "SERIES" | "ALBUM";

export type CatalogEntry = {
  code: BadgeCode;
  name: string;          // rótulo amigável
  domain: Domain;        // pasta raiz em /public/badges
  folder: string;        // nome exato da pasta em /public
  kind: MediaKind;       // para mapear progresso
  goal: number;          // meta de avaliações p/ desbloquear
  blurb: string;         // descrição curta exibida no tooltip
};

export const BADGE_CATALOG: CatalogEntry[] = [
  // FILMES
  { code: "MOVIE_FIRST", name: "novato",                 domain: "filmes",  folder: "1- novato",                 kind: "MOVIE", goal: 1,   blurb: "Avalie seu primeiro filme." },
  { code: "MOVIE_10",    name: "maratonista da pipoca",  domain: "filmes",  folder: "2- maratonista da pipoca", kind: "MOVIE", goal: 10,  blurb: "Avalie 10 filmes no ScoreIt." },
  { code: "MOVIE_50",    name: "critico de ouro",        domain: "filmes",  folder: "3 - critico de ouro",       kind: "MOVIE", goal: 50,  blurb: "Avalie 50 filmes e mostre repertório." },
  { code: "MOVIE_100",   name: "cinefilo",               domain: "filmes",  folder: "4 - cinefilo",              kind: "MOVIE", goal: 100, blurb: "100 filmes avaliados. Respeita a lenda." },

  // SÉRIES
  { code: "SERIES_FIRST", name: "maratonista novato",    domain: "series",  folder: "1 - maratonista novato",    kind: "SERIES", goal: 1,   blurb: "Avalie sua primeira série." },
  { code: "SERIES_10",    name: "virador de noite",      domain: "series",  folder: "2 - virador de noite",      kind: "SERIES", goal: 10,  blurb: "Avalie 10 séries (vale café)." },
  { code: "SERIES_30",    name: "seriemaniaco",          domain: "series",  folder: "3 - seriemaniaco",          kind: "SERIES", goal: 30,  blurb: "30 séries avaliadas. Você vive de cliffhanger." },
  { code: "SERIES_50",    name: "lenda do sofa",         domain: "series",  folder: "4 - lenda do sofa",         kind: "SERIES", goal: 50,  blurb: "50 séries avaliadas. O sofá é seu trono." },

  // MÚSICAS (ÁLBUNS)
  { code: "ALBUM_FIRST",  name: "ouvinte novato",        domain: "musicas", folder: "1 - ouvinte novato",        kind: "ALBUM", goal: 1,   blurb: "Avalie seu primeiro álbum." },
  { code: "ALBUM_10",     name: "colecionador de discos",domain: "musicas", folder: "2 - colecionador de discos",kind: "ALBUM", goal: 10,  blurb: "Avalie 10 álbuns (de preferência sem pular faixa)." },
  { code: "ALBUM_50",     name: "amante de musica",      domain: "musicas", folder: "3 - amante de musica",      kind: "ALBUM", goal: 50,  blurb: "50 álbuns avaliados. Você respira BPM." },
  { code: "ALBUM_100",    name: "lenda do vinil",        domain: "musicas", folder: "4 - lenda do vinil",        kind: "ALBUM", goal: 100, blurb: "100 álbuns. Sua prateleira range." },
];

export function findCatalogEntry(badge: BadgeResponse): CatalogEntry | null {
  if (badge.code) {
    const byCode = BADGE_CATALOG.find(b => b.code === badge.code);
    if (byCode) return byCode;
  }
  const norm = (s: string) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const name = norm(badge.name || "");
  const byName = BADGE_CATALOG.find(b => name.includes(norm(b.name)));
  return byName ?? null;
}

export function getBadgeImage(entry: CatalogEntry, unlocked: boolean) {
  const status = unlocked ? "desbloqueado" : "bloqueado";
  const path = `/badges/${entry.domain}/${entry.folder}/${status}.png`;
  return path;
}
