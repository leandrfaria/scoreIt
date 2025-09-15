"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { fetchMemberBadges } from "@/services/badge";
import type { BadgeResponse } from "@/types/Badge";
import AchievementModal from "./AchievementModal";
import { BADGE_CATALOG, findCatalogEntry, getBadgeImage } from "./badgeCatalog";
import { useTranslations } from "next-intl";
import { onReviewChanged } from "@/lib/events"; // 👈 NEW

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
  const t = useTranslations("badges");
  const [unlocked, setUnlocked] = useState<BadgeResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalBadge, setModalBadge] = useState<BadgeResponse | null>(null);

  const unlockedRef = useRef<BadgeResponse[]>([]);
  const seenRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 🔁 pequena proteção contra “tempestade” de eventos (debounce simples)
  const refetchLockRef = useRef(false);
  const refetchNow = async () => {
    if (refetchLockRef.current) return;
    refetchLockRef.current = true;
    setTimeout(() => (refetchLockRef.current = false), 1200); // 1.2s

    try {
      const previous = unlockedRef.current;
      const current = await fetchMemberBadges(memberId);
      unlockedRef.current = current;
      setUnlocked(current);

      const gained = diffNewBadges(previous, current);
      const notSeen = gained.find(b => !seenRef.current.has((b.code || b.name || "").toString()));
      if (notSeen) {
        const key = (notSeen.code || notSeen.name || "").toString();
        if (key) {
          seenRef.current.add(key);
          saveSeen(memberId, seenRef.current);
        }

        setModalBadge(notSeen);
        setModalOpen(true);

        const entry = findCatalogEntry(notSeen);
        toast.success(
          entry ? t("unlocked_with_name", { name: notSeen.name }) : t("unlocked_generic"),
          { icon: "🏅" }
        );
      }
    } catch {
      // silencia erros intermitentes
    }
  };

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

    // ⏱️ Polling como fallback
    if (pollMs > 0) {
      intervalRef.current = setInterval(refetchNow, pollMs);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId, pollMs]);

  // ⚡ NEW: atualização imediata assim que reviews forem registradas (inclui ALBUM)
  useEffect(() => {
    const off = onReviewChanged(() => {
      // sempre que houver uma avaliação (MOVIE/SERIE/SERIES/ALBUM), revalida badges
      refetchNow();
    });
    return () => off();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId]);

  const unlockedKeySet = useMemo(() => {
    const s = new Set<string>();
    unlocked.forEach((b) => s.add((b.code || b.name || "").toString()));
    return s;
  }, [unlocked]);

  if (loading) return <p className="text-white/80">{t("loading")}</p>;

  return (
    <>
      <section className={className}>
        <h2 className="text-white text-xl font-semibold mb-3">{t("title")}</h2>
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
                    {entry.code.startsWith("MOVIE") ? t("category.movies") :
                     entry.code.startsWith("SERIES") ? t("category.series") : t("category.music")}
                    {" • "}{isUnlocked ? t("status.unlocked") : t("status.locked")}
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
