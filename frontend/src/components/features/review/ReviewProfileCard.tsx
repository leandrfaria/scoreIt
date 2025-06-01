"use client";

import { FaStar } from "react-icons/fa";

type ReviewProfileCardProps = {
  title: string;
  posterUrl: string;
  date: string;
  rating: number;
  comment?: string;
};

export default function ReviewProfileCard({
  title,
  posterUrl,
  date,
  rating,
  comment,
}: ReviewProfileCardProps) {
  return (
    <div className="bg-[#0D1117] rounded-lg p-6 min-w-[320px] max-w-[320px] shadow-md border border-white/10 hover:border-[var(--color-lightgreen)] transition duration-200">
      <div className="flex gap-4 mb-4">
        <img
          src={posterUrl}
          alt={title}
          className="w-16 h-24 object-cover rounded-md border border-white/10"
        />
        <div className="flex-1">
          <h3 className="text-white font-semibold text-base line-clamp-2">{title}</h3>
          <p className="text-sm text-gray-400">{new Date(date).toLocaleDateString("pt-BR")}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <FaStar
            key={i}
            className={`text-base ${i < rating ? "text-[var(--color-lightgreen)]" : "text-gray-700"}`}
          />
        ))}
      </div>

      {comment?.trim() && (
        <p className="text-gray-300 text-sm leading-relaxed">{comment}</p>
      )}
    </div>
  );
}
