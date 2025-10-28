// src/app/api/ai/chat/route.ts
import { NextRequest } from "next/server";

export const runtime = "edge";

const GROQ_API_KEY = process.env.GROQ_API_KEY ?? "";
const MODEL = "llama-3.3-70b-versatile";

export async function GET() {
  return new Response(JSON.stringify({ ok: true, hasKey: !!GROQ_API_KEY }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

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
          "Você é a IA do ScoreIt. Responda na linguagem da pergunta, de forma clara, direta e bem escrita (sem erros). Foque em filmes, séries e músicas. Se houver incerteza, explique como verificaria (ex.: catálogos oficiais, ScoreIt API). Quando fizer listas, use bullets curtos.",
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

    // Fallback: sem stream SSE (veio JSON)
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

    // ✅ Fluxo normal (SSE) COM BUFFER DE LINHAS
    const stream = new ReadableStream({
      start(controller) {
        const reader = groqRes.body!.getReader();
        const textDecoder = new TextDecoder();
        const textEncoder = new TextEncoder();

        let buffer = ""; // <- acumula linhas quebradas entre chunks

        const pump = async (): Promise<void> => {
          const { done, value } = await reader.read();
          if (done) {
            // processa eventual resto de buffer
            if (buffer.trim().startsWith("data:")) {
              const payload = buffer.trim().replace(/^data:\s*/, "");
              if (payload !== "[DONE]") {
                try {
                  const json = JSON.parse(payload);
                  const token = json.choices?.[0]?.delta?.content ?? "";
                  if (token) controller.enqueue(textEncoder.encode(token));
                } catch { /* ignora */ }
              }
            }
            controller.close();
            return;
          }

          // acumula chunk no buffer
          buffer += textDecoder.decode(value, { stream: true });

          // quebra somente em linhas completas; guarda o resto
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? ""; // última pode estar incompleta

          for (const raw of lines) {
            const line = raw.trim();
            if (!line.startsWith("data:")) continue;
            const payload = line.replace(/^data:\s*/, "");
            if (payload === "[DONE]") continue;

            try {
              const json = JSON.parse(payload);
              const token = json.choices?.[0]?.delta?.content ?? "";
              if (token) controller.enqueue(textEncoder.encode(token));
            } catch {
              // se por algum motivo veio incompleto mesmo após split, reanexa ao buffer
              buffer = payload ? buffer + payload : buffer;
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
