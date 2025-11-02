"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

export default function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (t: string) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("ChatInput");
  const [text, setText] = useState("");
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  // auto expand
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(el.scrollHeight, 160); // até ~6 linhas
    el.style.height = next + "px";
  }, [text]);

  const submit = () => {
    if (!text.trim() || disabled) return;
    onSend(text);
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex items-end gap-2 sm:gap-3">
      <textarea
        ref={taRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("placeholder")}
        className="
          flex-1 rounded-lg bg-neutral-800 px-3 py-2 text-sm outline-none
          focus:ring-2 focus:ring-[color:var(--color-mediumgreen)]
          min-h-[40px] max-h-[160px] resize-none
        "
        rows={1}
        disabled={disabled}
      />
      <button
        type="button"
        onClick={submit}
        disabled={disabled || !text.trim()}
        className="
          shrink-0 rounded-lg bg-[color:var(--color-mediumgreen)]
          px-3 py-2 sm:px-4 text-sm font-medium
          hover:brightness-110 disabled:opacity-50
        "
      >
        {t("sendButton")}
      </button>
    </div>
  );
}
