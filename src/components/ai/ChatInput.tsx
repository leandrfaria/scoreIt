// src/components/ai/ChatInput.tsx
"use client";

import { useState } from "react";

export default function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (t: string) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (text.trim()) {
        onSend(text);
        setText("");
      }
    }
  };

  return (
    <div className="flex items-end gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Pergunte algo… (Shift+Enter para quebrar linha)"
        className="flex-1 rounded-lg bg-neutral-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-mediumgreen)] min-h-[40px] max-h-[140px]"
        rows={1}
        disabled={disabled}
      />
      <button
        type="button"
        onClick={() => {
          if (!text.trim()) return;
          onSend(text);
          setText("");
        }}
        disabled={disabled || !text.trim()}
        className="rounded-lg bg-[color:var(--color-mediumgreen)] px-4 py-2 text-sm font-medium hover:brightness-110 disabled:opacity-50"
      >
        Enviar
      </button>
    </div>
  );
}
