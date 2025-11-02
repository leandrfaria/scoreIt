"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ApiComment } from "@/types/comment";
import CommentForm from "./CommentForm";
import { createComment, deleteComment } from "@/services/Comment/Comment";
import { useMember } from "@/context/MemberContext";
import { fetchMemberById } from "@/services/user/member";
import toast from "react-hot-toast";
import { useTranslations, useLocale } from "next-intl";

import pessoaGenerica from "./pessoaGenerica.svg"; // seu SVG importado

const avatarCache = new Map<number, string>();

export default function CommentItem({
  comment,
  reviewId,
  onRefresh,
}: {
  comment: ApiComment;
  reviewId: string | number;
  onRefresh: () => void;
}) {
  const { member } = useMember();
  const t = useTranslations("CommentItem");
  const locale = useLocale(); // pega o idioma atual

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showReply, setShowReply] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [deleteToastOpen, setDeleteToastOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // --- Função para formatar data com internacionalização ---
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";

    const useEn = String(locale || "").toLowerCase().startsWith("en");

    return new Intl.DateTimeFormat(useEn ? "en-US" : "pt-BR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };

  // carrega avatar (mantém avatar/nome mesmo se comentário for deletado)
  useEffect(() => {
    const authorId = comment.authorId;
    if (!authorId) {
      setAvatarUrl(pessoaGenerica.src);
      return;
    }

    if (member && authorId === member.id) {
      const url = member.profileImageUrl || pessoaGenerica.src;
      avatarCache.set(authorId, url);
      setAvatarUrl(url);
      return;
    }

    if (avatarCache.has(authorId)) {
      setAvatarUrl(avatarCache.get(authorId)!);
      return;
    }

    fetchMemberById(authorId)
      .then((m) => {
        const url = m?.profileImageUrl || pessoaGenerica.src;
        avatarCache.set(authorId, url);
        setAvatarUrl(url);
      })
      .catch(() => {
        avatarCache.set(authorId, pessoaGenerica.src);
        setAvatarUrl(pessoaGenerica.src);
      });
  }, [comment.authorId, member]);

  const handleReply = async (content: string) => {
    if (!member?.id) {
      toast.error(t("loginToComment"));
      return;
    }

    const finalContent = content.trim().slice(0, 250);
    try {
      await createComment(Number(member.id), reviewId, finalContent, comment.id);
      onRefresh();
      toast.success(t("commentPosted"));
      setShowReply(false);
    } catch {
      toast.error(t("commentPostError"));
    }
  };

  const handleDelete = async () => {
    if (!member?.id || deleteToastOpen) return toast.error(t("unauthorized"));

    const toastId = toast(
      () => (
        <div className="flex flex-col gap-3">
          <span>{t("confirmDeleteComment")}</span>
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => {
                toast.dismiss(toastId);
                setDeleteToastOpen(false);
              }}
              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              {t("cancel")}
            </button>
            <button
              onClick={async () => {
                toast.dismiss(toastId);
                setDeleteToastOpen(false);
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

    setDeleteToastOpen(true);
  };

  // regra de menção: só coloca @author se eu (member) for diferente do author do comentário alvo
  const targetAuthorName = comment.authorName ?? undefined;
  const shouldMention = !!(targetAuthorName && member?.name && targetAuthorName !== member.name);
  const initialValue = shouldMention ? `@${targetAuthorName} ` : "";

  // move cursor para depois do @ quando abrir reply
  useEffect(() => {
    if (showReply && inputRef.current) {
      const len = initialValue.length;
      inputRef.current.focus();
      try {
        inputRef.current.setSelectionRange(len, len);
      } catch {}
    }
  }, [showReply, initialValue]);

  const displayContent = comment.content?.trim() || t("commentDeleted");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3 items-start">
        <Image
          src={avatarUrl || pessoaGenerica}
          alt={comment.authorName ?? t("unknownUser")}
          width={40}
          height={40}
          className="rounded-full object-cover border border-white/10 flex-shrink-0"
        />
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <strong className="text-white text-sm">{comment.authorName ?? t("unknownUser")}</strong>
            <span className="text-xs text-gray-400">• {formatDate(comment.createdAt)}</span>
          </div>

          <p className="text-gray-200 break-words whitespace-pre-wrap">
            {displayContent.split(" ").map((word, i) =>
              word.startsWith("@") ? (
                <span key={i} className="text-[#6EE7B7] font-medium">
                  {word}{" "}
                </span>
              ) : (
                word + " "
              )
            )}
          </p>

          <div className="flex gap-3 mt-1 text-sm">
            <button onClick={() => setShowReply((s) => !s)} className="text-white/80 hover:text-white">
              {t("reply")}
            </button>
            {member?.id && Number(comment.authorId) === Number(member.id) && (
              <button onClick={handleDelete} disabled={loadingDelete} className="text-white/80 hover:text-white">
                {loadingDelete ? t("deleting") : t("delete")}
              </button>
            )}
          </div>

          {showReply && (
            <div className="mt-2">
              <CommentForm
                onSubmit={handleReply}
                onCancel={() => setShowReply(false)}
                submitLabel={t("reply")}
                autoFocus
                initialValue={initialValue}
                ref={inputRef}
              />
            </div>
          )}
        </div>
      </div>

      {comment.replies?.length > 0 && (
        <div className="flex flex-col gap-2 mt-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              reviewId={reviewId}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
