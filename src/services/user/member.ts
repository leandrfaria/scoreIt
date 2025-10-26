import { apiBase, apiFetch, getToken } from "@/lib/api";
import {jwtDecode} from "jwt-decode";
import type { JwtPayload } from "jwt-decode";
import { Member } from "@/types/Member";

interface CustomJwtPayload extends JwtPayload {
  id?: string | number;
  role?: string;
  roles?: any;
  authorities?: any;
  name?: string;
  sub?: string;
  email?: string;
  birthDate?: string;
  handle?: string;
  gender?: string;
  bio?: string;
  profileImageUrl?: string;
  enabled?: boolean;
}

function cleanHandle(v: unknown): string {
  const raw = String(v ?? "");
  return raw.replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9._]/g, "");
}

function extractRoleFromAny(u: any): string | undefined {
  if (!u) return undefined;
  if (typeof u.role === "string" && u.role) return u.role;
  if (Array.isArray(u.roles) && u.roles.length) return u.roles[0];
  if (Array.isArray(u.authorities) && u.authorities.length) {
    const a = u.authorities[0];
    if (typeof a === "string") return a;
    if (a?.authority) return a.authority;
    if (a?.role) return a.role;
  }
  return undefined;
}

function toMember(u: any): Member {
  const idNum = Number(u?.id ?? 0);
  const rawRole = extractRoleFromAny(u);
  const role = rawRole ? (String(rawRole).toUpperCase().startsWith("ROLE_") ? String(rawRole) : `ROLE_${String(rawRole).toUpperCase()}`) : undefined;

  return {
    id: Number.isFinite(idNum) ? idNum : 0,
    name: String(u?.name ?? ""),
    birthDate: String(u?.birthDate ?? ""),
    email: String(u?.email ?? u?.sub ?? ""),
    handle: cleanHandle(u?.handle),
    gender: String(u?.gender ?? ""),
    bio: String(u?.bio ?? ""),
    profileImageUrl: typeof u?.profileImageUrl === "string" ? u.profileImageUrl : "",
    // ✅ agora incluímos role e enabled
    role,
    enabled: typeof u?.enabled === "boolean" ? u.enabled : true,
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

export async function fetchMemberByHandle(
  handle: string,
  opts?: { signal?: AbortSignal }
): Promise<Member | null> {
  if (!handle) return null;

  const data: any = await apiFetch(`/member/search?handle=${encodeURIComponent(handle)}`, {
    auth: true,
    signal: opts?.signal,
  });

  if (!Array.isArray(data) || data.length === 0) return null;

  // Retorna o primeiro usuário encontrado
  return toMember(data[0]);
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
  const jsonBody = { ...payload, handle: cleanHandle(payload.handle) };

  const res = await fetch(`${apiBase}/member/update`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(jsonBody),
    signal: opts?.signal,
  });

  if (!res.ok) {
    // lê o JSON do backend e lança só a mensagem
    const errData = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errData.message || "Erro desconhecido");
  }

  const data = await res.json();
  return toMember(data);
}
