import { apiFetch } from "@/lib/api";

export async function isFollowing(
  followerId: string,
  followedId: string,
  token: string,
  opts?: { signal?: AbortSignal }
): Promise<boolean> {
  const res = await apiFetch(`/followers/isFollowing?followerId=${encodeURIComponent(followerId)}&followedId=${encodeURIComponent(followedId)}`, {
    auth: true,
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    signal: opts?.signal,
  });
  return Boolean(res);
}
