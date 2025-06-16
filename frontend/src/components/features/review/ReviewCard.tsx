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

  const handleDelete = async () => {
    if (!reviewId) {
      console.error("🚫 ID da review ausente.");
      return;
    }

    console.log("🗑️ Tentando excluir a review com ID:", reviewId);

    try {
      const result = await deleteReview(reviewId);

      if (result) {
        toast.success("Avaliação excluída com sucesso!");
        onDelete?.();
        if (!onDelete) window.location.reload();
      } else {
        toast.error("Erro ao excluir a avaliação.");
      }
    } catch (err) {
      console.error("❌ Erro ao executar deleteReview:", err);
      toast.error("Erro inesperado ao excluir.");
    } finally {
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
      <div className="bg-[#0D1117] rounded-lg p-6 shadow-md border border-white/10 hover:border-[var(--color-lightgreen)] transition duration-200 relative">
        {canEdit && (
          <div className="absolute top-4 right-4 flex gap-3">
            <button onClick={onEdit} className="text-white/60 hover:text-white" title="Editar">
              <FaPen />
            </button>
            <button
              onClick={() => {
                console.log("⚠️ Abrindo modal de confirmação de exclusão");
                setShowConfirm(true);
              }}
              className="text-white/60 hover:text-red-500"
              title="Excluir"
            >
              <FaTrash />
            </button>
          </div>
        )}

        <div className="flex items-center gap-4 mb-4">
          <img
            src={avatar}
            alt={name}
            className="w-12 h-12 rounded-full object-cover border border-white/10"
          />
          <div>
            <p className="text-white font-semibold">{name}</p>
            <p className="text-sm text-gray-400">
              {new Date(date).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 mb-3">{renderStars()}</div>

        {comment?.trim() && (
          <div className="text-sm text-gray-300 leading-relaxed break-words whitespace-pre-wrap">
            {spoiler && !showSpoiler ? (
              <>
                <p className="blur-sm select-none transition duration-300">{comment}</p>
                <button
                  onClick={() => setShowSpoiler(true)}
                  className="mt-3 px-4 py-2 bg-transparent border border-[var(--color-lightgreen)] text-[var(--color-lightgreen)] hover:bg-[var(--color-lightgreen)] hover:text-black transition font-medium text-sm"
                >
                  Ver Avaliação
                </button>
              </>
            ) : (
              <p>{comment}</p>
            )}
          </div>
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
                onClick={() => {
                  console.log("❌ Cancelado");
                  setShowConfirm(false);
                }}
                className="px-4 py-2 border border-gray-500 text-gray-300 hover:bg-gray-700 rounded transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
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
