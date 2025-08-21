import { apiFetch } from "@/lib/api";

export async function unfollowUser(
  followerId: string,
  followedId: string,
  token: string,
  opts?: { signal?: AbortSignal }
): Promise<boolean> {
  await apiFetch(`/followers/unfollow?followerId=${encodeURIComponent(followerId)}&followedId=${encodeURIComponent(followedId)}`, {
    auth: true,
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    signal: opts?.signal,
  });
  return true;
}
