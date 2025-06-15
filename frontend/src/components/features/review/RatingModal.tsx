"use client";
import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { FaStar } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "@/styles/react-datepicker-dark.css";
import { postReview } from "@/services/review/post_review";
import { useMember } from "@/context/MemberContext";
import toast from "react-hot-toast";
import { useRouter, usePathname } from "next/navigation";

function formatDateTimeLocal(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function RatingModal({
  isOpen,
  onClose,
  mediaId,
  mediaType,
  onSuccess, // ✅ NOVA PROP
}: {
  isOpen: boolean;
  onClose: () => void;
  mediaId: string | number;
  mediaType: "movie" | "series" | "album";
  onSuccess?: () => void; // ✅ NOVA PROP DEFINIDA
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { member } = useMember();
  const [score, setScore] = useState(0);
  const [watchDate, setWatchDate] = useState<Date | null>(new Date());
  const [memberReview, setMemberReview] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDateValid = (date: Date | null) => {
    if (!date) return false;
    const now = new Date();
    const minDate = new Date("2020-01-01");
    return date <= now && date >= minDate;
  };

  const isReviewValid = memberReview.trim().length <= 260;

  const handleSubmit = async () => {
    if (!score || !watchDate || !member || !isDateValid(watchDate) || !isReviewValid) return;
    setIsSubmitting(true);

    const payload = {
      mediaId,
      mediaType,
      memberId: member.id,
      score,
      watchDate: formatDateTimeLocal(watchDate),
      memberReview: memberReview.trim(),
      spoiler,
    };

    const success = await postReview(payload);
    setIsSubmitting(false);

    if (success) {
      toast.success("Avaliação enviada!");
      setScore(0);
      setWatchDate(new Date());
      setMemberReview("");
      setSpoiler(false);
      onClose();
      onSuccess?.(); // ✅ Notifica que teve avaliação nova
    } else {
      toast.error("Erro ao enviar avaliação.");
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-lg rounded-lg bg-[#02070A] text-white shadow-lg border border-white/10 p-6 space-y-6">
          <Dialog.Title className="text-2xl font-bold">Avaliar</Dialog.Title>

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
              placeholderText="Selecione a data e hora"
              className="bg-zinc-800 text-white p-2 rounded border border-white/10 w-full focus:outline-none"
              calendarClassName="react-datepicker"
              popperClassName="z-50"
              maxDate={new Date()}
              minDate={new Date("2020-01-01")}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">O que achou?</label>
            <textarea
              value={memberReview}
              onChange={(e) => setMemberReview(e.target.value)}
              maxLength={260}
              rows={4}
              className="bg-zinc-800 text-white p-2 rounded border border-white/10 focus:outline-none resize-none"
              placeholder="Compartilhe sua opinião..."
            />
            <span className="text-sm text-gray-400">
              {memberReview.trim().length} / 260 caracteres
            </span>
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
              disabled={isSubmitting}
              className="px-4 py-2 rounded bg-zinc-700 hover:bg-zinc-600 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!score || !watchDate || isSubmitting || !isDateValid(watchDate) || !isReviewValid}
              className="px-6 py-2 rounded bg-[var(--color-darkgreen)] hover:brightness-110 transition font-semibold disabled:opacity-40"
            >
              {isSubmitting ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                "Enviar Avaliação"
              )}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}