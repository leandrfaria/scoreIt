// src/app/api/ai/chat/route.ts
import { NextRequest } from "next/server";

export const runtime = "edge";

const GROQ_API_KEY = process.env.GROQ_API_KEY ?? "";
const MODEL = "llama-3.3-70b-versatile";

export async function POST(req: NextRequest) {
  if (!GROQ_API_KEY) {
    return new Response("Falta GROQ_API_KEY no ambiente (.env.local).", { status: 500 });
  }

  try {
    // garante que o body é JSON
    let body: any = null;
    try {
      body = await req.json();
    } catch {
      return new Response("Body inválido: envie JSON { messages: [...] }.", { status: 400 });
    }

    const messages = Array.isArray(body?.messages) ? body.messages : null;
    if (!messages) {
      return new Response("Campo 'messages' é obrigatório e deve ser um array.", { status: 400 });
    }

    const groqMessages = [
      {
        role: "system",
        content:
          "Você é a IA do ScoreIt. Responda na linguagem da pergunta, de forma clara e direta. Foco em filmes, séries e músicas. Se tiver incerteza, explique como verificaria (ex.: catálogos oficiais, ScoreIt API).",
      },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: groqMessages,
        temperature: 0.6,
        stream: true,
      }),
    });

    // Se a Groq retornar erro, devolvemos o texto e o status exato para debugar
    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return new Response(`Groq error (${groqRes.status}): ${errText}`, {
        status: groqRes.status,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    if (!groqRes.body) {
      return new Response("Groq sem corpo de resposta.", { status: 502 });
    }

    const ct = groqRes.headers.get("content-type") || "";

    // 🔶 Fallback: se veio JSON (sem stream SSE), transforma em texto puro
    if (ct.includes("application/json")) {
      const full = await groqRes.json();
      const content =
        full?.choices?.[0]?.message?.content ??
        (typeof full === "string" ? full : JSON.stringify(full));
      return new Response(content, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    }

    // ✅ Fluxo normal (SSE): extrai os deltas e envia como stream de texto
    const stream = new ReadableStream({
      start(controller) {
        const reader = groqRes.body!.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        const pump = async (): Promise<void> => {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            return;
          }
          const chunk = decoder.decode(value, { stream: true });

          for (const line of chunk.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.replace(/^data:\s*/, "");
            if (payload === "[DONE]") continue;
            try {
              const json = JSON.parse(payload);
              const token = json.choices?.[0]?.delta?.content ?? "";
              if (token) controller.enqueue(encoder.encode(token));
            } catch {
              // ignora keep-alive
            }
          }
          await pump();
        };

        pump();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e: any) {
    const msg = e?.message || "Erro desconhecido no handler.";
    return new Response(`Falha no handler: ${msg}`, { status: 500 });
  }
}
