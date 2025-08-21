import { apiFetch } from "@/lib/api";

export async function followUser(
  followerId: string,
  followedId: string,
  token: string,
  opts?: { signal?: AbortSignal }
): Promise<boolean> {
  await apiFetch(`/followers/follow?followerId=${encodeURIComponent(followerId)}&followedId=${encodeURIComponent(followedId)}`, {
    auth: true,
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    signal: opts?.signal,
  });
  return true;
}
