"use client";

import { Container } from "@/components/container";
import Image from "next/image";
import { useEffect, useState } from "react";
import { fetchMembers } from "../../services/member.service";
import { ProtectedRoute } from "@/components/protected-route/ProtectedRoute";
import { RandomMoviesCarousel } from "@/components/random-movies-carousel/RandomMoviesCarousel";
import NowPlayingCarouselSection from "@/components/now-playing-carousel/NowPlayingCarouselSection";
import { createPortal } from "react-dom";
import { FiEdit2 } from "react-icons/fi";
import toast from "react-hot-toast";

type Member = {
  id: number;
  name: string;
  email: string;
  username: string;
  bio: string;
  profileImageUrl: string;
};

export default function Profile() {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", bio: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const membersData = await fetchMembers();
        setMember(membersData[0]);
        setFormData({
          name: membersData[0]?.name || "",
          bio: membersData[0]?.bio || "",
        });
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          toast.error("Um erro desconhecido ocorreu");
        }
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Token não encontrado");

      // Atualizar nome/bio
      const payload = {
        id: member.id,
        name: formData.name,
        email: member.email,
        bio: formData.bio,
      };

      const updateRes = await fetch("http://localhost:8080/member/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!updateRes.ok) toast.error("Erro ao atualizar perfil");
      else{
        toast.success("Perfil atualizado!")
      }

      // Upload da imagem
      if (imageFile) {
        const formDataImage = new FormData();
        formDataImage.append("file", imageFile);

        const uploadRes = await fetch(`http://localhost:8080/api/images/upload/${member.id}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataImage,
        });

        if (!uploadRes.ok) toast.error("Erro ao enviar imagem de perfil");
      }

      // Atualiza estado com novos dados
      const updated = await fetchMembers();
      setMember(updated[0]);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Erro ao atualizar perfil:", err);
      toast.error("Erro ao atualizar perfil. Tente novamente.");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ProtectedRoute>
      <main className="w-full">
        <Container>
          <div className="flex justify-between items-center">
            {/* Avatar + Infos */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-400 overflow-hidden relative">
                <Image
                  src={member?.profileImageUrl || "https://marketup.com/wp-content/themes/marketup/assets/icons/perfil-vazio.jpg"}
                  alt="User Avatar"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col text-white space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-medium">{member?.name}</span>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="text-gray-400 hover:text-white"
                    title="Editar perfil"
                  >
                    <FiEdit2 size={18} />
                  </button>
                </div>
                <p className="text-gray-400 text-sm max-w-md">{member?.bio || "Não há bio"}</p>
              </div>
            </div>

            {/* Contadores */}
            <div className="flex gap-6 text-center">
              <div>
                <p className="text-sm">Filmes</p>
                <p className="text-lg font-semibold">7</p>
              </div>
              <div>
                <p className="text-sm">Seguidores</p>
                <p className="text-lg font-semibold">25</p>
              </div>
              <div>
                <p className="text-sm">Seguindo</p>
                <p className="text-lg font-semibold">14</p>
              </div>
            </div>
          </div>
        </Container>

        <Container>
          <NowPlayingCarouselSection />
        </Container>

        {/* MODAL DE EDIÇÃO */}
        {isModalOpen &&
          createPortal(
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
              <div className="bg-zinc-900 p-6 rounded-lg w-full max-w-md shadow-lg">
                <h2 className="text-lg font-semibold text-white mb-4">Editar Perfil</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nome"
                    className="p-2 rounded bg-zinc-800 text-white"
                    required
                  />
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Bio"
                    className="p-2 rounded bg-zinc-800 text-white resize-none"
                    rows={3}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="text-white"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="border border-gray-500 text-gray-300 px-4 py-1 rounded"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-[var(--color-darkgreen)] hover:brightness-110 text-white px-4 py-1 rounded"
                    >
                      Salvar
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )}
      </main>
    </ProtectedRoute>
  );
}
