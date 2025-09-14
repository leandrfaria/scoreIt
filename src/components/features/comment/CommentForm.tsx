"use client";
import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

interface CommentFormProps {
  initialValue?: string;
  onCancel?: () => void;
  onSubmit: (content: string) => Promise<void> | void;
  submitLabel?: string;
  autoFocus?: boolean;
}

const MAX_LEN = 250;

const CommentForm = forwardRef<HTMLTextAreaElement, CommentFormProps>(
  ({ initialValue = "", onCancel, onSubmit, submitLabel, autoFocus = false }, ref) => {
    const t = useTranslations("CommentForm");
    const [value, setValue] = useState(initialValue);
    const [submitting, setSubmitting] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    // atualizar o estado quando initialValue muda (ex.: abrir reply com @nome)
    useEffect(() => {
      setValue(initialValue);
    }, [initialValue]);

    // expõe a textarea para o pai (foco / setSelectionRange)
    useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

    const handleSubmit = async (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmed = value.trim();
      if (!trimmed) return;
      try {
        setSubmitting(true);
        // garante limite
        await onSubmit(trimmed.slice(0, MAX_LEN));
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
          ref={textareaRef}
          className="w-full rounded bg-[#0b1114] text-white p-2 min-h-[64px] resize-none border border-white/10 break-words whitespace-pre-wrap"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("placeholder")}
          autoFocus={autoFocus}
          maxLength={MAX_LEN}
        />
        <div className="flex items-center justify-between mt-2">
          <div className="flex gap-2">
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

          <span className={`text-sm ${value.length <= MAX_LEN ? "text-gray-400" : "text-red-400"}`}>
            {value.length} / {MAX_LEN}
          </span>
        </div>
      </form>
    );
  }
);

CommentForm.displayName = "CommentForm";

export default CommentForm;
