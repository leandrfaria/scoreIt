// src/components/ai/client.ts
import type { ChatMessage } from "./schema";

export async function sendChat(history: ChatMessage[]) {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json", // <<< importante
    },
    body: JSON.stringify({ messages: history }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "IA offline");
    throw new Error(err || "IA offline");
  }

  const ct = res.headers.get("content-type") || "";

  if (ct.includes("application/json")) {
    const json = await res.json();
    const content =
      json?.choices?.[0]?.message?.content ??
      (typeof json === "string" ? json : JSON.stringify(json));
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(content));
        controller.close();
      },
    });
    return { stream };
  }

  if (!res.body) throw new Error("IA offline");
  return { stream: res.body };
}
