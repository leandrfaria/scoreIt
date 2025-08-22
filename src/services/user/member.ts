import { apiFetch } from "@/lib/api";
import { jwtDecode, JwtPayload } from "jwt-decode";
import { Member } from "@/types/Member";

interface CustomJwtPayload extends JwtPayload {
  id?: string | number;
}

function cleanHandle(v: unknown): string {
  const raw = String(v ?? "");
  // remove @ iniciais, força minúsculas e limita a caracteres seguros
  return raw.replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9._]/g, "");
}

function toMember(u: any): Member {
  const idNum = Number(u?.id ?? 0);
  return {
    id: Number.isFinite(idNum) ? idNum : 0,
    name: String(u?.name ?? ""),
    birthDate: String(u?.birthDate ?? ""),
    email: String(u?.email ?? ""),
    handle: cleanHandle(u?.handle),
    gender: String(u?.gender ?? ""),
    bio: String(u?.bio ?? ""),
    // deixe vazio se não vier da API; os componentes já têm fallback visual
    profileImageUrl: typeof u?.profileImageUrl === "string" ? u.profileImageUrl : "",
  };
}

/**
 * Lista ou "self" (caso o endpoint retorne o próprio quando autenticado)
 * useJwtId: tenta anexar o id do JWT em /member/get/{id}
 * Retém assinatura antiga para compatibilidade: Member | Member[] | null
 */
export async function fetchMembers(
  useJwtId = false,
  opts?: { signal?: AbortSignal }
): Promise<Member | Member[] | null> {
  let path = "/member/get";

  if (useJwtId && typeof window !== "undefined") {
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        const raw = token.startsWith("Bearer ") ? token.slice(7) : token;
        const decoded = jwtDecode<CustomJwtPayload>(raw);
        if (decoded?.id) path += `/${decoded.id}`;
      } catch {
        // se falhar o decode, segue sem id
      }
    }
  }

  const data: any = await apiFetch(path, { auth: true, signal: opts?.signal });
  if (Array.isArray(data)) return data.map(toMember);
  if (data && typeof data === "object") return toMember(data);
  return null;
}

export async function fetchMemberById(
  id: string | number,
  opts?: { signal?: AbortSignal }
): Promise<Member | null> {
  const path = id ? `/member/get/${id}` : "/member/get";
  const data: any = await apiFetch(path, { auth: true, signal: opts?.signal });
  if (!data || typeof data !== "object") return null;
  return toMember(data);
}

/**
 * ✅ Novo: sempre retorna **um** membro (ou null).
 * Usa o id do JWT quando possível; caso contrário, tenta `fetchMembers(true)`
 * e “desempacota” o resultado para Member | null.
 */
export async function fetchCurrentMember(opts?: { signal?: AbortSignal }): Promise<Member | null> {
  // 1) tenta extrair o id do JWT e buscar diretamente
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        const raw = token.startsWith("Bearer ") ? token.slice(7) : token;
        const decoded = jwtDecode<CustomJwtPayload>(raw);
        if (decoded?.id != null) {
          const byId = await fetchMemberById(String(decoded.id), opts);
          if (byId) return byId;
        }
      } catch {
        // ignore e tenta fallback
      }
    }
  }

  // 2) fallback: usa fetchMembers(true) e desempacota caso venha lista
  const data = await fetchMembers(true, opts);
  if (!data) return null;
  return Array.isArray(data) ? (data[0] ?? null) : data;
}

type UpdatePayload = Partial<
  Pick<Member, "name" | "bio" | "birthDate" | "gender" | "handle" | "email">
> & {
  id: number | string;
};

// sua API atualiza pelo body; o id vai no body (não na URL)
export async function updateMember(
  _memberId: string,
  payload: UpdatePayload,
  opts?: { signal?: AbortSignal }
): Promise<Member> {
  const jsonBody = {
    ...payload,
    handle: cleanHandle(payload.handle),
  };

  const data: any = await apiFetch("/member/update", {
    method: "PUT",
    auth: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(jsonBody),
    signal: opts?.signal,
  });

  return toMember(data);
}
