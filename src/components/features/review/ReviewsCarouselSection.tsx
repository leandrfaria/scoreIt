"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMember } from "@/context/MemberContext";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import ReviewProfileCard from "./ReviewProfileCard";
import { getReviewsByMemberId } from "@/services/review/get_member_review";
import { fetchMediaById } from "@/services/review/fetchMediaById";
import { Container } from "@/components/layout/Others/Container";
import { useLocale } from "next-intl";

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

  const carouselRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const locale = useLocale(); // retorna string como 'en', 'pt-BR' etc.

  const userIdToUse = useMemo(
    () => memberId || (member?.id ? String(member.id) : ""),
    [memberId, member?.id]
  );

  const fetchReviews = async () => {
    if (!userIdToUse) {
      setLoading(false);
      return;
    }

    // Aborta requisição anterior se existir
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    // Prioriza locale do next-intl, se não existir usa navigator.language, senão 'en'
    const localeToUse =
      (typeof locale === "string" && locale.trim() !== ""
        ? locale
        : typeof navigator !== "undefined"
        ? navigator.language || "en"
        : "en") ?? "en";

    try {
      setLoading(true);
      setErr("");

      const res = await getReviewsByMemberId(Number(userIdToUse), {
        signal: controller.signal,
      });

      // Verifica se a requisição não foi abortada antes de processar
      if (controller.signal.aborted) return;

      const enriched = await Promise.all(
        res.map(async (review) => {
          try {
            // <-- aqui passamos o locale para buscar título no idioma correto
            const media = await fetchMediaById(review.mediaId, review.mediaType, localeToUse);
            return media ? { ...review, title: media.title, posterUrl: media.posterUrl } : null;
          } catch {
            return null;
          }
        })
      );

      // Verifica novamente se não foi abortado
      if (controller.signal.aborted) return;

      const valid = enriched.filter(Boolean) as ReviewWithMediaData[];
      valid.sort((a, b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime());

      setReviews(valid);
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        console.error("Erro ao buscar reviews:", e);
        setErr("Não foi possível carregar suas avaliações agora.");
      }
    } finally {
      // Só atualiza o loading se não foi abortado
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchReviews();

    // Cleanup: aborta a requisição se o componente for desmontado
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
    // Reexecuta quando userIdToUse ou locale mudarem
  }, [userIdToUse, locale]);

  const scrollContainer = (dir: "left" | "right") => {
    if (!carouselRef.current) return;
    const scrollAmount = 350;
    carouselRef.current.scrollBy({ left: dir === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
  };

  if (loading) {
    return (
      <Container>
        <div className="py-10">
          <h2 className="text-2xl font-bold text-white mb-6 px-4 sm:px-6 lg:px-20">
            {memberId ? "Últimas avaliações do usuário" : "Suas últimas avaliações"}
          </h2>
          {/* Skeletons */}
          <div className="px-4 sm:px-6 lg:px-20 flex overflow-hidden gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="min-w-[360px] max-w-[360px] rounded-lg border border-white/10 bg-[#0D1117] p-6 animate-pulse">
                <div className="flex gap-4 mb-4">
                  <div className="w-16 h-24 bg-white/10 rounded" />
                  <div className="flex-1">
                    <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-white/10 rounded w-1/3" />
                  </div>
                </div>
                <div className="h-4 bg-white/10 rounded w-1/2 mb-3" />
                <div className="h-3 bg-white/10 rounded w-full" />
              </div>
            ))}
          </div>
        </div>
      </Container>
    );
  }

  if (err) {
    return (
      <Container>
        <div className="text-red-400 py-10 text-center">{err}</div>
      </Container>
    );
  }

  if (reviews.length === 0) {
    return (
      <Container>
        <div className="text-white py-10 text-center">Nenhuma avaliação feita ainda.</div>
      </Container>
    );
  }

  return (
    <section className="relative py-10">
      <h2 className="text-2xl font-bold text-white mb-6 px-4 sm:px-6 lg:px-20">
        {memberId ? "Últimas avaliações do usuário" : "Suas últimas avaliações"}
      </h2>

      {/* Botão esquerda */}
      <button
        onClick={() => scrollContainer("left")}
        aria-label="Rolagem para a esquerda"
        className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 bg-[var(--color-darkgreen)] p-2 rounded-full z-20 hover:brightness-110 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-lightgreen)]"
      >
        <FaChevronLeft className="text-white" />
      </button>

      {/* Carrossel */}
      <div
        ref={carouselRef}
        id="review-carousel"
        className="px-4 sm:px-6 lg:px-20 flex overflow-x-auto gap-6 scroll-smooth py-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`
          #review-carousel::-webkit-scrollbar { display: none; }
        `}</style>

        {reviews.map((review) => (
          <ReviewProfileCard
            key={review.id}
            title={review.title}
            posterUrl={review.posterUrl}
            date={review.reviewDate}
            rating={review.score}
            comment={review.memberReview}
            canEdit={!!member && member.id === review.memberId}
            reviewId={review.id}
            onDelete={fetchReviews}
          />
        ))}
      </div>

      {/* Botão direita */}
      <button
        onClick={() => scrollContainer("right")}
        aria-label="Rolagem para a direita"
        className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 bg-[var(--color-darkgreen)] p-2 rounded-full z-20 hover:brightness-110 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-lightgreen)]"
      >
        <FaChevronRight className="text-white" />
      </button>
    </section>
  );
}
