"use client";

import { Dialog } from "@headlessui/react";
import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "@/styles/react-datepicker-dark.css";
import { updateReview } from "@/services/review/update_review";
import toast from "react-hot-toast";
import { FaCheckCircle, FaStar } from "react-icons/fa";

function formatDateTimeLocal(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface EditReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: {
    id: number;
    score: number;
    watchDate: string;
    memberReview: string;
    spoiler: boolean;
  };
}

export default function EditReviewModal({ isOpen, onClose, review }: EditReviewModalProps) {
  const [score, setScore] = useState(review.score);
  const [watchDate, setWatchDate] = useState<Date | null>(new Date(review.watchDate));
  const [memberReview, setMemberReview] = useState(review.memberReview || "");
  const [spoiler, setSpoiler] = useState(review.spoiler);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!score || !watchDate) return;
    setIsSubmitting(true);

    const payload = {
      id: review.id,
      score,
      watchDate: formatDateTimeLocal(watchDate),
      memberReview: memberReview.trim(),
      spoiler,
    };

    const success = await updateReview(payload);
    setIsSubmitting(false);

    if (success) {
      toast.success("Avaliação atualizada com sucesso!");
      onClose();
    } else {
      toast.error("Erro ao atualizar avaliação.");
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-lg rounded-lg bg-[#02070A] text-white shadow-lg border border-white/10 p-6 space-y-6">
          <Dialog.Title className="text-2xl font-bold">Editar Avaliação</Dialog.Title>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">Sua nota</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <FaStar
                  key={i}
                  className={`cursor-pointer text-2xl transition ${i <= score ? "text-[var(--color-lightgreen)]" : "text-gray-600"}`}
                  onClick={() => setScore(i)}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">Data que assistiu</label>
            <DatePicker
              selected={watchDate}
              onChange={(date) => setWatchDate(date)}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="dd/MM/yyyy HH:mm"
              className="bg-zinc-800 text-white p-2 rounded border border-white/10 w-full"
              calendarClassName="react-datepicker"
              popperClassName="z-50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">Comentário</label>
            <textarea
              value={memberReview}
              onChange={(e) => setMemberReview(e.target.value)}
              rows={4}
              className="bg-zinc-800 text-white p-2 rounded border border-white/10 resize-none"
              placeholder="Atualize sua opinião..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="spoiler"
              checked={spoiler}
              onChange={() => setSpoiler(!spoiler)}
              className="accent-red-500"
            />
            <label htmlFor="spoiler" className="text-sm text-gray-300">
              Contém spoiler
            </label>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-zinc-700 hover:bg-zinc-600 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 rounded bg-[var(--color-darkgreen)] hover:brightness-110 transition font-semibold"
            >
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
