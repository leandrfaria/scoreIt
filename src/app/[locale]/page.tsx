"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/layout/Others/Container";
import { RandomMoviesCarousel } from "@/components/features/movie/RandomMoviesCarousel";
import { RandomSeriesCarousel } from "@/components/features/serie/RandomSeriesCarousel";
import { AlbumListByGenre } from "@/components/features/album/AlbumListByGenre";
import { useLocale, useTranslations } from "next-intl";
import { useAuthContext } from "@/context/AuthContext";
import { useTabContext } from "@/context/TabContext";
import PageTransition from "@/components/layout/Others/PageTransition";
import OnAirSeriesCarouselSection from "@/components/features/serie/OnAirSeriesCarouselSection";
import NowPlayingCarouselSection from "@/components/features/movie/NowPlayingCarouselSection";
import { SeriesList } from "@/components/features/serie/SeriesList";
import { MovieList } from "@/components/features/movie/MovieList";
import LoggedOutHome from "@/components/layout/oggedOutHome";



export default function Home() {
  const { isLoggedIn } = useAuthContext();
  const { activeTab } = useTabContext();
  const [hasMounted, setHasMounted] = useState(false);

  const locale = useLocale();
  const t = useTranslations("home");

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (isLoggedIn === null) {
    return (
      <p className="text-gray-400 text-center mt-10">
        {t("verificando_login")}
      </p>
    );
  }

  return (
    <main className="w-full">
      {isLoggedIn ? (
        <Container>
          <PageTransition>
            {activeTab === "musicas" ? (
              <AlbumListByGenre />
            ) : activeTab === "series" ? (
              <>
                <RandomSeriesCarousel />
                <OnAirSeriesCarouselSection />
                <h2 className="text-white text-xl font-bold mt-10 mb-4">
                  {t("todas_series")}
                </h2>
                <SeriesList />
              </>
            ) : (
              <>
                <RandomMoviesCarousel />
                <NowPlayingCarouselSection />
                <h2 className="text-white text-xl font-bold mt-10 mb-4">
                  {t("todos_filmes")}
                </h2>
                <MovieList />
              </>
            )}
          </PageTransition>
        </Container>
      ) : (
        <LoggedOutHome />
      )}
    </main>
  );
}
