"use client";

import { useState } from "react";
import { FaStar, FaPen, FaTrash, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import toast from "react-hot-toast";
import { deleteReview } from "@/services/review/delete_review";

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
  const [showSpoiler, setShowSpoiler] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState(avatar || FALLBACK_AVATAR);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!reviewId || deleting) return;
    setDeleting(true);
    try {
      const result = await deleteReview(reviewId);
      if (result) {
        toast.success("Avaliação excluída com sucesso!");
        onDelete?.();
      } else {
        toast.error("Erro ao excluir a avaliação.");
      }
    } catch (err) {
      console.error("❌ Erro ao executar deleteReview:", err);
      toast.error("Erro inesperado ao excluir.");
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push(<FaStar key={i} className="text-xl text-[var(--color-lightgreen)]" aria-hidden />);
      } else if (rating >= i - 0.5) {
        stars.push(<FaStarHalfAlt key={i} className="text-xl text-[var(--color-lightgreen)]" aria-hidden />);
      } else {
        stars.push(<FaRegStar key={i} className="text-xl text-gray-700" aria-hidden />);
      }
    }
    return stars;
  };

  return (
    <div className="relative">
      <article className="bg-[#0D1117] rounded-lg p-6 shadow-md border border-white/10 hover:border-[var(--color-lightgreen)] transition duration-200 relative">
        {canEdit && (
          <div className="absolute top-4 right-4 flex gap-3">
            <button
              onClick={onEdit}
              className="text-white/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded"
              title="Editar"
              aria-label="Editar avaliação"
            >
              <FaPen />
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="text-white/70 hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded"
              title="Excluir"
              aria-label="Excluir avaliação"
            >
              <FaTrash />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <img
            src={avatarSrc}
            alt={`Avatar de ${name}`}
            onError={() => setAvatarSrc(FALLBACK_AVATAR)}
            className="w-12 h-12 rounded-full object-cover border border-white/10"
          />
          <div>
            <p className="text-white font-semibold">{name}</p>
            <p className="text-sm text-gray-400">{new Date(date).toLocaleDateString("pt-BR")}</p>
          </div>
        </div>

        {/* Stars */}
        <div className="flex items-center gap-1 mb-3" aria-label={`Nota: ${rating} de 5`}>
          {renderStars()}
        </div>

        {/* Comment + spoiler */}
        {comment?.trim() && (
          <div className="text-sm text-gray-300 leading-relaxed break-words whitespace-pre-wrap">
            {spoiler && !showSpoiler ? (
              <div>
                <p className="select-none transition duration-300 blur-sm">{comment}</p>
                <button
                  onClick={() => setShowSpoiler(true)}
                  className="mt-3 px-4 py-2 bg-transparent border border-[var(--color-lightgreen)] text-[var(--color-lightgreen)] hover:bg-[var(--color-lightgreen)] hover:text-black transition font-medium text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-lightgreen)] rounded"
                >
                  Ver Avaliação
                </button>
              </div>
            ) : (
              <p>{comment}</p>
            )}
          </div>
        )}
      </article>

      {/* Confirm delete (simples e acessível) */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="bg-[#0D1117] p-6 rounded-lg shadow-md border border-white/10 w-[90%] max-w-md"
          >
            <h2 id="confirm-title" className="text-white text-lg font-semibold mb-4">
              Tem certeza que deseja excluir esta avaliação?
            </h2>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border border-gray-500 text-gray-300 hover:bg-gray-700 rounded transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                {deleting ? "Excluindo..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
