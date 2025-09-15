import { apiFetch } from "@/lib/api";
import type { BadgeResponse } from "@/types/Badge";

/** 👇 único endpoint usado — o que existe no seu back */
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
