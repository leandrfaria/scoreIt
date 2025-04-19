// services/carousel_utils.ts
import { fetchMovies } from "./service_popular_movies";
import { CarouselItem } from "@/utils/aceternity/AnimatedTestimonials";

const translations = {
  en: {
    noDescription: "No description available.",
    details: "Details",
  },
  pt: {
    noDescription: "Sem descrição disponível.",
    details: "Detalhes",
  },
};

export async function loadRandomCarouselItems(locale: "en" | "pt"): Promise<CarouselItem[]> {
  const t = translations[locale];

  const allMovies = await fetchMovies();
  const shuffled = allMovies.sort(() => 0.5 - Math.random()).slice(0, 3);

  return shuffled.map((movie) => ({
    image: movie.backdropUrl,
    title: movie.title,
    description: movie.overview || t.noDescription,
    buttonLabel: t.details,
    onClick: () => console.log("Detalhes de:", movie.title),
  }));
}
