'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import { MediaType } from '@/services/customList/add_content_list';
import Image from 'next/image';
import toast from 'react-hot-toast';
import {
  updateCustomList,
  removeContentFromList,
  fetchListContent,
  deleteCustomList,
} from '@/services/customList/add_content_list';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Member } from '@/types/Member';

interface CustomListModalProps {
  isOpen?: boolean;
  onClose: () => void;
  id?: number;
  listName?: string;
  listDescription?: string;
  onCreate?: (data: { name: string; description: string }) => Promise<void>;
  onListDeleted?: () => void;
  onListUpdated?: () => void;
  member: Member;
}

export function CustomListModal({
  isOpen = true,
  onClose,
  id,
  listName,
  listDescription,
  onCreate,
  onListDeleted,
  onListUpdated,
  member,
}: CustomListModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [mediaItems, setMediaItems] = useState<MediaType[]>([]);
  const [name, setName] = useState(listName ?? '');
  const [description, setDescription] = useState(listDescription ?? '');
  const [charCount, setCharCount] = useState(listDescription?.length ?? 0);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const router = useRouter();
  const locale = useLocale();

  useOutsideClick(modalRef, onClose);

  // Cache local das listas
  const listCache = useRef<Map<string, MediaType[]>>(new Map());

  // Helper para pegar token
  const getToken = () => localStorage.getItem('authToken') ?? '';

  // Normaliza imagens
  const normalizeMediaItem = useCallback((item: MediaType): MediaType => {
    if ('title' in item || ('name' in item && 'first_air_date' in item)) {
      return {
        ...item,
        internalId: item.internalId,
        posterUrl: item.posterUrl?.startsWith('http')
          ? item.posterUrl
          : item.posterUrl
          ? `https://image.tmdb.org/t/p/w500${item.posterUrl}`
          : null,
      };
    }
    if ('artist' in item) {
      return { ...item, internalId: item.internalId, imageUrl: item.imageUrl ?? null };
    }
    return { ...item, internalId: item.internalId };
  }, []);

  // Carrega conteúdo da lista com cache
  useEffect(() => {
    if (!isOpen || !member || !listName || onCreate) return;

    setName(listName);
    setDescription(listDescription ?? '');
    setCharCount(listDescription?.length ?? 0);

    const cacheKey = `${member.id}-${listName}`;

    if (listCache.current.has(cacheKey)) {
      setMediaItems(listCache.current.get(cacheKey)!);
      return;
    }

    fetchListContent(member.id, listName)
      .then(items => {
        const normalized = items.map(normalizeMediaItem);
        setMediaItems(normalized);
        listCache.current.set(cacheKey, normalized);
      })
      .catch(() => toast.error('Erro ao carregar conteúdo da lista'));
  }, [isOpen, listName, member, onCreate, normalizeMediaItem, listDescription]);

  // Navegação para detalhes
  const handleViewDetails = useCallback(
    (item: MediaType) => {
      if ('title' in item) router.push(`/${locale}/movie/${item.id}`);
      else if ('artist' in item) router.push(`/${locale}/album/${item.id}`);
      else router.push(`/${locale}/series/${item.id}`);
    },
    [router, locale]
  );

  // Remove item da lista
  const handleRemoveItem = useCallback(
    async (item: MediaType) => {
      if (!member || !listName) return;
      const token = getToken();
      if (!token) return toast.error('Token não encontrado');

      const mediaType: 'movie' | 'album' | 'series' =
        'title' in item ? 'movie' : 'artist' in item ? 'album' : 'series';

      try {
        await removeContentFromList(token, {
          id: item.internalId,
          memberId: member.id,
          mediaId: item.id.toString(),
          mediaType,
          listName,
        });

        // Atualiza estado e cache local
        setMediaItems(prev => {
          const updated = prev.filter(i => i.internalId !== item.internalId);
          listCache.current.set(`${member.id}-${listName}`, updated);
          return updated;
        });

        toast.success('Item removido da lista');
      } catch (error) {
        console.error(error);
        toast.error('Erro ao remover item da lista');
      }
    },
    [member, listName]
  );

  // Atualiza lista
  const handleUpdateList = async () => {
    if (!member || !id) return toast.error('Dados incompletos');
    if (description.length > 50) return toast.error('A descrição deve ter no máximo 50 caracteres');

    const token = getToken();
    if (!token) return toast.error('Token não encontrado');

    try {
      await updateCustomList(token, { id, listName: name.trim(), list_description: description.trim() });
      toast.success('Lista atualizada!');
      setIsEditing(false);
      onListUpdated?.();
    } catch (error) {
      console.error(error);
      toast.error(`Erro ao atualizar lista`);
    }
  };

  // Deleta lista
  const handleDeleteList = async () => {
    if (!id) return;
    try {
      await deleteCustomList(id);
      toast.success('Lista deletada!');
      onClose();
      onListDeleted?.();
      // Remove do cache
      if (member && listName) listCache.current.delete(`${member.id}-${listName}`);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao deletar lista');
    }
  };

  // Criação de nova lista
  const handleCreateListSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('O nome da lista é obrigatório');
    if (description.length > 50) return toast.error('A descrição deve ter no máximo 50 caracteres');

    try {
      if (onCreate) await onCreate({ name: name.trim(), description: description.trim() });
    } catch (error) {
      console.error(error);
      toast.error('Erro ao criar lista');
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    setCharCount(e.target.value.length);
  };

  // Botão de remover item memoizado
  const RemoveItemButton = useCallback(
    ({ item, title }: { item: MediaType; title: string }) => (
      <button
        onClick={() => handleRemoveItem(item)}
        className="absolute top-2 right-2 bg-black/70 rounded-full w-8 h-8 flex items-center justify-center z-20 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={`Remover ${title}`}
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
            className="fixed inset-0 bg-black/70 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            ref={modalRef}
            className="fixed z-50 top-[10%] left-1/2 -translate-x-1/2 bg-neutral-900 text-white p-6 max-w-3xl w-full rounded-xl shadow-lg max-h-[85vh] flex flex-col"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {onCreate ? 'Criar nova lista' : isEditing ? 'Editar lista' : `Lista: ${listName}`}
              </h2>
              <button onClick={onClose} className="text-red-400 text-2xl">
                ×
              </button>
            </div>

            {/* Conteúdo */}
            <div className="flex flex-col flex-grow min-h-0 overflow-hidden">
              {onCreate ? (
                <form onSubmit={handleCreateListSubmit} className="space-y-4 flex flex-col">
                  <input
                    type="text"
                    name="name"
                    placeholder="Nome da lista"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 rounded bg-neutral-800 text-white"
                  />
                  <div className="flex flex-col flex-grow min-h-0">
                    <textarea
                      name="description"
                      placeholder="Descrição (opcional)"
                      value={description}
                      onChange={handleDescriptionChange}
                      maxLength={50}
                      className="w-full p-2 rounded bg-neutral-800 text-white flex-grow"
                      rows={4}
                    />
                    <div className={`text-xs mt-1 text-right ${charCount === 50 ? 'text-red-500' : 'text-gray-400'}`}>
                      {charCount}/50 caracteres
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
                      Cancelar
                    </button>
                    <button type="submit" className="bg-green-600 px-4 py-2 rounded hover:bg-green-500">
                      Criar
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col flex-grow min-h-0">
                  {/* Editando */}
                  {isEditing ? (
                    <div className="space-y-4 flex flex-col flex-grow min-h-0">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2 rounded bg-neutral-800 text-white"
                      />
                      <div className="flex flex-col flex-grow min-h-0">
                        <textarea
                          value={description}
                          onChange={handleDescriptionChange}
                          maxLength={50}
                          className="w-full p-2 rounded bg-neutral-800 text-white flex-grow"
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
                        <button onClick={handleUpdateList} className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500">
                          Salvar alterações
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Descrição e ações */}
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-gray-400 italic">{description || 'Sem descrição'}</p>
                        <button onClick={() => setIsEditing(true)} className="text-sm text-blue-400 hover:underline">
                          Editar
                        </button>
                      </div>

                      <div className="flex justify-end mb-3">
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

{/* Container principal para scroll */}
<div className="flex-grow overflow-y-auto min-h-0">
  {/* Grid de itens */}
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-2">
    {mediaItems.length === 0 && (
      <p className="text-gray-400 text-center col-span-full py-8">Nenhum item nesta lista.</p>
    )}
    {mediaItems.map(item => {
      const isMovie = 'title' in item;
      const isAlbum = 'artist' in item;
      const imageUrl = isMovie || !isAlbum ? item.posterUrl : item.imageUrl;
      const title = isMovie ? item.title : item.name;

      return (
        <div
          key={item.internalId}
          className={`relative group overflow-hidden rounded-md bg-neutral-800 w-full
            ${isAlbum ? "aspect-square" : "aspect-[2/3]"}
          `}
        >
          <RemoveItemButton item={item} title={title} />
          <button 
            onClick={() => handleViewDetails(item)} 
            className="absolute inset-0 w-full h-full flex items-center justify-center"
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
    })}
  </div>
</div>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
