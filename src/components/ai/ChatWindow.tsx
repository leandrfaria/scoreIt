// src/components/ai/ChatWindow.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import { sendChat } from "./client";
import { ChatMessage } from "./schema";

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "sys-welcome",
      role: "assistant",
      content:
        "Oi! Eu sou a IA do ScoreIt. Pergunte sobre filmes, séries e músicas. Ex.: “onde assistir Duna 2?”, “melhores thrillers de 2023?”, “recomenda 3 álbuns parecidos com Blonde (Frank Ocean)?”.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    viewportRef.current?.scrollTo({
      top: viewportRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const { stream } = await sendChat([...messages, userMsg]);
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      const assistant: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
      };
      setMessages((prev) => [...prev, assistant]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        assistant.content += decoder.decode(value, { stream: true });
        setMessages((prev) =>
            prev.map((m) => (m.id === assistant.id ? assistant : m))
        );
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Não consegui falar com a IA agora. Tenta novamente em alguns segundos.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[60vh] border border-white/10 rounded-xl overflow-hidden">
      <div
        ref={viewportRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-950 custom-scroll"
      >
        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} />
        ))}
        {loading && (
          <div className="text-xs text-neutral-400 animate-pulse">Digitando…</div>
        )}
      </div>

      <div className="border-t border-white/10 bg-neutral-900 p-3">
        {/* import lazy para evitar re-render caro */}
        {require("react").createElement(
          require("./ChatInput").default,
          { onSend: handleSend, disabled: loading },
          null
        )}
      </div>
    </div>
  );
}
