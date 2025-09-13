"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Series } from "@/types/Series";
import { FaHeart, FaStar } from "react-icons/fa";
import { FiHeart } from "react-icons/fi";
import Image from "next/image";
import { useMember } from "@/context/MemberContext";
import { isFavoritedMedia } from "@/services/user/is_favorited";
import { addFavouriteSeries } from "@/services/series/add_fav_series";
import { removeFavouriteMedia } from "@/services/user/remove_fav";
import toast from "react-hot-toast";
import RatingModal from "@/components/features/review/RatingModal";
import ReviewSection from "@/components/features/review/ReviewSection";
import { apiFetch, AUTH_TOKEN_KEY } from "@/lib/api";
import { useLocale, useTranslations } from "next-intl";

export default function SeriePage() {
  const { id } = useParams<{ id: string }>();
  const [serie, setSerie] = useState<Series | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [refreshReviews, setRefreshReviews] = useState(false);
  const { member } = useMember();
  const locale = useLocale();
  const t = useTranslations("Series"); // <-- Adicionado

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    const ac = new AbortController();

    const loadSerie = async () => {
      try {
        const hasToken =
          typeof window !== "undefined" &&
          !!localStorage.getItem(AUTH_TOKEN_KEY);

        if (hasToken) {
          try {
            const data = await apiFetch(`/series/${id}/details`, {
              method: "GET",
              auth: true,
              signal: ac.signal,
            });
            if (!mountedRef.current || ac.signal.aborted) return;
            setSerie(data as Series);
            return;
          } catch (e: any) {
            const isAbort =
              e?.name === "AbortError" ||
              String(e?.message || "").toLowerCase().includes("abort");
            const status = e?.status ?? e?.code;
            const noToken =
              typeof e?.message === "string" &&
              e.message.toUpperCase().includes("NO_TOKEN");
            if (isAbort) return;
            if (!(status === 401 || status === 403 || noToken)) {
              console.error("Erro ao buscar série (com auth):", e);
            }
          }
        }

        try {
          const data = await apiFetch(`/series/${id}/details`, {
            method: "GET",
            auth: false,
            signal: ac.signal,
          });
          if (!mountedRef.current || ac.signal.aborted) return;
          setSerie(data as Series);
        } catch (e: any) {
          const isAbort =
            e?.name === "AbortError" ||
            String(e?.message || "").toLowerCase().includes("abort");
          if (!isAbort) {
            console.error("Erro ao buscar detalhes da série (sem auth):", e);
          }
        }
      } catch (err: any) {
        const isAbort =
          err?.name === "AbortError" ||
          String(err?.message || "").toLowerCase().includes("abort");
        if (!isAbort) console.error("Erro inesperado ao carregar série:", err);
      }
    };

    void loadSerie();

    return () => {
      try {
        ac.abort();
      } catch {}
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    const checkFavorite = async () => {
      try {
        if (member && id) {
          const fav = await isFavoritedMedia(member.id, Number(id), locale);
          if (!cancelled) setIsFavorited(fav);
        }
      } catch (e) {
        if (!cancelled) console.error("Erro ao checar favorito:", e);
      }
    };

    void checkFavorite();
    return () => {
      cancelled = true;
    };
  }, [member, id]);

  const handleFavoriteToggle = async () => {
    if (!member || !serie) return;

    if (isFavorited) {
      const success = await removeFavouriteMedia(member.id, serie.id, locale, "series");
      if (success) {
        toast.success(t("toastRemoved"));
        setIsFavorited(false);
      } else toast.error(t("toastErrorRemove"));
    } else {
      const success = await addFavouriteSeries("", member.id, serie.id, locale);
      if (success) {
        toast.success(t("toastAdded"));
        setIsFavorited(true);
      } else toast.error(t("toastErrorAdd"));
    }
  };

  if (!serie) {
    return (
      <p className="text-white p-10" aria-live="polite">
        {t("loadingSerie")}
      </p>
    );
  }

  const year = serie.release_date
    ? new Date(serie.release_date).getFullYear()
    : t("unknown");

  return (
    <main className="relative w-full min-h-screen text-white">
      {serie.backdropUrl && (
        <div className="absolute inset-0 -z-10">
          <Image
            src={serie.backdropUrl.replace("/w500/", "/original/")}
            alt={serie.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </div>
      )}

      <div className="flex flex-col justify-end h-screen max-w-6xl mx-auto px-8 pb-24 space-y-5">
        <h1 className="text-6xl font-extrabold">{serie.name}</h1>

        <div className="flex items-center gap-4 text-sm text-gray-300">
          <div className="flex items-center gap-1 text-yellow-400">
            <FaStar />
            <span className="text-lg font-medium">
              {Number(serie.vote_average || 0).toFixed(1)}
            </span>
          </div>
          <span className="uppercase">{serie.genres?.[0] || t("unknown")}</span>
          <span>{year}</span>
        </div>

        <p className="max-w-2xl text-gray-200 text-base leading-relaxed">
          {serie.overview || t("noDescription")}
        </p>

        <div className="flex gap-4 flex-wrap">
          <button
            onClick={() => setShowModal(true)}
            className="bg-white text-black font-semibold px-6 py-3 rounded hover:bg-gray-200 transition"
          >
            {t("rate")}
          </button>
          <button
            onClick={handleFavoriteToggle}
            className="bg-darkgreen/80 border border-white/20 text-white px-6 py-3 rounded hover:bg-darkgreen hover:brightness-110 transition flex items-center gap-2"
            aria-label={isFavorited ? t("removeFromFavorites") : t("addToFavorites")}
          >
            {isFavorited ? (
              <>
                <FaHeart className="text-red-500" /> {t("remove")}
              </>
            ) : (
              <>
                <FiHeart /> {t("favorite")}
              </>
            )}
          </button>
        </div>
      </div>

      {member && serie && (
        <RatingModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          mediaId={serie.id}
          mediaType="series"
          onSuccess={() => setRefreshReviews((prev) => !prev)}
        />
      )}

      {serie && (
        <ReviewSection mediaId={serie.id.toString()} refreshTrigger={refreshReviews} />
      )}
    </main>
  );
}
