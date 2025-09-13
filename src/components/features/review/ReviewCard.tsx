"use client";

import { useState, useEffect, useRef } from "react";
import { FaStar, FaPen, FaTrash, FaStarHalfAlt, FaRegStar, FaComments } from "react-icons/fa";
import toast from "react-hot-toast";
import { deleteReview } from "@/services/review/delete_review";
import { useMember } from "@/context/MemberContext";
import CommentsSection from "@/components/features/comment/CommentSection";
import { useTranslations } from "next-intl";

type ReviewProps = {
  name: string;
  avatar: string;
  date: string;
  rating: number;
  comment?: string;
  canEdit?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  spoiler?: boolean;
  reviewId?: number;
};

const FALLBACK_AVATAR = "/fallback-avatar.jpg";

export default function ReviewCard({
  name,
  avatar,
  date,
  rating,
  comment,
  canEdit,
  onEdit,
  onDelete,
  spoiler = false,
  reviewId,
}: ReviewProps) {
  const { member } = useMember();
  const t = useTranslations("ReviewCard"); // internacionalização

  const [showSpoiler, setShowSpoiler] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState(avatar || FALLBACK_AVATAR);
  const [deleting, setDeleting] = useState(false);
  const mountedRef = useRef(true);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleDelete = async () => {
    if (!reviewId || deleting) return;
    setDeleting(true);
    try {
      const result = await deleteReview(reviewId);
      if (result) {
        toast.success(t("deletedSuccess"));
        onDelete?.();
      } else {
        toast.error(t("deletedError"));
      }
    } catch (err) {
      console.error("❌ Erro ao executar deleteReview:", err);
      toast.error(t("deletedUnexpected"));
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push(<FaStar key={i} className="text-xl text-[var(--color-lightgreen)]" />);
      } else if (rating >= i - 0.5) {
        stars.push(<FaStarHalfAlt key={i} className="text-xl text-[var(--color-lightgreen)]" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-xl text-gray-700" />);
      }
    }
    return stars;
  };

  return (
    <div className="relative">
      <article className="bg-[#0D1117] rounded-lg p-6 shadow-md border border-white/10 hover:border-[var(--color-lightgreen)] transition duration-200 relative">
        {/* Edit/Delete */}
        {canEdit && (
          <div className="absolute top-4 right-4 flex gap-3">
            <button
              onClick={onEdit}
              className="text-white/70 hover:text-white rounded"
              title={t("edit")}
              aria-label={t("edit")}
            >
              <FaPen />
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="text-white/70 hover:text-red-500 rounded"
              title={t("delete")}
              aria-label={t("delete")}
            >
              <FaTrash />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <img
            src={avatarSrc}
            alt={`${t("avatarOf")} ${name}`}
            onError={() => setAvatarSrc(FALLBACK_AVATAR)}
            className="w-12 h-12 rounded-full object-cover border border-white/10"
          />
          <div>
            <p className="text-white font-semibold">{name}</p>
            <p className="text-sm text-gray-400">{new Date(date).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Stars */}
        <div className="flex items-center gap-1 mb-3">{renderStars()}</div>

        {/* Comment + spoiler */}
        {comment?.trim() && (
          <div className="text-sm text-gray-300 leading-relaxed break-words whitespace-pre-wrap">
            {spoiler && !showSpoiler ? (
              <div>
                <p className="select-none transition duration-300 blur-sm">{comment}</p>
                <button
                  onClick={() => setShowSpoiler(true)}
                  className="mt-3 px-4 py-2 bg-transparent border border-[var(--color-lightgreen)] text-[var(--color-lightgreen)] hover:bg-[var(--color-lightgreen)] hover:text-black transition font-medium text-sm rounded"
                >
                  {t("viewReview")}
                </button>
              </div>
            ) : (
              <p>{comment}</p>
            )}
          </div>
        )}

        {/* Botão mostrar comentários */}
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            title={t("comments")}
            onClick={() => setShowComments((s) => !s)}
            className="p-2 rounded hover:bg-white/5 transition text-white/80"
            aria-pressed={showComments}
          >
            <FaComments />
          </button>
        </div>
      </article>

      {/* Confirm delete */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="bg-[#0D1117] p-6 rounded-lg shadow-md border border-white/10 w-[90%] max-w-md"
          >
            <h2 id="confirm-title" className="text-white text-lg font-semibold mb-4">
              {t("confirmDelete")}
            </h2>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border border-gray-500 text-gray-300 hover:bg-gray-700 rounded"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-50"
              >
                {deleting ? t("deleting") : t("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comentários */}
      {showComments && reviewId && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <CommentsSection reviewId={reviewId} />
        </div>
      )}
    </div>
  );
}
