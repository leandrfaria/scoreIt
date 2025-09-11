// src/lib/api.ts
const isProd = process.env.NODE_ENV === "production";

export const apiBase = isProd
  ? process.env.NEXT_PUBLIC_API_BASE_URL_PROD!
  : process.env.NEXT_PUBLIC_API_BASE_URL_DEV!;

export const frontendBase = isProd
  ? process.env.NEXT_PUBLIC_FRONTEND_URL_PROD!
  : process.env.NEXT_PUBLIC_FRONTEND_URL_DEV!;

/** chave de token por ambiente (evita 403 por token “trocado”) */
export const AUTH_TOKEN_KEY = isProd ? "authToken_prod" : "authToken_dev";

export function getToken(): string | null {
  try {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearToken() {
  try {
    if (typeof window !== "undefined") localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {}
}

type FetchOpts = RequestInit & { auth?: boolean };

export async function apiFetch(path: string, opts: FetchOpts = {}) {
  const headers = new Headers(opts.headers || {});
  if (opts.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Injeta JWT somente no client. Se for obrigatório (auth:true) e não houver token, falha cedo com erro claro.
  if (opts.auth && typeof window !== "undefined") {
    const token = getToken();
    if (!token) {
      const err = new Error("NO_TOKEN: usuário não autenticado ou sessão expirada");
      (err as any).code = 401;
      throw err;
    }
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${apiBase}${path}`, {
    ...opts,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(`API ${res.status}: ${body || res.statusText}`);
    (err as any).status = res.status;
    (err as any).body = body;
    throw err;
  }

  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}
