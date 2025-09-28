import { apiBase, AUTH_TOKEN_KEY } from "@/lib/api";

function assertApiBase() {
  if (!apiBase) {
    throw new Error("API base URL não configurada. Verifique suas envs NEXT_PUBLIC_API_BASE_URL_* e faça redeploy.");
  }
}

async function postJson<T = any>(path: string, body: unknown): Promise<T> {
  assertApiBase();
  const url = `${apiBase}${path}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
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

export async function verifyToken(token: string) {
  assertApiBase();
  const bearer = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  const res = await fetch(`${apiBase}/auth/verifyToken`, {
    method: "GET",
    headers: { Authorization: bearer },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Token inválido/expirado");
  return true;
}

export async function loginUser(email: string, password: string) {
  const data = await postJson<{ token?: string }>(`/member/login`, {
    email: email.trim(),
    password,
  });

  if (!data?.token) throw new Error("Token JWT não retornado pelo servidor");

  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_TOKEN_KEY, data.token); // grava por AMBIENTE
  }

  return { success: true as const, token: data.token };
}

type BackendGender = "MASC" | "FEM" | "OTHER";

export async function registerUser(payload: {
  name: string;
  email: string;
  password: string;
  birthDate: string; // yyyy-MM-dd
  gender: string;
  handle: string;
}) {
  const normalized = (payload.gender || "").trim().toUpperCase();
  const map: Record<string, BackendGender> = {
    MASC: "MASC",
    FEM: "FEM",
    OTHER: "OTHER",
    M: "MASC",
    F: "FEM",
    O: "OTHER",
    MASCULINO: "MASC",
    FEMININO: "FEM",
  };

  const gender: BackendGender | undefined = map[normalized];
  if (!gender) throw new Error("Gênero inválido. Selecione MASC, FEM ou OTHER.");

  // usa postJson que já monta a URL correta com apiBase e trata JSON/erros
  await postJson(`/member/post`, {
    name: payload.name.trim(),
    email: payload.email.trim(),
    password: payload.password,
    birthDate: payload.birthDate,
    gender,
    handle: payload.handle.trim(),
  });

  return { success: true as const, message: "Usuário cadastrado; verifique seu e-mail." };
}
