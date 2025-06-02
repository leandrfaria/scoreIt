'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import { useMember } from '@/context/MemberContext';
import { Movie } from '@/types/Movie';
import { CustomList } from '@/types/CustomList';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { updateCustomList, removeContentFromList, fetchListContent, deleteCustomList } from "@/services/movie/add_list_movie";

interface CustomListModalProps {
  isOpen?: boolean;
  onClose: () => void;
  id?: number;           // Id da lista customizada para update e fetch
  listName?: string;
  listDescription?: string;  // Descrição inicial para preencher no modal
  onCreate?: (data: { name: string; description: string }) => Promise<void>;
}

export function CustomListModal({
  isOpen = true,
  onClose,
  id,
  listName,
  listDescription,
  onCreate
}: CustomListModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { member } = useMember();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [name, setName] = useState(listName ?? '');
  const [description, setDescription] = useState(listDescription ?? '');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedList, setSelectedList] = useState<CustomList | null>(null);

  useOutsideClick(modalRef, onClose);

useEffect(() => {
  if (isOpen && member && listName && !onCreate) { // Use listName em vez de id
    setName(listName);
    setDescription(listDescription ?? '');

    // Passe listName (string) em vez de id (number)
    fetchListContent(member.id, listName) // 👈 Corrigido aqui
      .then((movies) => {
        const normalized = movies.map((movie) => ({
          ...movie,
          internalId: movie.id,
          posterUrl: movie.posterUrl 
            ? (movie.posterUrl.startsWith('http') 
                ? movie.posterUrl 
                : `https://image.tmdb.org/t/p/w500${movie.posterUrl}`) 
            : null,
        })) as Movie[];

        setMovies(normalized);
      })
      .catch(() => toast.error('Erro ao carregar filmes da lista'));
  }
}, [isOpen, listName, listDescription, member, onCreate]); // Atualize as dependências



const handleRemoveMovie = async (internalId: number) => {
  if (!member || !id || !listName) return; // Use listName prop

  const token = localStorage.getItem("authToken");
  if (!token) {
    toast.error('Token não encontrado');
    return;
  }

  try {
  await removeContentFromList(token, {
    id: internalId,
    memberId: member.id,
    mediaId: internalId,
    mediaType: 'movie',
    listName // Use o nome original da lista
  });

    setMovies(prevMovies => prevMovies.filter(movie => movie.internalId !== internalId));
    toast.success('Filme removido da lista');
  } catch {
    toast.error('Erro ao remover filme da lista');
  }
};


const handleUpdateList = async () => {
  console.log("🚀 Iniciando atualização da lista");
  
  if (!member || !id) {
    const errorMsg = "Dados incompletos: " + JSON.stringify({member, id});
    console.error(errorMsg);
    toast.error(errorMsg);
    return;
  }

  const token = localStorage.getItem("authToken");
  if (!token) {
    console.error("Token não encontrado no localStorage");
    toast.error("Token não encontrado");
    return;
  }

  try {
    console.log("📤 Enviando dados para atualização:", {
      id,
      listName: name.trim(),
      list_description: description.trim(),
    });

    await updateCustomList(token, {
      id,
      listName: name.trim(),
      list_description: description.trim(),
    });
    
    console.log("🎉 Lista atualizada com sucesso no backend");
    toast.success("Lista atualizada!");
    setIsEditing(false);
    
  } catch (error) {
    console.error("🔥 ERRO na atualização:", error);
    toast.error(`Erro ao atualizar lista: ${error}`);
  }
};

  const handleDeleteList = async () => {
    if (!id) return;

    const confirmDelete = window.confirm("Tem certeza que deseja deletar esta lista?");
    if (!confirmDelete) return;

    try {
      await deleteCustomList(id);
      toast.success("Lista deletada com sucesso!");
      onClose(); // fecha o modal após deletar
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
            className="fixed z-50 top-[10%] left-1/2 -translate-x-1/2 bg-neutral-900 text-white p-6 max-w-3xl w-full rounded-xl shadow-lg"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {onCreate ? 'Criar nova lista' : isEditing ? 'Editar lista' : `Lista: ${listName}`}
              </h2>
              <button onClick={onClose} className="text-red-400 text-2xl">×</button>
            </div>

            {onCreate ? (
              <form onSubmit={handleCreateListSubmit} className="space-y-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Nome da lista"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 rounded bg-neutral-800 text-white"
                />
                <textarea
                  name="description"
                  placeholder="Descrição (opcional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 rounded bg-neutral-800 text-white"
                />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">Cancelar</button>
                  <button type="submit" className="bg-green-600 px-4 py-2 rounded hover:bg-green-500">Criar</button>
                </div>
              </form>
            ) : (
              <>
                {isEditing ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-2 rounded bg-neutral-800 text-white"
                    />
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-2 rounded bg-neutral-800 text-white"
                    />
                    <div className="flex justify-end gap-2">
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
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-gray-400 italic">{description || 'Sem descrição'}</p>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-sm text-blue-400 hover:underline"
                      >
                        Editar
                      </button>
                    </div>

                    <div className="flex justify-end mt-6">
                      <button
                        onClick={handleDeleteList}
                        className="text-red-400 hover:text-red-300 hover:underline"
                      >
                        Deletar lista
                      </button>
                    </div>
                    {movies.length === 0 ? (
                      <p className="text-gray-400 text-center">Nenhum filme nesta lista.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {movies.map((movie) => (
                          <div key={movie.internalId} className="relative aspect-[2/3] rounded overflow-hidden group">
                            {movie.posterUrl && movie.posterUrl !== 'null' ? (
                              <div className="relative w-full h-full">
                                <Image
                                  src={movie.posterUrl}
                                  alt={movie.title || 'Capa do filme'}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-full h-full bg-gray-700 flex items-center justify-center rounded text-gray-400 text-xs text-center">
                                Sem imagem
                              </div>
                            )}
                            <button
                              onClick={() => handleRemoveMovie(movie.internalId)}
                              className="absolute top-2 right-2 text-red-400 hover:text-red-300 z-10"
                              aria-label={`Remover ${movie.title}`}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
