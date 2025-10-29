// src/app/api/ai/chat/route.ts
import { NextRequest } from "next/server";

export const runtime = "edge";

// ====== ENV ======
const GROQ_API_KEY = process.env.GROQ_API_KEY ?? "";
const SERPER_API_KEY = process.env.SERPER_API_KEY ?? "";
const MODEL = "llama-3.3-70b-versatile";

// ====== AJUDA: detectar quando precisa web ======
function needsWebSearch(userText: string): boolean {
  const t = userText.toLowerCase().trim();

  // força manual via prefixos
  if (t.startsWith("web:") || t.startsWith("now:")) return true;

  // heurística básica para fatos/atualidades/datas
  const triggers = [
    "quando", "que dia", "data", "lançamento", "estreia", "estreou",
    "saiu", "vai sair", "hoje", "agora", "recentemente",
    "ganhou", "oscar", "prêmio", "bilheteria", "notícia",
    "temporada", "episódio", "elenco", "escalação", "trilha sonora",
    "setlist", "turnê", "tour", "álbum", "single", "chart", "parada", "spotify",
  ];
  return triggers.some((k) => t.includes(k));
}

// ====== CHAMADA SERPER (Google Search API) ======
async function serperSearch(query: string) {
  if (!SERPER_API_KEY) return null;

  const body = {
    q: query,
    gl: "br",             // país (pt-BR)
    hl: "pt-br",          // idioma resultados
    num: 8,               // 4–8 é um bom equilíbrio
    // siteFilters opcional: prioriza fontes específicas
    // siteFilters: ["themoviedb.org","imdb.com","rottentomatoes.com","wikipedia.org","spotify.com","music.apple.com"]
  };

  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": SERPER_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Serper error (${res.status}): ${txt}`);
  }

  const json = await res.json();
  return json;
}

// ====== FORMATA O CONTEXTO PRO LLM ======
function buildWebContext(serp: any) {
  if (!serp) return "";

  // answerBox / knowledgeGraph quando existirem
  const extraBits: string[] = [];
  if (serp.answerBox?.answer) {
    extraBits.push(`Resposta direta: ${serp.answerBox.answer}`);
  }
  if (serp.knowledgeGraph?.title) {
    const kg = serp.knowledgeGraph;
    const desc = kg.description ? ` — ${kg.description}` : "";
    extraBits.push(`Knowledge: ${kg.title}${desc}`);
  }

  // orgânicos
  const lines: string[] = [];
  const org = Array.isArray(serp.organic) ? serp.organic.slice(0, 8) : [];
  for (const r of org) {
    const title = r.title || "(sem título)";
    const link = r.link || r.url || "";
    const snippet = r.snippet || r.snippets?.[0] || "";
    const date = r.date ? ` [${r.date}]` : "";
    lines.push(`- ${title}${date}\n  ${snippet}\n  ${link}`);
  }

  const header = [
    "### Fonte: Web search (Serper.dev)",
    ...(extraBits.length ? ["", ...extraBits] : []),
    "",
    "Resultados:",
    ...lines,
  ].join("\n");

  return header;
}

// ====== LIMPA PREFIXOS (web:/now:) DO TEXTO DO USUÁRIO ======
function stripManualPrefixes(text: string): string {
  let t = text.trim();
  if (t.toLowerCase().startsWith("web:")) t = t.slice(4).trim();
  if (t.toLowerCase().startsWith("now:")) t = t.slice(4).trim();
  return t;
}

export async function GET() {
  return new Response(
    JSON.stringify({
      ok: true,
      hasKey: !!GROQ_API_KEY,
      hasSerper: !!SERPER_API_KEY,
      model: MODEL,
    }),
    { headers: { "Content-Type": "application/json; charset=utf-8" } }
  );
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

    // última mensagem do usuário
    const lastUser = [...messages].reverse().find((m) => m?.role === "user");
    const originalUserText: string = typeof lastUser?.content === "string" ? lastUser.content : "";
    const cleanedUserText = stripManualPrefixes(originalUserText);

    // ====== (Opcional) BUSCA NA WEB ======
    let webContext = "";
    const shouldSearch = SERPER_API_KEY && originalUserText && needsWebSearch(originalUserText);
    if (shouldSearch) {
      try {
        const serp = await serperSearch(cleanedUserText);
        webContext = buildWebContext(serp);
      } catch (err: any) {
        // não derruba a resposta da IA; só inclui aviso no contexto
        webContext = `### Web search falhou\nMotivo: ${(err?.message || "erro desconhecido")}\n`;
      }
    }

    // ====== MENSAGENS PARA O GROQ ======
    const groqMessages = [
      {
        role: "system",
        content:
          "Você é a IA do ScoreIt. Responda na linguagem da pergunta, de forma clara, direta e bem escrita (sem erros). Foque em filmes, séries e músicas. Se houver incerteza, explique como verificaria (ex.: catálogos oficiais, ScoreIt API). Quando fizer listas, use bullets curtos.",
      },
      // injeta contexto factual se existir
      ...(webContext
        ? [
            {
              role: "system" as const,
              content:
                "Contexto factual obtido agora da web. Use isso como base, cite fontes pelo nome e, quando fizer sentido, inclua as URLs.\n\n" +
                webContext,
            },
          ]
        : []),
      // mensagens originais (com o texto do usuário limpo)
      ...messages.map((m: any) =>
        m?.role === "user" && typeof m?.content === "string"
          ? { role: "user", content: m.content === originalUserText ? cleanedUserText : m.content }
          : { role: m.role, content: m.content }
      ),
    ];

    // ====== CHAMADA GROQ ======
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

    // ====== STREAM (SSE) COM BUFFER DE LINHAS ======
    const stream = new ReadableStream({
      start(controller) {
        const reader = groqRes.body!.getReader();
        const textDecoder = new TextDecoder();
        const textEncoder = new TextEncoder();

        let buffer = ""; // acumula linhas quebradas entre chunks

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
