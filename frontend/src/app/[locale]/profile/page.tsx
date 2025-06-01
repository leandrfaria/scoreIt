"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { FiEdit2 } from "react-icons/fi";
import ProfileEditModal from "@/components/features/user/ProfileEditModal";
import { useMember } from "@/context/MemberContext";
import { Member } from "@/types/Member";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { fetchMembers, updateMember } from "@/services/user/member";
import FavouriteAlbumCarouselSection from "@/components/features/album/FavouriteAlbumCarouselSection";
import { useTabContext } from "@/context/TabContext";
import FavouriteMoviesCarouselSection from "@/components/features/movie/FavouriteMoviesCarouselSection";
import FavouriteSeriesCarouselSection from "@/components/features/serie/FavouriteSeriesCarouselSection";
import { ProfileStats } from "@/components/features/user/ProfileStats";
import { countFollowers, countFollowing } from "@/services/followers/countStats";
import ReviewsCarouselSection from "@/components/features/review/ReviewsCarouselSection";

export default function Profile() {
  const { member, setMember } = useMember();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { activeTab } = useTabContext();
  const t = useTranslations("profile");
  const [followers, setFollowers] = useState<number>(0);
  const [following, setFollowing] = useState<number>(0);

  const handleUpdateMember = async (
    formData: { name: string; bio: string; birthDate: string; gender: string },
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
        gender: formData.gender,
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

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token || !member) return;

        const [followerCount, followingCount] = await Promise.all([
          countFollowers(member.id.toString(), token),
          countFollowing(member.id.toString(), token),
        ]);

        console.log("SEGUIDORES::: ", followerCount)
        console.log("SEGUINDO::: ", followingCount)
        setFollowers(followerCount);
        setFollowing(followingCount);
      } catch (err) {
        console.error("Erro ao buscar contadores:", err);
      }
    };

    fetchCounts();
  }, [member]);

  return (
    <ProtectedRoute>
      <main className="w-full">
        <Container>
          <div className="mt-5">
            <ProfileHeader
              member={member}
              onEditClick={() => setIsModalOpen(true)}
              t={t}
              followers={followers}
              following={following}
            />
          </div>
        </Container>

        <Container>
                <ReviewsCarouselSection />
              </Container>
        <Container>
          
          {activeTab == "filmes" && <FavouriteMoviesCarouselSection />}
          {activeTab == "musicas" && <FavouriteAlbumCarouselSection />}
          {activeTab == "series" && <FavouriteSeriesCarouselSection />}
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
  followers: number;
  following: number;
}

const ProfileHeader = ({ member, onEditClick, t, followers, following }: ProfileHeaderProps) => (
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
        <p className="text-gray-400 text-sm max-w-md">
          {member?.bio || t("no_bio")}
        </p>
      </div>
    </div>
    <ProfileStats t={t} followers={followers} following={following} />
  </div>
);
