import { apiFetch } from "@/lib/api";

/**
 * Conta seguidores de um membro.
 */
export async function countFollowers(
  memberId: string,
  token: string,
  opts?: { signal?: AbortSignal }
): Promise<number> {
  const data = await apiFetch(`/followers/${memberId}/countFollowers`, {
    auth: true,
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    signal: opts?.signal,
  });
  const n = Number(data);
  return Number.isFinite(n) ? n : 0;
}

export async function countFollowing(
  memberId: string,
  token: string,
  opts?: { signal?: AbortSignal }
): Promise<number> {
  const data = await apiFetch(`/followers/${memberId}/countFollowing`, {
    auth: true,
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    signal: opts?.signal,
  });
  const n = Number(data);
  return Number.isFinite(n) ? n : 0;
}
