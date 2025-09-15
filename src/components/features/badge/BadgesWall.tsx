"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { fetchMemberBadges } from "@/services/badge";
import type { BadgeResponse } from "@/types/Badge";
import AchievementModal from "./AchievementModal";
import { BADGE_CATALOG, findCatalogEntry, getBadgeImage } from "./badgeCatalog";
import { useTranslations } from "next-intl";
import { onReviewChanged } from "@/lib/events";

const seenKey = (memberId: number) => `scoreit_badges_seen:${memberId}`;

function loadSeen(memberId: number): Set<string> {
  try {
    const raw = localStorage.getItem(seenKey(memberId));
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}
function saveSeen(memberId: number, seen: Set<string>) {
  try {
    localStorage.setItem(seenKey(memberId), JSON.stringify(Array.from(seen)));
  } catch {}
}

function diffNewBadges(prev: BadgeResponse[], next: BadgeResponse[]) {
  const key = (b: BadgeResponse) => (b.code || b.name || "").toString();
  const prevSet = new Set(prev.map(key));
  return next.filter((b) => !prevSet.has(key(b)));
}

type Props = {
  memberId: number;
  pollMs?: number;
  className?: string;
  /** deixe true se quiser escrever o título dentro do componente */
  showTitle?: boolean;
};

type Group = { label: string; prefix: "MOVIE" | "SERIES" | "ALBUM" };
const GROUPS: Group[] = [
  { label: "Filmes", prefix: "MOVIE" },
  { label: "Séries", prefix: "SERIES" },
  { label: "Músicas", prefix: "ALBUM" },
];

export default function BadgesWall({
  memberId,
  pollMs = 8000,
  className,
  showTitle = false,
}: Props) {
  const t = useTranslations("badges");
  const [unlocked, setUnlocked] = useState<BadgeResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalBadge, setModalBadge] = useState<BadgeResponse | null>(null);

  const unlockedRef = useRef<BadgeResponse[]>([]);
  const seenRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const refetchLockRef = useRef(false);

  const notifyOnce = (badge: BadgeResponse) => {
    const key = (badge.code || badge.name || "").toString();
    if (!key || seenRef.current.has(key)) return;
    toast.success(t("unlocked_with_name", { name: badge.name }), { icon: "🏅" });
    seenRef.current.add(key);
  };

  const refetchNow = async () => {
    if (refetchLockRef.current) return;
    refetchLockRef.current = true;
    setTimeout(() => (refetchLockRef.current = false), 1200);

    try {
      const previous = unlockedRef.current;
      const current = await fetchMemberBadges(memberId);
      unlockedRef.current = current;
      setUnlocked(current);

      // novas conquistas ganhas desde a última leitura
      const gained = diffNewBadges(previous, current);
      const firstNotSeen = gained.find(
        (b) => !seenRef.current.has((b.code || b.name || "").toString())
      );
      if (firstNotSeen) {
        notifyOnce(firstNotSeen);
        saveSeen(memberId, seenRef.current);
        setModalBadge(firstNotSeen);
        setModalOpen(true);
      }
    } catch (e) {
      // silencioso: não deixa quebrar UI
      console.error("Erro ao atualizar badges:", e);
    }
  };

  async function loadInitial() {
    try {
      const list = await fetchMemberBadges(memberId);
      unlockedRef.current = list;
      setUnlocked(list);

      // carrega badges já vistas
      seenRef.current = loadSeen(memberId);

      // ⚠️ AVISO AO ABRIR PERFIL:
      // qualquer badge desbloqueada que ainda não foi avisada gera um toast (uma única vez).
      let changed = false;
      for (const b of list) {
        const key = (b.code || b.name || "").toString();
        if (key && !seenRef.current.has(key)) {
          notifyOnce(b);
          changed = true;
        }
      }
      if (changed) saveSeen(memberId, seenRef.current);

      setLoading(false);
    } catch (e) {
      console.error("Erro ao carregar badges:", e);
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    setModalOpen(false);
    setModalBadge(null);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    loadInitial();

    if (pollMs > 0) intervalRef.current = setInterval(refetchNow, pollMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId, pollMs]);

  // atualiza na hora que uma review é registrada
  useEffect(() => {
    const off = onReviewChanged(() => refetchNow());
    // cleanup sempre do tipo () => void
    return () => {
      if (typeof off === "function") {
        try { off(); } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId]);

  const unlockedKeySet = useMemo(() => {
    const s = new Set<string>();
    unlocked.forEach((b) => s.add((b.code || b.name || "").toString()));
    return s;
  }, [unlocked]);

  if (loading) return <p className="text-white/80">{t("loading") ?? "Carregando conquistas..."}</p>;

  return (
    <>
      <section className={className}>
        {showTitle && <h2 className="text-white text-xl font-semibold mb-4">Mural de Conquistas</h2>}

        <div className="space-y-10">
          {GROUPS.map((g) => {
            const items = BADGE_CATALOG.filter((b) => b.code.startsWith(g.prefix));
            return (
              <div key={g.prefix}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white/90 font-medium">{g.label}</h3>
                </div>

                {/* ocupa bem o espaço em telas grandes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {items.map((entry) => {
                    const isUnlocked = unlockedKeySet.has(entry.code);
                    const img = getBadgeImage(entry, isUnlocked);
                    const { plural, singular } = getCategoryLabels(entry.code);
                    const req = `Requisito: avalie ${entry.goal} ${entry.goal === 1 ? singular : plural} para desbloquear.`;

                    return (
                      <div
                        key={entry.code}
                        className="relative group rounded-2xl p-5 bg-gradient-to-br from-[#0e1718] to-[#0b1212] ring-1 ring-white/10 shadow-sm hover:shadow-md hover:ring-white/20 transition min-h-[130px]"
                      >
                        {/* selo de status */}
                        <span
                          className={`absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full tracking-wide ${
                            isUnlocked
                              ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20"
                              : "bg-white/5 text-white/60 ring-1 ring-white/10"
                          }`}
                        >
                          {isUnlocked ? "desbloqueada" : "bloqueada"}
                        </span>

                        <div className="flex items-center gap-4">
                          {/* imagem maior e sem cadeado */}
                          <div className="relative w-16 h-16 shrink-0">
                            <Image src={img} alt={entry.name} fill className="object-cover rounded-full" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-white text-base font-medium truncate">{entry.name}</p>
                            <p className="text-[12px] text-white/60">{g.label}</p>
                          </div>
                        </div>

                        {/* tooltip com requisito claro */}
                        <div className="pointer-events-none absolute left-0 right-0 -bottom-2 translate-y-full opacity-0 group-hover:opacity-100 group-hover:translate-y-[10px] transition mx-3 rounded-lg bg-neutral-900/95 ring-1 ring-white/10 p-3 shadow-xl">
                          <p className="text-xs text-white/80">
                            {isUnlocked ? `Você já desbloqueou. ${req}` : req}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <AchievementModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          if (modalBadge) {
            const key = (modalBadge.code || modalBadge.name || "").toString();
            if (key) {
              seenRef.current.add(key);
              saveSeen(memberId, seenRef.current);
            }
          }
          setModalBadge(null);
        }}
        title={modalBadge?.name ?? t("modal.title")}
        description={modalBadge?.description || undefined}
        imageUrl={
          modalBadge
            ? (() => {
                const entry = findCatalogEntry(modalBadge);
                return entry ? getBadgeImage(entry, true) : undefined;
              })()
            : undefined
        }
      />
    </>
  );
}

/* ===== helpers ===== */
function getCategoryLabels(code: string) {
  const prefix = (code || "").split("_")[0]; // MOVIE | SERIES | ALBUM
  if (prefix === "MOVIE") return { plural: "filmes", singular: "filme" };
  if (prefix === "SERIES") return { plural: "séries", singular: "série" };
  return { plural: "álbuns", singular: "álbum" };
}
