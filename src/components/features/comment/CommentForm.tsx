"use client";
import React, { useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

export default function CommentForm({
  initialValue = "",
  onCancel,
  onSubmit,
  submitLabel,
  autoFocus = false,
}: {
  initialValue?: string;
  onCancel?: () => void;
  onSubmit: (content: string) => Promise<void> | void;
  submitLabel?: string;
  autoFocus?: boolean;
}) {
  const t = useTranslations("CommentForm");
  const [value, setValue] = useState(initialValue);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!value.trim()) return;
    try {
      setSubmitting(true);
      await onSubmit(value.trim());
      setValue("");
    } catch (err) {
      console.error(err);
      toast.error(t("submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <textarea
        className="w-full rounded bg-[#0b1114] text-white p-2 min-h-[64px] resize-none border border-white/10"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("placeholder")}
        autoFocus={autoFocus}
      />
      <div className="flex gap-2 mt-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-3 py-1 bg-[var(--color-darkgreen)] rounded text-white hover:brightness-110 transition"
        >
          {submitting ? t("submitting") : submitLabel || t("submit")}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1 rounded border border-white/10 text-white/80 hover:bg-white/5"
          >
            {t("cancel")}
          </button>
        )}
      </div>
    </form>
  );
}
