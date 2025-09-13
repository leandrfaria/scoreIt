// src/services/Comment/Comment.ts
import { apiFetch } from "@/lib/api";
import { ApiComment } from "@/types/comment";

export async function getCommentsByReview(
  reviewId: number | string,
  opts?: { signal?: AbortSignal }
): Promise<ApiComment[]> {
  return apiFetch(`/comments/review/${reviewId}`, {
    method: "GET",
    signal: opts?.signal,
    auth: true,
  }) as Promise<ApiComment[]>;
}

export async function createComment(
  memberId: number,
  reviewId: number | string,
  content: string,
  parentId?: number,
  opts?: { signal?: AbortSignal }
) {
  const params = new URLSearchParams({
    memberId: String(memberId),
    reviewId: String(reviewId),
    content,
  });
  if (parentId != null) params.set("parentId", String(parentId));

  return apiFetch(`/comments/create?${params.toString()}`, {
    method: "POST",
    signal: opts?.signal,
    auth: true,
  });
}

export async function saveComment(
  commentId: number,
  memberId: number,
  opts?: { signal?: AbortSignal }
) {
  return apiFetch(`/comments/${commentId}?memberId=${memberId}`, {
    method: "POST",
    signal: opts?.signal,
    auth: true,
  });
}


export async function deleteComment(
  commentId: number,
  memberId: number,
  opts?: { signal?: AbortSignal }
) {
  return apiFetch(`/comments/${commentId}?memberId=${memberId}`, {
    method: "DELETE",
    signal: opts?.signal,
    auth: true,
  });
}
