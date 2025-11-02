// src/services/admin.ts
import { apiFetch } from "@/lib/api";
import { Member } from "@/types/Member";

type Opts = { signal?: AbortSignal };

/**
 * MEMBROS
 */

/** Alterna enabled/disabled do membro (PATCH /admin/members/{id}/toggle) */
export async function toggleMemberStatus(id: number | string, opts?: Opts): Promise<string> {
  return await apiFetch(`/admin/members/${id}/toggle`, { method: "PATCH", auth: true, signal: opts?.signal });
}

/** Alterna role do membro (PATCH /admin/members/{id}/role) */
export async function toggleMemberRole(id: number | string, opts?: Opts): Promise<string> {
  return await apiFetch(`/admin/members/${id}/role`, { method: "PATCH", auth: true, signal: opts?.signal });
}


export async function listAllMembers(
  page = 0,
  size = 10,
  query?: string,
  opts?: Opts
): Promise<any> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("size", String(size));
  if (query) params.set("query", query);
  const path = `/admin/members?${params.toString()}`;
  return await apiFetch(path, { auth: true, signal: opts?.signal });
}

/** Busca um membro por id (GET /admin/members/{id}) */
export async function getMemberById(id: number | string, opts?: Opts): Promise<Member | null> {
  const data: any = await apiFetch(`/admin/members/${id}`, { auth: true, signal: opts?.signal });
  return data && typeof data === "object" ? data as Member : null;
}


export async function getAllReportsWithReportedMember(): Promise<any[]> {
  try {
    // 1️⃣ Pega todas as denúncias
    const reports = await getAllReports();

    // 2️⃣ Extrai todos os IDs únicos de membros denunciados
    const reportedIds = reports
      .map(r => r.reported?.id)
      .filter(id => id != null)
      .filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicatas

    if (reportedIds.length === 0) {
      return reports.map(r => ({ ...r, reportedMember: null }));
    }

    // 3️⃣ Busca informações dos membros denunciados em lote
    const reportedMembers = await Promise.all(
      reportedIds.map(id => getMemberById(id).catch(() => null))
    );

    // 4️⃣ Cria um mapa de ID -> Member
    const membersMap = new Map<string, any>();
    reportedMembers.forEach((member, index) => {
      if (member) {
        membersMap.set(String(reportedIds[index]), member);
      }
    });

    // 5️⃣ Associa o reportedMember a cada report
    const enrichedReports = reports.map((r) => {
      if (r.reported?.id) {
        const reportedMember = membersMap.get(String(r.reported.id));
        return {
          ...r,
          reportedMember: reportedMember || r.reported, // fallback pro próprio objeto
        };
      }
      return { ...r, reportedMember: null };
    });

    return enrichedReports;
  } catch (error) {
    console.error("Erro ao buscar denúncias com membros:", error);
    return [];
  }
}




export async function updateMemberAdmin(
  id: number | string,
  payload: { name?: string; email?: string; enabled?: boolean },
  opts?: Opts
): Promise<Member> {
  const params = new URLSearchParams();
  if (payload.name != null) params.set("name", String(payload.name));
  if (payload.email != null) params.set("email", String(payload.email));
  if (payload.enabled != null) params.set("enabled", String(payload.enabled));
  const path = `/admin/members/${id}/update?${params.toString()}`;
  const data: any = await apiFetch(path, { method: "PATCH", auth: true, signal: opts?.signal });
  return data as Member;
}

/**
 * DENÚNCIAS (REPORTS)
 */

/** Pega todas as denúncias (GET /admin/reports) */
export async function getAllReports(opts?: Opts): Promise<any[]> {
  return await apiFetch("/admin/reports", { auth: true, signal: opts?.signal });
}

/** Atualiza o status de uma denúncia (PATCH /admin/reports/{id}/status?status=STATUS) */
export async function updateReportStatus(id: number | string, status: string, opts?: Opts): Promise<any> {
  const path = `/admin/reports/${id}/status?status=${encodeURIComponent(status)}`;
  return await apiFetch(path, { method: "PATCH", auth: true, signal: opts?.signal });
}

/** Deleta uma denúncia (DELETE /admin/reports/{id}) */
export async function deleteReport(id: number | string, opts?: Opts): Promise<string> {
  return await apiFetch(`/admin/reports/${id}`, { method: "DELETE", auth: true, signal: opts?.signal });
}

/**
 * GRÁFICOS / ESTATÍSTICAS
 */

/** Membros criados em uma data (GET /admin/members/created-on?date=YYYY-MM-DD) */
export async function getMembersByCreationDate(dateISO: string, opts?: Opts): Promise<Member[]> {
  const path = `/admin/members/created-on?date=${encodeURIComponent(dateISO)}`;
  return await apiFetch(path, { auth: true, signal: opts?.signal });
}

/** Membros criados entre datas (GET /admin/members/created-between?start=YYYY-MM-DD&end=YYYY-MM-DD) */
export async function getMembersBetweenDates(startISO: string, endISO: string, opts?: Opts): Promise<Member[]> {
  const params = new URLSearchParams({ start: startISO, end: endISO });
  const path = `/admin/members/created-between?${params.toString()}`;
  return await apiFetch(path, { auth: true, signal: opts?.signal });
}

/** Reviews por data (GET /admin/statistic/reviews-by-date) */
export async function getReviewsByDate(opts?: Opts): Promise<any[]> {
  return await apiFetch("/admin/statistic/reviews-by-date", { auth: true, signal: opts?.signal });
}

/** Mídias mais populares (GET /admin/statistic/popular-media) */
export async function getPopularMedia(opts?: Opts): Promise<any[]> {
  return await apiFetch("/admin/statistic/popular-media", { auth: true, signal: opts?.signal });
}

/** Crescimento de usuários (GET /admin/statistic/users-growth) */
export async function getUsersGrowth(opts?: Opts): Promise<any[]> {
  return await apiFetch("/admin/statistic/users-growth", { auth: true, signal: opts?.signal });
}
