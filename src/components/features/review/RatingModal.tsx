"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Dialog } from "@headlessui/react";
import { FaStar } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "@/styles/react-datepicker-dark.css";
import { postReview } from "@/services/review/post_review";
import { useMember } from "@/context/MemberContext";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

/** Garante "YYYY-MM-DD" (sem horário/UTC) */
function formatDateYMD(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Trunca para a meia-noite local (removendo hora/min/seg/ms) */
function stripTimeLocal(d: Date | null): Date | null {
  if (!d) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export default function RatingModal({
  isOpen,
  onClose,
  mediaId,
  mediaType,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  mediaId: string | number;
  mediaType: "movie" | "series" | "album";
  onSuccess?: () => void;
}) {
  const t = useTranslations("RatingModal");
  const titleId = useId();
  const descId = useId();
  const { member } = useMember();

  const [score, setScore] = useState(0);
  const [watchDate, setWatchDate] = useState<Date | null>(null);
  const [memberReview, setMemberReview] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const acRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen) {
      setScore(0);
      setWatchDate(null);
      setMemberReview("");
      setSpoiler(false);
      setIsSubmitting(false);
      acRef.current?.abort();
      acRef.current = new AbortController();
    } else {
      acRef.current?.abort();
      acRef.current = null;
    }
    return () => {
      acRef.current?.abort();
      acRef.current = null;
    };
  }, [isOpen]);

  const isDateValid = (date: Date | null) => {
    if (!date) return false;
    const now = new Date();
    const minDate = new Date("2020-01-01T00:00:00");
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return d <= today && d >= minDate;
  };

  const reviewLen = memberReview.trim().length;
  const isReviewValid = reviewLen <= 250;
  const canSubmit =
    !!member && score > 0 && !!watchDate && isDateValid(watchDate) && isReviewValid && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit || !watchDate || !member) return;
    setIsSubmitting(true);

    const payload = {
      mediaId,
      mediaType,
      memberId: member.id,
      score,
      watchDate: formatDateYMD(watchDate),
      memberReview: memberReview.trim(),
      spoiler,
    };

    const signal = acRef.current?.signal;

    const success = await postReview(payload, { signal });
    setIsSubmitting(false);

    if (success) {
      toast.success(t("reviewSent"));
      onClose();
      onSuccess?.();
    } else {
      toast.error(t("reviewError"));
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50" aria-labelledby={titleId} aria-describedby={descId}>
      <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-lg rounded-lg bg-[#02070A] text-white shadow-lg border border-white/10 p-6 space-y-6">
          <Dialog.Title id={titleId} className="text-2xl font-bold">{t("title")}</Dialog.Title>
          <p id={descId} className="sr-only">{t("description")}</p>

          {/* Nota */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">{t("yourScore")}</label>
            <div role="radiogroup" aria-label={t("scoreAriaLabel")} className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => {
                const selected = i <= score;
                return (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={t("starLabel", { count: i })}
                    onClick={() => setScore(i)}
                    className={`cursor-pointer text-2xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-lightgreen)] rounded-sm ${
                      selected ? "text-[var(--color-lightgreen)]" : "text-gray-600"
                    }`}
                  >
                    <FaStar />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Data */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">{t("watchDate")}</label>
            <DatePicker
              selected={watchDate}
              onChange={(date) => setWatchDate(stripTimeLocal(date))}
              dateFormat="dd/MM/yyyy"
              placeholderText={t("selectDate")}
              className="bg-zinc-800 text-white p-2 rounded border border-white/10 w-full focus:outline-none focus:ring-2 focus:ring-[var(--color-lightgreen)]"
              calendarClassName="react-datepicker"
              popperClassName="z-50"
              maxDate={new Date()}
              minDate={new Date("2020-01-01")}
              showTimeSelect={false}
            />
            {!isDateValid(watchDate) && (
              <span className="text-xs text-red-400">{t("invalidDate")}</span>
            )}
          </div>

          {/* Review */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">{t("reviewLabel")}</label>
            <textarea
              value={memberReview}
              onChange={(e) => setMemberReview(e.target.value)}
              maxLength={250}
              rows={4}
              className="bg-zinc-800 text-white p-2 rounded border border-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--color-lightgreen)] resize-none"
              placeholder={t("reviewPlaceholder")}
            />
            <span className={`text-sm ${isReviewValid ? "text-gray-400" : "text-red-400"}`}>
              {reviewLen} / 250 {t("characters")}
            </span>
          </div>

          {/* Spoiler */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="spoiler-create"
              checked={spoiler}
              onChange={() => setSpoiler((s) => !s)}
              className="accent-red-500"
            />
            <label htmlFor="spoiler-create" className="text-sm text-gray-300">
              {t("containsSpoiler")}
            </label>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded bg-zinc-700 hover:bg-zinc-600 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-50"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-6 py-2 rounded bg-[var(--color-darkgreen)] hover:brightness-110 transition font-semibold disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-lightgreen)]"
            >
              {isSubmitting ? t("sending") : t("sendReview")}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
