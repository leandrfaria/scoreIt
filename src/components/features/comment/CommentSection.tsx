"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiComment } from "@/types/comment";
import { getCommentsByReview, createComment } from "@/services/Comment/Comment";
import { useMember } from "@/context/MemberContext";
import CommentForm from "./CommentForm";
import CommentItem from "./CommentItem";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

export default function CommentsSection({ reviewId }: { reviewId: number | string }) {
  const { member } = useMember();
  const mountedRef = useRef(true);
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const t = useTranslations("CommentsSection");

  const fetchComments = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCommentsByReview(reviewId, { signal });
        if (!mountedRef.current) return;
        setComments(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error(err);
        if (mountedRef.current) setError(t("loadError"));
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [reviewId, t]
  );

  useEffect(() => {
    mountedRef.current = true;
    const ac = new AbortController();
    fetchComments(ac.signal);
    return () => {
      mountedRef.current = false;
      ac.abort();
    };
  }, [fetchComments]);

  const handleCreateRootComment = async (content: string) => {
    if (!member?.id) {
      toast.error(t("loginRequired"));
      return;
    }
    try {
      await createComment(Number(member.id), reviewId, content);
      await fetchComments();
      toast.success(t("commentCreated"));
    } catch (err) {
      console.error(err);
      toast.error(t("commentCreateError"));
    }
  };

  const handleRefresh = async () => {
    await fetchComments();
  };

  const visible = useMemo(
    () => (showAll ? comments : (comments || []).slice(0, 6)),
    [comments, showAll]
  );

  return (
    <section className="mt-6 bg-[#02070A] p-4 rounded">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-semibold">
          {t("commentsTitle", { count: comments.length })}
        </h3>
        {comments.length > 6 && (
          <button
            onClick={() => setShowAll((s) => !s)}
            className="text-sm text-white/80"
          >
            {showAll ? t("seeLess") : t("seeMore")}
          </button>
        )}
      </div>

      <div>
        <h4 className="text-white/90 mb-2">{t("leaveComment")}</h4>
        <CommentForm onSubmit={handleCreateRootComment} submitLabel={t("comment")} />
      </div>

      <div className="mt-4">
        {loading && <p className="text-gray-400">{t("loading")}</p>}
        {error && <p className="text-red-400">{error}</p>}
        {!loading && comments.length === 0 && !error && (
          <p className="text-gray-400">{t("firstComment")}</p>
        )}

        <div className="mt-3 space-y-3">
          {visible.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              reviewId={reviewId}
              onRefresh={handleRefresh}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
