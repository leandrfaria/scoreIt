// src/components/ai/MessageBubble.tsx
"use client";

import clsx from "clsx";
import { ChatMessage } from "./schema";

export default function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  return (
    <div
      className={clsx(
        "max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed border",
        {
          "ml-auto bg-[color:var(--color-mediumgreen)]/15 border-[color:var(--color-mediumgreen)]/30":
            isUser,
          "mr-auto bg-neutral-800/60 border-white/10": !isUser,
        }
      )}
    >
      <div className="whitespace-pre-wrap">{msg.content}</div>
    </div>
  );
}

