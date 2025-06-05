"use client";

import { useEffect, useState } from "react";
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

export default function ReviewSection({ mediaId }: { mediaId: string }) {
  const { member } = useMember();
  const [reviews, setReviews] = useState<FullReview[]>([]);
  const [visibleCount, setVisibleCount] = useState(6);
  const [sortOption, setSortOption] = useState<SortOption>("date");
  const [ascending, setAscending] = useState(false);
  const [editingReview, setEditingReview] = useState<FullReview | null>(null);

  useEffect(() => {
    const fetchReviewsWithAuthors = async () => {
      try {
        const reviewList = await getReviewsByMediaId(mediaId);

        const reviewsWithAuthors: FullReview[] = await Promise.all(
          reviewList.map(async (review) => {
            try {
              const member = await fetchMemberById(String(review.memberId));
              return {
                ...review,
                memberName: member.name,
                memberAvatar:
                  member.profileImageUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    member.name
                  )}&background=random&color=fff`,
              };
            } catch (error) {
              return {
                ...review,
                memberName: "Usuário desconhecido",
                memberAvatar: `https://ui-avatars.com/api/?name=Anônimo&background=555&color=fff`,
              };
            }
          })
        );

        setReviews(reviewsWithAuthors);
      } catch (error) {
        console.error("Erro ao buscar avaliações:", error);
      }
    };

    fetchReviewsWithAuthors();
  }, [mediaId]);

  const toggleSort = (option: SortOption) => {
    if (sortOption === option) {
      setAscending(!ascending);
    } else {
      setSortOption(option);
      setAscending(false);
    }
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortOption === "date") {
      return ascending
        ? new Date(a.watchDate).getTime() - new Date(b.watchDate).getTime()
        : new Date(b.watchDate).getTime() - new Date(a.watchDate).getTime();
    }

    if (sortOption === "rating") {
      return ascending ? a.score - b.score : b.score - a.score;
    }

    if (sortOption === "comments") {
      const hasCommentA = a.memberReview?.trim() !== "";
      const hasCommentB = b.memberReview?.trim() !== "";
      return ascending
        ? Number(hasCommentA) - Number(hasCommentB)
        : Number(hasCommentB) - Number(hasCommentA);
    }

    return 0;
  });

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 6);
  };

  const renderArrow = (option: SortOption) =>
    sortOption === option ? (
      ascending ? <FaArrowUp className="inline ml-1" /> : <FaArrowDown className="inline ml-1" />
    ) : null;

  return (
    <section className="bg-[#02070A] py-16 px-4 md:px-10 lg:px-20">
      <h2 className="text-white text-3xl font-bold mb-6 border-b border-white/10 pb-4">
        Avaliações da comunidade
      </h2>

      <div className="flex flex-wrap gap-4 mb-10 text-white">
        <button
          onClick={() => toggleSort("rating")}
          className="border border-white/20 px-4 py-2 rounded hover:bg-white/10 transition"
        >
          Avaliação {renderArrow("rating")}
        </button>
        <button
          onClick={() => toggleSort("comments")}
          className="border border-white/20 px-4 py-2 rounded hover:bg-white/10 transition"
        >
          Comentários {renderArrow("comments")}
        </button>
        <button
          onClick={() => toggleSort("date")}
          className="border border-white/20 px-4 py-2 rounded hover:bg-white/10 transition"
        >
          Data {renderArrow("date")}
        </button>
      </div>

      {reviews.length === 0 ? (
        <p className="text-gray-400 text-center">Nenhuma avaliação foi registrada ainda.</p>
      ) : (
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
                onEdit={() => setEditingReview(review)}
                canEdit={!!member && review.memberId === member.id}
              />
            ))}
          </div>

          {visibleCount < sortedReviews.length && (
            <div className="flex justify-center mt-10">
              <button
                onClick={handleLoadMore}
                className="px-6 py-2 bg-[var(--color-darkgreen)] text-white rounded hover:brightness-110 transition"
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
            />
          )}
        </>
      )}
    </section>
  );
}
