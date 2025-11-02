// ReviewCard.tsx
"use client";
import React, { useState, useRef, useEffect } from "react";
import { FaStar, FaStarHalfAlt, FaRegStar, FaPen, FaTrash, FaComments } from "react-icons/fa";
import toast from "react-hot-toast";
import { deleteReview } from "@/services/review/delete_review";
import { useMember } from "@/context/MemberContext";
import CommentsSection from "@/components/features/comment/CommentSection";
import { useTranslations, useLocale } from "next-intl";

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
  const t = useTranslations("ReviewCard");
  const locale = useLocale();

  const [avatarSrc, setAvatarSrc] = useState(avatar || FALLBACK_AVATAR);
  const [deleting, setDeleting] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showSpoiler, setShowSpoiler] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
      console.error(err);
      toast.error(t("deletedUnexpected"));
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) stars.push(<FaStar key={i} className="text-xl text-[var(--color-lightgreen)]" />);
      else if (rating >= i - 0.5)
        stars.push(<FaStarHalfAlt key={i} className="text-xl text-[var(--color-lightgreen)]" />);
      else stars.push(<FaRegStar key={i} className="text-xl text-gray-700" />);
    }
    return stars;
  };

  // formata a data conforme o idioma, evitando shift por timezone em "date-only"
  const formatDate = (iso: string | Date) => {
    if (!iso) return "N/A";
    const options: Intl.DateTimeFormatOptions = {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    };

    // se já for Date, formata direto
    if (iso instanceof Date) {
      if (isNaN(iso.getTime())) return "N/A";
      return new Intl.DateTimeFormat(locale || undefined, options).format(iso);
    }

    const s = String(iso).trim();

    // caso 1: date-only "YYYY-MM-DD" -> criar Date no timezone LOCAL (sem shift)
    const dateOnly = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnly) {
      const year = Number(dateOnly[1]);
      const month = Number(dateOnly[2]); // 1..12
      const day = Number(dateOnly[3]);
      const d = new Date(year, month - 1, day); // cria meia-noite LOCAL
      return new Intl.DateTimeFormat(locale || undefined, options).format(d);
    }

    // caso 2 (fallback): string com hora/offset ou outro formato ISO -> deixamos o Date interpretar
    const parsed = new Date(s);
    if (isNaN(parsed.getTime())) return "N/A";
    return new Intl.DateTimeFormat(locale || undefined, options).format(parsed);
  };


  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", showCommentsModal);
  }, [showCommentsModal]);

  return (
    <div className="relative">
      <article className="bg-[#0D1117] rounded-lg p-6 shadow-md border border-white/10 hover:border-[var(--color-lightgreen)] transition">
        {/* Edit/Delete */}
        {canEdit && (
          <div className="absolute top-4 right-4 flex gap-3">
            <button
              onClick={onEdit}
              className="text-white/70 hover:text-white rounded"
              title={t("edit")}
            >
              <FaPen />
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="text-white/70 hover:text-red-500 rounded"
              title={t("delete")}
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
            <p className="text-sm text-gray-400">{formatDate(date)}</p>
          </div>
        </div>

        {/* Stars */}
        <div className="flex items-center gap-1 mb-3">{renderStars()}</div>

        {/* Comment + spoiler */}
        {comment && comment.trim() && (
          <div className="text-sm text-gray-300 leading-relaxed break-words whitespace-pre-wrap">
            {spoiler && !showSpoiler ? (
              <div>
                <p className="select-none blur-sm transition">{comment}</p>
                <button
                  onClick={() => setShowSpoiler(true)}
                  className="mt-3 px-4 py-2 bg-transparent border border-[var(--color-lightgreen)] text-[var(--color-lightgreen)] hover:bg-[var(--color-lightgreen)] hover:text-black rounded text-sm font-medium transition"
                >
                  {t("viewReview")}
                </button>
              </div>
            ) : (
              <p>{comment}</p>
            )}
          </div>
        )}

        {/* Open comments */}
        {reviewId && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setShowCommentsModal(true)}
              className="p-2 rounded hover:bg-white/5 transition text-white/80"
            >
              <FaComments />
            </button>
          </div>
        )}
      </article>

      {/* Confirm Delete Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#0D1117] p-6 rounded-lg shadow-md border border-white/10 w-[90%] max-w-md">
            <h2 className="text-white text-lg font-semibold mb-4">{t("confirmDelete")}</h2>
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

      {/* Comments Modal */}
      {showCommentsModal && reviewId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#0D1117] rounded-lg shadow-lg border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex justify-between items-center p-4 border-b border-white/10">
              <h3 className="text-white font-semibold">{t("comments")}</h3>
              <button
                onClick={() => setShowCommentsModal(false)}
                className="text-white/70 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal body */}
            <div className="p-4">
              <CommentsSection
                reviewId={reviewId}
                reviewContent={comment || ""}
                reviewAuthorName={name}
                reviewAuthorAvatar={avatar}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
