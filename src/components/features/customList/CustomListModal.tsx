'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import {
  MediaType,
  fetchListContent,
  updateCustomList,
  removeContentFromList,
  deleteCustomList,
} from '@/services/customList/list';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Member } from '@/types/Member';

function CardSkeleton({ square = false }: { square?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden rounded-md bg-neutral-800/70 animate-pulse ${
        square ? 'aspect-square' : 'aspect-[2/3]'
      }`}
    />
  );
}

type Props = {
  isOpen?: boolean;
  onClose: () => void;
  id: number;
  listName: string;
  listDescription?: string;
  onListDeleted?: () => void;
  onListUpdated?: () => void;
  member: Member;
};

export default function CustomListModal({
  isOpen = true,
  onClose,
  id,
  listName,
  listDescription,
  onListDeleted,
  onListUpdated,
  member,
}: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [mediaItems, setMediaItems] = useState<MediaType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [name, setName] = useState(listName ?? '');
  const [description, setDescription] = useState(listDescription ?? '');
  const [charCount, setCharCount] = useState(listDescription?.length ?? 0);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'movie' | 'series' | 'album'>('all');

  const router = useRouter();
  const locale = useLocale();

  const listCache = useRef<Map<string, MediaType[]>>(new Map());
  const controllerRef = useRef<AbortController | null>(null);

  useOutsideClick(modalRef, onClose);

  const normalizeMediaItem = useCallback((item: MediaType): MediaType => {
    // movie/series
    if ('title' in item || ('name' in item && 'first_air_date' in item)) {
      const raw = item.posterUrl || null;
      const poster = raw?.startsWith('http') ? raw : raw ? `https://image.tmdb.org/t/p/w500${raw}` : null;
      return { ...item, posterUrl: poster, internalId: item.internalId };
    }
    // album
    if ('artist' in item) {
      return { ...item, imageUrl: item.imageUrl ?? null, internalId: item.internalId };
    }
    return { ...item, internalId: item.internalId };
  }, []);

  // carregar conteúdo
  useEffect(() => {
    if (!isOpen || !member || !listName) return;

    setName(listName);
    setDescription(listDescription ?? '');
    setCharCount(listDescription?.length ?? 0);
    setError('');

    const cacheKey = `${member.id}-${listName}`;
    if (listCache.current.has(cacheKey)) {
      setMediaItems(listCache.current.get(cacheKey)!);
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    fetchListContent(member.id, listName, { signal: controller.signal })
      .then((items) => {
        const normalized = items.map(normalizeMediaItem);
        setMediaItems(normalized);
        listCache.current.set(cacheKey, normalized);
      })
      .catch(() => setError('Erro ao carregar conteúdo da lista'))
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [isOpen, listName, member, normalizeMediaItem, listDescription]);

  const handleViewDetails = useCallback(
    (item: MediaType) => {
      if ('title' in item) router.push(`/${locale}/movie/${item.id}`);
      else if ('artist' in item) router.push(`/${locale}/album/${item.id}`);
      else router.push(`/${locale}/series/${item.id}`);
    },
    [router, locale]
  );

  const handleRemoveItem = useCallback(
    async (item: MediaType) => {
      if (!member || !listName) return;

      // descobre o tipo pela shape
      const mediaType: 'movie' | 'album' | 'series' =
        'title' in item ? 'movie' : 'artist' in item ? 'album' : 'series';

      // otimista
      setMediaItems((prev) => prev.filter((i) => i.internalId !== item.internalId));
      const cacheKey = `${member.id}-${listName}`;
      listCache.current.set(
        cacheKey,
        (listCache.current.get(cacheKey) || []).filter((i) => i.internalId !== item.internalId)
      );

      try {
        await removeContentFromList(
          // apiFetch usa auth:true, então o token é injetado automaticamente; ainda assim
          // a assinatura pede o token—mantemos string vazia para compatibilidade.
          '',
          {
            id: item.internalId,
            memberId: member.id,
            mediaId: String(item.id),
            mediaType,
            listName,
            list_description: description || '',
          } as any
        );
        toast.success('Item removido da lista');
      } catch (error) {
        // rollback
        setMediaItems((prev) => [...prev, item]);
        listCache.current.set(cacheKey, [...(listCache.current.get(cacheKey) || []), item]);
        console.error(error);
        toast.error('Erro ao remover item da lista');
      }
    },
    [member, listName, description]
  );

  const handleUpdateList = async () => {
    if (!member || !id) return toast.error('Dados incompletos');
    if (!name.trim()) return toast.error('O nome da lista é obrigatório');
    if (description.length > 50) return toast.error('A descrição deve ter no máximo 50 caracteres');

    try {
      await updateCustomList(
        // apiFetch usa auth:true; passamos token vazio apenas para compat assinatura
        '',
        {
          id,
          listName: name.trim(),
          list_description: description.trim(),
        }
      );
      toast.success('Lista atualizada!');
      setIsEditing(false);
      onListUpdated?.();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar lista');
    }
  };

  const handleDeleteList = async () => {
    try {
      await deleteCustomList(id);
      toast.success('Lista deletada!');
      onClose();
      onListDeleted?.();
      if (member && listName) listCache.current.delete(`${member.id}-${listName}`);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao deletar lista');
    }
  };

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  const filteredItems = useMemo(() => {
    if (filter === 'all') return mediaItems;
    return mediaItems.filter((i) =>
      filter === 'movie' ? 'title' in i : filter === 'album' ? 'artist' in i : !('title' in i) && !('artist' in i)
    );
  }, [mediaItems, filter]);

  const RemoveItemButton = useCallback(
    ({ item, title }: { item: MediaType; title: string }) => (
      <button
        onClick={() => handleRemoveItem(item)}
        className="absolute top-2 right-2 bg-black/70 rounded-full w-8 h-8 flex items-center justify-center z-20 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={`Remover ${title}`}
        title="Remover da lista"
      >
        ×
      </button>
    ),
    [handleRemoveItem]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/70 z-40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Lista ${listName}`}
            className="fixed z-50 top-[8%] left-1/2 -translate-x-1/2 bg-neutral-900 text-white p-6 max-w-4xl w-[92vw] rounded-2xl shadow-2xl max-h-[84vh] flex flex-col ring-1 ring-white/10"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28 }}
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-2xl font-bold tracking-tight">
                {isEditing ? 'Editar lista' : `Lista: ${listName}`}
              </h2>

              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1 text-white/70 text-sm">
                  <span className="px-2 py-1 rounded-full bg-white/10">Itens: {mediaItems.length}</span>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white px-3 py-1.5 rounded-lg bg-white/5"
                  aria-label="Fechar modal"
                >
                  Fechar
                </button>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="flex flex-col flex-grow min-h-0 overflow-hidden">
              {isEditing ? (
                <div className="space-y-4 flex flex-col flex-grow min-h-0">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 rounded-lg bg-neutral-800 text-white outline-none ring-1 ring-transparent focus:ring-darkgreen/60"
                    maxLength={50}
                  />
                  <div className="flex flex-col flex-grow min-h-0">
                    <textarea
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        setCharCount(e.target.value.length);
                      }}
                      maxLength={50}
                      className="w-full p-3 rounded-lg bg-neutral-800 text-white flex-grow outline-none ring-1 ring-transparent focus:ring-darkgreen/60"
                      rows={4}
                    />
                    <div className={`text-xs mt-1 text-right ${charCount === 50 ? 'text-red-500' : 'text-gray-400'}`}>
                      {charCount}/50 caracteres
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white">
                      Cancelar
                    </button>
                    <button onClick={handleUpdateList} className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-500">
                      Salvar alterações
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Descrição e ações */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                    <p className="text-gray-400 italic">{description || 'Sem descrição'}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1 text-xs">
                        <button
                          className={`px-2 py-1 rounded ${
                            filter === 'all' ? 'bg-white/10' : 'bg-white/5 hover:bg-white/10'
                          }`}
                          onClick={() => setFilter('all')}
                          aria-label="Mostrar todos"
                        >
                          Todos
                        </button>
                        <button
                          className={`px-2 py-1 rounded ${
                            filter === 'movie' ? 'bg-white/10' : 'bg-white/5 hover:bg-white/10'
                          }`}
                          onClick={() => setFilter('movie')}
                          aria-label="Filtrar filmes"
                        >
                          Filmes
                        </button>
                        <button
                          className={`px-2 py-1 rounded ${
                            filter === 'series' ? 'bg-white/10' : 'bg-white/5 hover:bg-white/10'
                          }`}
                          onClick={() => setFilter('series')}
                          aria-label="Filtrar séries"
                        >
                          Séries
                        </button>
                        <button
                          className={`px-2 py-1 rounded ${
                            filter === 'album' ? 'bg-white/10' : 'bg-white/5 hover:bg-white/10'
                          }`}
                          onClick={() => setFilter('album')}
                          aria-label="Filtrar álbuns"
                        >
                          Álbuns
                        </button>
                      </div>

                      <button onClick={() => setIsEditing(true)} className="text-sm text-blue-400 hover:underline">
                        Editar
                      </button>

                      {isDeleteConfirmOpen ? (
                        <div className="flex gap-2 items-center">
                          <span className="text-gray-300">Confirmar exclusão?</span>
                          <button
                            onClick={async () => {
                              await handleDeleteList();
                              setIsDeleteConfirmOpen(false);
                            }}
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-500"
                          >
                            Confirmar
                          </button>
                          <button onClick={() => setIsDeleteConfirmOpen(false)} className="text-gray-400 hover:text-white">
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsDeleteConfirmOpen(true)}
                          className="text-red-400 hover:text-red-300 hover:underline"
                        >
                          Deletar lista
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Área de conteúdo */}
                  <div className="flex-grow overflow-y-auto min-h-0">
                    {error && <div className="text-red-400 mb-3">{error}</div>}

                    {loading && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <CardSkeleton key={i} square={i % 3 === 0} />
                        ))}
                      </div>
                    )}

                    {!loading && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-2">
                        {filteredItems.length === 0 ? (
                          <p className="text-gray-400 text-center col-span-full py-8">Nenhum item nesta lista.</p>
                        ) : (
                          filteredItems.map((item) => {
                            const isMovie = 'title' in item;
                            const isAlbum = 'artist' in item;
                            const imageUrl = isAlbum ? (item as any).imageUrl : (item as any).posterUrl;
                            const title = isMovie ? (item as any).title : (item as any).name;

                            return (
                              <div
                                key={item.internalId}
                                className={`relative group overflow-hidden rounded-lg bg-neutral-800/60 ring-1 ring-white/10 hover:ring-white/20 transition ${
                                  isAlbum ? 'aspect-square' : 'aspect-[2/3]'
                                }`}
                              >
                                <RemoveItemButton item={item} title={title} />
                                <button
                                  onClick={() => handleViewDetails(item)}
                                  className="absolute inset-0 w-full h-full flex items-center justify-center"
                                  aria-label={`Ver detalhes de ${title}`}
                                  title="Ver detalhes"
                                >
                                  {imageUrl ? (
                                    <Image
                                      src={imageUrl}
                                      alt={title}
                                      fill
                                      className="object-cover"
                                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                                      Sem imagem
                                    </div>
                                  )}
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
