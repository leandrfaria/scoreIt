import { apiFetch } from "@/lib/api";
import type { BadgeResponse } from "@/types/Badge";


export async function fetchMemberBadges(
  memberId: number | string,
  opts?: { signal?: AbortSignal }
) {
  const res = await apiFetch(`/member/${memberId}/badges`, {
    auth: true,
    signal: opts?.signal,
  });
  return res as BadgeResponse[];
}
