// src/lib/api.ts
const isProd = process.env.NODE_ENV === "production";

export const apiBase = isProd
  ? process.env.NEXT_PUBLIC_API_BASE_URL_PROD!
  : process.env.NEXT_PUBLIC_API_BASE_URL_DEV!;

export const frontendBase = isProd
  ? process.env.NEXT_PUBLIC_FRONTEND_URL_PROD!
  : process.env.NEXT_PUBLIC_FRONTEND_URL_DEV!;

type FetchOpts = RequestInit & { auth?: boolean };

export async function apiFetch(path: string, opts: FetchOpts = {}) {
  const headers = new Headers(opts.headers || { "Content-Type": "application/json" });

  // Injeta JWT só no client
  if (opts.auth && typeof window !== "undefined") {
    const token = localStorage.getItem("authToken");
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const res = await fetch(`${apiBase}${path}`, {
      ...opts,
      headers,
      cache: "no-store", // evite cache em chamadas mutáveis
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`API ${res.status}: ${body || res.statusText}`);
    }

    const ct = res.headers.get("content-type") || "";
    return ct.includes("application/json") ? res.json() : res.text();
  } catch (err: any) {
    if (err.name === "AbortError") {
      // requisição foi cancelada pelo AbortController → não é erro real
      return undefined;
    }
    console.error("Erro no apiFetch:", err);
    throw err;
  }
}
