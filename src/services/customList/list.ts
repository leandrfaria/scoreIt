import { apiFetch, getToken } from "@/lib/api";
import { fetchMovieById } from "@/services/movie/fetch_movie_by_id";
import { fetchSerieById } from "@/services/series/fetch_series_by_id";
import { fetchAlbumById } from "@/services/album/fetch_album_by_id";
import { Movie } from "@/types/Movie";
import { AddToCustomListRequest, CustomList } from "@/types/CustomList";
import { Series } from "@/types/Series";
import { Album } from "@/types/Album";

export type MediaType = (Movie | Series | Album) & {
  internalId: number;
  posterUrl?: string | null;
  imageUrl?: string | null;
};

type Fetcher = (id: string, locale: string) => Promise<Movie | Series | Album | null>;

const fetchMap: Record<"movie" | "series" | "album", Fetcher> = {
  movie: fetchMovieById,
  series: fetchSerieById,
  album: fetchAlbumById,
};

// ---------- Utils ----------
function validCustomItem(item: CustomList): boolean {
  if (!item.mediaId || item.mediaId === "null") return false;
  if (item.mediaType === "series" && isNaN(Number(item.mediaId))) return false;
  if (item.mediaType === "movie" && isNaN(Number(item.mediaId))) return false;
  return true;
}

function coerceType(t: string): "movie" | "series" | "album" | null {
  const k = t.toLowerCase();
  if (k === "movie" || k === "series" || k === "album") return k;
  return null;
}

// ---------- API ----------
/** Cria uma lista personalizada — backend espera `description` */
export async function createCustomList(
  memberId: number,
  name: string,
  list_description: string,
  opts?: { signal?: AbortSignal }
): Promise<void> {
  const token = getToken();
  if (!token) throw new Error("NO_TOKEN: usuário não autenticado ou sessão expirada");

  const payload = {
    memberId,
    listName: name,
    description: list_description, // <- campo exato do backend
  };

  await apiFetch("/customList/register", {
    auth: true,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: opts?.signal,
  });
}

/** Busca conteúdo de uma lista e resolve metadados de cada mídia */
export async function fetchListContent(
  memberId: number,
  listName: string,
  locale: string, // Adicionar locale como parâmetro
  opts?: { signal?: AbortSignal }
): Promise<MediaType[]> {
  const items = (await apiFetch(`/customList/getContent/${memberId}/${encodeURIComponent(listName)}`, {
    auth: true,
    method: "GET",
    signal: opts?.signal,
  })) as CustomList[];

  const validItems = (items || []).filter(validCustomItem);

  const resolved = await Promise.all(
    validItems.map(async (item) => {
      try {
        const type = coerceType(item.mediaType);
        if (!type) return null;
          const media = await fetchMap[type](String(item.mediaId), locale);
        return media ? ({ ...media, internalId: item.id } as MediaType) : null;
      } catch {
        return null;
      }
    })
  );

  return resolved.filter(Boolean) as MediaType[];
}

/** Adiciona conteúdo à lista */
export async function addContentToList(
  _token: string | undefined,
  data: AddToCustomListRequest,
  opts?: { signal?: AbortSignal }
): Promise<"success" | "duplicate" | "error"> {
  try {
    // backend ignora campos extras, mas mandamos só os necessários:
    const payload = {
      memberId: data.memberId,
      mediaId: data.mediaId,
      mediaType: data.mediaType,
      listName: data.listName,
    };

    await apiFetch("/customList/addContent", {
      auth: true,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: opts?.signal,
    });
    return "success";
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg.includes("already in your list") || msg.toLowerCase().includes("duplicate")) return "duplicate";
    return "error";
  }
}

/** Remove conteúdo da lista — backend exige exatamente estes 4 campos */
export function removeContentFromList(
  data: CustomList,
  opts?: { signal?: AbortSignal }
): Promise<void>;
export function removeContentFromList(
  _token: string | undefined,
  data: CustomList,
  opts?: { signal?: AbortSignal }
): Promise<void>;
export async function removeContentFromList(a: any, b?: any, c?: any): Promise<void> {
  const body: Pick<CustomList, "memberId" | "mediaId" | "mediaType" | "listName"> =
    typeof a === "object"
      ? { memberId: a.memberId, mediaId: a.mediaId, mediaType: a.mediaType, listName: a.listName }
      : { memberId: b.memberId, mediaId: b.mediaId, mediaType: b.mediaType, listName: b.listName };

  const opts = typeof a === "object" ? b : c;

  await apiFetch("/customList/deleteContent", {
    auth: true,
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: opts?.signal,
  });
}

/** Busca todas as listas de um membro */
export async function fetchMemberLists(
  _token: string | undefined,
  memberId: number,
  language: string, // Novo parâmetro para idioma
  opts?: { signal?: AbortSignal }
): Promise<CustomList[]> {
  const url = `/customList/getList/${memberId}?language=${encodeURIComponent(language)}`;
  const lists = await apiFetch(url, {
    auth: true,
    method: "GET",
    signal: opts?.signal,
  });
  return (Array.isArray(lists) ? lists : []) as CustomList[];
}

/** Deleta uma lista personalizada */
export async function deleteCustomList(
  id: number,
  opts?: { signal?: AbortSignal }
): Promise<void> {
  await apiFetch(`/customList/delete/${id}`, {
    auth: true,
    method: "DELETE",
    signal: opts?.signal,
  });
}

/** Atualiza nome/descrição da lista — backend espera `list_description` */
export function updateCustomList(
  data: { id: number; listName: string; list_description: string },
  opts?: { signal?: AbortSignal }
): Promise<void>;
export function updateCustomList(
  _token: string | undefined,
  data: { id: number; listName: string; list_description: string },
  opts?: { signal?: AbortSignal }
): Promise<void>;
export async function updateCustomList(a: any, b?: any, c?: any): Promise<void> {
  const data = typeof a === "object" ? a : b;
  const opts = typeof a === "object" ? b : c;

  const payload = {
    id: data.id,
    listName: data.listName,
    list_description: data.list_description, // <- campo exato do backend
  };

  await apiFetch("/customList/update", {
    auth: true,
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: opts?.signal,
  });
}
