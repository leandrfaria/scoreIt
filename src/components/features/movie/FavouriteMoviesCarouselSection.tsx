"use client";

import { useEffect, useState } from "react";
import { Movie } from "@/types/Movie";
import { useTranslations } from "next-intl";
import { fetchFavouriteMovies } from "@/services/movie/get_fav_movie";
import { useMember } from "@/context/MemberContext";
import { MovieCarousel } from "./MovieCarousel";

type Props = { memberId?: string };

const FavouriteMoviesCarouselSection = ({ memberId }: Props) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("NowPlayingCarousel");
  const { member } = useMember();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const idToUse = memberId ?? String(member?.id ?? "");
      if (!idToUse) {
        setLoading(false);
        return;
      }
      try {
        const data = await fetchFavouriteMovies(localStorage.getItem("authToken") ?? "", idToUse);
        if (mounted) setMovies(data);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [memberId, member]);

  if (loading) return <div className="text-center py-10 text-gray-300 animate-pulse">{t("loadingFav")}</div>;
  if (movies.length === 0)
    return (
      <div className="text-center py-10 text-gray-400">
        <p className="text-lg font-semibold">{t("noFavMovie")}</p>
        <p className="text-sm mt-2">Adicione alguns filmes aos favoritos e eles aparecerão aqui 🎬</p>
      </div>
    );

  return <MovieCarousel title={t("FilmeFavoritos")} movies={movies} onRemoveMovie={(id) => setMovies((prev) => prev.filter((m) => m.id !== id))} />;
};

export default FavouriteMoviesCarouselSection;
