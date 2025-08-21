import { apiFetch } from "@/lib/api";
import { Member } from "@/types/Member";

function normalizeMember(u: any): Member {
  const id = Number(u?.id ?? 0);
  const handle = String(u?.handle ?? "")
    .replace(/^@+/, "")
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "");

  return {
    id: Number.isFinite(id) ? id : 0,
    name: String(u?.name ?? ""),
    birthDate: String(u?.birthDate ?? ""),
    email: String(u?.email ?? ""),
    handle,
    gender: String(u?.gender ?? ""),
    bio: String(u?.bio ?? ""),
    profileImageUrl: typeof u?.profileImageUrl === "string" ? u.profileImageUrl : "",
  };
}

export async function fetchFollowersList(
  userId: string,
  opts?: { signal?: AbortSignal }
): Promise<Member[]> {
  const data = await apiFetch(`/followers/${userId}/followers`, {
    auth: true,
    method: "GET",
    signal: opts?.signal,
  });

  if (!Array.isArray(data)) return [];
  return data.map(normalizeMember);
}

export async function fetchFollowingList(
  userId: string,
  opts?: { signal?: AbortSignal }
): Promise<Member[]> {
  const data = await apiFetch(`/followers/${userId}/following`, {
    auth: true,
    method: "GET",
    signal: opts?.signal,
  });

  if (!Array.isArray(data)) return [];
  return data.map(normalizeMember);
}
