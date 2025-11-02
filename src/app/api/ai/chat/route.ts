// src/app/api/ai/chat/route.ts
import { NextRequest } from "next/server";

export const runtime = "edge";

// ====== ENV ======
const GROQ_API_KEY = process.env.GROQ_API_KEY ?? "";
const SERPER_API_KEY = process.env.SERPER_API_KEY ?? "";
const MODEL = "llama-3.3-70b-versatile";

// ====== LIMPA PREFIXOS (web:/now:) DO TEXTO DO USUÁRIO ======
function stripManualPrefixes(text: string): string {
  let t = text.trim();
  if (t.toLowerCase().startsWith("web:")) t = t.slice(4).trim();
  if (t.toLowerCase().startsWith("now:")) t = t.slice(4).trim();
  return t;
}

// ====== HEURÍSTICA: decidir quando procurar na web ======
// — mais robusta, com foco em atualidade e fatos variáveis
function needsWebSearch(userText: string): boolean {
  const t = userText.toLowerCase().trim();

  // força manual via prefixos
  if (t.startsWith("web:") || t.startsWith("now:")) return true;

  // palavras/estruturas que geralmente pedem fato mutável/recente
  const triggers = [
    "quando", "que dia", "data", "lançamento", "estreia", "estreou",
    "saiu", "vai sair", "confirmado", "anunciado",
    "hoje", "agora", "ontem", "últimas", "recentemente", "atual",
    "ganhou", "oscar", "prêmio", "bilheteria", "recorde",
    "notícia", "rumor", "vazou", "revelado", "trailer",
    "temporada nova", "episódio novo", "setlist", "turnê", "tour",
    "álbum", "single", "chart", "parada", "spotify", "apple music", "billboard",
  ];
  if (triggers.some((k) => t.includes(k))) return true;

  // se mencionar explícito “fonte”, “link”, “site”, também vale
  if (/\b(fontes?|links?|sites?)\b/.test(t)) return true;

  return false;
}

// ====== WEB SEARCH REFINADO (Serper.dev) ======
//
// Melhorias:
// - escolhe automaticamente entre /search (geral) e /news (se "agora"/"notícia"/prefixo now:)
// - aplica filtro de recência (tbs: qdr:d|w|m|y) quando fizer sentido
// - siteFilters padrão para priorizar fontes de entretenimento confiáveis
// - respeita se o usuário já colocou "site:" no query (não força filtros)
// - dedup por hostname+path e reordenação por “confiabilidade” do domínio
// - formatação concisa (título + hostname + data + snippet + URL)

type SerperSearchKind = "search" | "news";

function classifyWebEndpoint(originalUserText: string): SerperSearchKind {
  const t = originalUserText.toLowerCase();
  const forceNews = t.startsWith("now:") || /\b(hoje|agora|últimas|notícia|noticias|anunciado|confirmado)\b/.test(t);
  return forceNews ? "news" : "search";
}

// converte “hoje/ontem/última semana/mês/ano” em tbs (time-based search)
// d=day, w=week, m=month, y=year
function inferTbs(userText: string): string | undefined {
  const t = userText.toLowerCase();

  if (/\bhoje|agora\b/.test(t)) return "qdr:d";
  if (/\bontem|últim[ao]s?\s*2?\s*dias?\b/.test(t)) return "qdr:d";
  if (/\b(esta|desta)\s*semana|últim[ao]s?\s*7\s*dias|semana\b/.test(t)) return "qdr:w";
  if (/\b(este|deste)\s*m[eê]s|últim[ao]s?\s*30\s*dias|m[eê]s\b/.test(t)) return "qdr:m";
  if (/\b(este|deste)\s*ano|ano\b/.test(t)) return "qdr:y";

  // se mencionou “lançamento”, “estreia”, “temporada nova”, aplicar pelo menos qdr:y
  if (/(lançamento|estreia|temporada nova|temporada)/.test(t)) return "qdr:y";

  return undefined;
}

function hasExplicitSiteOperator(q: string): boolean {
  return /\bsite:/.test(q);
}

const TRUST_WEIGHTS: Record<string, number> = {
  // Música
  "billboard.com": 9, "pitchfork.com": 8, "rollingstone.com": 8,
  "music.apple.com": 8, "spotify.com": 8, "genius.com": 7,
  // Cinema/TV
  "imdb.com": 9, "themoviedb.org": 9, "rottentomatoes.com": 8,
  "variety.com": 8, "hollywoodreporter.com": 8, "deadline.com": 8,
  "screenrant.com": 6, "collider.com": 6,
  // Generalistas de referência
  "wikipedia.org": 7, "bbc.com": 8, "reuters.com": 9, "apnews.com": 8,
};

function hostnameOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

