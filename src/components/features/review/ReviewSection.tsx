"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";
import ReviewCard from "./ReviewCard";
import { ReviewFromApi, getReviewsByMediaId } from "@/services/review/get_media_review";
import { fetchMemberById } from "@/services/user/member";
import EditReviewModal from "./EditReviewModal";
import { useMember } from "@/context/MemberContext";

type SortOption = "rating" | "date" | "comments";

interface FullReview extends ReviewFromApi {
  memberName: string;
  memberAvatar: string;
}

export default function ReviewSection({
  mediaId,
  refreshTrigger,
}: {
  mediaId: string;
  refreshTrigger?: boolean;
}) {
  const { member } = useMember();
  const [reviews, setReviews] = useState<FullReview[]>([]);
  const [visibleCount, setVisibleCount] = useState(6);
  const [sortOption, setSortOption] = useState<SortOption>("date");
  const [ascending, setAscending] = useState(false);
  const [editingReview, setEditingReview] = useState<FullReview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const buildAvatar = (displayName: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=222&color=fff`;

  /** Busca avaliações + autores. Suprime AbortError e evita setState após unmount. */
  const fetchReviewsWithAuthors = useCallback(() => {
    const ac = new AbortController();

    const run = async () => {
      try {
        if (!mountedRef.current) return;
        setLoading(true);
        setError("");

        const reviewList = await getReviewsByMediaId(mediaId, { signal: ac.signal });

        // Para cada review, busca o autor
        const reviewsWithAuthors: FullReview[] = await Promise.all(
          reviewList.map(async (review) => {
            try {
              const fetchedMember = await fetchMemberById(String(review.memberId), {
                signal: ac.signal,
              });

              const name = fetchedMember?.name || "Usuário desconhecido";
              const avatar = fetchedMember?.profileImageUrl || buildAvatar(name);

              return {
                ...review,
                memberName: name,
                memberAvatar: avatar,
              };
            } catch (e: any) {
              // Se abortar no meio, retorna um fallback sem quebrar o Promise.all
              const isAbort =
                e?.name === "AbortError" ||
                e?.code === 20 ||
                (typeof e?.message === "string" && e.message.toLowerCase().includes("abort"));
              const name = "Usuário desconhecido";
              return {
                ...review,
                memberName: name,
                memberAvatar: buildAvatar(name),
                ...(isAbort ? {} : {}), // apenas garante retorno
              };
            }
          })
        );

        if (!mountedRef.current || ac.signal.aborted) return;
        setReviews(reviewsWithAuthors);
      } catch (e: any) {
        const isAbort =
          e?.name === "AbortError" ||
          e?.code === 20 ||
          (typeof e?.message === "string" && e.message.toLowerCase().includes("abort"));
        if (!isAbort) {
          console.error("❌ Erro ao buscar avaliações:", e);
          if (mountedRef.current) setError("Não foi possível carregar as avaliações no momento.");
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    void run();

    return () => {
      ac.abort();
    };
  }, [mediaId]);

  useEffect(() => {
    const cleanup = fetchReviewsWithAuthors();
    return () => {
      try {
        cleanup?.();
      } catch {}
    };
  }, [fetchReviewsWithAuthors, refreshTrigger]);

  const toggleSort = (option: SortOption) => {
    if (sortOption === option) {
      setAscending((prev) => !prev);
    } else {
      setSortOption(option);
      setAscending(false);
    }
  };

  const sortedReviews = useMemo(() => {
    const arr = [...reviews];
    switch (sortOption) {
      case "date":
        return arr.sort((a, b) =>
          ascending
            ? new Date(a.watchDate).getTime() - new Date(b.watchDate).getTime()
            : new Date(b.watchDate).getTime() - new Date(a.watchDate).getTime()
        );
      case "rating":
        return arr.sort((a, b) => (ascending ? a.score - b.score : b.score - a.score));
      case "comments": {
        const has = (r: FullReview) => (r.memberReview?.trim() ?? "") !== "";
        return arr.sort((a, b) =>
          ascending ? Number(has(a)) - Number(has(b)) : Number(has(b)) - Number(has(a))
        );
      }
      default:
        return arr;
    }
  }, [reviews, sortOption, ascending]);

  const handleLoadMore = () => setVisibleCount((prev) => prev + 6);

  const renderArrow = (option: SortOption) =>
    sortOption === option ? (ascending ? <FaArrowUp className="inline ml-1" /> : <FaArrowDown className="inline ml-1" />) : null;

  const forceReload = () => {
    // Recarrega a lista sem acusar AbortError
    try {
      const cleanup = fetchReviewsWithAuthors();
      // opcionalmente, chamar cleanup em um timeout se quiser
    } catch {}
  };

  return (
    <section className="bg-[#02070A] py-16 px-4 md:px-10 lg:px-20">
      <h2 className="text-white text-3xl font-bold mb-6 border-b border-white/10 pb-4">
        Avaliações da comunidade
      </h2>

      {/* Barra de ordenação */}
      <div className="flex flex-wrap gap-2 sm:gap-4 mb-10 text-white">
        <button
          onClick={() => toggleSort("rating")}
          className="border border-white/20 px-4 py-2 rounded hover:bg-white/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-lightgreen)]"
          aria-label="Ordenar por avaliação"
        >
          Avaliação {renderArrow("rating")}
        </button>
        <button
          onClick={() => toggleSort("comments")}
          className="border border-white/20 px-4 py-2 rounded hover:bg-white/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-lightgreen)]"
          aria-label="Ordenar por comentários"
        >
          Comentários {renderArrow("comments")}
        </button>
        <button
          onClick={() => toggleSort("date")}
          className="border border-white/20 px-4 py-2 rounded hover:bg-white/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-lightgreen)]"
          aria-label="Ordenar por data"
        >
          Data {renderArrow("date")}
        </button>
      </div>

      {/* Estados */}
      {loading && <p className="text-gray-400">Carregando avaliações...</p>}

      {error && !loading && <p className="text-red-400">{error}</p>}

      {!loading && !error && reviews.length === 0 && (
        <p className="text-gray-400 text-center">Nenhuma avaliação foi registrada ainda.</p>
      )}

      {!loading && !error && reviews.length > 0 && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedReviews.slice(0, visibleCount).map((review) => (
              <ReviewCard
                key={review.id}
                name={review.memberName}
                avatar={review.memberAvatar}
                date={review.watchDate}
                rating={review.score}
                comment={review.memberReview}
                spoiler={review.spoiler}
                onEdit={() => setEditingReview(review)}
                canEdit={!!member && Number(review.memberId) === Number(member.id)}
                reviewId={review.id}
                onDelete={forceReload}
              />
            ))}
          </div>

          {visibleCount < sortedReviews.length && (
            <div className="flex justify-center mt-10">
              <button
                onClick={handleLoadMore}
                className="px-6 py-2 bg-[var(--color-darkgreen)] text-white rounded hover:brightness-110 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-lightgreen)]"
              >
                Ver mais
              </button>
            </div>
          )}

          {editingReview && (
            <EditReviewModal
              isOpen={!!editingReview}
              onClose={() => setEditingReview(null)}
              review={editingReview}
              onSuccess={forceReload}
            />
          )}
        </>
      )}
    </section>
  );
}
