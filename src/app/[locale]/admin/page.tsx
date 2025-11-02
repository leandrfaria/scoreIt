// File: app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/Others/Container";
import { ProtectedRoute } from "@/components/layout/Others/ProtectedRoute";
import { useMember } from "@/context/MemberContext";
import { useTranslations } from "next-intl";
import {
  listAllMembers,
  toggleMemberStatus,
  toggleMemberRole,
  updateMemberAdmin,
  updateReportStatus,
  deleteReport,
  getAllReportsWithReportedMember,
} from "@/services/admin/admin";
import toast from "react-hot-toast";

const IconUser = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 21c0-3.866 3.582-7 9-7s9 3.134 9 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconReport = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 9v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 17h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconClose = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function Avatar({ imageUrl, name, size = 40 }: { imageUrl?: string | null; name?: string; size?: number }) {
  const initials = (name || "").trim().charAt(0)?.toUpperCase() || "U";
  const [err, setErr] = useState(false);
  const s = size;

  if (imageUrl && !err) {
    return (
      <div style={{ width: s, height: s }} className="rounded-full overflow-hidden flex items-center justify-center bg-emerald-800 text-white flex-shrink-0">
        <Image
          src={imageUrl}
          alt={name || "Avatar"}
          width={s}
          height={s}
          className="object-cover"
          onError={() => setErr(true)}
          priority={false}
        />
      </div>
    );
  }

  return (
    <div style={{ width: s, height: s }} className="rounded-full overflow-hidden flex items-center justify-center bg-emerald-800 text-white flex-shrink-0">
      <span className="font-semibold">{initials}</span>
    </div>
  );
}