function canonicalPath(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, "")}${u.pathname.replace(/\/+$/, "")}`;
  } catch { return url; }
}

type WebItem = { title: string; link: string; snippet?: string; date?: string; pos: number };

function normalizeSerperResults(kind: SerperSearchKind, json: any): WebItem[] {
  const items: WebItem[] = [];
  const arr = kind === "news" ? json?.news : json?.organic;
  if (!Array.isArray(arr)) return items;

  let pos = 0;
  for (const r of arr.slice(0, 12)) {
    const title = r.title || r.link || "(sem título)";
    const link = r.link || r.url || r.source || "";
    if (!link) continue;
    const snippet = r.snippet || r.snippets?.[0] || r.description || "";
    const date = r.date || r.datePublished || r.dateUtc || r.age || undefined;
    items.push({ title, link, snippet, date, pos: pos++ });
  }
  return items;
}

function dedupeAndRescore(items: WebItem[]): WebItem[] {
  const seen = new Set<string>();
  const out: WebItem[] = [];
  for (const it of items) {
    const key = canonicalPath(it.link);
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(it);
    }
  }

  // score por confiança do domínio + posição original
  return out
    .map((it) => {
      const host = hostnameOf(it.link);
      const trust = TRUST_WEIGHTS[host] ?? 5; // default
      const score = trust * 100 - it.pos;     // mais confiança + mais alto no ranking original
      return { it, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((x) => x.it);
}

async function serperSmartSearch(originalUserText: string, cleanedQuery: string) {
  if (!SERPER_API_KEY) return null;

  const kind = classifyWebEndpoint(originalUserText);
  const tbs = inferTbs(originalUserText);

  const body: Record<string, any> = {
    q: cleanedQuery,
    gl: "br",
    hl: "pt-br",
    num: 10,
    autocorrect: true,
  };

  if (tbs) body.tbs = tbs;

  // se o usuário não fixou "site:", priorize fontes confiáveis
  if (!hasExplicitSiteOperator(cleanedQuery)) {
    body.siteFilters = [
      "themoviedb.org","imdb.com","rottentomatoes.com",
      "variety.com","hollywoodreporter.com","deadline.com",
      "wikipedia.org","spotify.com","music.apple.com","billboard.com","pitchfork.com",
    ];
  }

  const endpoint = kind === "news" ? "news" : "search";
  const url = `https://google.serper.dev/${endpoint}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "X-API-KEY": SERPER_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Serper ${endpoint} error (${res.status}): ${txt}`);
  }

  const json = await res.json();
  const normalized = dedupeAndRescore(normalizeSerperResults(kind, json));

  // answerBox / knowledgeGraph — quando existir, colamos no topo como “resumo”
  const extras: string[] = [];
  if (json.answerBox?.answer) {
    extras.push(`> **Resposta direta:** ${json.answerBox.answer}`);
  } else if (json.answerBox?.snippet) {
    extras.push(`> **Resumo:** ${json.answerBox.snippet}`);
  }
  if (json.knowledgeGraph?.title) {
    const kg = json.knowledgeGraph;
    const desc = kg.description ? ` — ${kg.description}` : "";
    extras.push(`> **Knowledge Graph:** ${kg.title}${desc}`);
  }

  return { items: normalized, extras };
}

function buildWebContext(smart: Awaited<ReturnType<typeof serperSmartSearch>>) {
  if (!smart || !smart.items?.length) return "";

  const lines: string[] = [];
  const top = smart.items;

  for (const r of top) {
    const host = hostnameOf(r.link);
    const date = r.date ? ` — ${r.date}` : "";
    const snippet = r.snippet ? `\n  ${r.snippet}` : "";
    lines.push(`- [${r.title}](${r.link}) *(${host}${date})*${snippet}`);
  }

  const block = [
    "### Fonte: Web (Serper.dev)",
    ...(smart.extras?.length ? ["", ...smart.extras] : []),
    "",
    ...lines,
  ].join("\n");

  return block;
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

    // ====== (Opcional) BUSCA NA WEB (refinada) ======
    let webContext = "";
    const shouldSearch = SERPER_API_KEY && originalUserText && needsWebSearch(originalUserText);
    if (shouldSearch) {
      try {
        const smart = await serperSmartSearch(originalUserText, cleanedUserText);
        webContext = buildWebContext(smart);
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
          "Você é a IA do ScoreIt. Responda na linguagem da pergunta, de forma clara, direta e bem escrita (sem erros). Foque em filmes, séries e músicas. Se houver incerteza, explique como verificaria (ex.: catálogos oficiais, ScoreIt API). Quando fizer listas, use bullets curtos. Se houver bloco 'Fonte: Web', use-o como base factual e cite as URLs já listadas.",
      },
      ...(webContext
        ? [
            {
              role: "system" as const,
              content: webContext,
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
