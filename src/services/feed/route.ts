import { apiBase, getToken } from "@/lib/api";

export async function fetchFeedServer(memberId: string) {
  // Aqui garantimos que o código roda server-side
  const token = process.env.NEXT_PUBLIC_API_TOKEN ?? getToken();
  if (!token) throw new Error("Usuário não autenticado ou token não encontrado");

  const res = await fetch(`${apiBase}/feed/${memberId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body || `Erro ${res.status}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}
