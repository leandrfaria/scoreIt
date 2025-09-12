"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { fetchMemberBadges } from "@/services/badge";
import type { BadgeResponse } from "@/types/Badge";
import AchievementModal from "./AchievementModal";
import { BADGE_CATALOG, findCatalogEntry, getBadgeImage } from "./badgeCatalog";

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
  return next.filter(b => !prevSet.has(key(b)));
}

type Props = {
  memberId: number;
  pollMs?: number;
  className?: string;
};

export default function BadgesWall({ memberId, pollMs = 8000, className }: Props) {
  const [unlocked, setUnlocked] = useState<BadgeResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalBadge, setModalBadge] = useState<BadgeResponse | null>(null);

  const unlockedRef = useRef<BadgeResponse[]>([]);
  const seenRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function loadInitial() {
    try {
      const list = await fetchMemberBadges(memberId);
      unlockedRef.current = list;
      setUnlocked(list);
      seenRef.current = loadSeen(memberId);
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

    if (pollMs > 0) {
      intervalRef.current = setInterval(async () => {
        try {
          const previous = unlockedRef.current;
          const current = await fetchMemberBadges(memberId);
          unlockedRef.current = current;
          setUnlocked(current);

          const gained = diffNewBadges(previous, current);
          if (gained.length > 0) {
            const notSeen = gained.find(b => !seenRef.current.has((b.code || b.name || "").toString()));
            if (notSeen) {
              setModalBadge(notSeen);
              setModalOpen(true);

              const entry = findCatalogEntry(notSeen);
              toast.success(
                entry ? `Parabéns! Você desbloqueou: ${notSeen.name}` : `Parabéns! Nova conquista desbloqueada.`,
                { icon: "🏅" }
              );
            }
          }
        } catch (e) {
        }
      }, pollMs);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [memberId, pollMs]);

  const unlockedKeySet = useMemo(() => {
    const s = new Set<string>();
    unlocked.forEach((b) => s.add((b.code || b.name || "").toString()));
    return s;
  }, [unlocked]);

  if (loading) return <p className="text-white/80">Carregando conquistas…</p>;

  return (
    <>
      <section className={className}>
        <h2 className="text-white text-xl font-semibold mb-3">Mural de Conquistas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {BADGE_CATALOG.map((entry) => {
            const isUnlocked = unlockedKeySet.has(entry.code);
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
        title={modalBadge?.name ?? "Conquista"}
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
