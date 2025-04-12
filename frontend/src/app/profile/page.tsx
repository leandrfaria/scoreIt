"use client";

import { Container } from "@/components/container";
import Image from "next/image";
import { useEffect, useState } from "react";
import { fetchMembers, updateMember } from "../../services/member.service"; // Importando updateMember
import { ProtectedRoute } from "@/components/protected-route/ProtectedRoute";
import { createPortal } from "react-dom";
import { FiEdit2 } from "react-icons/fi";
import ProfileEditModal from "@/components/profile-edit-modal/ProfileEditModal";
import { useMember } from "@/context/MemberContext"; // Usando o contexto
import NowPlayingCarouselSection from "@/components/now-playing-carousel/NowPlayingCarouselSection";
import { Member } from "@/types/Member";
import toast from "react-hot-toast";

export default function Profile() {
  const { member, setMember } = useMember(); // Obtendo o membro do contexto
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const membersData = await fetchMembers(true);
        setMember(membersData); // Atualiza o estado do membro no contexto
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Um erro desconhecido ocorreu");
      } finally {
        setLoading(false);
      }
    };

    if (!member) { // Verifica se o membro já está carregado
      loadMembers();
      console.log("CARREGUEI EM")
    } else {
      setLoading(false); // Se já tiver o membro, não precisa carregar novamente
    }
  }, [member, setMember]);

  const handleUpdateMember = async (formData: { name: string; bio: string }, imageFile: File | null) => {
    if (!member) return;

    try {
      const payload = {
        id: member.id,
        name: formData.name,
        email: member.email,
        bio: formData.bio,
      };

      // Atualizar nome/bio usando a função do serviço
      const updated = await updateMember(member.id.toString(), payload);
      setMember(updated); // Atualiza o membro no contexto

      // Se houver um arquivo de imagem, faça o upload
      if (imageFile) {
        const formDataImage = new FormData();
        formDataImage.append("file", imageFile);

        const token = localStorage.getItem("authToken");
        const uploadRes = await fetch(`http://localhost:8080/api/images/upload/${member.id}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataImage,
        });

        if (!uploadRes.ok) throw toast.error("Erro ao enviar imagem de perfil");
      }

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
          <ProfileHeader member={member} onEditClick={() => setIsModalOpen(true)} />
        </Container>
        <Container>
          <NowPlayingCarouselSection />
        </Container>
        
        {isModalOpen && (
          <ProfileEditModal
            member={member}
            onUpdateMember={handleUpdateMember}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </main>
    </ProtectedRoute>
  );
}

const ProfileHeader = ({ member, onEditClick }: { member: Member | null; onEditClick: () => void; }) => (
  <div className="flex justify-between items-center">
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
          <button onClick={onEditClick} className="text-gray-400 hover:text-white" title="Editar perfil">
            <FiEdit2 size={18} />
          </button>
        </div>
        <p className="text-gray-400 text-sm max-w-md">{member?.bio || "Não há bio"}</p>
      </div>
    </div>
    <ProfileStats />
  </div>
);

const ProfileStats = () => (
  <div className="flex gap-6 text-center">
    <Stat label="Filmes" value="7" />
    <Stat label="Seguidores" value="25" />
    <Stat label="Seguindo" value="14" />
  </div>
);

const Stat = ({ label, value }: { label: string; value: string; }) => (
  <div>
    <p className="text-sm">{label}</p>
    <p className="text-lg font-semibold">{value}</p>
  </div>
);