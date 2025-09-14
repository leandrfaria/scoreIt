// CommentsSection.tsx
"use client";

import React, { useState, useEffect } from "react";
import { ApiComment } from "@/types/comment";
import CommentForm from "./CommentForm";
import CommentItem from "./CommentItem";
import { getCommentsByReview, createComment } from "@/services/Comment/Comment";
import { useMember } from "@/context/MemberContext";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

interface CommentsSectionProps {
  reviewId: number | string;
  reviewContent: string;      // texto da review
  reviewAuthorName: string;   // nome do autor da review
  reviewAuthorAvatar?: string; // avatar do autor da review
}

const FALLBACK_AVATAR = "/fallback-avatar.jpg";

export default function CommentsSection({
  reviewId,
  reviewContent,
  reviewAuthorName,
  reviewAuthorAvatar,
}: CommentsSectionProps) {
  const { member } = useMember();
  const t = useTranslations("CommentsSection");

  const [comments, setComments] = useState<ApiComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCommentsByReview(reviewId);
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [reviewId]);

  const handleCreateComment = async (content: string) => {
    if (!member?.id) {
      toast.error(t("loginRequired"));
      return;
    }
    try {
      await createComment(Number(member.id), reviewId, content);
      toast.success(t("commentCreated"));
      await loadComments();
    } catch (err) {
      console.error(err);
      toast.error(t("commentCreateError"));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Preview da review */}
      <div className="flex gap-3 items-start bg-[#0b1114] p-3 rounded border border-white/10 max-w-full">
        <img
          src={reviewAuthorAvatar || FALLBACK_AVATAR}
          alt={reviewAuthorName}
          className="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0"
        />
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <strong className="text-white text-sm">{reviewAuthorName}</strong>
          <p className="text-gray-200 whitespace-pre-wrap break-words">
            {reviewContent}
          </p>
        </div>
      </div>

      {/* Campo para escrever comentário */}
      <CommentForm onSubmit={handleCreateComment} submitLabel={t("comment")} />

      {loading && <p className="text-gray-400">{t("loading")}</p>}
      {error && <p className="text-red-400">{error}</p>}

      {!loading && !error && (
      <div className="flex flex-col gap-3">
        {comments.length === 0 ? (
          <p className="text-gray-400">{t("firstComment")}</p>
        ) : (
          comments.map((c, i) => (
            <React.Fragment key={c.id}>
              {i > 0 && <hr className="border-t border-white/10" />} {/* separador entre comentários */}
              <CommentItem
                comment={c}
                reviewId={reviewId}
                onRefresh={loadComments}
              />
            </React.Fragment>
          ))
        )}
      </div>
      )}
    </div>
  );
}
