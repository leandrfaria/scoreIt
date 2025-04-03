'use client';

import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation } from 'swiper/modules';

const mockMovies = [
  'https://image.tmdb.org/t/p/w1280/a5RuXKcLcfyjwZRDmW4yEdjigNx.jpg',
  'https://image.tmdb.org/t/p/w1280/a5RuXKcLcfyjwZRDmW4yEdjigNx.jpg',
  'https://image.tmdb.org/t/p/w1280/a5RuXKcLcfyjwZRDmW4yEdjigNx.jpg',
  'https://image.tmdb.org/t/p/w1280/a5RuXKcLcfyjwZRDmW4yEdjigNx.jpg',
  'https://image.tmdb.org/t/p/w1280/a5RuXKcLcfyjwZRDmW4yEdjigNx.jpg',
  'https://image.tmdb.org/t/p/w1280/a5RuXKcLcfyjwZRDmW4yEdjigNx.jpg',
  'https://image.tmdb.org/t/p/w1280/a5RuXKcLcfyjwZRDmW4yEdjigNx.jpg',
  'https://image.tmdb.org/t/p/w1280/a5RuXKcLcfyjwZRDmW4yEdjigNx.jpg',
  'https://image.tmdb.org/t/p/w1280/a5RuXKcLcfyjwZRDmW4yEdjigNx.jpg',
  'https://image.tmdb.org/t/p/w1280/a5RuXKcLcfyjwZRDmW4yEdjigNx.jpg',
  'https://image.tmdb.org/t/p/w1280/a5RuXKcLcfyjwZRDmW4yEdjigNx.jpg',
  'https://image.tmdb.org/t/p/w1280/a5RuXKcLcfyjwZRDmW4yEdjigNx.jpg',
  'https://image.tmdb.org/t/p/w1280/a5RuXKcLcfyjwZRDmW4yEdjigNx.jpg',
  'https://image.tmdb.org/t/p/w1280/a5RuXKcLcfyjwZRDmW4yEdjigNx.jpg',
  'https://image.tmdb.org/t/p/w1280/a5RuXKcLcfyjwZRDmW4yEdjigNx.jpg',
  'https://image.tmdb.org/t/p/w1280/a5RuXKcLcfyjwZRDmW4yEdjigNx.jpg',
  'https://image.tmdb.org/t/p/w1280/a5RuXKcLcfyjwZRDmW4yEdjigNx.jpg',
];

export default function MovieCarousel() {
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
        {mockMovies.map((src, index) => (
          <SwiperSlide key={index}>
            <div className="w-full h-64 relative">
              <Image src={src} alt={`Movie ${index}`} layout="fill" objectFit="cover" className="rounded-lg" />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
