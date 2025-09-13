// services/carousel_utils.ts
import { fetchMovies } from "./movie/popular";
import { CarouselItem } from "@/utils/aceternity/AnimatedTestimonials";

// Objeto de traduções manual
const translations = {
  en: {
    noDescription: "No description available.",
    detailButton: "Details",
  },
  pt: {
    noDescription: "Sem descrição disponível.",
    detailButton: "Detalhes",
  },
};

export async function loadRandomCarouselItems(locale: "en" | "pt" = "pt"): Promise<CarouselItem[]> {
  // Obter traduções com base no locale
  const t = translations[locale];

  const allMovies = await fetchMovies(locale);
  const shuffled = allMovies.sort(() => 0.5 - Math.random()).slice(0, 3);

  return shuffled.map((movie) => ({
    image: movie.backdropUrl,
    title: movie.title,
    description: movie.overview || t.noDescription,
    buttonLabel: t.detailButton,
    onClick: () => console.log("Detalhes de:", movie.title),
  }));
}