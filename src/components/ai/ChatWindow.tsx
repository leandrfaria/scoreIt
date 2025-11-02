"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import { sendChat } from "./client";
import { ChatMessage } from "./schema";
import { useMember } from "@/context/MemberContext";
import { useTranslations } from "next-intl";

export default function ChatWindow() {
  const t = useTranslations("ChatWindow");
  const { member } = useMember();

  // chave por usuário (isola histórico entre perfis)
  const storageKey = useMemo(
    () => `scoreit:ai:chat:${member?.id ?? "user"}`,
    [member?.id]
  );

  const WELCOME: ChatMessage = {
    id: "sys-welcome",
    role: "assistant",
    content: t("welcome"),
  };

  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [loading, setLoading] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  // ----- carregar histórico salvo -----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // sanity check de estrutura
        const ok = parsed.every(
          (m) =>
            m &&
            typeof m.id === "string" &&
            typeof m.role === "string" &&
            typeof m.content === "string"
        );
        if (ok) setMessages(parsed);
      }
    } catch {
      // ignora erro de parse
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // ----- salvar histórico a cada mudança -----
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      // storage cheio / indisponível -> ignora
    }
  }, [messages, storageKey]);

  // ----- autoscroll -----
  useEffect(() => {
    viewportRef.current?.scrollTo({
      top: viewportRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  // ----- enviar -----
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
        setMessages((prev) => prev.map((m) => (m.id === assistant.id ? assistant : m)));
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: t("errors.unavailable"),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ----- limpar histórico (opcional) -----
  const handleClear = () => {
    setMessages([WELCOME]);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  };

  return (
    <div
      className="
        flex flex-col
        h-[65svh] sm:h-[70svh] lg:h-[64svh]
        border border-white/10 rounded-xl overflow-hidden
      "
    >
      {/* header compacto no mobile */}
      <div className="sm:hidden flex items-center justify-between px-3 py-2 border-b border-white/10 bg-neutral-900">
        <span className="text-xs text-white/70">{t("headerTitle")}</span>
        <button
          onClick={handleClear}
          className="text-[11px] px-2 py-1 rounded bg-white/5 ring-1 ring-white/10 hover:bg-white/10"
        >
          {t("clearButton")}
        </button>
      </div>

      <div
        ref={viewportRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-neutral-950 custom-scroll"
      >
        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} />
        ))}
        {loading && (
          <div className="text-xs text-neutral-400 animate-pulse">{t("typing")}</div>
        )}
      </div>

      <div
        className="
          sticky bottom-0 border-t border-white/10
          bg-neutral-900 p-2 sm:p-3
          [padding-bottom:calc(env(safe-area-inset-bottom,0)+0.25rem)]
        "
      >
        {require("react").createElement(
          require("./ChatInput").default,
          { onSend: handleSend, disabled: loading },
          null
        )}
      </div>
    </div>
  );
}
