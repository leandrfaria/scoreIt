"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Container } from "@/components/container";
import { ProtectedRoute } from "@/components/protected-route/ProtectedRoute";
import { FiEdit2 } from "react-icons/fi";
import ProfileEditModal from "@/components/profile-edit-modal/ProfileEditModal";
import { useMember } from "@/context/MemberContext";
import NowPlayingCarouselSection from "@/components/now-playing-carousel/NowPlayingCarouselSection";
import { Member } from "@/types/Member";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { fetchMembers, updateMember } from "@/services/service_member";

export default function Profile() {
  const { member, setMember } = useMember();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const t = useTranslations("profile");

  const handleUpdateMember = async (
    formData: { name: string; bio: string, birthDate: string, gender: string },
    imageFile: File | null
  ) => {
    if (!member) return;

    try {
      const payload = {
        id: member.id,
        name: formData.name,
        email: member.email,
        bio: formData.bio,
        birthDate: formData.birthDate,
        gender: formData.gender
      };

      if (imageFile) {
        const formDataImage = new FormData();
        formDataImage.append("file", imageFile);

        const token = localStorage.getItem("authToken");
        const uploadRes = await fetch(
          `http://localhost:8080/api/images/upload/${member.id}`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formDataImage,
          }
        );

        if (!uploadRes.ok) throw new Error(t("error_uploading_image"));
      }

      const updated = await updateMember(member.id.toString(), payload);
      setMember(updated);

      toast.success(t("success_updating_profile"));
      setIsModalOpen(false);
    } catch (err) {
      console.error("Erro ao atualizar perfil:", err);
      toast.error(t("error_updating_profile"));
    }
  };

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
        {isModalOpen && member && (
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
  t: any;
}

const ProfileHeader = ({ member, onEditClick, t }: ProfileHeaderProps) => (
  <div className="flex justify-between items-center">
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-full bg-gray-400 overflow-hidden relative">
        <Image
          src={
            member?.profileImageUrl ||
            "https://marketup.com/wp-content/themes/marketup/assets/icons/perfil-vazio.jpg"
          }
          alt="Foto de perfil"
          fill
          className="object-cover"
        />
      </div>
      <div className="flex flex-col text-white space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-lg font-medium">{member?.name}</span>
          <button
            onClick={onEditClick}
            className="text-gray-400 hover:text-white"
            title={t("edit_profile")}
          >
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
    <p className="text-sm text-white">{label}</p>
    <p className="text-lg font-semibold text-white">{value}</p>
  </div>
);
