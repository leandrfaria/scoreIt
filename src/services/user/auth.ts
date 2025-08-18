import { apiBase } from "@/lib/api";

/** Garante que a base está configurada (evita fetch para undefined) */
function assertApiBase() {
  if (!apiBase) {
    throw new Error("API base URL não configurada. Verifique suas envs NEXT_PUBLIC_API_BASE_URL_* e faça redeploy.");
  }
}

/** Helper para POST JSON com base do api.ts */
async function postJson<T = any>(path: string, body: unknown): Promise<T> {
  assertApiBase();
  const url = `${apiBase}${path}`;
  // console.log("[auth] POST", url); // habilite se quiser debugar

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const ct = res.headers.get("content-type") || "";
  const payload = ct.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    const msg =
      (typeof payload === "string" && payload) ||
      (payload && (payload.message || payload.error)) ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return (payload as T) ?? ({} as T);
}

/** (Opcional) checar token no back quando app inicia/refresh */
export async function verifyToken(token: string) {
  assertApiBase();
  const res = await fetch(`${apiBase}/auth/verifyToken`, {
    method: "GET",
    headers: { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Token inválido/expirado");
  return true;
}

/** LOGIN */
export async function loginUser(email: string, password: string) {
  // backend: POST /member/login -> { token }
  const data = await postJson<{ token?: string }>(`/member/login`, {
    email: email.trim(),
    password,
  });

  if (!data?.token) {
    throw new Error("Token JWT não retornado pelo servidor");
  }

  if (typeof window !== "undefined") {
    localStorage.setItem("authToken", data.token);
  }

  return { success: true as const, token: data.token };
}

/** CADASTRO */
export async function registerUser(payload: {
  name: string;
  email: string;
  password: string;
  birthDate: string; // yyyy-mm-dd
  gender: string;    // "MASC" | "FEM" | "OTHER"
}) {
  // backend: POST /member/post -> texto "Cadastro realizado. Verifique seu e-mail."
  await postJson(`/member/post`, {
    name: payload.name.trim(),
    email: payload.email.trim(),
    password: payload.password,
    birthDate: payload.birthDate,
    gender: payload.gender,
  });

  return { success: true as const, message: "Usuário cadastrado; verifique seu e-mail." };
}
