"use client";

import { useMemo, useState } from "react";
import { FaStar, FaTrash, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import toast from "react-hot-toast";
import { deleteReview } from "@/services/review/delete_review";
import { useTranslations, useLocale } from "next-intl";

type ReviewProfileCardProps = {
  title: string;
  posterUrl: string;
  date: string;
  rating: number;
  comment?: string;
  canEdit?: boolean;
  onDelete?: () => void;
  reviewId?: number;
};

const FALLBACK_POSTER = "/fallback.jpg";

export default function ReviewProfileCard({
  title,
  posterUrl,
  date,
  rating,
  comment,
  canEdit = false, // valor padrão false
  onDelete,
  reviewId,
}: ReviewProfileCardProps) {
  const t = useTranslations("ReviewProfileCard");
  const locale = useLocale();
  const [showConfirm, setShowConfirm] = useState(false);
  const [posterSrc, setPosterSrc] = useState(posterUrl || FALLBACK_POSTER);
  const [deleting, setDeleting] = useState(false);

  const score = useMemo(() => Math.max(0, Math.min(5, Number(rating) || 0)), [rating]);

  const handleDelete = async () => {
    if (!reviewId || deleting) return;
    setDeleting(true);
    const success = await deleteReview(reviewId);
    setDeleting(false);
    if (success) {
      toast.success(t("deletedSuccess"), {
        style: { background: "#101418", color: "#fff", border: "1px solid #4ade80" },
        icon: "🗑️",
      });
      onDelete?.();
    } else {
      toast.error(t("deletedError"));
    }
    setShowConfirm(false);
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (score >= i)
        stars.push(<FaStar key={i} className="text-base text-emerald-400" aria-hidden />);
      else if (score >= i - 0.5)
        stars.push(<FaStarHalfAlt key={i} className="text-base text-emerald-400" aria-hidden />);
      else stars.push(<FaRegStar key={i} className="text-base text-zinc-600" aria-hidden />);
    }
    return stars;
  };

  const formatDate = (iso: string | Date) => {
    if (!iso) return "N/A";

    // Se já for Date, usa direto com locale
    if (iso instanceof Date) return iso.toLocaleDateString(locale);

    // Tenta extrair partes YYYY-MM-DD (aceita também ISO com T/Z)
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      const year = Number(m[1]);
      const month = Number(m[2]); // 1..12
      const day = Number(m[3]);

      // cria data no horário local sem efeitos de fuso
      const d = new Date(year, month - 1, day);

      // formata com o locale atual (pt-BR -> dd/mm; en-US -> mm/dd)
      return d.toLocaleDateString(locale);
    }

    // fallback: deixa o motor lidar com a string
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(locale);
    } catch {
      return String(iso);
    }
  };


  const formattedDate = formatDate(date);
  const hasComment = !!comment?.trim();

  return (
    <div className="group relative min-w-[300px] max-w-[300px] sm:min-w-[340px] sm:max-w-[340px]">
      <article className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c1220]/90 via-[#0d1117]/90 to-[#0d1117]/90 shadow-sm transition-all duration-200 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.35)]">
        {canEdit && (
          <div className="absolute top-2 right-2 z-10">
            <button
              onClick={() => setShowConfirm(true)}
              className="rounded-full p-2 bg-black/30 text-white/80 hover:text-red-400 hover:bg-black/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              title={t("delete")}
              aria-label={t("delete")}
            >
              <FaTrash />
            </button>
          </div>
        )}

        <div className="p-5">
          <div className="flex gap-5">
            <img
              src={posterSrc}
              alt={title}
              onError={() => setPosterSrc(FALLBACK_POSTER)}
              className="w-[84px] h-[126px] sm:w-[96px] sm:h-[144px] object-cover rounded-lg ring-1 ring-white/10"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm sm:text-base leading-snug line-clamp-2 pr-6">
                {title}
              </h3>
              <p className="text-xs text-gray-400 mt-1">{formattedDate}</p>

              <div className="mt-2">
                {score > 0 ? (
                  <div className="flex items-center gap-1" aria-label={`${t("score")}: ${score} / 5`}>
                    {renderStars()}
                  </div>
                ) : (
                  <span className="inline-block text-[11px] px-2 py-1 rounded-full border border-dashed border-zinc-600 text-zinc-300">
                    {t("noScore")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 min-h-[32px] sm:min-h-[32px]">
            {hasComment && (
              <p className="text-sm leading-relaxed text-gray-200 break-words whitespace-pre-wrap">
                {comment}
              </p>
            )}
          </div>
        </div>
      </article>

      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title-profile"
            className="bg-[#0D1117] p-6 rounded-lg shadow-md border border-white/10 w-[90%] max-w-md"
          >
            <h2 id="confirm-title-profile" className="text-white text-lg font-semibold mb-4">
              {t("confirmDelete")}
            </h2>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border border-gray-500 text-gray-300 hover:bg-gray-700 rounded transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                {t("cancel")}
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete();
                }}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                {deleting ? t("deleting") : t("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
