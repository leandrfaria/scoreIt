import type { ChatMessage } from "./schema";

/**
 * Envia o histórico para a rota /api/ai/chat e retorna um ReadableStream para renderizar em tempo real.
 */
export async function sendChat(history: ChatMessage[]) {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    body: JSON.stringify({ messages: history }),
  });
  if (!res.ok || !res.body) {
    throw new Error("IA offline");
  }
  return { stream: res.body };
}
