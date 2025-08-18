import { apiBase, frontendBase } from "@/lib/api";

/**
 * Helpers para enviar x-www-form-urlencoded,
 * mantendo o fetch nativo (sem depender do apiFetch que seta JSON).
 */
async function postForm(path: string, form: Record<string, string>) {
  const body = new URLSearchParams(form).toString();
  const res = await fetch(`${apiBase}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  // tenta JSON, senão devolve texto
  try { return JSON.parse(text); } catch { return text || { ok: true }; }
}

/** 1) Enviar e-mail de reset de SENHA */
export async function requestPasswordReset(email: string) {
  await postForm(`/api/forgot-password`, { email });
  return { success: true, message: "E-mail enviado com sucesso!" };
}

/** 2) Resetar senha com token */
export async function resetPasswordWithToken(token: string, newPassword: string) {
  await postForm(`/api/reset-password`, { token, newPassword });
  return { success: true };
}

/** 3) Enviar e-mail para troca de e-mail (fluxo de "mudar e-mail") */
export async function requestEmailChange(email: string) {
  await postForm(`/api/change-email`, { email });
  return { success: true, message: "E-mail enviado com sucesso!" };
}

/** 4) Aplicar NOVO e-mail (com token do e-mail recebido) */
export async function applyNewEmail(token: string, newEmail: string) {
  await postForm(`/api/reset-email`, { token, newEmail });
  return { success: true };
}

/** 5) Confirmar conta (link do e-mail de cadastro) */
export async function confirmAccount(token: string) {
  // alinhado ao que você já usava
  const res = await fetch(`${apiBase}/member/confirm?token=${encodeURIComponent(token)}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Token inválido");
  return { success: true, message: "Conta confirmada com sucesso!" };
}

/**
 * (Opcional) Montar a URL do front para verificação (cadastro)
 * Útil se o back pedir para você enviar a URL de callback no body do cadastro.
 */
export function buildVerificationUrl() {
  return `${frontendBase}${process.env.NEXT_PUBLIC_VERIFICATION_ROUTE}`;
}
