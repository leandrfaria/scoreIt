import { apiBase } from "@/lib/api";

/** Ajuda a fazer fetch JSON com base URL do api.ts */
async function postJson<T = any>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${apiBase}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json() : await res.text().catch(() => "");
  if (!res.ok) {
    const msg = typeof data === "string" ? data : data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

/** (Opcional) checar token no back quando app inicia/refresh */
export async function verifyToken(token: string) {
  const res = await fetch(`${apiBase}/auth/verifyToken`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Token inválido/expirado");
  return true;
}

/** LOGIN */
export async function loginUser(email: string, password: string) {
  // backend: POST /member/login -> { token }
  const data = await postJson<{ token: string }>(`/member/login`, { email, password });

  if (!data?.token) {
    throw new Error("Token JWT não retornado pelo servidor");
  }

  // guardar token no client
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
  // backend: POST /member/post -> "Cadastro realizado. Verifique seu e-mail." (texto)
  await postJson(`/member/post`, payload);
  return { success: true as const, message: "Usuário cadastrado; verifique seu e-mail." };
}
