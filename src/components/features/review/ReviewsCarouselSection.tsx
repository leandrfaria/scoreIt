// src/components/features/review/ReviewsCarouselSection.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMember } from "@/context/MemberContext";
import ReviewProfileCard from "./ReviewProfileCard";
import { getReviewsByMemberId } from "@/services/review/get_member_review";
import { fetchMediaById } from "@/services/review/fetchMediaById";
import { ArrowLeft as IconArrowLeft, ArrowRight as IconArrowRight } from "lucide-react";

interface Props {
  memberId?: string;
}

interface Review {
  id: number;
  mediaId: string;
  mediaType: "movie" | "series" | "album";
  memberId: number;
  score: number;
  memberReview: string;
  watchDate: string;
  spoiler: boolean;
  reviewDate: string;
}

interface ReviewWithMediaData extends Review {
  title: string;
  posterUrl: string;
}

export default function ReviewsCarouselSection({ memberId }: Props) {
  const { member } = useMember();
  const [reviews, setReviews] = useState<ReviewWithMediaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  // --- Carrossel ---
  const trackRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);

  const mountedRef = useRef<boolean>(false);
  const requestSeqRef = useRef<number>(0);

  const userIdToUse = useMemo(
    () => memberId || (member?.id ? String(member.id) : ""),
    [memberId, member?.id]
  );

  const updateButtons = () => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeftButton(scrollLeft > 0);
    setShowRightButton(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scheduleUpdateButtons = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(updateButtons);
  };

  const scroll = (direction: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.8;
    const newLeft =
      direction === "left" ? el.scrollLeft - scrollAmount : el.scrollLeft + scrollAmount;
    el.scrollTo({ left: newLeft, behavior: "smooth" });
  };

  // --- Fetch das reviews ---
  const fetchReviews = async () => {
    const mySeq = ++requestSeqRef.current;
    if (!userIdToUse) {
      if (mountedRef.current && mySeq === requestSeqRef.current) {
        setLoading(false);
        setReviews([]);
        setErr("");
      }
      return;
    }

    try {
      if (mountedRef.current && mySeq === requestSeqRef.current) {
        setLoading(true);
        setErr("");
      }

      const res = await getReviewsByMemberId(Number(userIdToUse));

      const settled = await Promise.allSettled(
        res.map(async (review) => {
          const media = await fetchMediaById(review.mediaId, review.mediaType);
          if (!media) return null;
          return {
            ...review,
            title: media.title,
            posterUrl: media.posterUrl,
          } as ReviewWithMediaData;
        })
      );

      const valid: ReviewWithMediaData[] = [];
      for (const r of settled) {
        if (r.status === "fulfilled" && r.value) valid.push(r.value);
      }

      valid.sort((a, b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime());

      if (mountedRef.current && mySeq === requestSeqRef.current) setReviews(valid);
    } catch (e: any) {
      if (mountedRef.current && mySeq === requestSeqRef.current) {
        console.error("Erro ao buscar reviews:", e);
        setErr("Não foi possível carregar suas avaliações agora.");
      }
    } finally {
      if (mountedRef.current && mySeq === requestSeqRef.current) setLoading(false);
      scheduleUpdateButtons();
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestSeqRef.current++;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    fetchReviews();
    return () => {
      requestSeqRef.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIdToUse]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => scheduleUpdateButtons();
    el.addEventListener("scroll", onScroll, { passive: true });
    scheduleUpdateButtons();
    return () => el.removeEventListener("scroll", onScroll);
  }, [reviews.length]);

  useEffect(() => {
    const onResize = () => scheduleUpdateButtons();
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // --- Render ---
  if (loading) {
    return (
      <section className="w-full py-4">
        <div className="flex overflow-hidden gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="min-w-[300px] max-w-[300px] sm:min-w-[340px] sm:max-w-[340px] rounded-2xl border border-white/10 bg-[#0D1117] p-5 animate-pulse"
            >
              <div className="flex gap-4">
                <div className="w-16 h-24 bg-white/10 rounded-md" />
                <div className="flex-1">
                  <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-white/10 rounded w-1/3 mb-4" />
                  <div className="h-3 bg-white/10 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Setas sem fundo, centralizadas, desabilitadas no loading */}
        <div className="flex justify-center mt-5 gap-6">
          <button disabled className="p-1 text-white/60 cursor-not-allowed" aria-label="Anterior">
            <IconArrowLeft className="h-5 w-5" />
          </button>
          <button disabled className="p-1 text-white/60 cursor-not-allowed" aria-label="Próximo">
            <IconArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>
    );
  }

  if (err) return <div className="text-red-400 py-6 text-center">{err}</div>;

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-sm">Nenhuma avaliação feita ainda.</p>
      </div>
    );
  }

  return (
    <section className="w-full py-4">
      {/* trilho */}
      <div
        ref={trackRef}
        className="flex overflow-x-auto gap-4 sm:gap-6 scroll-smooth px-1 sm:px-0 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
        role="list"
        aria-label="Reviews recentes"
      >
        {reviews.map((review) => (
          <div
            key={review.id}
            className="flex-shrink-0 snap-start"
            style={{ width: "340px", maxWidth: "340px" }}
            role="listitem"
          >
            <ReviewProfileCard
              title={review.title}
              posterUrl={review.posterUrl}
              date={review.reviewDate}
              rating={review.score}
              comment={review.memberReview}
              canEdit={!!member && member.id === review.memberId}
              reviewId={review.id}
              onDelete={fetchReviews}
            />
          </div>
        ))}
      </div>

      {/* Controles ABAIXO — sem fundo, brancos, centralizados (20px) */}
      <div className="flex justify-center mt-5 gap-6">
        <button
          onClick={() => scroll("left")}
          aria-label="Anterior"
          className="p-1 text-white/70 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          disabled={!showLeftButton}
        >
          <IconArrowLeft className="h-5 w-5 transition-transform hover:scale-110" />
        </button>
        <button
          onClick={() => scroll("right")}
          aria-label="Próximo"
          className="p-1 text-white/70 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          disabled={!showRightButton}
        >
          <IconArrowRight className="h-5 w-5 transition-transform hover:scale-110" />
        </button>
      </div>
    </section>
  );
}
