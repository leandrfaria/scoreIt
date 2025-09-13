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

/** Mantido (remove só a chave do ambiente atual) */
export function clearToken() {
  try {
    if (typeof window !== "undefined") localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {}
}

/** 🔥 NOVO: limpeza total de tokens de localStorage, sessionStorage e cookies */
export function clearAllAuthStorage() {
  try {
    if (typeof window === "undefined") return;

    const ls = window.localStorage;
    const ss = window.sessionStorage;

    // chaves explícitas mais comuns e as do app
    const explicitKeys = new Set<string>([
      "authToken",
      "authToken_dev",
      "authToken_prod",
      AUTH_TOKEN_KEY,
      "token",
      "access_token",
      "refresh_token",
      "jwt",
      "jwt_token",
      "id_token",
    ]);

    // remove chaves explícitas dos dois storages
    for (const k of explicitKeys) {
      try { ls.removeItem(k); } catch {}
      try { ss.removeItem(k); } catch {}
    }

    // varredura por padrão (qualquer chave que contenha auth/token/jwt)
    const patterns = [/auth/i, /token/i, /jwt/i];

    // localStorage sweep
    try {
      const keys: string[] = [];
      for (let i = 0; i < ls.length; i++) {
        const key = ls.key(i);
        if (key) keys.push(key);
      }
      for (const key of keys) {
        if (patterns.some((p) => p.test(key))) {
          try { ls.removeItem(key); } catch {}
        }
      }
    } catch {}

    // sessionStorage sweep
    try {
      const keys: string[] = [];
      for (let i = 0; i < ss.length; i++) {
        const key = ss.key(i);
        if (key) keys.push(key);
      }
      for (const key of keys) {
        if (patterns.some((p) => p.test(key))) {
          try { ss.removeItem(key); } catch {}
        }
      }
    } catch {}

    // cookies comuns
    try {
      const cookieNames = [
        "authToken",
        "authToken_dev",
        "authToken_prod",
        "token",
        "access_token",
        "refresh_token",
        "jwt",
        "jwt_token",
        "id_token",
      ];
      cookieNames.forEach((name) => {
        try {
          document.cookie = `${name}=; Max-Age=0; path=/`;
          // se sua app usa domínio específico, pode repetir com domain=.
        } catch {}
      });
    } catch {}
  } catch {}
}

type FetchOpts = RequestInit & { auth?: boolean };

export async function apiFetch(path: string, opts: FetchOpts = {}) {
  try {
    const headers = new Headers(opts.headers || {});
    if (opts.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

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

  } catch (err: any) {
    if (err.name === "AbortError") {
      return undefined;
    }
    console.error("Erro no apiFetch:", err);
    throw err;
  }
}
