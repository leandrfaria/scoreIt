"use client";

import { useEffect, useState } from "react";
import { Movie } from "@/types/Movie";
import { MovieCarousel } from "../movie-carousel/MovieCarousel";
import { useTranslations } from "next-intl";
import { fetchFavouriteMovies } from "@/services/movie/get_fav_movie";
import { useMember } from "@/context/MemberContext";

const FavouriteMoviesCarouselSection = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("NowPlayingCarousel");
  const { member } = useMember();

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

      setLoading(false);
    };

    loadMovies();
  }, [t, member]);

  if (loading) {
    return (
      <div className="text-center py-10 text-white">{t("loadingFav")}</div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="text-center py-10 text-white">
        {t("noFavMovie")}
      </div>
    );
  }

  const handleRemoveMovie = (id: number) => {
    setMovies((prevMovies) => prevMovies.filter((movie) => movie.id !== id));
  };

  return <MovieCarousel title={t("FilmeFavoritos")} movies={movies}  onRemoveMovie={handleRemoveMovie}/>;
};

export default FavouriteMoviesCarouselSection;
