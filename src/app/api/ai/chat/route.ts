import { NextRequest } from "next/server";

export const runtime = "edge";

const GROQ_API_KEY = process.env.GROQ_API_KEY!;
const MODEL = "llama-3.1-70b-versatile"; // pode trocar por 8B se quiser baratear

export async function POST(req: NextRequest) {
  if (!GROQ_API_KEY) {
    return new Response(
      "Falta GROQ_API_KEY no ambiente. Adicione no .env.local",
      { status: 500 }
    );
  }

  try {
    const { messages } = await req.json();

    const groqMessages = [
      {
        role: "system",
        content:
          "Você é a IA do ScoreIt. Responda em português, de forma clara e direta. Foco em filmes, séries e músicas. Se tiver incerteza, explique como verificaria (ex.: buscar catálogos oficiais, consultar ScoreIt API).",
      },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
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
      }
    );

    if (!groqRes.ok || !groqRes.body) {
      return new Response("Erro ao contatar Groq", { status: 500 });
    }

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

          // A API da Groq usa SSE (linhas com `data:`); puxamos apenas o conteúdo
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
  } catch {
    return new Response("Requisição inválida", { status: 400 });
  }
}
