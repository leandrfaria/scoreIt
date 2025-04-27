"use client";

import { useEffect, useState } from "react";
import { Movie } from "@/types/Movie";
import { MovieCarousel } from "../movie-carousel/MovieCarousel";
import { useTranslations } from "next-intl";
import { fetchFavouriteSeries } from "@/services/service_favourite_series";
import { useMember } from "@/context/MemberContext";
import { useFavoriteContext } from "@/context/FavoriteContext";

const FavouriteSeriesCarouselSection = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("NowPlayingCarousel");
  const { member } = useMember();
  const { setFavoriteSeries } = useFavoriteContext(); // 🆕

  useEffect(() => {
    const loadMovies = async () => {
      const token = localStorage.getItem("authToken");

      if (!token || !member?.id) {
        console.error(t("tokenNotFound"));
        setLoading(false);
        return;
      }

      const data = await fetchFavouriteSeries(token, String(member.id));
      setMovies(data);

      // 🆕 Atualiza o contexto também
      if (data && data.length > 0) {
        const ids = new Set(data.map((serie) => serie.id));
        setFavoriteSeries(ids);
      }

      setLoading(false);
    };

    loadMovies();
  }, [t, member, setFavoriteSeries]);

  if (loading) {
    return (
      <div className="text-center py-10 text-white">Carregando séries favoritas...</div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="text-center py-10 text-white">
        {t("noMoviesFound")}
      </div>
    );
  }

  return <MovieCarousel title="Series favoritas" movies={movies} />;
};

export default FavouriteSeriesCarouselSection;
