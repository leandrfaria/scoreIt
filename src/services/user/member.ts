import { apiFetch, getToken } from "@/lib/api";
import { jwtDecode, JwtPayload } from "jwt-decode";
import { Member } from "@/types/Member";

interface CustomJwtPayload extends JwtPayload {
  id?: string | number;
}

function cleanHandle(v: unknown): string {
  const raw = String(v ?? "");
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
    profileImageUrl: typeof u?.profileImageUrl === "string" ? u.profileImageUrl : "",
  };
}

/**
 * Lista ou "self" (dependendo do backend).
 * useJwtId: tenta anexar o id do JWT em /member/get/{id}
 * Retém assinatura antiga para compatibilidade: Member | Member[] | null
 */
export async function fetchMembers(
  useJwtId = false,
  opts?: { signal?: AbortSignal }
): Promise<Member | Member[] | null> {
  let path = "/member/get";

  if (useJwtId && typeof window !== "undefined") {
    const token = getToken(); // ✅ padronizado
    if (token) {
      try {
        const decoded = jwtDecode<CustomJwtPayload>(token);
        if (decoded?.id != null) {
          path += `/${decoded.id}`;
        }
      } catch {
        // segue sem id
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
 * ✅ Novo: retorna **apenas o membro logado** (ou null), sem pegar `data[0]`.
 * 1) tenta pelo id do JWT
 * 2) fallback: chama /member/get (esperando que o backend devolva "self" autenticado)
 */
export async function fetchCurrentMember(opts?: { signal?: AbortSignal }): Promise<Member | null> {
  if (typeof window !== "undefined") {
    const token = getToken(); // ✅ padronizado
    if (token) {
      try {
        const decoded = jwtDecode<CustomJwtPayload>(token);
        if (decoded?.id != null) {
          const byId = await fetchMemberById(String(decoded.id), opts);
          if (byId) return byId;
        }
      } catch {
        // ignore e tenta fallback
      }
    }
  }

  // fallback: tenta /member/get (esperando objeto "self")
  const data: any = await apiFetch("/member/get", { auth: true, signal: opts?.signal });
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    // se vier array por algum motivo, NÃO escolhe o primeiro
    return null;
  }
  return toMember(data);
}

type UpdatePayload = Partial<
  Pick<Member, "name" | "bio" | "birthDate" | "gender" | "handle" | "email">
> & {
  id: number | string;
};

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
