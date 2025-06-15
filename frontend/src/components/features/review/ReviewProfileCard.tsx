"use client";

import { useState } from "react";
import { FaStar, FaTrash, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import toast from "react-hot-toast";
import { deleteReview } from "@/services/review/delete_review";

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

export default function ReviewProfileCard({
  title,
  posterUrl,
  date,
  rating,
  comment,
  canEdit,
  onDelete,
  reviewId,
}: ReviewProfileCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    if (!reviewId) {
      console.error("❌ ID da review ausente.");
      return;
    }

    const success = await deleteReview(reviewId);
    if (success) {
      toast.success("Avaliação excluída com sucesso!", {
        style: {
          background: "#1f1f1f",
          color: "#fff",
          border: "1px solid #4ade80",
        },
        icon: "🗑️",
      });

      onDelete?.();
      if (!onDelete) location.reload();
    } else {
      toast.error("Erro ao deletar a avaliação.");
    }

    setShowConfirm(false);
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push(<FaStar key={i} className="text-base text-[var(--color-lightgreen)]" />);
      } else if (rating >= i - 0.5) {
        stars.push(<FaStarHalfAlt key={i} className="text-base text-[var(--color-lightgreen)]" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-base text-gray-700" />);
      }
    }
    return stars;
  };

  return (
    <div className="relative">
      <div className="bg-[#0D1117] rounded-lg p-6 min-w-[360px] max-w-[360px] min-h-[260px] shadow-md border border-white/10 hover:border-[var(--color-lightgreen)] transition duration-200 relative">
        {canEdit && (
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => setShowConfirm(true)}
              className="text-white/60 hover:text-red-500"
              title="Excluir"
            >
              <FaTrash />
            </button>
          </div>
        )}

        <div className="flex gap-4 mb-4 pr-8">
          <img
            src={posterUrl}
            alt={title}
            className="w-16 h-24 object-cover rounded-md border border-white/10"
          />
          <div className="flex-1">
            <h3 className="text-white font-semibold text-base line-clamp-2 pr-4">{title}</h3>
            <p className="text-sm text-gray-400">{new Date(date).toLocaleDateString("pt-BR")}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 mb-3">{renderStars()}</div>

        {comment?.trim() && (
          <p className="text-gray-300 text-sm leading-relaxed">{comment}</p>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-[#0D1117] p-6 rounded-lg shadow-md border border-white/10 w-[90%] max-w-md">
            <h2 className="text-white text-lg font-semibold mb-4">
              Tem certeza que deseja excluir esta avaliação?
            </h2>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border border-gray-500 text-gray-300 hover:bg-gray-700 rounded transition"
              >
                Cancelar
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete();
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