export default function AdminPage() {
  const t = useTranslations("AdminPage");
  const { member } = useMember();

  const [members, setMembers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<{ name: string; email: string; enabled: boolean }>({ name: "", email: "", enabled: false });
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  // helpers
  const isAdminAccount = (m: any) => !!m?.role && String(m.role).toUpperCase().includes("ADMIN");
  const isCurrentUser = (m: any) => !!member && m?.id === member.id;
  const isNotEditable = (m: any) => isAdminAccount(m) || isCurrentUser(m);
  const formatRole = (r: any) => String(r || "").replace(/^ROLE_/i, "").toUpperCase();

  // dados iniciais
  useEffect(() => {
    (async () => {
      try {
        const membersRes = await listAllMembers(0, 20);
        setMembers(membersRes?.content || membersRes || []);

        const reportsRes = await getAllReportsWithReportedMember();
        setReports(reportsRes || []);
      } catch (err: any) {
        toast.error(t("errors.loadAdminData"));
        console.error(err);
      }
    })();
  }, [t]);

  // Ações membros e denúncias
  const handleEnableDisableMember = async (id: number) => {
    const target = members.find((m) => m.id === id);
    if (isNotEditable(target)) return toast.error(t("errors.operationNotAllowed"));
    try {
      await toggleMemberStatus(id);
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)));
      toast.success(t("toasts.memberStatusUpdated", { name: target?.name, status: target?.enabled ? t("labels.disabled") : t("labels.enabled") }));
    } catch {
      toast.error(t("errors.updateMemberStatus"));
    }
  };

  const handlePromoteDemoteMember = async (id: number) => {
    const target = members.find((m) => m.id === id);
    if (isAdminAccount(target)) return toast.error(t("errors.operationNotAllowedForAdmin"));
    if (isNotEditable(target)) return toast.error(t("errors.operationNotAllowed"));
    try {
      await toggleMemberRole(id);
      const membersRes = await listAllMembers(0, 20);
      setMembers(membersRes?.content || membersRes || []);
      toast.success(t("toasts.memberRoleUpdated", { name: target?.name }));
    } catch {
      toast.error(t("errors.updateMemberRole"));
    }
  };

  const handleReportStatus = async (id: number, status: string) => {
    try {
      await updateReportStatus(id, status);
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      if (selectedReport?.id === id) setSelectedReport({ ...selectedReport, status });
      toast.success(t("toasts.reportStatusUpdated"));
    } catch {
      toast.error(t("errors.updateReportStatus"));
    }
  };

  const handleDeleteReport = async (id: number) => {
    try {
      await deleteReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
      if (selectedReport?.id === id) setSelectedReport(null);
      toast.success(t("toasts.reportDeleted"));
    } catch {
      toast.error(t("errors.deleteReport"));
    }
  };

  const startEdit = (m: any) => {
    if (isNotEditable(m)) return toast.error(t("errors.cannotEditProfile"));
    setEditingId(m.id);
    setEditData({ name: m.name || "", email: m.email || "", enabled: !!m.enabled });
  };
  const cancelEdit = () => setEditingId(null);
  const saveEdit = async (id: number) => {
    try {
      const updated = await updateMemberAdmin(id, editData);
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
      setEditingId(null);
      toast.success(t("toasts.memberUpdated"));
    } catch {
      toast.error(t("errors.updateMember"));
    }
  };

  return (
    <ProtectedRoute>
      <Container>
        <div className="py-12 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-emerald-100">{t("title")}</h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-zinc-900/40 border border-emerald-700 px-3 py-2 rounded-lg">
                <IconUser className="h-5 w-5 text-emerald-200" />
                <div className="text-sm text-emerald-200">{t("labels.membersCount", { count: members.length })}</div>
              </div>
              <div className="flex items-center gap-2 bg-zinc-900/40 border border-amber-500 px-3 py-2 rounded-lg">
                <IconReport className="h-5 w-5 text-amber-200" />
                <div className="text-sm text-amber-200">{t("labels.reportsCount", { count: reports.length })}</div>
              </div>

              {/* Botão de Gráficos (navega para página separada) */}
              <Link href="/graficos" className="ml-2 px-3 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium">{t("actions.charts")}</Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Members Card (large) */}
            <div className="lg:col-span-2 bg-zinc-900 border border-emerald-800 rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{t("sections.members")}</h2>
                <div className="text-sm text-emerald-300/80">{t("sections.membersSubtitle")}</div>
              </div>

              {/* Mobile list (kept) */}
              <div className="md:hidden flex flex-col gap-4">
                {members.map((m) => {
                  const notEditable = isNotEditable(m);
                  const adminAcc = isAdminAccount(m);
                  return (
                    <div key={m.id} className="bg-gradient-to-br from-zinc-900/70 to-zinc-800/40 p-4 rounded-lg border border-emerald-700/40">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar imageUrl={m.profileImageUrl} name={m.name} size={48} />
                          <div>
                            <div className="font-semibold text-emerald-100">{m.name || "-"}</div>
                            <div className="text-xs text-emerald-300">{m.email}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded ${m.enabled ? 'bg-emerald-800/60 text-emerald-100' : 'bg-rose-800/60 text-rose-100'}`}>
                            {m.enabled ? t("labels.active") : t("labels.inactive")}
                          </div>
                          <div className="text-xs text-emerald-300 mt-1">{formatRole(m.role)}</div>
                        </div>
                      </div>

                      <div className="mt-3 text-sm space-y-2">
                        <div>
                          <div className="text-xs text-emerald-300">{t("labels.bio")}</div>
                          <div className="text-emerald-100">{m.bio || '—'}</div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2">
                          {editingId === m.id ? (
                            <>
                              <button onClick={() => saveEdit(m.id)} className="px-3 py-1 bg-emerald-700 rounded hover:bg-emerald-600">{t("actions.save")}</button>
                              <button onClick={cancelEdit} className="px-3 py-1 bg-zinc-800 rounded hover:bg-zinc-700">{t("actions.cancel")}</button>
                            </>
                          ) : (
                            <>
                              {!notEditable && (
                                <button onClick={() => startEdit(m)} className="px-3 py-1 bg-emerald-700 rounded hover:bg-emerald-600">{t("actions.edit")}</button>
                              )}

                              {/* hide sensitive actions for admin accounts */}
                              {!adminAcc && (
                                <>
                                  <button onClick={() => handleEnableDisableMember(m.id)} className="px-3 py-1 bg-emerald-700 rounded hover:bg-emerald-600">{m.enabled ? t("actions.disable") : t("actions.enable")}</button>
                                  <button onClick={() => handlePromoteDemoteMember(m.id)} className="px-3 py-1 bg-emerald-800 rounded hover:bg-emerald-700">{isAdminAccount(m) ? t("actions.demote") : t("actions.promote")}</button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full table-auto border-separate border-spacing-0 bg-zinc-900 rounded-lg overflow-hidden">
                  <thead className="bg-emerald-900/20 text-emerald-100">
                    <tr>
                      <th className="px-4 py-3 text-left">{t("table.id")}</th>
                      <th className="px-4 py-3 text-left">{t("table.name")}</th>
                      <th className="px-4 py-3 text-left">{t("table.email")}</th>
                      <th className="px-4 py-3 text-left">{t("table.role")}</th>
                      <th className="px-4 py-3 text-center">{t("table.active")}</th>
                      <th className="px-4 py-3 text-left">{t("table.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m, idx) => {
                      const notEditable = isNotEditable(m);
                      const adminAcc = isAdminAccount(m);
                      return (
                        <tr key={m.id} className={`${idx % 2 === 0 ? 'bg-zinc-900/30' : ''} border-b border-emerald-800/20`}>
                          <td className="px-4 py-3 text-emerald-200">{m.id}</td>
                          <td className="px-4 py-3">
                            {editingId === m.id ? (
                              <input value={editData.name} onChange={(e) => setEditData((p) => ({ ...p, name: e.target.value }))} className="w-full rounded px-2 py-1 text-white bg-emerald-900/60 placeholder:text-emerald-300" />
                            ) : (
                              <div className="flex items-center gap-3">
                                <Avatar imageUrl={m.profileImageUrl} name={m.name} size={40} />
                                <div className="text-emerald-100">{m.name || '-'}</div>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 break-words">
                            {editingId === m.id ? (
                              <input value={editData.email} onChange={(e) => setEditData((p) => ({ ...p, email: e.target.value }))} className="w-full rounded px-2 py-1 text-white bg-emerald-900/60 placeholder:text-emerald-300" />
                            ) : (
                              <div className="text-emerald-300">{m.email}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">{formatRole(m.role)}</td>
                          <td className="px-4 py-3 text-center">
                            {editingId === m.id ? (
                              <input type="checkbox" checked={editData.enabled} onChange={(e) => setEditData({ ...editData, enabled: e.target.checked })} />
                            ) : m.enabled ? (
                              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-700 text-white">✓</div>
                            ) : (
                              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-rose-700 text-white">✕</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              {editingId === m.id ? (
                                <>
                                  <button onClick={() => saveEdit(m.id)} className="px-3 py-1 bg-emerald-700 rounded hover:bg-emerald-600">{t("actions.save")}</button>
                                  <button onClick={cancelEdit} className="px-3 py-1 bg-zinc-800 rounded hover:bg-zinc-700">{t("actions.cancel")}</button>
                                </>
                              ) : (
                                <>
                                  {!notEditable && (
                                    <button onClick={() => startEdit(m)} className="px-3 py-1 bg-emerald-700 rounded hover:bg-emerald-600">{t("actions.edit")}</button>
                                  )}

                                  {/* hide sensitive actions for admin accounts */}
                                  {!adminAcc && (
                                    <>
                                      <button onClick={() => handleEnableDisableMember(m.id)} className="px-3 py-1 bg-emerald-700 rounded hover:bg-emerald-600">{m.enabled ? t("actions.disable") : t("actions.enable")}</button>
                                      <button onClick={() => handlePromoteDemoteMember(m.id)} className="px-3 py-1 bg-emerald-800 rounded hover:bg-emerald-700">{isAdminAccount(m) ? t("actions.demote") : t("actions.promote")}</button>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Reports side card */}
            <aside className="space-y-6">
              <div className="bg-zinc-900 border border-amber-700 rounded-2xl p-4 shadow-lg">
                <h3 className="text-lg font-semibold">🚨 {t("sections.reports")}</h3>
                <p className="text-sm text-amber-200/70 mt-1">{t("sections.reportsSubtitle")}</p>

                <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                  {reports.length === 0 && <div className="text-sm text-amber-200/60">{t("messages.noReports")}</div>}
                  {reports.map((r) => (
                    <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800 border border-amber-700/20">
                      <div className="flex-shrink-0">
                        <Avatar imageUrl={r.reporter?.profileImageUrl || r.reporterImageUrl} name={r.reporter?.name || r.reporterName} size={40} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">#{r.id} — {r.reportedMember?.name || r.reportedName || '—'}</div>
                          <div className={`text-xs px-2 py-0.5 rounded ${r.status === 'RESOLVED' ? 'bg-emerald-800 text-emerald-100' : 'bg-amber-800 text-amber-100'}`}>{r.status || 'N/A'}</div>
                        </div>
                        <div className="text-xs text-amber-200/80 mt-1 line-clamp-2">{r.reason || '-'}</div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button onClick={() => setSelectedReport(r)} className="px-3 py-1 bg-amber-700 text-white rounded">{t("actions.view")}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>

          {/* Modal */}
          {selectedReport && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
              <div className="absolute inset-0 bg-black/70" onClick={() => setSelectedReport(null)} />
              <div className="relative w-full max-w-2xl bg-zinc-900 p-6 rounded-2xl shadow-2xl ring-1 ring-white/5 text-white overflow-y-auto max-h-[90vh]">
                <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                  <div>
                    <h3 className="text-lg font-semibold">{t("modal.title", { id: selectedReport.id })}</h3>
                    <p className="text-sm text-amber-200/70 mt-1">{t("modal.status")} <span className="font-medium">{selectedReport.status || 'N/A'}</span></p>
                  </div>
                  <button onClick={() => setSelectedReport(null)} className="text-white/80 hover:text-white p-2 rounded-full bg-zinc-800/40">
                    <IconClose className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Avatar imageUrl={selectedReport.reporter?.profileImageUrl} name={selectedReport.reporter?.name || selectedReport.reporterName} size={56} />
                    <div>
                      <p className="text-gray-400">{t("modal.author")}</p>
                      <p className="font-medium">{selectedReport.reporter?.name || selectedReport.reporterName || 'Desconhecido'}</p>
                      <p className="text-xs text-gray-400 break-words">{selectedReport.reporter?.email || selectedReport.reporterEmail || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Avatar imageUrl={selectedReport.reportedMember?.profileImageUrl} name={selectedReport.reportedMember?.name || selectedReport.reportedName} size={56} />
                    <div>
                      <p className="text-gray-400">{t("modal.reported")}</p>
                      <p className="font-medium">{selectedReport.reportedMember?.name || selectedReport.reportedName || '—'}</p>
                      <p className="text-xs text-gray-400 break-words">{selectedReport.reportedMember?.email || selectedReport.reportedEmail || ''}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-1">{t("modal.reason")}</p>
                  <div className="bg-zinc-800 p-3 rounded text-sm break-words">{selectedReport.reason || '-'}</div>
                </div>

                {selectedReport.createdAt && (
                  <div className="text-xs text-gray-400 mb-4">
                    {t("modal.createdAt")}:{" "}
                    {new Intl.DateTimeFormat("en-US", {
                      month: "2-digit",
                      day: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    }).format(new Date(selectedReport.createdAt))}
                  </div>
                )}

                <div className="flex flex-wrap justify-end gap-2">
                  <button onClick={() => { handleReportStatus(selectedReport.id, "RESOLVED"); setSelectedReport((prev: any) => prev ? { ...prev, status: "RESOLVED" } : prev); }} className="px-3 py-1 bg-emerald-700 rounded hover:bg-emerald-600">{t("modal.markResolved")}</button>
                  <button onClick={() => handleDeleteReport(selectedReport.id)} className="px-3 py-1 bg-red-700 rounded hover:bg-red-600">{t("modal.delete")}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Container>
    </ProtectedRoute>
  );
}