"use client";

import { useEffect, useState } from "react";
import { Album } from "@/types/Album";
import { AlbumCarousel } from "@/components/features/album/AlbumCarousel";
import { fetchFavouriteAlbuns } from "@/services/album/get_fav_album";
import { useMember } from "@/context/MemberContext";
import { useTranslations } from "next-intl";

type Props = {
  memberId?: string;
};

const FavouriteAlbumCarouselSection = ({ memberId }: Props) => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("NowPlayingCarousel");
  const { member } = useMember();

  useEffect(() => {
    let mounted = true;

    const loadAlbums = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      const idToUse = memberId ?? (member?.id ? String(member.id) : "");

      if (!token || !idToUse) {
        // Mantém UX consistente sem disparar chamada desnecessária
        console.error(t("tokenNotFound"));
        if (mounted) setLoading(false);
        return;
      }

      try {
        const data = await fetchFavouriteAlbuns(idToUse);
        if (mounted) {
          setAlbums(data);
        }
      } catch (err) {
        console.error("Erro ao carregar álbuns favoritos:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadAlbums();
    return () => {
      mounted = false;
    };
  }, [memberId, member, t]);

  if (loading) {
    return <div className="text-center py-10 text-white">{t("loadingFavAlbum")}</div>;
  }

  if (albums.length === 0) {
    return <div className="text-center py-10 text-white">{t("noFavAlbum")}</div>;
  }

  const handleRemoveAlbum = (id: string) => {
    setAlbums((prev) => prev.filter((album) => album.id !== id));
  };

  return (
    <AlbumCarousel
      title={t("AlbunsFavoritos")}
      albums={albums}
      onRemoveAlbum={handleRemoveAlbum}
    />
  );
};

export default FavouriteAlbumCarouselSection;
