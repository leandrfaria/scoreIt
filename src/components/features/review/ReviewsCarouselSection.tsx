"use client";

import { useEffect, useState } from "react";
import { useMember } from "@/context/MemberContext";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import ReviewProfileCard from "./ReviewProfileCard";
import { getReviewsByMemberId } from "@/services/review/get_member_review";
import { fetchMediaById } from "@/services/review/fetchMediaById";
import { Container } from "@/components/layout/Container";

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

  const fetchReviews = async () => {
    const token = localStorage.getItem("authToken");
    const idToUse = memberId || member?.id;

    if (!token || !idToUse) return;

    try {
      const res = await getReviewsByMemberId(Number(idToUse), token);

      const reviewsWithMedia: ReviewWithMediaData[] = await Promise.all(
        res.map(async (review) => {
          const media = await fetchMediaById(review.mediaId, review.mediaType);
          if (!media) return null;
          return {
            ...review,
            title: media.title,
            posterUrl: media.posterUrl,
          };
        })
      ).then((results) => results.filter((r): r is ReviewWithMediaData => r !== null));

      const sorted = reviewsWithMedia.sort(
        (a, b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime()
      );

      setReviews(sorted);
    } catch (error) {
      console.error("Erro ao buscar reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [memberId, member]);

  const scrollContainer = (dir: "left" | "right") => {
    const container = document.getElementById("review-carousel");
    if (!container) return;
    const scrollAmount = 350;
    container.scrollBy({ left: dir === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
  };

  if (loading) {
    return (
      <Container>
        <div className="text-white py-10 text-center">Carregando avaliações...</div>
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
        className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 bg-[var(--color-darkgreen)] p-2 rounded-full z-20 hover:brightness-110 transition"
      >
        <FaChevronLeft className="text-white" />
      </button>

      {/* Carrossel */}
      <div
        id="review-carousel"
        className="px-4 sm:px-6 lg:px-20 flex overflow-x-auto gap-6 scroll-smooth py-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`
          #review-carousel::-webkit-scrollbar {
            display: none;
          }
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
        className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 bg-[var(--color-darkgreen)] p-2 rounded-full z-20 hover:brightness-110 transition"
      >
        <FaChevronRight className="text-white" />
      </button>
    </section>

  );
}
