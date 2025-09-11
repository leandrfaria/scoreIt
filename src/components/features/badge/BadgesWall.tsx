"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { fetchMemberBadges } from "@/services/badge";
import type { BadgeResponse } from "@/types/Badge";
import AchievementModal from "./AchievementModal";
import { BADGE_CATALOG, findCatalogEntry, getBadgeImage } from "./badgeCatalog";

/** Compara listas de badges e retorna as que são novas */
function diffNewBadges(prev: BadgeResponse[], next: BadgeResponse[]) {
  const prevSet = new Set(prev.map(b => (b as any).code || b.name));
  return next.filter(b => !prevSet.has((b as any).code || b.name));
}

type Props = {
  memberId: number;
  /** polling em ms para detectar desbloqueios em tempo real (ex.: após reviews). 0 = desliga */
  pollMs?: number;
  className?: string;
};

export default function BadgesWall({ memberId, pollMs = 8000, className }: Props) {
  const [unlocked, setUnlocked] = useState<BadgeResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // modal-state para quando detectar nova badge
  const [modalOpen, setModalOpen] = useState(false);
  const [modalBadge, setModalBadge] = useState<BadgeResponse | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function load() {
    try {
      const list = await fetchMemberBadges(memberId);
      setUnlocked(list);
      setLoading(false);
      return list;
    } catch (e) {
      console.error("Erro ao carregar badges:", e);
      setLoading(false);
      return [];
    }
  }

  useEffect(() => {
    load();
    if (pollMs > 0) {
      pollingRef.current = setInterval(async () => {
        const previous = unlocked;
        const current = await fetchMemberBadges(memberId).catch(() => previous);
        const gained = diffNewBadges(previous, current);
        if (gained.length > 0) {
          // pega a primeira nova e mostra modal/toast
          const b = gained[0];
          setModalBadge(b);
          setModalOpen(true);

          const entry = findCatalogEntry(b);
          if (entry) {
            toast.success(`Parabéns! Você desbloqueou: ${b.name}`, {
              icon: "🏅",
            });
          } else {
            toast.success(`Parabéns! Nova conquista desbloqueada.`, { icon: "🏅" });
          }
        }
        setUnlocked(current);
      }, pollMs);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId]);

  const catalog = BADGE_CATALOG;

  const unlockedKeySet = useMemo(() => {
    const s = new Set<string>();
    unlocked.forEach((b) => s.add((b as any).code || b.name));
    return s;
  }, [unlocked]);

  if (loading) return <p className="text-white/80">Carregando conquistas…</p>;

  return (
    <>
      <section className={className}>
        <h2 className="text-white text-xl font-semibold mb-3">Mural de Conquistas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {catalog.map((entry) => {
            // unlocked se existe badge com mesmo code (ou mesmo name no fallback)
            const isUnlocked = Array.from(unlockedKeySet).some(k => k === entry.code || k.includes(entry.name));
            const img = getBadgeImage(entry, isUnlocked);

            return (
              <div
                key={entry.code}
                className="relative rounded-lg bg-neutral-900 ring-1 ring-white/10 p-3 flex items-center gap-3 hover:bg-neutral-800 transition"
              >
                <div className="relative w-14 h-14 shrink-0">
                  <Image src={img} alt={entry.name} fill className="object-cover rounded-full" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{entry.name}</p>
                  <p className="text-xs text-white/60">
                    {entry.code.startsWith("MOVIE") ? "Filmes" :
                     entry.code.startsWith("SERIES") ? "Séries" : "Músicas"}
                    {isUnlocked ? " • desbloqueada" : " • bloqueada"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Modal de parabéns */}
      <AchievementModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalBadge?.name ?? "Conquista"}
        description={modalBadge?.description}
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
