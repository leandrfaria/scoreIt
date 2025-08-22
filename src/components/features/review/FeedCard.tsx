"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FaStar } from "react-icons/fa";

type MediaType = "movie" | "series" | "album";

type FeedCardProps = {
  name: string;
  avatar: string;
  reviewDate: string;
  rating: number;
  comment: string;
  memberId: string;
  mediaType: MediaType;
  media: {
    id: string;
    title: string;
    overview?: string;
    posterUrl: string;
    releaseDate?: string;
    seasons?: number; // séries
    artist?: string;  // álbuns
  };
};

const FALLBACK_AVATAR = "/fallback-avatar.jpg";
const FALLBACK_POSTER = "/fallback.jpg";

export default function FeedCard({
  name,
  avatar,
  reviewDate,
  rating,
  comment,
  memberId,
  mediaType,
  media,
}: FeedCardProps) {
  const locale = useLocale();
  const router = useRouter();

  const [avatarSrc, setAvatarSrc] = useState(avatar || FALLBACK_AVATAR);
  const [posterSrc, setPosterSrc] = useState(media.posterUrl || FALLBACK_POSTER);

  const subInfo = useMemo(() => {
    switch (mediaType) {
      case "movie":
        return `Lançamento: ${media.releaseDate ? new Date(media.releaseDate).getFullYear() : "?"}`;
      case "series":
        return `${media.seasons ?? "?"} temporada(s)`;
      case "album":
        return `Artista: ${media.artist ?? "Desconhecido"}`;
      default:
        return "";
    }
  }, [mediaType, media.releaseDate, media.seasons, media.artist]);

  const handleMediaClick = () => {
    switch (mediaType) {
      case "movie":
        router.push(`/${locale}/movie/${media.id}`);
        break;
      case "series":
        router.push(`/${locale}/series/${media.id}`);
        break;
      case "album":
        router.push(`/${locale}/album/${media.id}`);
        break;
      default:
        break;
    }
  };

  const reviewDateLabel = useMemo(
    () => new Date(reviewDate).toLocaleDateString("pt-BR"),
    [reviewDate]
  );

  return (
    <article className="bg-[#0D1117] rounded-lg p-6 shadow-md border border-white/10 hover:border-[var(--color-lightgreen)] transition duration-200 focus-within:border-[var(--color-lightgreen)]">
      {/* Cabeçalho com usuário */}
      <header className="flex items-center gap-4 mb-4">
        <img
          src={avatarSrc}
          alt={`Avatar de ${name}`}
          onError={() => setAvatarSrc(FALLBACK_AVATAR)}
          className="w-12 h-12 rounded-full object-cover border border-white/10 cursor-pointer"
          onClick={() => router.push(`/${locale}/profile/${memberId}`)}
        />
        <div>
          <button
            className="text-white font-semibold hover:text-[var(--color-lightgreen)] transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-lightgreen)] rounded"
            onClick={() => router.push(`/${locale}/profile/${memberId}`)}
            aria-label={`Ver perfil de ${name}`}
          >
            {name}
          </button>
          <p className="text-sm text-gray-400">{reviewDateLabel}</p>
        </div>
      </header>

      {/* Informações da mídia */}
      <div className="flex gap-4 mb-4">
        <img
          src={posterSrc}
          alt={media.title}
          onError={() => setPosterSrc(FALLBACK_POSTER)}
          className="w-24 h-36 object-cover rounded border border-white/10 cursor-pointer"
          onClick={handleMediaClick}
        />
        <div className="flex flex-col justify-between min-w-0">
          <div>
            <button
              className="text-white font-bold text-lg hover:text-[var(--color-lightgreen)] transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-lightgreen)] rounded"
              onClick={handleMediaClick}
              aria-label={`Abrir detalhes de ${media.title}`}
            >
              {media.title}
            </button>
            <p className="text-gray-400 text-sm">{subInfo}</p>
          </div>
          {media.overview && (
            <p className="text-gray-300 text-sm mt-2 line-clamp-3">{media.overview}</p>
          )}
        </div>
      </div>

      {/* Avaliação */}
      <div className="flex items-center gap-1 mb-2" aria-label={`Nota: ${rating} de 5`}>
        {[...Array(5)].map((_, i) => (
          <FaStar
            key={i}
            className={`text-xl ${i < rating ? "text-[var(--color-lightgreen)]" : "text-gray-700"}`}
            aria-hidden
          />
        ))}
      </div>

      {comment?.trim() && (
        <p className="text-gray-300 text-sm leading-relaxed break-words whitespace-pre-wrap">
          {comment}
        </p>
      )}
    </article>
  );
}
