"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/layout/Container";
import { RandomMoviesCarousel } from "@/components/features/movie/RandomMoviesCarousel";
import { RandomSeriesCarousel } from "@/components/features/serie/RandomSeriesCarousel";
import { AlbumListByGenre } from "@/components/features/album/AlbumListByGenre";
import { useLocale, useTranslations } from "next-intl";
import { useAuthContext } from "@/context/AuthContext";
import { useTabContext } from "@/context/TabContext";
import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";
import RecentsAlbumCarousel from "@/components/features/album/RecentsAlbumCarousel";
import TopArtistsCarouselSection from "@/components/features/artist/TopArtistsCarousel";
import OnAirSeriesCarouselSection from "@/components/features/serie/OnAirSeriesCarouselSection";
import NowPlayingCarouselSection from "@/components/features/movie/NowPlayingCarouselSection";
import { SeriesList } from "@/components/features/serie/SeriesList";
import { MovieList } from "@/components/features/movie/MovieList";

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
      "poster8.png",
      "poster9.png",
      "poster10.png",
      "poster11.png",
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
                <AlbumListByGenre />
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
                  href={`/${locale}/auth?tab=login`}
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
