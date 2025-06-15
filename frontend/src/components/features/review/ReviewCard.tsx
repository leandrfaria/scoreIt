import { useState } from "react";
import { FaStar, FaPen } from "react-icons/fa";

type ReviewProps = {
  name: string;
  avatar: string;
  date: string;
  rating: number;
  comment?: string;
  canEdit?: boolean;
  onEdit?: () => void;
  spoiler?: boolean;
};

export default function ReviewCard({
  name,
  avatar,
  date,
  rating,
  comment,
  canEdit,
  onEdit,
  spoiler = false,
}: ReviewProps) {
  const [showSpoiler, setShowSpoiler] = useState(false);

  return (
    <div className="bg-[#0D1117] rounded-lg p-6 shadow-md border border-white/10 hover:border-[var(--color-lightgreen)] transition duration-200 relative">
      {canEdit && (
        <button
          onClick={onEdit}
          className="absolute top-4 right-4 text-white/60 hover:text-white"
        >
          <FaPen />
        </button>
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

      <div className="flex items-center gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <FaStar
            key={i}
            className={`text-xl ${
              i < rating ? "text-[var(--color-lightgreen)]" : "text-gray-700"
            }`}
          />
        ))}
      </div>

      {comment?.trim() && (
        <div className="text-sm text-gray-300 leading-relaxed">
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
  );
}
