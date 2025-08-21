"use client";

import { useEffect, useState } from "react";
import { Album } from "@/types/Album";
import { AlbumCarousel } from "@/components/features/album/AlbumCarousel";
import { fetchFavouriteAlbuns } from "@/services/album/get_fav_album";
import { useMember } from "@/context/MemberContext";
import { useTranslations } from "next-intl";

type Props = { memberId?: string };

const FavouriteAlbumCarouselSection = ({ memberId }: Props) => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("NowPlayingCarousel");
  const { member } = useMember();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const idToUse = memberId ?? String(member?.id ?? "");
      if (!idToUse) {
        setLoading(false);
        return;
      }
      try {
        const data = await fetchFavouriteAlbuns(idToUse);
        if (mounted) setAlbums(data);
      } catch (err) {
        console.error("Erro ao carregar álbuns favoritos:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [memberId, member]);

  if (loading) return <div className="text-center py-10 text-gray-300 animate-pulse">{t("loadingFavAlbum")}</div>;
  if (albums.length === 0)
    return (
      <div className="text-center py-10 text-gray-400">
        <p className="text-lg font-semibold">{t("noFavAlbum")}</p>
        <p className="text-sm mt-2">Adicione alguns álbuns aos favoritos e eles aparecerão aqui 🎶</p>
      </div>
    );

  return <AlbumCarousel title={t("AlbunsFavoritos")} albums={albums} onRemoveAlbum={(id) => setAlbums((prev) => prev.filter((a) => a.id !== id))} />;
};

export default FavouriteAlbumCarouselSection;
