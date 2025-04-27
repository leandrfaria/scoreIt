"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/container";
import { RandomMoviesCarousel } from "@/components/random-movies-carousel/RandomMoviesCarousel";
import { RandomSeriesCarousel } from "@/components/random-series-carousel/RandomSeriesCarousel";
import { MovieList } from "@/components/movies-list/MovieList";
import { AlbumListByGenre } from "@/components/album-list-by-genre/AlbumListByGenre";
import { useLocale, useTranslations } from "next-intl";
import { useAuthContext } from "@/context/AuthContext";
import { useTabContext } from "@/context/TabContext";
import Link from "next/link";
import PageTransition from "@/components/page-transition/PageTransition";
import RecentsAlbumCarousel from "@/components/recents-album-carousel/RecentsAlbumCarousel";
import TopArtistsCarouselSection from "@/components/top-artists-carousel/TopArtistsCarousel";
import OnAirSeriesCarouselSection from "@/components/series-on-air-carousel/OnAirSeriesCarouselSection";
import NowPlayingCarouselSection from "@/components/now-playing-carousel/NowPlayingCarouselSection";
import { SeriesList } from "@/components/series-list/SeriesList"; // 👈 Importei a SeriesList certinho

export default function Home() {
  const { isLoggedIn } = useAuthContext();
  const { activeTab } = useTabContext();
  const [randomImage, setRandomImage] = useState("");
  const [hasMounted, setHasMounted] = useState(false);

  const locale = useLocale();
  const t = useTranslations("home");

  useEffect(() => {
    setHasMounted(true);

    const posters = [
      "poster1.png",
      "poster2.png",
      "poster3.png",
      "poster4.png",
      "poster5.png",
      "poster6.png",
      "poster7.png",
    ];
    const random = Math.floor(Math.random() * posters.length);
    setRandomImage(`/postershorizont/${posters[random]}`);
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
      <Container>
        {isLoggedIn ? (
          <>
            {activeTab === "musicas" ? (
              <>
                <TopArtistsCarouselSection />
                <RecentsAlbumCarousel />
                <AlbumListByGenre />
              </>
            ) : activeTab === "series" ? (
              <>
                <RandomSeriesCarousel />
                <OnAirSeriesCarouselSection />
                <h2 className="text-white text-xl font-bold mt-10 mb-4">
                  {t("todas_series")}
                </h2>
                <SeriesList /> {/* 👈 AGORA CHAMANDO A LISTA DE SÉRIES! */}
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
          </>
        ) : (
          <PageTransition>
            <div className="flex flex-col md:flex-row items-center justify-between min-h-[80vh]">
              <div className="w-full md:w-1/2 mb-10 md:mb-0">
                {hasMounted && randomImage && (
                  <img
                    src={randomImage}
                    alt="Poster aleatório"
                    className="w-full h-[400px] object-cover rounded-lg shadow-lg"
                  />
                )}
              </div>

              <div className="w-full md:w-1/2 p-8 text-center md:text-left">
                <h1 className="text-4xl font-bold text-white mb-12">
                  {t("mensagem_login")}
                </h1>
                <Link
                  href={`/${locale}/login`}
                  className="px-6 py-3 bg-darkgreen text-white rounded-md hover:brightness-110 transition"
                >
                  {t("botao_login")}
                </Link>
              </div>
            </div>
          </PageTransition>
        )}
      </Container>
    </main>
  );
}
