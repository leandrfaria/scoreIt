import { apiFetch } from "@/lib/api";
import { Album } from "@/types/Album";

type Json = Record<string, unknown>;

function isRecord(v: unknown): v is Json {
  return typeof v === "object" && v !== null;
}

function pickString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function normalizeAlbum(item: unknown): Album | null {
  // Spotify-like
  if (isRecord(item)) {
    const id = pickString(item.id);
    const name = pickString(item.name);
    const release_date = pickString(item.release_date);
    const images = (item.images as unknown[]) || [];
    const imageUrl =
      Array.isArray(images) && isRecord(images[0]) ? pickString(images[0].url, "/fallback.jpg") : "/fallback.jpg";
    const artists = (item.artists as unknown[]) || [];
    const artist =
      Array.isArray(artists) && isRecord(artists[0]) ? pickString(artists[0].name, "Desconhecido") : "Desconhecido";
    const total_tracksRaw = (item.total_tracks as number) ?? 0;

    if (!id || !name) return null;

    return {
      id,
      name,
      artist,
      release_date,
      total_tracks: typeof total_tracksRaw === "number" ? total_tracksRaw : 0,
      imageUrl,
    };
  }
  return null;
}

function normalizeAlbumFromLastFm(item: unknown): Album | null {
  // lastfm custom payload used by your API (/lastfm/albums-by-genre/*)
  if (isRecord(item)) {
    const id = pickString(item.id);
    const name = pickString(item.name);
    const imageUrl = pickString(item.imageUrl, "/fallback.jpg");
    const artist = pickString(item.artistName, "Desconhecido");
    const release_date = pickString(item.release_date);
    const total_tracksRaw = (item.total_tracks as number) ?? 0;

    if (!id || !name) return null;

    return {
      id,
      name,
      artist,
      release_date,
      total_tracks: typeof total_tracksRaw === "number" ? total_tracksRaw : 0,
      imageUrl: imageUrl || "/fallback.jpg",
    };
  }
  return null;
}

/**
 * 🎧 Busca álbuns por gênero
 * Se o endpoint por gênero estiver indisponível (back removeu filtros), faz fallback para releases recentes.
 */
export async function fetchAlbumsByGenre(
  genre: string = "rap",
  page = 1,
  limit = 20,
  signal?: AbortSignal
): Promise<Album[]> {
  try {
    // Tentativa 1: endpoint por gênero (LastFM wrapper do seu back)
    const data = await apiFetch(`/lastfm/albums-by-genre/${genre}?page=${page}&limit=${limit}`, {
      auth: true,
      signal,
    });

    if (!Array.isArray(data)) {
      console.warn("[albums-by-genre] Resposta inesperada; caindo para releases recentes:", data);
      return await fetchAlbumsFallbackReleases(limit, signal);
    }

    const mapped = data
      .map(normalizeAlbumFromLastFm)
      .filter((a): a is Album => a !== null);

    // Garante tamanho
    return mapped.slice(0, limit);
  } catch (err) {
    console.warn("[albums-by-genre] Falha na API; fallback releases:", err);
    return await fetchAlbumsFallbackReleases(limit, signal);
  }
}

/**
 * 🔎 Busca álbuns por nome (Spotify search via back)
 */
export async function fetchAlbumsByName(query: string, limit = 20, signal?: AbortSignal): Promise<Album[]> {
  if (!query.trim()) return [];
  try {
    const data = await apiFetch(
      `/spotify/api/searchAlbum?query=${encodeURIComponent(query)}&limit=${limit}`,
      { auth: true, signal }
    );

    const items = isRecord(data) && isRecord(data.albums) && Array.isArray((data.albums as Json).items)
      ? ((data.albums as Json).items as unknown[])
      : [];

    const filtered = items.filter((item) => {
      if (!isRecord(item)) return false;
      const name = pickString(item.name).toLowerCase();
      return name.includes(query.toLowerCase());
    });

    return filtered
      .map(normalizeAlbum)
      .filter((a): a is Album => a !== null)
      .slice(0, limit);
  } catch (err) {
    console.error("Erro ao buscar álbuns por nome:", err);
    return [];
  }
}

/** 🔁 Fallback: usa releases recentes quando o endpoint de gênero estiver indisponível */
async function fetchAlbumsFallbackReleases(limit = 20, signal?: AbortSignal): Promise<Album[]> {
  try {
    const data = await apiFetch(`/spotify/api/newAlbumReleases`, { auth: true, signal });

    if (!Array.isArray(data)) return [];
    return data
      .map(normalizeAlbum)
      .filter((a): a is Album => a !== null)
      .slice(0, limit);
  } catch (err) {
    console.error("[fallback releases] erro:", err);
    return [];
  }
}
