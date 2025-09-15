"use client";

import { useEffect } from "react";
import { Container } from "@/components/layout/Others/Container";
import { RandomMoviesCarousel } from "@/components/features/movie/RandomMoviesCarousel";
import { RandomSeriesCarousel } from "@/components/features/serie/RandomSeriesCarousel";
import AlbumList from "@/components/features/album/AlbumList";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/context/AuthContext";
import { useTabContext } from "@/context/TabContext";
import PageTransition from "@/components/layout/Others/PageTransition";
import OnAirSeriesCarouselSection from "@/components/features/serie/OnAirSeriesCarouselSection";
import NowPlayingCarouselSection from "@/components/features/movie/NowPlayingCarouselSection";
import { SeriesList } from "@/components/features/serie/SeriesList";
import { MovieList } from "@/components/features/movie/MovieList";
import LoggedOutHome from "@/components/layout/oggedOutHome";
import TopAlbums from "@/components/features/album/TopAlbums";

export default function Home() {
  const { isLoggedIn } = useAuthContext();
  const { activeTab } = useTabContext();
  const t = useTranslations("home");

  // (mantido caso tenha side-effects globais de montagem; remova se não precisar)
  useEffect(() => {}, []);

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
              <>
              <TopAlbums />
              <AlbumList />
              </>
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
