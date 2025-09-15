// src/services/album/by_name.ts
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

/** Normaliza diferentes formatos de payload do backend */
function extractList(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (raw?.albums?.items && Array.isArray(raw.albums.items)) return raw.albums.items; // ✅ formato do teu back
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.albums)) return raw.albums;
  if (raw?.data?.albums?.items && Array.isArray(raw.data.albums.items)) return raw.data.albums.items;
  return [];
}

/** Busca por nome usando o endpoint correto do backend */
export async function fetchAlbumsByName(
  name: string,
  limit: number = 20,
  signal?: AbortSignal
): Promise<Album[]> {
  const term = name.trim();
  if (!term) return [];
  const q = encodeURIComponent(term);

  // endpoint: /spotify/api/searchAlbum?query=views&limit=5
  const path = `/spotify/api/searchAlbum?query=${q}&limit=${limit}`;

  // 🔓 sem token (igual teste no navegador)
  const raw = await apiFetch(path, { auth: false, signal });
  const list = extractList(raw);

  return list
    .map((item) => mapAlbum(item as Json))
    .filter((a): a is Album => Boolean(a));
}
