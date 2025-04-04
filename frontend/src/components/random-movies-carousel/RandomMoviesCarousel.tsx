"use client";

import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

export type CarouselItem = {
  id?: string | number;
  image: string;
  title: string;
  description: string;
  buttonLabel?: string;
  onClick?: () => void;
};

export const AnimatedCarousel = ({
  items,
  autoplay = false,
  arrowButtonClass = "bg-gray-700 hover:bg-gray-600 text-white",
  detailButtonClass = "bg-blue-500 hover:bg-blue-600 text-white",
}: {
  items: CarouselItem[];
  autoplay?: boolean;
  arrowButtonClass?: string;
  detailButtonClass?: string;
}) => {
  const [active, setActive] = useState(0);

  const handleNext = () => {
    setActive((prev) => (prev + 1) % items.length);
  };

  const handlePrev = () => {
    setActive((prev) => (prev - 1 + items.length) % items.length);
  };

  const isActive = (index: number) => index === active;

  useEffect(() => {
    if (autoplay) {
      const interval = setInterval(handleNext, 5000);
      return () => clearInterval(interval);
    }
  }, [autoplay]);

  return (
    <div className="mx-auto w-full px-4 py-10 font-sans antialiased max-w-7xl">
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* Imagem do lado esquerdo */}
        <div className="relative w-full h-[300px]">
          <AnimatePresence>
            {items.map((item, index) => (
              <motion.div
                key={item.image}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{
                  opacity: isActive(index) ? 1 : 0,
                  scale: isActive(index) ? 1 : 0.95,
                  zIndex: isActive(index) ? 10 : 0,
                }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="rounded-lg object-cover"
                  priority
                  quality={100} // <-- força qualidade máxima
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Texto e controles */}
        <div className="flex flex-col justify-between h-full">
          <motion.div
            key={active}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <h3 className="text-3xl font-bold text-white">
              {items[active].title}
            </h3>
            <p className="text-sm text-gray-400 mt-2">
              {items[active].description}
            </p>
          </motion.div>

          <div className="flex justify-between items-center mt-6">
            {items[active].buttonLabel && (
              <button
                onClick={items[active].onClick}
                className={`px-6 py-2 rounded-md ${detailButtonClass}`}
              >
                {items[active].buttonLabel}
              </button>
            )}
            <div className="flex gap-4">
              <button
                onClick={handlePrev}
                className={`group/button flex h-8 w-8 items-center justify-center rounded-full ${arrowButtonClass}`}
              >
                <IconArrowLeft className="h-5 w-5 group-hover/button:scale-110 transition-transform" />
              </button>
              <button
                onClick={handleNext}
                className={`group/button flex h-8 w-8 items-center justify-center rounded-full ${arrowButtonClass}`}
              >
                <IconArrowRight className="h-5 w-5 group-hover/button:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
