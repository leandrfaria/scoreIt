// src/services/album/top_albums.ts
import { apiFetch } from "@/lib/api";
import type { Album } from "@/types/Album";

type Json = Record<string, any>;

function mapAlbum(obj: Json): Album | null {
  if (!obj || typeof obj !== "object") return null;

  const images = Array.isArray(obj.images) ? obj.images : [];
  const imageUrl =
    images?.[0]?.url || images?.[1]?.url || images?.[2]?.url || "/fallback.jpg";

  const artists = Array.isArray(obj.artists) ? obj.artists : [];
  const artist = artists?.[0]?.name || "Desconhecido";

  const id = String(obj.id || "");
  const name = String(obj.name || "");
  if (!id || !name) return null;

  return {
    id,
    name,
    artist,
    release_date: String(obj.release_date || ""),
    total_tracks: Number.isFinite(obj.total_tracks) ? obj.total_tracks : 0,
    imageUrl,
  };
}

/** GET /spotify/api/top-albums  -> [{ mediaId, total }, ...] */
async function fetchTopAlbumIds(signal?: AbortSignal): Promise<string[]> {
  // por padrão o back das outras rotas exige auth; se der 401/403 a gente tenta sem
  try {
    const raw = await apiFetch(`/spotify/api/top-albums`, { auth: true, signal });
    return normalizeTopIds(raw);
  } catch (err: any) {
    if (err?.status === 401 || err?.status === 403) {
      const raw = await apiFetch(`/spotify/api/top-albums`, { auth: false, signal });
      return normalizeTopIds(raw);
    }
    throw err;
  }
}

function normalizeTopIds(raw: any): string[] {
  if (!Array.isArray(raw)) return [];
  // pega mediaId, ignora ids antigos com "-", remove vazios e duplica
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const item of raw) {
    const id = String(item?.mediaId || "").trim();
    if (!id || id.includes("-")) continue;
    if (!seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}

/** GET /spotify/api/albums?ids=... -> Album[] */
async function fetchAlbumsByIds(ids: string[], signal?: AbortSignal): Promise<Album[]> {
  if (!ids.length) return [];
  const path = `/spotify/api/albums?ids=${encodeURIComponent(ids.join(","))}`;

  try {
    const raw = await apiFetch(path, { auth: true, signal });
    if (!Array.isArray(raw)) return [];
    return raw.map((x) => mapAlbum(x as Json)).filter(Boolean) as Album[];
  } catch (err: any) {
    if (err?.status === 401 || err?.status === 403) {
      const raw = await apiFetch(path, { auth: false, signal });
      if (!Array.isArray(raw)) return [];
      return raw.map((x) => mapAlbum(x as Json)).filter(Boolean) as Album[];
    }
    throw err;
  }
}

/** 🔝 Top álbuns prontos para o carrossel */
export async function fetchTopAlbums(signal?: AbortSignal): Promise<Album[]> {
  const ids = await fetchTopAlbumIds(signal);
  // por UX, limita a 10–20; aqui usei 12 para caber bem no layout
  const limited = ids.slice(0, 12);
  return fetchAlbumsByIds(limited, signal);
}
