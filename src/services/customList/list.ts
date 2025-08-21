import { apiFetch } from "@/lib/api";
import { fetchMovieById } from "@/services/movie/fetch_movie_by_id";
import { fetchSerieById } from "@/services/series/fetch_series_by_id";
import { fetchAlbumById } from "@/services/album/fetch_album_by_id";
import { Movie } from "@/types/Movie";
import { AddToCustomListRequest, CustomList } from "@/types/CustomList";
import { Series } from "@/types/Series";
import { Album } from "@/types/Album";

export type MediaType = (Movie | Series | Album) & {
  internalId: number;          // id do item dentro da tabela de customList content
  posterUrl?: string | null;   // filmes/séries
  imageUrl?: string | null;    // álbuns
};

type Fetcher = (id: string) => Promise<Movie | Series | Album | null>;

const fetchMap: Record<"movie" | "series" | "album", Fetcher> = {
  movie: fetchMovieById,
  series: fetchSerieById,
  album: fetchAlbumById,
};

// ---------- Utils ----------
function validCustomItem(item: CustomList): boolean {
  if (!item.mediaId || item.mediaId === "null") return false;

  // séries devem ser numéricas, filme não pode ser id base64 (22 chars) no seu backend, etc.
  if (item.mediaType === "series" && isNaN(Number(item.mediaId))) return false;
  if (item.mediaType === "movie" && /^[A-Za-z0-9]{22}$/.test(item.mediaId)) return false;

  return true;
}

function coerceType(t: string): "movie" | "series" | "album" | null {
  const k = t.toLowerCase();
  if (k === "movie" || k === "series" || k === "album") return k;
  return null;
}

// ---------- API ----------
/**
 * Busca conteúdo de uma lista específica de um membro e resolve os metadados de cada mídia.
 * Usa apiFetch (com JWT automático em client), valida itens, e ignora os que falharem.
 */
export async function fetchListContent(
  memberId: number,
  listName: string,
  opts?: { signal?: AbortSignal }
): Promise<MediaType[]> {
  const items = await apiFetch(`/customList/getContent/${memberId}/${encodeURIComponent(listName)}`, {
    auth: true,
    method: "GET",
    signal: opts?.signal,
  }) as CustomList[];

  const validItems = (items || []).filter(validCustomItem);

  const resolved = await Promise.all(
    validItems.map(async (item) => {
      try {
        const type = coerceType(item.mediaType);
        if (!type) return null;

        const media = await fetchMap[type](String(item.mediaId));
        return media ? ({ ...media, internalId: item.id } as MediaType) : null;
      } catch {
        return null;
      }
    })
  );

  return resolved.filter(Boolean) as MediaType[];
}

/**
 * Adiciona conteúdo à lista (com tratamento de duplicidade).
 * Retorna "success" | "duplicate" | "error".
 */
export async function addContentToList(
  token: string,
  data: AddToCustomListRequest,
  opts?: { signal?: AbortSignal }
): Promise<"success" | "duplicate" | "error"> {
  try {
    await apiFetch("/customList/addContent", {
      auth: true,
      method: "POST",
      body: JSON.stringify(data), // <-- serialize
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      signal: opts?.signal,
    });
    return "success";
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg.includes("already in your list") || msg.toLowerCase().includes("duplicate")) {
      return "duplicate";
    }
    return "error";
  }
}

/**
 * Remove conteúdo de uma lista (payload precisa bater com o backend).
 */
export async function removeContentFromList(
  token: string,
  data: CustomList,
  opts?: { signal?: AbortSignal }
): Promise<void> {
  await apiFetch("/customList/deleteContent", {
    auth: true,
    method: "DELETE",
    body: JSON.stringify(data), // <-- serialize
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    signal: opts?.signal,
  });
}

/**
 * Busca todas as listas de um membro.
 */
export async function fetchMemberLists(
  token: string,
  memberId: number,
  opts?: { signal?: AbortSignal }
): Promise<CustomList[]> {
  const lists = await apiFetch(`/customList/getList/${memberId}`, {
    auth: true,
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    signal: opts?.signal,
  });
  return (Array.isArray(lists) ? lists : []) as CustomList[];
}

/**
 * Deleta uma lista personalizada.
 */
export async function deleteCustomList(
  listId: number,
  opts?: { signal?: AbortSignal }
): Promise<void> {
  await apiFetch(`/customList/delete/${listId}`, {
    auth: true,
    method: "DELETE",
    signal: opts?.signal,
  });
}

/**
 * Atualiza nome/descrição da lista.
 */
export async function updateCustomList(
  token: string,
  data: { id: number; listName: string; list_description: string },
  opts?: { signal?: AbortSignal }
): Promise<void> {
  await apiFetch("/customList/update", {
    auth: true,
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data), // <-- serialize
    signal: opts?.signal,
  });
}
