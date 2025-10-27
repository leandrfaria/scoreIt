// src/components/ai/MessageBubble.tsx
"use client";

import clsx from "clsx";
import { ChatMessage } from "./schema";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
      {/* Markdown bonito */}
      <div className="prose prose-invert prose-sm max-w-none
                      prose-p:my-2 prose-strong:text-white prose-strong:font-semibold
                      prose-ul:my-2 prose-li:my-1 prose-li:marker:text-[color:var(--color-lightgreen)]
                      prose-a:text-[color:var(--color-lightgreen)] hover:prose-a:underline
                      prose-code:px-1 prose-code:py-0.5 prose-code:bg-white/10 prose-code:rounded
                      prose-hr:border-white/10">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // títulos bem discretos
            h1: ({node, ...props}) => <h3 className="text-[1.05rem] font-bold mt-2 mb-1" {...props} />,
            h2: ({node, ...props}) => <h4 className="text-[1rem] font-semibold mt-2 mb-1" {...props} />,
            h3: ({node, ...props}) => <h5 className="text-[0.95rem] font-semibold mt-2 mb-1" {...props} />,
            // links abrindo em nova aba
            a: ({node, ...props}) => <a target="_blank" rel="noopener noreferrer" {...props} />,
            // listas com espaçamento compacto
            ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-1" {...props} />,
            // parágrafos compactos
            p: ({node, ...props}) => <p className="my-2" {...props} />,
          }}
        >
          {msg.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
