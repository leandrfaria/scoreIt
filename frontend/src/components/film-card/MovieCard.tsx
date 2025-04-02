import Link from 'next/link';
import Image from 'next/image';
import { FaStar } from 'react-icons/fa';

interface MovieCardProps {
  id: number;
  title: string;
  posterUrl: string;
  vote_average: number;
  release_date: string;
  genre?: string;
}

export function MovieCard({
  id,
  title,
  posterUrl,
  vote_average,
  release_date,
  genre = 'Drama',
}: MovieCardProps) {
  const year = new Date(release_date).getFullYear();

  return (
    <Link
      href={`/movie/${id}`}
      className="block w-full max-w-[190px] rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-all duration-300"
    >
      <div className="relative w-full h-[270px]">
        <Image
          src={posterUrl}
          alt={title}
          fill
          className="object-cover"
        />

        <div className="absolute top-3 right-3 bg-black/70 text-white text-sm px-2 py-1 rounded-full flex items-center gap-1">
          <FaStar className="text-white" size={14} />
          <span>{vote_average.toFixed(1)} <span className="text-xs text-gray-300">/ 5</span></span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-black/10 p-3">
          <h3 className="text-white text-sm font-semibold truncate">{title}</h3>
          <p className="text-gray-300 text-xs">{genre} • {year}</p>
        </div>
      </div>
    </Link>
  );
}
