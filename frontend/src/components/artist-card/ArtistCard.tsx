"use client"

import Image from "next/image"
import type { Artist } from "@/types/Artist"

interface ArtistCardProps {
  artist: Artist
  index?: number 
}

export function ArtistCard({ artist, index }: ArtistCardProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center w-[130px]">
      <div className="relative w-[100px] h-[100px] rounded-full overflow-hidden shadow-md border-2 border-white">
        <Image
          src={artist.imageUrl}
          alt={artist.name}
          fill
          className="object-cover"
          sizes="100px"
        />
      </div>
      <p className="mt-2 text-sm font-semibold text-white">
        {index !== undefined ? `${index + 1}. ` : ""}
        {artist.name}
      </p>
    </div>
  )
}
