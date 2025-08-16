// services/api.ts
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  requireToken = true
): Promise<T> {
  const token = requireToken ? localStorage.getItem("authToken") : null;
  if (requireToken && !token) throw new Error("Token não encontrado");

  const res = await fetch(`http://localhost:8080${endpoint}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(requireToken ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Erro na requisição");
  }

  if (res.headers.get("content-type")?.includes("application/json")) {
    return res.json() as Promise<T>;
  }

  // Para respostas sem corpo JSON
  return undefined as T;
}
