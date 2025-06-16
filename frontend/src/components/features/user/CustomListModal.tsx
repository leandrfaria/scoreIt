'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import { useMember } from '@/context/MemberContext';
import { MediaType } from'@/services/customList/add_content_list';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { updateCustomList, removeContentFromList, fetchListContent, deleteCustomList } from "@/services/customList/add_content_list";
import { useRouter } from "next/navigation";
import { useLocale } from 'next-intl';

interface CustomListModalProps {
  isOpen?: boolean;
  onClose: () => void;
  id?: number;
  listName?: string;
  listDescription?: string;
  onCreate?: (data: { name: string; description: string }) => Promise<void>;
  onListDeleted?: () => void; // Nova prop
  onListUpdated?: () => void; // Nova prop para atualizações

}

export function CustomListModal({
  isOpen = true,
  onClose,
  id,
  listName,
  listDescription,
  onCreate,
  onListDeleted,
  onListUpdated
}: CustomListModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { member } = useMember();
  const [mediaItems, setMediaItems] = useState<MediaType[]>([]);
  const [name, setName] = useState(listName ?? '');
  const [description, setDescription] = useState(listDescription ?? '');
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const router = useRouter();
  const locale = useLocale();

  useOutsideClick(modalRef, onClose);

useEffect(() => {
  if (isOpen && member && listName && !onCreate) {
    setName(listName);
    setDescription(listDescription ?? '');
    setCharCount(listDescription?.length ?? 0); // Inicializa contagem de caracteres


    fetchListContent(member.id, listName)
      .then((items) => {
        const normalizedItems = items.map((item) => {
          // Para filmes
          if ('title' in item) {
            return {
              ...item,
              internalId: item.internalId,
              posterUrl: item.posterUrl 
                ? (item.posterUrl.startsWith('http') 
                    ? item.posterUrl 
                    : `https://image.tmdb.org/t/p/w500${item.posterUrl}`)
                : null,
            } as MediaType;
          } 
          // Para séries
          else if ('name' in item && 'first_air_date' in item) {
            return {
              ...item,
              internalId: item.internalId,
              posterUrl: item.posterUrl 
                ? (item.posterUrl.startsWith('http') 
                    ? item.posterUrl 
                    : `https://image.tmdb.org/t/p/w500${item.posterUrl}`)
                : null,
            } as MediaType;
          }
          // Para álbuns
          else if ('artist' in item) {
            return {
              ...item,
              internalId: item.internalId,
              imageUrl: item.imageUrl || null,
            } as MediaType;
          }
          return {
            ...item,
            internalId: item.internalId,
          } as MediaType;
        });

        setMediaItems(normalizedItems);
      })
      .catch(() => toast.error('Erro ao carregar conteúdo da lista'));
  }
}, [isOpen, listName, listDescription, member, onCreate]);



  const handleViewDetails = (item: MediaType) => {
    if ('title' in item) {
      router.push(`/${locale}/movie/${item.id}`);
    } else if ('artist' in item) {
      router.push(`/${locale}/album/${item.id}`);
    } else {
      router.push(`/${locale}/series/${item.id}`);
    }
  };


const handleRemoveItem = async (item: MediaType) => {
  if (!member || !listName) return;

  const token = localStorage.getItem("authToken");
  if (!token) {
    toast.error('Token não encontrado');
    return;
  }

  try {
    // Determina o tipo de mídia corretamente
    let mediaType: 'movie' | 'album' | 'series';
    
    if ('title' in item) {
      mediaType = 'movie';
    } else if ('artist' in item) {
      mediaType = 'album';
    } else {
      mediaType = 'series';
    }

    await removeContentFromList(token, {
      id: item.internalId,
      memberId: member.id,
      mediaId: item.id.toString(),
      mediaType: mediaType,
      listName: listName
    });

    // Atualiza a UI
    setMediaItems(prev => prev.filter(i => i.internalId !== item.internalId));
    toast.success('Item removido da lista');
  } catch (error) {
    console.error('Erro ao remover item:', error);
    toast.error('Erro ao remover item da lista');
  }
};


const handleUpdateList = async () => {
  console.log(" Iniciando atualização da lista");
  
  if (!member || !id) {
    const errorMsg = "Dados incompletos: " + JSON.stringify({member, id});
    console.error(errorMsg);
    toast.error(errorMsg);
    return;
  }

  // Validação de caracteres
  if (description.length > 50) {
    toast.error('A descrição deve ter no máximo 50 caracteres');
    return;
  }

  const token = localStorage.getItem("authToken");
  if (!token) {
    console.error("Token não encontrado no localStorage");
    toast.error("Token não encontrado");
    return;
  }

  try {
    console.log(" Enviando dados para atualização:", {
      id,
      listName: name.trim(),
      list_description: description.trim(),
    });

    await updateCustomList(token, {
      id,
      listName: name.trim(),
      list_description: description.trim(),
    });
    
    console.log(" Lista atualizada com sucesso no backend");
    toast.success("Lista atualizada!");
    setIsEditing(false);
    
    if (onListUpdated) {
      onListUpdated();
    }
  } catch (error) {
    console.error(" ERRO na atualização:", error);
    toast.error(`Erro ao atualizar lista: ${error}`);
  }
};

  const handleDeleteList = async () => {
    if (!id) return;

    try {
      await deleteCustomList(id);
      toast.success("Lista deletada com sucesso!");
      onClose();
      
      // Chama o callback de atualização
      if (onListDeleted) {
        onListDeleted();
      }
    } catch (error) {
      console.error("Erro ao deletar lista:", error);
      toast.error("Erro ao deletar lista");
    }
  };


  const handleCreateListSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('O nome da lista é obrigatório');
      return;
    }

    // Validação de caracteres
    if (description.length > 50) {
      toast.error('A descrição deve ter no máximo 50 caracteres');
      return;
    }

    try {
      if (onCreate) {
        await onCreate({ name: name.trim(), description: description.trim() });
      }
    } catch (error) {
      toast.error('Erro ao criar lista');
      console.error(error);
    }
  };

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
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              {onCreate ? 'Criar nova lista' : isEditing ? 'Editar lista' : `Lista: ${listName}`}
            </h2>
            <button onClick={onClose} className="text-red-400 text-2xl">×</button>
          </div>

          {/* Área flexível com scroll */}
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
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setCharCount(e.target.value.length);
                    }}
                    maxLength={50}
                    className="w-full p-2 rounded bg-neutral-800 text-white flex-grow"
                    rows={4}
                  />
                  <div className={`text-xs mt-1 text-right ${charCount === 50 ? 'text-red-500' : 'text-gray-400'}`}>
                    {charCount}/50 caracteres
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">Cancelar</button>
                  <button type="submit" className="bg-green-600 px-4 py-2 rounded hover:bg-green-500">Criar</button>
                </div>
              </form>
            ) : (
              <>
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
                        onChange={(e) => {
                          setDescription(e.target.value);
                          setCharCount(e.target.value.length);
                        }}
                        maxLength={50}
                        className="w-full p-2 rounded bg-neutral-800 text-white flex-grow"
                        rows={4}
                      />
                      <div className={`text-xs mt-1 text-right ${charCount === 50 ? 'text-red-500' : 'text-gray-400'}`}>
                        {charCount}/50 caracteres
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleUpdateList}
                        className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500"
                      >
                        Salvar alterações
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col flex-grow min-h-0">
                    {/* Seção de descrição e botões */}
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-gray-400 italic">{description || 'Sem descrição'}</p>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-sm text-blue-400 hover:underline"
                      >
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
                          <button
                            onClick={() => setIsDeleteConfirmOpen(false)}
                            className="text-gray-400 hover:text-white"
                          >
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

                    {/* Container com scroll vertical */}
                    <div className="flex-grow overflow-y-auto min-h-0">
                      {mediaItems.length === 0 ? (
                        <p className="text-gray-400 text-center">Nenhum item nesta lista.</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {mediaItems.map((item) => {
                            const isMovie = 'title' in item;
                            const isAlbum = 'artist' in item;
                            const isSeries = !isMovie && !isAlbum;
                            const imageUrl = isMovie || isSeries ? item.posterUrl : item.imageUrl;
                            const title = isMovie ? item.title : item.name;

                            return (
                              <div
                                key={item.internalId}
                                className="relative group aspect-[2/3] overflow-hidden rounded-md"
                              >
                                <button
                                  onClick={() => handleRemoveItem(item)}
                                  className="absolute top-2 right-2 bg-black/70 rounded-full w-8 h-8 flex items-center justify-center z-20 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                  aria-label={`Remover ${title}`}
                                >
                                  ×
                                </button>

                                {/* Imagem clicável */}
                                <button
                                  onClick={() => handleViewDetails(item)}
                                  className="w-full h-full"
                                >
                                  {imageUrl && imageUrl !== "null" ? (
                                    <Image
                                      src={imageUrl}
                                      alt={title}
                                      fill
                                      className="object-cover"
                                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                      <span className="text-gray-500 text-sm">Sem imagem</span>
                                    </div>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);
}
