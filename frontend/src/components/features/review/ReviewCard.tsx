"use client";

import { FaStar } from "react-icons/fa";

type ReviewProps = {
  name: string;
  avatar: string;
  date: string;
  rating: number;
  comment?: string;
};

export default function ReviewCard({ name, avatar, date, rating, comment }: ReviewProps) {
  return (
    <div className="bg-[#0D1117] rounded-lg p-6 shadow-md border border-white/10 hover:border-[var(--color-lightgreen)] transition duration-200">
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
        <p className="text-gray-300 text-sm leading-relaxed">{comment}</p>
      )}
    </div>
  );
}
