import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
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
        seasons?: number;       // Para séries
        artist?: string;        // Para álbuns
    };
};

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

    const getSubInfo = () => {
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
    };

    const handleMediaClick = () => {
        switch (mediaType) {
            case "movie":
                router.push(`/${locale}/movie/${media.id}`)
                break;
            case "series":
                router.push(`/${locale}/series/${media.id}`)
                break;
            case "album":
                router.push(`/${locale}/album/${media.id}`)
                break;
            default:
                console.log("Tipo de mídia não reconhecido:", mediaType);
                break;
        }
    };

return (
  <div className="bg-[#0D1117] rounded-lg p-6 shadow-md border border-white/10 hover:border-[var(--color-lightgreen)] transition duration-200">
    {/* Cabeçalho com usuário */}
    <div className="flex items-center gap-4 mb-4">
      <img
        src={avatar}
        alt={name}
        className="w-12 h-12 rounded-full object-cover border border-white/10 cursor-pointer"
        onClick={() => router.push(`/${locale}/profile/${memberId}`)}
      />
      <div>
        <p
          className="text-white font-semibold hover:text-[var(--color-lightgreen)] transition cursor-pointer"
          onClick={() => router.push(`/${locale}/profile/${memberId}`)}
        >
          {name}
        </p>
        <p className="text-sm text-gray-400">
          {new Date(reviewDate).toLocaleDateString("pt-BR")}
        </p>
      </div>
    </div>

    {/* Informações da mídia */}
    <div className="flex gap-4 mb-4">
      <img
        src={media.posterUrl}
        alt={media.title}
        className="w-24 h-36 object-cover rounded border border-white/10 cursor-pointer"
        onClick={() => handleMediaClick()}
      />
      <div className="flex flex-col justify-between">
        <div>
          <h3
            className="text-white font-bold text-lg hover:text-[var(--color-lightgreen)] transition cursor-pointer"
            onClick={() => handleMediaClick()}
          >
            {media.title}
          </h3>
          <p className="text-gray-400 text-sm">{getSubInfo()}</p>
        </div>
        {media.overview && (
          <p className="text-gray-300 text-sm mt-2 line-clamp-3">{media.overview}</p>
        )}
      </div>
    </div>

    {/* Avaliação */}
    <div className="flex items-center gap-1 mb-2">
      {[...Array(5)].map((_, i) => (
        <FaStar
          key={i}
          className={`text-xl ${i < rating ? "text-[var(--color-lightgreen)]" : "text-gray-700"}`}
        />
      ))}
    </div>

    {comment?.trim() && (
      <p className="text-gray-300 text-sm leading-relaxed break-words whitespace-pre-wrap">
        {comment}
      </p>
    )}
  </div>
);

}
