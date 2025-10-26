"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/layout/Others/Container";
import { ProtectedRoute } from "@/components/layout/Others/ProtectedRoute";
import { useAuthContext } from "@/context/AuthContext";
import { useMember } from "@/context/MemberContext";
import {
  listAllMembers,
  toggleMemberStatus,
  toggleMemberRole,
  updateMemberAdmin,
  getReviewsByDate,
  getPopularMedia,
  getUsersGrowth,
  updateReportStatus,
  deleteReport,
  getAllReportsWithReportedMember,
} from "@/services/admin/admin";
import toast from "react-hot-toast";

export default function AdminPage() {
  const { isLoading, hasRole } = useAuthContext();
  const { member } = useMember();

  const [status, setStatus] = useState<"loading" | "denied" | "allowed">("loading");

  // dados
  const [members, setMembers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [stats, setStats] = useState<{ reviews: any[]; popular: any[]; growth: any[] }>({
    reviews: [],
    popular: [],
    growth: [],
  });

  // edição inline
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<{ name: string; email: string; enabled: boolean }>(
    {
      name: "",
      email: "",
      enabled: false,
    }
  );

  // relatório selecionado
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  // Controle de acesso
  useEffect(() => {
    if (isLoading) return setStatus("loading");
    setStatus(hasRole("ADMIN") ? "allowed" : "denied");
  }, [isLoading, member?.role, hasRole]);

  // Carrega dados iniciais
  useEffect(() => {
    if (status !== "allowed") return;
    (async () => {
      try {
        const membersRes = await listAllMembers(0, 20);
        setMembers(membersRes?.content || membersRes || []);

        const reportsRes = await getAllReportsWithReportedMember();
        setReports(reportsRes || []);

        const [reviews, popular, growth] = await Promise.all([
          getReviewsByDate(),
          getPopularMedia(),
          getUsersGrowth(),
        ]);
        setStats({ reviews, popular, growth });
      } catch (err: any) {
        toast.error("Erro ao carregar dados do admin");
        console.error(err);
      }
    })();
  }, [status]);

  // helpers
  const isAdminAccount = (m: any) => !!m?.role && String(m.role).toUpperCase().includes("ADMIN");
  const isCurrentUser = (m: any) => !!member && m?.id === member.id;
  const isNotEditable = (m: any) => isAdminAccount(m) || isCurrentUser(m);

  // Ações membros
  const handleEnableDisableMember = async (id: number) => {
    const target = members.find((m) => m.id === id);
    if (isNotEditable(target)) return toast.error("Operação não permitida para esse usuário.");
    try {
      await toggleMemberStatus(id);
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)));
      toast.success(`Membro ${target?.enabled ? "desativado" : "ativado"}!`);
    } catch {
      toast.error("Erro ao atualizar status do membro");
    }
  };

  const handlePromoteDemoteMember = async (id: number) => {
    const target = members.find((m) => m.id === id);
    if (isNotEditable(target)) return toast.error("Operação não permitida para esse usuário.");
    try {
      await toggleMemberRole(id);
      const membersRes = await listAllMembers(0, 20);
      setMembers(membersRes?.content || membersRes || []);
      toast.success(`Membro ${isAdminAccount(target) ? "rebaixado" : "promovido"}!`);
    } catch {
      toast.error("Erro ao atualizar role do membro");
    }
  };

  const handleReportStatus = async (id: number, status: string) => {
    try {
      await updateReportStatus(id, status);
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      if (selectedReport?.id === id) setSelectedReport({ ...selectedReport, status });
      toast.success("Status da denúncia atualizado!");
    } catch {
      toast.error("Erro ao atualizar status da denúncia");
    }
  };

  const handleDeleteReport = async (id: number) => {
    try {
      await deleteReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
      if (selectedReport?.id === id) setSelectedReport(null);
      toast.success("Denúncia removida!");
    } catch {
      toast.error("Erro ao deletar denúncia");
    }
  };

  // edição inline
  const startEdit = (m: any) => {
    if (isNotEditable(m)) return toast.error("Este perfil não pode ser editado.");
    setEditingId(m.id);
    setEditData({ name: m.name || "", email: m.email || "", enabled: !!m.enabled });
  };
  const cancelEdit = () => setEditingId(null);
  const saveEdit = async (id: number) => {
    try {
      const updated = await updateMemberAdmin(id, editData);
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
      setEditingId(null);
      toast.success("Membro atualizado!");
    } catch {
      toast.error("Erro ao atualizar membro");
    }
  };

  if (status === "loading")
    return (
      <ProtectedRoute>
        <Container>
          <div className="py-12 text-center text-emerald-300">
            <h2 className="text-2xl font-semibold">Carregando...</h2>
          </div>
        </Container>
      </ProtectedRoute>
    );

  if (status === "denied")
    return (
      <ProtectedRoute>
        <Container>
          <div className="py-12 text-center text-emerald-300">
            <h2 className="text-2xl font-semibold">Acesso negado</h2>
          </div>
        </Container>
      </ProtectedRoute>
    );

  return (
    <ProtectedRoute>
      <Container>
        <div className="py-12 text-emerald-300 space-y-10">
          <div className="text-center">
            <h1 className="text-3xl font-semibold">Painel Administrativo</h1>
            <p className="mt-2">Bem-vindo, {member?.name || "Admin"}!</p>
          </div>

          {/* ==== MEMBROS ==== */}
          <section>
            <h2 className="text-xl font-semibold mb-3">👥 Membros</h2>

            {/* Mobile Cards (mobile-first) */}
            <div className="md:hidden flex flex-col gap-4">
              {members.map((m) => {
                const notEditable = isNotEditable(m);
                return (
                  <div
                    key={m.id}
                    className="bg-zinc-900 p-4 rounded-lg border border-emerald-700 space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <div className="font-semibold">ID: {m.id}</div>
                        <div className="text-xs text-gray-400">{m.role}</div>
                      </div>
                      <div className="text-sm text-right">
                        <div>{m.enabled ? "✅ Ativo" : "❌ Inativo"}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-400">Nome</div>
                      <div className="font-medium">
                        {editingId === m.id ? (
                          <input
                            value={editData.name}
                            onChange={(e) => setEditData((p) => ({ ...p, name: e.target.value }))}
                            className="w-full rounded px-2 py-1 text-white bg-emerald-900/60 placeholder:text-emerald-300"
                          />
                        ) : (
                          m.name || "-"
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-400">Email</div>
                      <div className="font-medium break-words">
                        {editingId === m.id ? (
                          <input
                            value={editData.email}
                            onChange={(e) => setEditData((p) => ({ ...p, email: e.target.value }))}
                            className="w-full rounded px-2 py-1 text-white bg-emerald-900/60 placeholder:text-emerald-300"
                          />
                        ) : (
                          m.email
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {editingId === m.id ? (
                        <>
                          <button
                            onClick={() => saveEdit(m.id)}
                            className="px-3 py-1 bg-emerald-700 rounded hover:bg-emerald-600"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          {!notEditable && (
                            <button
                              onClick={() => startEdit(m)}
                              className="px-3 py-1 bg-emerald-700 rounded hover:bg-emerald-600"
                            >
                              Editar
                            </button>
                          )}
                          <button
                            onClick={() => handleEnableDisableMember(m.id)}
                            disabled={notEditable}
                            className="px-3 py-1 bg-emerald-700 rounded hover:bg-emerald-600"
                          >
                            {m.enabled ? "Desativar" : "Ativar"}
                          </button>
                          <button
                            onClick={() => handlePromoteDemoteMember(m.id)}
                            disabled={notEditable}
                            className="px-3 py-1 bg-emerald-800 rounded hover:bg-emerald-700"
                          >
                            {isAdminAccount(m) ? "Rebaixar" : "Promover"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-[700px] md:min-w-full text-left border border-emerald-700 rounded-lg overflow-hidden">
                <thead className="bg-emerald-900 text-emerald-100">
                  <tr>
                    <th className="px-4 py-2">ID</th>
                    <th className="px-4 py-2">Nome</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Role</th>
                    <th className="px-4 py-2">Ativo</th>
                    <th className="px-4 py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => {
                    const notEditable = isNotEditable(m);
                    return (
                      <tr
                        key={m.id}
                        className={`border-t border-emerald-700 ${
                          editingId === m.id ? "text-white" : "text-emerald-300"
                        }`}
                      >
                        <td className="px-4 py-2">{m.id}</td>
                        <td className="px-4 py-2">
                          {editingId === m.id ? (
                            <input
                              value={editData.name}
                              onChange={(e) =>
                                setEditData((p) => ({ ...p, name: e.target.value }))
                              }
                              className="w-full rounded px-2 py-1 text-white bg-emerald-900/60 placeholder:text-emerald-300"
                            />
                          ) : (
                            m.name || "-"
                          )}
                        </td>
                        <td className="px-4 py-2 break-words">
                          {editingId === m.id ? (
                            <input
                              value={editData.email}
                              onChange={(e) =>
                                setEditData((p) => ({ ...p, email: e.target.value }))
                              }
                              className="w-full rounded px-2 py-1 text-white bg-emerald-900/60 placeholder:text-emerald-300"
                            />
                          ) : (
                            m.email
                          )}
                        </td>
                        <td className="px-4 py-2">{m.role}</td>
                        <td className="px-4 py-2 text-center">
                          {editingId === m.id ? (
                            <input
                              type="checkbox"
                              checked={editData.enabled}
                              onChange={(e) =>
                                setEditData({ ...editData, enabled: e.target.checked })
                              }
                            />
                          ) : m.enabled ? (
                            "✅"
                          ) : (
                            "❌"
                          )}
                        </td>
                        <td className="px-4 py-2 flex flex-wrap gap-2">
                          {editingId === m.id ? (
                            <>
                              <button
                                onClick={() => saveEdit(m.id)}
                                className="px-3 py-1 bg-emerald-700 rounded hover:bg-emerald-600"
                              >
                                Salvar
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              {!notEditable && (
                                <button
                                  onClick={() => startEdit(m)}
                                  className="px-3 py-1 bg-emerald-700 rounded hover:bg-emerald-600"
                                >
                                  Editar
                                </button>
                              )}
                              <button
                                onClick={() => handleEnableDisableMember(m.id)}
                                disabled={notEditable}
                                className="px-3 py-1 bg-emerald-700 rounded hover:bg-emerald-600"
                              >
                                {m.enabled ? "Desativar" : "Ativar"}
                              </button>
                              <button
                                onClick={() => handlePromoteDemoteMember(m.id)}
                                disabled={notEditable}
                                className="px-3 py-1 bg-emerald-800 rounded hover:bg-emerald-700"
                              >
                                {isAdminAccount(m) ? "Rebaixar" : "Promover"}
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* ==== REPORTS ==== */}
          <section>
            <h2 className="text-xl font-semibold mb-3">🚨 Denúncias</h2>

            {/* Mobile Cards (mobile-first) */}
            <div className="md:hidden flex flex-col gap-4">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="bg-zinc-900 p-4 rounded-lg border border-emerald-700 space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">ID: {r.id}</div>
                      <div className="text-xs text-gray-400">{r.status || "N/A"}</div>
                    </div>
                    <div className="text-sm text-right">
                      <div className="text-xs text-gray-400">Autor</div>
                      <div className="font-medium">{r.reporter?.name || r.reporterName || "Desconhecido"}</div>
                    </div>
                  </div>

                  {/* MOTIVO EM DESTAQUE NO MOBILE */}
                  <div className="mt-2 p-3 rounded bg-zinc-800 border border-amber-500/20">
                    <div className="text-xs text-amber-200 font-semibold">Motivo</div>
                    <div className="mt-1 text-sm text-amber-100 break-words">
                      {r.reason || "-"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-400">Denunciado</div>
                    <div className="font-medium">{r.reportedMember?.name || r.reportedName || "—"}</div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedReport(r)}
                      className="px-3 py-1 bg-emerald-700 rounded hover:bg-emerald-600 text-white"
                    >
                      Ver
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-[700px] md:min-w-full text-left border border-emerald-700 rounded-lg overflow-hidden">
                <thead className="bg-emerald-900 text-emerald-100">
                  <tr>
                    <th className="px-4 py-2">ID</th>
                    <th className="px-4 py-2">Autor</th>
                    <th className="px-4 py-2">Denunciado</th>
                    <th className="px-4 py-2">Motivo</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id} className="border-t border-emerald-700 text-emerald-300">
                      <td className="px-4 py-2">{r.id}</td>
                      <td className="px-4 py-2 break-words">
                        {r.reporter?.name || r.reporterName || "Desconhecido"}
                      </td>
                      <td className="px-4 py-2 break-words">
                        {r.reportedMember?.name || r.reportedName || "—"}
                      </td>
                      <td className="px-4 py-2 break-words">{r.reason || "-"}</td>
                      <td className="px-4 py-2">{r.status || "N/A"}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => setSelectedReport(r)}
                          className="px-3 py-1 bg-emerald-700 rounded hover:bg-emerald-600 text-white"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal */}
            {selectedReport && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                <div
                  className="absolute inset-0 bg-black/60"
                  onClick={() => setSelectedReport(null)}
                />
                <div className="relative w-full max-w-2xl sm:max-w-3xl bg-zinc-900 p-6 rounded-xl shadow-2xl ring-1 ring-white/10 text-white overflow-y-auto max-h-[90vh]">
                  <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                    <div>
                      <h3 className="text-lg font-semibold">Denúncia #{selectedReport.id}</h3>
                      <p className="text-sm text-gray-300 mt-1">
                        Status:{" "}
                        <span className="font-medium">{selectedReport.status || "N/A"}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedReport(null)}
                      className="text-white/80 hover:text-white text-xl"
                      aria-label="Fechar"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-400">Autor</p>
                      <p className="font-medium">
                        {selectedReport.reporter?.name || selectedReport.reporterName || "Desconhecido"}
                      </p>
                      <p className="text-xs text-gray-400 break-words">
                        {selectedReport.reporter?.email || selectedReport.reporterEmail || ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Denunciado</p>
                      <p className="font-medium">
                        {selectedReport.reportedMember?.name || selectedReport.reportedName || "—"}
                      </p>
                      <p className="text-xs text-gray-400 break-words">
                        {selectedReport.reportedMember?.email || selectedReport.reportedEmail || ""}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-400 text-sm mb-1">Motivo</p>
                    <div className="bg-zinc-800 p-3 rounded text-sm break-words">
                      {selectedReport.reason || "-"}
                    </div>
                  </div>

                  {selectedReport.createdAt && (
                    <div className="text-xs text-gray-400 mb-4">
                      Criada em: {new Date(selectedReport.createdAt).toLocaleString()}
                    </div>
                  )}

                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      onClick={() => {
                        handleReportStatus(selectedReport.id, "RESOLVED");
                        setSelectedReport((prev: any) =>
                          prev ? { ...prev, status: "RESOLVED" } : prev
                        );
                      }}
                      className="px-3 py-1 bg-emerald-700 rounded hover:bg-emerald-600"
                    >
                      Marcar como resolvido
                    </button>
                    <button
                      onClick={() => handleDeleteReport(selectedReport.id)}
                      className="px-3 py-1 bg-red-700 rounded hover:bg-red-600"
                    >
                      Deletar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </Container>
    </ProtectedRoute>
  );
}
