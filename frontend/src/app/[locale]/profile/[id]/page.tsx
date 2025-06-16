"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Member } from "@/types/Member";
import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { useLocale, useTranslations } from "next-intl";
import FavouriteAlbumCarouselSection from "@/components/features/album/FavouriteAlbumCarouselSection";
import FavouriteMoviesCarouselSection from "@/components/features/movie/FavouriteMoviesCarouselSection";
import FavouriteSeriesCarouselSection from "@/components/features/serie/FavouriteSeriesCarouselSection";
import { fetchMemberById } from "@/services/user/member";
import { useTabContext } from "@/context/TabContext";
import { useMember } from "@/context/MemberContext";
import { FollowButton } from "@/components/features/follow/FollowButton";
import { ProfileStats } from "@/components/features/user/ProfileStats";
import {
  countFollowers,
  countFollowing,
} from "@/services/followers/countStats";
import ReviewsCarouselSection from "@/components/features/review/ReviewsCarouselSection";

export default function PublicProfilePage() {
  const [otherMember, setOtherMember] = useState<Member | null>(null);
  const { member } = useMember();
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const t = useTranslations("profile");
  const { activeTab } = useTabContext();
  const router = useRouter();
  const locale = useLocale();
  const [followers, setFollowers] = useState<number>(0);
  const [following, setFollowing] = useState<number>(0);

  // Buscar o membro
  useEffect(() => {
    const fetchMember = async () => {
      try {
        const data = await fetchMemberById(id as string);
        setOtherMember(data);
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [id]);

  // Buscar contadores
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token || !id) return;

        const [followerCount, followingCount] = await Promise.all([
          countFollowers(id as string, token),
          countFollowing(id as string, token),
        ]);

        setFollowers(followerCount);
        setFollowing(followingCount);
      } catch (err) {
        console.error("Erro ao buscar contadores:", err);
      }
    };

    fetchCounts();
  }, [id]);

  useEffect(() => {
    if (member?.id && String(member.id) === id) {
      router.replace(`/${locale}/profile`);
    }
  }, [member, id, router]);

  if (member?.id && String(member.id) === id) return null;
  if (loading) return <p className="text-white">Carregando...</p>;
  if (!otherMember)
    return <p className="text-white">Usuário não encontrado.</p>;

  return (
    <main className="w-full">
      <Container>
        <div className="mt-5">
          <ProfileHeader
            member={otherMember}
            t={t}
            isEditable={false}
            followers={followers}
            following={following}
            setFollowers={setFollowers}
          />
        </div>
      </Container>

      <Container>
        {activeTab == "filmes" && (
          <FavouriteMoviesCarouselSection memberId={id as string} />
        )}
        {activeTab == "musicas" && (
          <FavouriteAlbumCarouselSection memberId={id as string} />
        )}
        {activeTab == "series" && (
          <FavouriteSeriesCarouselSection memberId={id as string} />
        )}
      </Container>

      <Container>
        <ReviewsCarouselSection memberId={id as string} />
      </Container>
    </main>
  );
}

interface ProfileHeaderProps {
  member: Member;
  t: any;
  isEditable: boolean;
  followers: number;
  following: number;
  setFollowers: React.Dispatch<React.SetStateAction<number>>;
}

const ProfileHeader = ({
  member,
  t,
  followers,
  following,
  setFollowers,
}: ProfileHeaderProps) => (
  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
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

      <div className="flex-1 flex flex-col text-white space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-lg font-medium">{member?.name}</span>
        </div>
        <p className="text-gray-400 text-sm max-w-md">
          {member?.bio || t("no_bio")}
        </p>
      </div>

      <div className="sm:ml-auto">
        <FollowButton
          targetId={member.id.toString()}
          onFollow={() => setFollowers((prev) => prev + 1)}
          onUnfollow={() => setFollowers((prev) => Math.max(prev - 1, 0))}
        />
      </div>
    </div>

    <div className="w-full md:w-auto">
      <ProfileStats
        t={t}
        followers={followers}
        following={following}
        memberId={member.id.toString()}
      />
    </div>
  </div>
);