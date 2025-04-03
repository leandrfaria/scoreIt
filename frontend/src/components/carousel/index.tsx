'use client';

import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation } from 'swiper/modules';
import { useEffect, useState } from 'react';
import { fetchMovies, Movie } from '@/services/service_movies';
import { MovieCard } from '../film-card/MovieCard';
import '../../style/swiper_custom.css';

export default function MovieCarousel() {

    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const getMovies = async () => {
        const moviesData = await fetchMovies();
        setMovies(moviesData);
        setLoading(false);
      };
  
      getMovies();
    }, []);
  
    if (loading) {
      return <p className="text-center mt-10 text-white">Carregando filmes...</p>;
    }
  
    if (movies.length === 0) {
      return <p className="text-center mt-10 text-white">Nenhum filme encontrado.</p>;
    }
  
  return (
    <div className="w-full max-w-5xl mx-auto py-4">
      <Swiper
        modules={[Navigation]}
        spaceBetween={10}
        slidesPerView={2}
        navigation
        breakpoints={{
          640: { slidesPerView: 3 },
          1024: { slidesPerView: 5 }
        }}
      >
        {movies.map((movie, index) => (
          <SwiperSlide key={index}>
            <MovieCard
                  key={movie.id}
                  id={movie.id}
                  title={movie.title}
                  posterUrl={movie.posterUrl}
                  vote_average={movie.vote_average}
                  release_date={movie.release_date}
                />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
