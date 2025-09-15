// src/app/[locale]/album/[id]/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import { FaHeart } from "react-icons/fa";
import { FiHeart } from "react-icons/fi";
import { useLocale, useTranslations } from "next-intl";

import type { Album } from "@/types/Album";
import { fetchAlbumById } from "@/services/album/fetch_album_by_id";
import { useMember } from "@/context/MemberContext";
import { isFavoritedMedia } from "@/services/user/is_favorited";
import { addFavouriteAlbum } from "@/services/album/add_fav_album";
import { removeFavouriteMedia } from "@/services/user/remove_fav";
import RatingModal from "@/components/features/review/RatingModal";
import ReviewSection from "@/components/features/review/ReviewSection";

/** Fallbacks em PT caso a chave de i18n não exista */
const FALLBACK_PT: Record<string, string> = {
  toastLoadError: "Não foi possível carregar o álbum.",
  notAuthenticated: "Você precisa estar logado.",
  toastRemoved: "Removido dos favoritos.",
  toastErrorRemove: "Erro ao remover dos favoritos.",
  toastAdded: "Adicionado aos favoritos.",
  toastErrorAdd: "Erro ao adicionar aos favoritos.",
  toastGenericError: "Ocorreu um erro. Tente novamente.",
  loadingAlbum: "Carregando álbum...",
  tracksCount: "{count} faixas",
  rate: "Avaliar",
  removeFromFavorites: "Remover dos favoritos",
  addToFavorites: "Adicionar aos favoritos",
  remove: "Remover",
  favorite: "Favoritar",
};

/** Tradutor resiliente: tenta `next-intl`; se falhar, usa FALLBACK_PT */
function useSafeT() {
  const tRaw = useTranslations("Albums");
  return useCallback(
    (key: string, values?: Record<string, unknown>) => {
      try {
        // tenta via next-intl
        const result = (tRaw as unknown as (k: string, v?: any) => string)(key, values);
        return result;
      } catch {
        // fallback PT
        const template = FALLBACK_PT[key] ?? key;
        if (!values) return template;
        // simples interpolação {chave}
        return template.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? ""));
      }
    },
    [tRaw]
  );
}

export default function AlbumPage() {
  const { id } = useParams<{ id: string }>();
  const locale = useLocale();
  const T = useSafeT();
  const { member } = useMember();

  const [album, setAlbum] = useState<Album | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [refreshReviews, setRefreshReviews] = useState(false);
  const mountedRef = useRef(true);

  // Carrega dados do álbum
  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();

    (async () => {
      try {
        const result = await fetchAlbumById(id, controller.signal);
        if (!mountedRef.current) return;
        if (!result) {
          toast.error(T("toastLoadError"));
        }
        setAlbum(result);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("Erro ao carregar álbum:", err);
          toast.error(T("toastLoadError"));
        }
      }
    })();

    return () => {
      mountedRef.current = false;
      controller.abort();
    };
  }, [id, locale, T]);

  // Checa favorito
  useEffect(() => {
    if (!member || !id) return;
    let active = true;
    (async () => {
      try {
        const fav = await isFavoritedMedia(member.id, id, locale);
        if (active) setIsFavorited(fav);
      } catch (err) {
        console.error("Erro ao verificar favorito:", err);
      }
    })();
    return () => {
      active = false;
    };
  }, [member, id, locale]);

  const handleFavoriteToggle = async () => {
    try {
      if (!member || !album) {
        toast.error(T("notAuthenticated"));
        return;
      }

      if (isFavorited) {
        const success = await removeFavouriteMedia(member.id, album.id, locale, "album");
        if (success) {
          toast.success(T("toastRemoved"));
          setIsFavorited(false);
        } else {
          toast.error(T("toastErrorRemove"));
        }
      } else {
        const success = await addFavouriteAlbum(member.id, album.id);
        if (success) {
          toast.success(T("toastAdded"));
          setIsFavorited(true);
        } else {
          toast.error(T("toastErrorAdd"));
        }
      }
    } catch (err) {
      console.error("Erro ao favoritar:", err);
      toast.error(T("toastGenericError"));
    }
  };

  // Ano com fallback seguro
  const year = useMemo(() => {
    if (!album?.release_date) return null;
    const d = new Date(album.release_date);
    const y = d.getFullYear();
    return Number.isFinite(y) && y > 0 ? y : null;
  }, [album?.release_date]);

  if (!album) {
    return (
      <main className="relative w-full min-h-[60vh] text-white">
        <div className="max-w-6xl mx-auto px-8 py-24">
          <p className="opacity-80">{T("loadingAlbum")}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative w-full min-h-screen text-white overflow-hidden">
      {album.imageUrl && (
        <div className="absolute inset-0 -z-10 h-[500px] md:h-[600px] lg:h-[700px]">
          <Image
            src={album.imageUrl}
            alt={album.name}
            fill
            className="object-cover opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        </div>
      )}

      <div className="flex flex-col justify-end h-screen max-w-6xl mx-auto px-8 pb-24 space-y-5">
        <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight">{album.name}</h1>

        <div className="flex items-center gap-4 text-sm text-gray-300 flex-wrap">
          {album.artist && <span className="uppercase">{album.artist}</span>}
          {year !== null && <span>{year}</span>}
          <span>{T("tracksCount", { count: album.total_tracks ?? 0 })}</span>
        </div>

        <div className="flex gap-4 flex-wrap">
          <button
            onClick={() => setShowModal(true)}
            className="bg-white text-black font-semibold px-6 py-3 rounded hover:bg-gray-200 transition"
          >
            {T("rate")}
          </button>

          <button
            onClick={handleFavoriteToggle}
            className="bg-darkgreen/80 border border-white/20 text-white px-6 py-3 rounded hover:bg-darkgreen hover:brightness-110 transition flex items-center gap-2"
            aria-label={isFavorited ? T("removeFromFavorites") : T("addToFavorites")}
          >
            {isFavorited ? (
              <>
                <FaHeart className="text-red-500" /> {T("remove")}
              </>
            ) : (
              <>
                <FiHeart /> {T("favorite")}
              </>
            )}
          </button>
        </div>
      </div>

      <RatingModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        mediaId={album.id}
        mediaType="album"
        onSuccess={() => setRefreshReviews((prev) => !prev)}
      />

      <ReviewSection mediaId={String(album.id)} refreshTrigger={refreshReviews} />
    </main>
  );
}
