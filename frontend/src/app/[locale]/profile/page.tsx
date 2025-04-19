"use client";

import { Container } from "@/components/container";
import Image from "next/image";
import { useEffect, useState } from "react";
import { fetchMembers, updateMember } from "../../../services/member.service";
import { ProtectedRoute } from "@/components/protected-route/ProtectedRoute";
import { createPortal } from "react-dom";
import { FiEdit2 } from "react-icons/fi";
import ProfileEditModal from "@/components/profile-edit-modal/ProfileEditModal";
import { useMember } from "@/context/MemberContext";
import NowPlayingCarouselSection from "@/components/now-playing-carousel/NowPlayingCarouselSection";
import { Member } from "@/types/Member";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

export default function Profile() {
  const { member, setMember } = useMember();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const t = useTranslations("profile");

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const membersData = await fetchMembers(true);
        setMember(membersData);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Um erro desconhecido ocorreu");
      } finally {
        setLoading(false);
      }
    };

    if (!member) {
      loadMembers();
      console.log("CARREGUEI EM");
    } else {
      setLoading(false);
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

      const updated = await updateMember(member.id.toString(), payload);
      setMember(updated);

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

        if (!uploadRes.ok) throw toast.error(t("profile_edit_modal.error_uploading_image"));
      }

      setIsModalOpen(false);
      toast.success(t("success_updating_profile"));
    } catch (err) {
      console.error("Erro ao atualizar perfil:", err);
      toast.error(t("error_updating_profile"));
    }
  };

  if (loading) return <div>{t("loading")}</div>;
  if (error) return <div>{t("error")}</div>;

  return (
    <ProtectedRoute>
      <main className="w-full">
        <Container>
          <ProfileHeader 
            member={member} 
            onEditClick={() => setIsModalOpen(true)} 
            t={t} 
          />
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

interface ProfileHeaderProps {
  member: Member | null;
  onEditClick: () => void;
  t: any; // Ou defina um tipo mais específico para a função de tradução
}

const ProfileHeader = ({ member, onEditClick, t }: ProfileHeaderProps) => (
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
          <button onClick={onEditClick} className="text-gray-400 hover:text-white" title={t("edit_profile")}>
            <FiEdit2 size={18} />
          </button>
        </div>
        <p className="text-gray-400 text-sm max-w-md">{member?.bio || t("no_bio")}</p>
      </div>
    </div>
    <ProfileStats t={t} />
  </div>
);

interface ProfileStatsProps {
  t: any;
}

const ProfileStats = ({ t }: ProfileStatsProps) => (
  <div className="flex gap-6 text-center">
    <Stat label={t("movies")} value="7" />
    <Stat label={t("followers")} value="25" />
    <Stat label={t("following")} value="14" />
  </div>
);

interface StatProps {
  label: string;
  value: string;
}

const Stat = ({ label, value }: StatProps) => (
  <div>
    <p className="text-sm">{label}</p>
    <p className="text-lg font-semibold">{value}</p>
  </div>
);