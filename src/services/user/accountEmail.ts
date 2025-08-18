import { apiBase, frontendBase } from "@/lib/api";

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
  try { return JSON.parse(text); } catch { return text || { ok: true }; }
}

export async function requestPasswordReset(email: string) {
  await postForm(`/api/forgot-password`, { email });
  return { success: true, message: "E-mail enviado com sucesso!" };
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  await postForm(`/api/reset-password`, { token, newPassword });
  return { success: true };
}

export async function requestEmailChange(email: string) {
  await postForm(`/api/change-email`, { email });
  return { success: true, message: "E-mail enviado com sucesso!" };
}

export async function applyNewEmail(token: string, newEmail: string) {
  await postForm(`/api/reset-email`, { token, newEmail });
  return { success: true };
}

/** Confirmar conta (link do e-mail de cadastro) */
export async function confirmAccount(token: string) {
  const res = await fetch(`${apiBase}/member/confirm?token=${encodeURIComponent(token)}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Token inválido");
  return { success: true, message: "Conta confirmada com sucesso!" };
}

export function buildVerificationUrl() {
  return `${frontendBase}${process.env.NEXT_PUBLIC_VERIFICATION_ROUTE}`;
}
