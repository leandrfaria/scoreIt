// src/services/user/member.ts
import { jwtDecode, JwtPayload } from "jwt-decode";
import { apiBase } from "@/lib/api";

interface CustomJwtPayload extends JwtPayload {
  id?: string; // opcional para evitar crash se o claim faltar
}

function assertApiBase() {
  if (!apiBase) {
    throw new Error(
      "API base URL não configurada. Verifique NEXT_PUBLIC_API_BASE_URL_* e faça redeploy."
    );
  }
}

function buildHeaders(withJson = true): Headers {
  const h = new Headers();
  if (withJson) h.set("Content-Type", "application/json");
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("authToken");
    if (token) h.set("Authorization", `Bearer ${token}`);
  }
  return h;
}

export const fetchMembers = async (useJwtId = false) => {
  assertApiBase();

  let path = "/member/get";
  if (useJwtId) {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    if (token) {
      try {
        const decoded = jwtDecode<CustomJwtPayload>(token);
        if (decoded?.id) path += `/${decoded.id}`;
      } catch {
        // se falhar o decode, segue sem o /{id}
      }
    }
  }

  const res = await fetch(`${apiBase}${path}`, {
    method: "GET",
    headers: buildHeaders(), // já inclui Content-Type + Authorization se existir
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || "Erro ao buscar membros");
  }

  return res.json();
};

export const fetchMemberById = async (id: string) => {
  assertApiBase();
  const path = id ? `/member/get/${id}` : "/member/get";

  const res = await fetch(`${apiBase}${path}`, {
    method: "GET",
    headers: buildHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Erro ao buscar membro pelo id ${id}`);
  }

  return res.json();
};

export const updateMember = async (_memberId: string, payload: any) => {
  assertApiBase();
  // sua API atualiza pelo body; memberId não é usado na URL
  const res = await fetch(`${apiBase}/member/update`, {
    method: "PUT",
    headers: buildHeaders(),
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || "Erro ao atualizar perfil");
  }

  return res.json();
};
