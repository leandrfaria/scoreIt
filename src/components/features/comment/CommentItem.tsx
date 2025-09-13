"use client";

import React, { useState } from "react";
import { ApiComment } from "@/types/comment";
import CommentForm from "./CommentForm";
import { createComment, deleteComment } from "@/services/Comment/Comment";
import { useMember } from "@/context/MemberContext";
import { fetchMemberById } from "@/services/user/member";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

const FALLBACK_AVATAR = "/fallback-avatar.jpg";

// Cache global de avatar por userId
const avatarCache = new Map<number, string>();

export default function CommentItem({
  comment,
  reviewId,
  depth = 0,
  onRefresh,
}: {
  comment: ApiComment;
  reviewId: number | string;
  depth?: number;
  onRefresh: () => void;
}) {
  const { member } = useMember();
  const [showReply, setShowReply] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>(
    avatarCache.get(comment.authorId ?? 0) || FALLBACK_AVATAR
  );

  const t = useTranslations("CommentItem");

  const timeRelative = (dateString?: string) =>
    dateString ? new Date(dateString).toLocaleString() : "";

  const buildAvatar = (name?: string | null) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name ?? t("unknownUser"))}&background=222&color=fff`;

  // Carrega avatar no cache se necessário
  React.useEffect(() => {
    const authorId = comment.authorId;
    if (!authorId) return;

    // Usuário logado
    if (member && authorId === member.id) {
      const url = member.profileImageUrl || buildAvatar(member.name);
      avatarCache.set(authorId, url);
      setAvatarUrl(url);
      return;
    }

    // Outro usuário: verifica cache primeiro
    if (avatarCache.has(authorId)) {
      setAvatarUrl(avatarCache.get(authorId)!);
      return;
    }

    // Busca do backend
    fetchMemberById(authorId)
      .then((m) => {
        const url = m?.profileImageUrl || buildAvatar(m?.name ?? comment.authorName);
        avatarCache.set(authorId, url);
        setAvatarUrl(url);
      })
      .catch(() => {
        const url = buildAvatar(comment.authorName);
        avatarCache.set(authorId, url);
        setAvatarUrl(url);
      });
  }, [comment.authorId, comment.authorName, member, t]);

  const handleReply = async (content: string): Promise<void> => {
    if (!member?.id) {
      toast.error(t("loginToComment"));
      return;
    }

    try {
      await createComment(Number(member.id), reviewId, content, comment.id);
      onRefresh();
      toast.success(t("commentPosted"));
      setShowReply(false);
    } catch (err) {
      console.error(err);
      toast.error(t("commentPostError"));
    }
  };

  const handleDelete = async () => {
    if (!member?.id) return toast.error(t("unauthorized"));

    const toastId = toast(
      (tContent) => (
        <div className="flex flex-col gap-3">
          <span>{t("confirmDeleteComment")}</span>
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => toast.dismiss(toastId)}
              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              {t("cancel")}
            </button>
            <button
              onClick={async () => {
                toast.dismiss(toastId);
                try {
                  setLoadingDelete(true);
                  await deleteComment(comment.id, Number(member.id));
                  onRefresh();
                  toast.success(t("commentDeleted"));
                } catch (err) {
                  console.error(err);
                  toast.error(t("commentDeleteError"));
                } finally {
                  setLoadingDelete(false);
                }
              }}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              {t("confirm")}
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  };

  return (
    <div
      className={`pl-${Math.min(depth * 4, 20)} py-3 border-l ${
        depth > 0 ? "border-white/5" : "border-transparent"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <img
          src={avatarUrl}
          alt={comment.authorName ?? t("unknownUser")}
          className="w-10 h-10 rounded-full object-cover border border-white/10"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            target.src = buildAvatar(comment.authorName);
          }}
        />

        <div className="flex-1">
          {/* Nome e data */}
          <div className="flex items-center gap-2">
            <strong className="text-white text-sm">{comment.authorName ?? t("unknownUser")}</strong>
            <span className="text-xs text-gray-400">• {timeRelative(comment.createdAt)}</span>
          </div>

          {/* Conteúdo */}
          <p className="text-gray-200 mt-2 whitespace-pre-wrap">{comment.content}</p>

          {/* Ações */}
          <div className="flex gap-3 mt-2 text-sm">
            <button
              onClick={() => setShowReply((s) => !s)}
              className="text-white/80 hover:text-white"
            >
              {t("reply")}
            </button>

            {comment.authorId && member?.id && Number(comment.authorId) === Number(member.id) && (
              <button
                onClick={handleDelete}
                disabled={loadingDelete}
                className="text-white/80 hover:text-white"
              >
                {loadingDelete ? t("deleting") : t("delete")}
              </button>
            )}
          </div>

          {/* Replies */}
          <div className="mt-3 space-y-3">
            {comment.replies?.map((r) => (
              <CommentItem
                key={r.id}
                comment={r}
                reviewId={reviewId}
                depth={depth + 1}
                onRefresh={onRefresh}
              />
            ))}

            {showReply && (
              <div className="mt-2">
                <CommentForm
                  onSubmit={handleReply}
                  onCancel={() => setShowReply(false)}
                  submitLabel={t("reply")}
                  autoFocus
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
