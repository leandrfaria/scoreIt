import { CarouselItem } from "@/utils/aceternity/AnimatedTestimonials";
import { fetchMovies } from "./service_popular_movies";

export async function loadRandomCarouselItems(): Promise<CarouselItem[]> {
  const allMovies = await fetchMovies();

  const shuffled = allMovies.sort(() => 0.5 - Math.random()).slice(0, 3);

  return shuffled.map((movie) => ({
    image: movie.backdropUrl,
    title: movie.title,
    description: movie.overview || "Sem descrição disponível.",
    buttonLabel: "Ver Detalhes",
    onClick: () => console.log("Detalhes de:", movie.title),
  }));
}
