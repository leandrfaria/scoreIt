"use client";

import { useEffect, useState } from "react";
import { Movie } from "@/types/Movie";
import { MovieCarousel } from "../movie-carousel/MovieCarousel";
import { useTranslations } from "next-intl";
import { fetchFavouriteMovies } from "@/services/service_favourite_movies";
import { useMember } from "@/context/MemberContext";
import { useFavoriteContext } from "@/context/FavoriteContext";

const FavouriteMoviesCarouselSection = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("NowPlayingCarousel");
  const { member } = useMember();
  const { setFavoriteMovies } = useFavoriteContext(); // 🆕

  useEffect(() => {
    const loadMovies = async () => {
      const token = localStorage.getItem("authToken");

      if (!token || !member?.id) {
        console.error(t("tokenNotFound"));
        setLoading(false);
        return;
      }

      const data = await fetchFavouriteMovies(token, String(member.id));
      setMovies(data);

      // 🆕 Atualiza o contexto também
      if (data && data.length > 0) {
        const ids = new Set(data.map((movie) => movie.id));
        setFavoriteMovies(ids);
      }

      setLoading(false);
    };

    loadMovies();
  }, [t, member, setFavoriteMovies]);

  if (loading) {
    return (
      <div className="text-center py-10 text-white">Carregando filmes favoritos...</div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="text-center py-10 text-white">
        {t("noMoviesFound")}
      </div>
    );
  }

  return <MovieCarousel title="Filmes favoritos" movies={movies} />;
};

export default FavouriteMoviesCarouselSection;
