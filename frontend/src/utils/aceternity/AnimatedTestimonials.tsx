"use client";

import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";

type Movie = {
  title: string;
  description: string;
  poster: string; // URL da imagem do filme
};

export const AnimatedTestimonials = ({
  testimonials, // Agora serão filmes
  autoplay = false,
}: {
  testimonials: Movie[];
  autoplay?: boolean;
}) => {
  const [active, setActive] = useState(0);

  const handleNext = () => {
    setActive((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const isActive = (index: number) => index === active;

  useEffect(() => {
    if (autoplay) {
      const interval = setInterval(handleNext, 5000);
      return () => clearInterval(interval);
    }
  }, [autoplay]);

  return (
    <div className="mx-auto max-w-sm px-4 py-20 font-sans antialiased md:max-w-4xl md:px-8 lg:px-12">
      <div className="relative grid grid-cols-1 gap-20 md:grid-cols-2">
        <div>
          <div className="relative h-96 w-full">
            <AnimatePresence>
              {testimonials.map((movie, index) => (
                <motion.div
                  key={movie.poster}
                  initial={{ opacity: 0, scale: 0.9, z: -100 }}
                  animate={{
                    opacity: isActive(index) ? 1 : 0.7,
                    scale: isActive(index) ? 1 : 0.95,
                    z: isActive(index) ? 0 : -100,
                    zIndex: isActive(index) ? 40 : testimonials.length - index,
                    y: isActive(index) ? [0, -30, 0] : 0,
                  }}
                  exit={{ opacity: 0, scale: 0.9, z: 100 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="absolute inset-0 origin-bottom flex flex-col items-center"
                >
                  <Image
                    src={movie.poster}
                    alt={movie.title}
                    width={500}
                    height={700}
                    draggable={false}
                    className="h-96 w-auto rounded-lg shadow-lg object-cover"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex flex-col justify-between py-4">
          <motion.div
            key={active}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <h3 className="text-3xl font-bold text-white">{testimonials[active].title}</h3>
            <p className="text-sm text-gray-400 mt-2">{testimonials[active].description}</p>
            <button className="mt-6 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md">
              Ver Detalhes
            </button>
          </motion.div>
          <div className="flex gap-4 pt-12 md:pt-0">
            <button
              onClick={handlePrev}
              className="group/button flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600"
            >
              <IconArrowLeft className="h-5 w-5 text-white group-hover/button:scale-110 transition-transform" />
            </button>
            <button
              onClick={handleNext}
              className="group/button flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600"
            >
              <IconArrowRight className="h-5 w-5 text-white group-hover/button:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
